'use client'

import { useEffect, useState } from 'react'

/**
 * 顶部滚动进度条：2px 青→紫渐变，宽度随页面滚动百分比。
 */
export function ScrollProgress() {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement
        const max = doc.scrollHeight - doc.clientHeight
        setPct(max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_8px_rgba(34,211,238,0.7)] transition-[width] duration-100 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
