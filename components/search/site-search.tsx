'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { OPEN_SEARCH_EVENT, requestOpenSearch, type KBarSearchProps } from './search-events'

const KBarSearchShell = dynamic(() => import('./kbar-shell').then((mod) => mod.KBarSearchShell), {
  ssr: false,
})

/**
 * 首屏只保留这个极小的监听器；kbar 的运行时（连同 ariakit）在用户
 * 第一次请求搜索时才下载，避免拖慢 LCP 的渲染阶段。
 */
export function SiteSearch({ configs }: { configs: KBarSearchProps }) {
  const [isRequested, setIsRequested] = useState(false)

  useEffect(() => {
    const request = () => setIsRequested(true)
    // 监听器常驻：壳层挂载后 ⌘K 交给 kbar-shell 做开合切换
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        requestOpenSearch()
      }
    }
    window.addEventListener(OPEN_SEARCH_EVENT, request)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener(OPEN_SEARCH_EVENT, request)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  if (!isRequested) return null
  return <KBarSearchShell configs={configs} autoOpen />
}
