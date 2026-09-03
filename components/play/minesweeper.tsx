'use client'

import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'

type Cell = {
  mine: boolean
  revealed: boolean
  flagged: boolean
  adjacent: number
}

type Difficulty = {
  name: string
  rows: number
  cols: number
  mines: number
}

const DIFFICULTIES: Difficulty[] = [
  { name: '初级', rows: 9, cols: 9, mines: 10 },
  { name: '中级', rows: 16, cols: 16, mines: 40 },
  { name: '高级', rows: 16, cols: 30, mines: 99 },
]

const NUM_COLORS = [
  '',
  'text-blue-600 dark:text-blue-400',
  'text-green-600 dark:text-green-400',
  'text-red-600 dark:text-red-400',
  'text-purple-700 dark:text-purple-400',
  'text-amber-700 dark:text-amber-400',
  'text-cyan-700 dark:text-cyan-400',
  'text-pink-700 dark:text-pink-400',
  'text-gray-700 dark:text-gray-300',
]

const DIRS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
]

type GameState = 'ready' | 'playing' | 'won' | 'lost'

function makeBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
    }))
  )
}

function cloneBoard(b: Cell[][]): Cell[][] {
  return b.map((row) => row.map((cell) => ({ ...cell })))
}

function neighborsIn(rows: number, cols: number, r: number, c: number): [number, number][] {
  const out: [number, number][] = []
  for (const [dr, dc] of DIRS) {
    const nr = r + dr
    const nc = c + dc
    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc])
  }
  return out
}

