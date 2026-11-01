'use client'

import { useEffect, useState } from 'react'

const BOOT_LINES = [
  { text: '> initializing blog.exe', ok: 'OK' },
  { text: '> loading modules · themes · games', ok: 'OK' },
  { text: '> mounting arcade.decks × 40+', ok: 'OK' },
  { text: '> indexing posts · 68 mdx · 106 tags', ok: 'OK' },
  { text: '> linking cha · galaxy · town', ok: 'OK' },
  { text: '> establishing uplink', ok: 'READY' },
]

const BOOT_FALLBACK_MS = 4000
const EXIT_FALLBACK_MS = 1200
/** 整段引导的最后一个动画：它结束才允许淡出，避免收尾文案被掐掉 */
const SEQ_END_ANIM = 'boot-ready'

type BootWindow = Window & { __bootT0?: number }

/**
 * 进站引导动画：整段共用一条时钟。
 * 内联脚本等样式表生效（遮罩 computed position=fixed）后才切到 go（CSS 起播），
 * 并在 boot-ready 的 animationend 后 +150ms 触发淡出——不依赖水合，
 * 慢水合不会再卡在 READY；样式表迟迟不来时由这里补锚点并同样按上限收尾。
 * 另负责无动画场景（已播过、减少动效）直接卸载遮罩。每会话仅播一次。
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
      else if (e.animationName === SEQ_END_ANIM) {
        // 整段引导（含收尾文案）播完后再留一拍才淡出
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

    // 水合晚于整段引导结束时，animationend 已经错过：直接补一个短收尾
    const overlayEl = document.querySelector<HTMLElement>('.entrance-overlay')
    const last = overlayEl
      ?.getAnimations({ subtree: true })
      .find((a) => (a as CSSAnimation).animationName === SEQ_END_ANIM)
    const seqEnd =
      last && last.startTime !== null
        ? Number(last.startTime) + Number(last.effect?.getComputedTiming().endTime ?? 0)
        : 0
    if (seqEnd > 0 && seqEnd <= performance.now()) {
      fillTimer = window.setTimeout(startExit, 150)
    }

    // 兜底：水合迟迟不来时立即收尾；否则等收尾动画的结束事件
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
      <span className="boot-grid" />
      <span className="boot-sweep" />
      <span className="boot-frame" />
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
      <div className="boot-hud">{'SSG · CLOUDFLARE EDGE · 0 COLD START'}</div>
      <div className="boot-ready">{'READY · WELCOME TO MY DECK'}</div>
    </div>
  )
}
