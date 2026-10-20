'use client'

import type { Action } from 'kbar'
import { KBarProvider, useKBar } from 'kbar'
import { useRouter } from 'next/navigation.js'
import { useCallback, useEffect, useState } from 'react'
import type { CoreContent, MDXDocument } from '~/types/data'
import { formatDate } from '~/utils/misc'
import { KBarModal } from './kbar-modal'
import { OPEN_SEARCH_EVENT, type KBarSearchProps } from './search-events'

export type { KBarSearchProps }

/**
 * 只有在用户请求搜索时才下载（见 site-search.tsx），因此 kbar 与 ariakit
 * 不进入首屏 JS。
 */
export function KBarSearchShell({
  configs,
  autoOpen,
}: {
  configs: KBarSearchProps
  autoOpen?: boolean
}) {
  const { searchDocumentsPath, defaultActions, onSearchDocumentsLoad } = configs
  const router = useRouter()
  const [searchActions, setSearchActions] = useState<Action[]>([])
  const [isLoading, setIsLoading] = useState(Boolean(searchDocumentsPath))

  const mapPosts = useCallback(
    (posts: CoreContent<MDXDocument>[]): Action[] =>
      posts.map((post) => ({
        id: post.path,
        name: post.title,
        keywords: post?.summary || '',
        section: '文章',
        subtitle: formatDate(post.date),
        perform: () => router.push('/' + post.path),
      })),
    [router]
  )

  useEffect(() => {
    if (!searchDocumentsPath) return
    let stale = false
    const url =
      searchDocumentsPath.indexOf('://') > 0 || searchDocumentsPath.indexOf('//') === 0
        ? searchDocumentsPath
        : new URL(searchDocumentsPath, window.location.origin).toString()
    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (stale) return
        setSearchActions(onSearchDocumentsLoad ? onSearchDocumentsLoad(json) : mapPosts(json))
      })
      .catch(() => undefined)
      .finally(() => {
        if (!stale) setIsLoading(false)
      })
    return () => {
      stale = true
    }
  }, [mapPosts, onSearchDocumentsLoad, searchDocumentsPath])

  return (
    <KBarProvider actions={defaultActions}>
      <SearchToggler openOnMount={autoOpen} />
      <KBarModal actions={searchActions} isLoading={isLoading} />
    </KBarProvider>
  )
}

/** 首次由 site-search 触发时直接展开；之后的点击与 ⌘K 都走这里。 */
function SearchToggler({ openOnMount }: { openOnMount?: boolean }) {
  const { query } = useKBar()

  useEffect(() => {
    if (openOnMount) query.toggle()
  }, [openOnMount, query])

  useEffect(() => {
    const toggle = () => query.toggle()
    window.addEventListener(OPEN_SEARCH_EVENT, toggle)
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, toggle)
  }, [query])

  return null
}