export function Minesweeper() {
  const [diffIdx, setDiffIdx] = useState(0)
  const diff = DIFFICULTIES[diffIdx]
  const [board, setBoard] = useState<Cell[][]>(() => makeBoard(9, 9))
  const [status, setStatus] = useState<GameState>('ready')
  const [flags, setFlags] = useState(0)
  const [time, setTime] = useState(0)
  const [firstClick, setFirstClick] = useState(true)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusRef = useRef<GameState>('ready')
  statusRef.current = status

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const startTimer = () => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => setTime((t) => (t >= 999 ? t : t + 1)), 1000)
  }

  useEffect(() => stopTimer, [])

  const reset = (idx: number = diffIdx) => {
    stopTimer()
    const d = DIFFICULTIES[idx]
    setDiffIdx(idx)
    setBoard(makeBoard(d.rows, d.cols))
    setStatus('ready')
    setFlags(0)
    setTime(0)
    setFirstClick(true)
  }

  const revealAllMines = (b: Cell[][]) => {
    for (const row of b) for (const cell of row) if (cell.mine) cell.revealed = true
    return b
  }

  const floodReveal = (b: Cell[][], r: number, c: number, rows: number, cols: number) => {
    const stack: [number, number][] = [[r, c]]
    while (stack.length) {
      const [cr, cc] = stack.pop()!
      const cell = b[cr][cc]
      if (cell.revealed || cell.flagged || cell.mine) continue
      cell.revealed = true
      if (cell.adjacent === 0) {
        for (const [nr, nc] of neighborsIn(rows, cols, cr, cc)) stack.push([nr, nc])
      }
    }
    return b
  }

  const countRevealed = (b: Cell[][]) => {
    let n = 0
    for (const row of b) for (const cell of row) if (cell.revealed) n++
    return n
  }

  // 布雷：首点 + 周围 8 格安全
  const plantMines = (
    b: Cell[][],
    safeR: number,
    safeC: number,
    rows: number,
    cols: number,
    mines: number
  ) => {
    const safe = new Set<string>([`${safeR},${safeC}`])
    for (const [nr, nc] of neighborsIn(rows, cols, safeR, safeC)) safe.add(`${nr},${nc}`)
    const candidates: [number, number][] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!safe.has(`${r},${c}`)) candidates.push([r, c])
      }
    }
    let placed = 0
    while (placed < mines) {
      const i = Math.floor(Math.random() * candidates.length)
      const [r, c] = candidates.splice(i, 1)[0]
      b[r][c].mine = true
      placed++
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (b[r][c].mine) continue
        b[r][c].adjacent = neighborsIn(rows, cols, r, c).filter(([nr, nc]) => b[nr][nc].mine).length
      }
    }
  }

  const handleLeftClick = (r: number, c: number) => {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return
    const b = cloneBoard(board)
    const cell = b[r][c]
    if (cell.revealed || cell.flagged) return

    if (firstClick) {
      plantMines(b, r, c, diff.rows, diff.cols, diff.mines)
      setFirstClick(false)
      setStatus('playing')
      statusRef.current = 'playing'
      startTimer()
    }

    if (b[r][c].mine) {
      revealAllMines(b)
      setBoard(b)
      setStatus('lost')
      statusRef.current = 'lost'
      stopTimer()
      return
    }

    floodReveal(b, r, c, diff.rows, diff.cols)
    setBoard(b)
    if (countRevealed(b) === diff.rows * diff.cols - diff.mines) {
      setStatus('won')
      statusRef.current = 'won'
      stopTimer()
    }
  }

  const handleRightClick = (r: number, c: number) => {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return
    if (board[r][c].revealed) return
    const b = cloneBoard(board)
    b[r][c].flagged = !b[r][c].flagged
    setBoard(b)
    setFlags(b.flat().filter((x) => x.flagged).length)
  }

  // 和弦：对已翻开的数字双击/点按，若周围旗标数一致则展开未标格
  const handleChord = (r: number, c: number) => {
    if (statusRef.current === 'won' || statusRef.current === 'lost') return
    const b = cloneBoard(board)
    const cell = b[r][c]
    if (!cell.revealed || cell.adjacent === 0) return
    const nbs = neighborsIn(diff.rows, diff.cols, r, c)
    const flaggedAround = nbs.filter(([nr, nc]) => b[nr][nc].flagged).length
    if (flaggedAround !== cell.adjacent) return

    let exploded = false
    for (const [nr, nc] of nbs) {
      const nb = b[nr][nc]
      if (!nb.revealed && !nb.flagged && nb.mine) exploded = true
    }
    if (exploded) {
      revealAllMines(b)
      setBoard(b)
      setStatus('lost')
      statusRef.current = 'lost'
      stopTimer()
      return
    }

    floodReveal(b, r, c, diff.rows, diff.cols)
    setBoard(b)
    if (countRevealed(b) === diff.rows * diff.cols - diff.mines) {
      setStatus('won')
      statusRef.current = 'won'
      stopTimer()
    }
  }

  const onCellClick = (r: number, c: number) => {
    if (board[r][c].revealed) {
      handleChord(r, c)
    } else {
      handleLeftClick(r, c)
    }
  }

  const face = status === 'won' ? '😎' : status === 'lost' ? '😵' : '🙂'
  const remaining = Math.max(diff.mines - flags, 0)

  return (
    <div className="flex flex-col items-center gap-4">
      {/* 难度选择 */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {DIFFICULTIES.map((d, i) => (
          <button
            key={d.name}
            onClick={() => reset(i)}
            className={clsx(
              'rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors',
              i === diffIdx
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            )}
          >
            {d.name} {d.rows}×{d.cols} · {d.mines}雷
          </button>
        ))}
      </div>

      {/* 状态栏 */}
      <div className="flex w-full items-center justify-between rounded-xl border border-gray-300 bg-gray-100 px-4 py-1.5 font-mono text-xl dark:border-gray-700 dark:bg-gray-900 sm:w-[420px]">
        <span className={clsx('tabular-nums', remaining <= 0 && 'text-green-500')}>
          {String(remaining).padStart(3, '0')}
        </span>
        <button
          onClick={() => reset()}
          aria-label="重新开始"
          title="重新开始"
          className="rounded p-0.5 text-2xl leading-none transition-transform hover:scale-110 active:scale-90"
        >
          {face}
        </button>
        <span className="tabular-nums">{String(time).padStart(3, '0')}</span>
      </div>

      {/* 棋盘 */}
      <div
        className="select-none overflow-hidden rounded-xl border-4 border-gray-300 bg-gray-300 p-1 shadow-inner dark:border-gray-700 dark:bg-gray-700"
        style={{ display: 'grid', gridTemplateColumns: `repeat(${diff.cols}, 1fr)` }}
        onContextMenu={(e) => e.preventDefault()}
      >
        {board.map((row, r) =>
          row.map((cell, c) => {
            const size =
              diff.cols > 16
                ? 'h-5 w-5 text-xs sm:h-6 sm:w-6 sm:text-sm'
                : 'h-6 w-6 text-xs sm:h-7 sm:w-7 sm:text-sm'
            if (cell.revealed) {
              return (
                <button
                  key={`${r}-${c}`}
                  aria-label={`cell ${r}-${c}`}
                  className={clsx(
                    'flex items-center justify-center border border-gray-300 bg-gray-100 font-bold',
                    'dark:border-gray-800 dark:bg-gray-800',
                    size,
                    cell.mine && 'bg-red-200 dark:bg-red-950',
                    !cell.mine && cell.adjacent > 0 && NUM_COLORS[cell.adjacent]
                  )}
                  onClick={() => onCellClick(r, c)}
                >
                  {cell.mine ? '💣' : cell.adjacent > 0 ? cell.adjacent : ''}
                </button>
              )
            }
            return (
              <button
                key={`${r}-${c}`}
                aria-label={`cell ${r}-${c} hidden`}
                className={clsx(
                  'flex items-center justify-center font-bold',
                  'border border-b-gray-500 border-l-gray-100 border-r-gray-500 border-t-gray-100 bg-gray-400',
                  'shadow-[inset_-2px_-2px_3px_rgba(0,0,0,0.15),inset_2px_2px_3px_rgba(255,255,255,0.4)]',
                  'hover:brightness-105 active:brightness-95',
                  'dark:border-b-gray-900 dark:border-l-gray-600 dark:border-r-gray-900 dark:border-t-gray-600 dark:bg-gray-600',
                  'dark:shadow-[inset_-2px_-2px_3px_rgba(0,0,0,0.3),inset_2px_2px_3px_rgba(255,255,255,0.08)]',
                  size,
                  cell.flagged && 'bg-amber-300 dark:bg-amber-700'
                )}
                onClick={() => onCellClick(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  handleRightClick(r, c)
                }}
              >
                {cell.flagged ? '🚩' : ''}
              </button>
            )
          })
        )}
      </div>

      {/* 操作提示 / 状态 */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        {status === 'ready' && '点击任意格子开始游戏（首次点击不会踩雷）'}
        {status === 'playing' && '左键翻开 · 右键插旗 · 点击已翻开的数字可快速展开（和弦）'}
        {status === 'won' && '🎉 太棒了，你赢了！'}
        {status === 'lost' && '💥 踩到地雷了，点击笑脸重新开始'}
      </div>
    </div>
  )
}
