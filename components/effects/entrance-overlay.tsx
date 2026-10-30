'use client'

import { useEffect, useState } from 'react'

const BOOT_LINES = [
  { text: '> initializing blog.exe', ok: '' },
  { text: '> loading modules · themes · games', ok: 'OK' },
  { text: '> mounting arcade.decks × 40', ok: 'OK' },
  { text: '> establishing uplink', ok: 'READY' },
]

const BOOT_FALLBACK_MS = 4500
const EXIT_FALLBACK_MS = 1200

type BootWindow = Window & { __bootT0?: number }

/**
 * 进站引导动画：整段共用一条时钟。
 * 内联脚本在遮罩首帧真正可见后才切到 go（CSS 起播）；
 * 水合完成的 effect 等到引导播完再触发淡出——此时页面已经水合，
 * 揭开遮罩后不会再出现第二段入场。每会话仅播一次。
 */
export function EntranceOverlay() {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (root.dataset.boot === 'done') {
      setGone(true)
      return
    }

    let fillTimer = 0
    let fallbackTimer = 0
    let finishTimer = 0

    const finish = () => {
      if (root.dataset.boot === 'done') return
      root.classList.remove('boot-exiting')
      root.dataset.boot = 'done'
      setGone(true)
    }
    const startExit = () => {
      if (root.dataset.boot === 'done' || root.classList.contains('boot-exiting')) return
      root.classList.add('boot-exiting')
      finishTimer = window.setTimeout(finish, EXIT_FALLBACK_MS)
    }
    const onAnimEnd = (e: AnimationEvent) => {
      if (e.animationName === 'boot-exit') finish()
      else if (e.animationName === 'boot-fill') {
        // 进度条跑到 100% 后再留一拍，整段引导完整播完才淡出
        fillTimer = window.setTimeout(startExit, 150)
      }
    }
    document.addEventListener('animationend', onAnimEnd)

    if (root.dataset.boot !== 'playing' && root.dataset.boot !== 'go') {
      finish()
      return () => document.removeEventListener('animationend', onAnimEnd)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish()
      return () => document.removeEventListener('animationend', onAnimEnd)
    }

    // 内联脚本的起播 rAF 若被主线程卡住，这里补一个时钟锚点
    if (root.dataset.boot === 'playing') {
      root.dataset.boot = 'go'
      ;(window as BootWindow).__bootT0 = performance.now()
    }
    const t0 = (window as BootWindow).__bootT0 ?? performance.now()

    // 水合晚于进度条结束时，animationend 已经错过：直接补一个短收尾
    const overlayEl = document.querySelector<HTMLElement>('.entrance-overlay')
    const fill = overlayEl
      ?.getAnimations({ subtree: true })
      .find((a) => (a as CSSAnimation).animationName === 'boot-fill')
    const fillEnd =
      fill && fill.startTime !== null
        ? Number(fill.startTime) + Number(fill.effect?.getComputedTiming().endTime ?? 0)
        : 0
    if (fillEnd > 0 && fillEnd <= performance.now()) {
      fillTimer = window.setTimeout(startExit, 150)
    }

    // 兜底：水合晚于引导结束时立即收尾；否则等 boot-fill 的结束事件
    fallbackTimer = window.setTimeout(
      startExit,
      Math.max(0, t0 + BOOT_FALLBACK_MS - performance.now())
    )

    return () => {
      document.removeEventListener('animationend', onAnimEnd)
      window.clearTimeout(fillTimer)
      window.clearTimeout(fallbackTimer)
      window.clearTimeout(finishTimer)
    }
  }, [])

  if (gone) return null

  return (
    <div className="entrance-overlay" aria-hidden="true">
      <div className="boot-logo">
        ADCakeyuan
        <span className="boot-caret" />
      </div>
      <div className="boot-log">
        {BOOT_LINES.map(({ text, ok }) => (
          <span key={text} className="line">
            {text}
            {ok && (
              <>
                {' '}
                <span className="ok">{ok}</span>
              </>
            )}
          </span>
        ))}
      </div>
      <div className="boot-bar" />
      <div className="boot-pct" />
    </div>
  )
}
