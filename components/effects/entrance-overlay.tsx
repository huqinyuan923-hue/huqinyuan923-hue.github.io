'use client'

import { useEffect, useState } from 'react'

const BOOT_LINES = [
  { text: '> initializing blog.exe', ok: '' },
  { text: '> loading modules · themes · games', ok: 'OK' },
  { text: '> mounting arcade.decks × 40', ok: 'OK' },
  { text: '> establishing uplink', ok: 'READY' },
]

/**
 * 进站引导动画：终端日志逐行（JS 状态驱动，不依赖 CSS 加载时机）→
 * 徽标辉光 → 霓虹进度条 + 百分比，3.0s 播完 + 0.6s 整层淡出。
 * 每会话仅播一次（layout 内联脚本在文档开头标记）；prefers-reduced-motion 直接跳过。
 */
export function EntranceOverlay() {
  const [gone, setGone] = useState(false)
  const [shownLines, setShownLines] = useState(0)

  useEffect(() => {
    // 日志逐行显现（JS 时钟，与 CSS 动画解耦）
    const timers = BOOT_LINES.map((_, i) =>
      window.setTimeout(() => setShownLines(i + 1), 250 + i * 320)
    )
    // 收尾与 CSS 时钟自同步：监听 boot-exit 的 animationend；
    // 兜底 6s 强制收尾（防后台标签页节流丢事件）
    const onAnimEnd = (e: AnimationEvent) => {
      if (e.animationName === 'boot-exit') {
        document.documentElement.dataset.boot = 'done'
        setGone(true)
      }
    }
    document.addEventListener('animationend', onAnimEnd)
    const fallback = window.setTimeout(() => {
      document.documentElement.dataset.boot = 'done'
      setGone(true)
    }, 6000)
    return () => {
      timers.forEach(window.clearTimeout)
      document.removeEventListener('animationend', onAnimEnd)
      window.clearTimeout(fallback)
    }
  }, [])

  if (gone) return null

  return (
    <div className="entrance-overlay" aria-hidden="true">
      <div className="boot-logo">ADCakeyuan</div>
      <div className="boot-log">
        {BOOT_LINES.map(({ text, ok }, i) => (
          <span
            key={text}
            className="line"
            style={{ opacity: i < shownLines ? 1 : 0, transition: 'opacity .25s ease' }}
          >
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
