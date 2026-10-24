'use client'

import { useEffect } from 'react'

/**
 * 滚动显现：页面里的卡片进入视口时上浮淡入。
 * 初始隐藏状态由 html.js-anim（内联脚本在文档开头添加）作用，
 * JS 不可用或 prefers-reduced-motion 时元素直接可见，不会丢内容。
 */
export function ScrollReveal() {
  useEffect(() => {
    const docEl = document.documentElement
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      docEl.classList.add('reveal-ready')
      return
    }

    const selector = 'main article, main .glass-card'
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -36px 0px' }
    )

    docEl.classList.add('reveal-ready')
    // 等一拍再观察：让首屏内容直接带 revealed，避免开屏闪隐
    const targets = Array.from(document.querySelectorAll<HTMLElement>(selector))
    for (const el of targets) {
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight * 0.9) {
        el.classList.add('revealed')
      } else {
        observer.observe(el)
      }
    }
    // 动态插入的内容（分页/切换视图）也纳入观察
    const mo = new MutationObserver(() => {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (!el.classList.contains('revealed')) {
          const rect = el.getBoundingClientRect()
          if (rect.top < window.innerHeight * 0.9) {
            el.classList.add('revealed')
          } else {
            observer.observe(el)
          }
        }
      })
    })
    mo.observe(document.querySelector('main') ?? document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}
