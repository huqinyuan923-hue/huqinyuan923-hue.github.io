'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const AskAI = dynamic(() => import('./ask-ai').then((mod) => mod.AskAI), { ssr: false })

/** 浮窗不是首屏内容，等浏览器空闲后再加载它的代码和本地嵌入模型。 */
export function AskAILazy() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number
      cancelIdleCallback?: (id: number) => void
    }
    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(() => setReady(true), { timeout: 2500 })
      return () => idleWindow.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(() => setReady(true), 2000)
    return () => window.clearTimeout(id)
  }, [])

  return ready ? <AskAI /> : null
}
