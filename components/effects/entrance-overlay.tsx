'use client'

import { useEffect, useState } from 'react'

/**
 * 进站引导动画：boot 日志 + 霓虹进度条，1.55s 后整层淡出（CSS forwards 收尾）。
 * - 每个浏览器会话只播一次（sessionStorage 'hud-boot-seen'，由 layout 的内联
 *   脚本在水合前打 data-boot 标记，重复访问不会闪屏）
 * - prefers-reduced-motion 用户由 CSS 直接 display:none 跳过
 */
export function EntranceOverlay() {
  const [gone, setGone] = useState(false)

  useEffect(() => {
    // 存储标记已由 layout 内联脚本在文档开头完成；
    // 这里只负责在 CSS 动画播完后（1.55s 延迟 + 0.55s 淡出）收尾卸载。
    const finish = window.setTimeout(() => {
      document.documentElement.dataset.boot = 'done'
      setGone(true)
    }, 2150)
    return () => window.clearTimeout(finish)
  }, [])

  if (gone) return null

  return (
    <div className="entrance-overlay" aria-hidden="true">
      <div className="boot-logo">ADCakeyuan</div>
      <div className="boot-log">{'> initializing blog.exe'}</div>
      <div className="boot-bar" />
    </div>
  )
}
