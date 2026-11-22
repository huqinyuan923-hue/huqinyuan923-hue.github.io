'use client'

import { useEffect } from 'react'
import { matchFestival } from '~/data/festivals'

/**
 * 节日自动换肤（参考站同机制）：挂载时按当日日期匹配节日主题，
 * 设置 html[data-festival=...] 激活 tailwind.css 末尾的 CSS 变量覆盖。
 * 常规日期零覆盖、零额外渲染；动画遵循 prefers-reduced-motion。
 */
export function ThemeOverride() {
  useEffect(() => {
    const festival = matchFestival()
    const root = document.documentElement
    if (festival) {
      root.dataset.festival = festival.key
    } else {
      delete root.dataset.festival
    }
  }, [])

  return null
}
