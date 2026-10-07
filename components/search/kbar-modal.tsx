import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarResults,
  KBarSearch,
  useKBar,
  useMatches,
  useRegisterActions,
  type Action,
} from 'kbar'
import { Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation.js'
import { useEffect, useState } from 'react'

export function KBarModal({ actions, isLoading }: { actions: Action[]; isLoading: boolean }) {
  useRegisterActions(actions, [actions])

  return (
    <KBarPortal>
      <KBarPositioner className="z-50 bg-gray-300/50 p-4 backdrop-blur backdrop-filter dark:bg-black/50">
        <KBarAnimator className="w-full max-w-xl">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center space-x-4 p-4">
              <span className="block w-5">
                <svg
                  className="text-gray-400 dark:text-gray-300"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </span>
              <KBarSearch
                defaultPlaceholder="搜索文章，或输入命令…"
                className="h-8 w-full bg-transparent text-gray-600 placeholder-gray-400 focus:outline-none dark:text-gray-200 dark:placeholder-gray-500"
              />
              <kbd className="inline-block whitespace-nowrap rounded border border-gray-400 px-1.5 align-middle text-xs font-medium leading-4 tracking-wide text-gray-400">
                ESC
              </kbd>
            </div>
            {!isLoading && <RenderResults />}
            {!isLoading && <SemanticResults />}
            {isLoading && (
              <div className="block border-t border-gray-100 px-4 py-8 text-center text-gray-400 dark:border-gray-800 dark:text-gray-600">
                加载中…
              </div>
            )}
          </div>
        </KBarAnimator>
      </KBarPositioner>
    </KBarPortal>
  )
}

interface SemanticHit {
  slug: string
  title: string
  heading: string
  snippet: string
  score: number
  url: string
}

const semanticCache = new Map<string, SemanticHit[]>()

/**
 * AI 语义搜索：不走 kbar 的关键词匹配，直接请求 Worker
 * /api/semantic-search（查询向量化后与全站文章块做余弦排序）。
 * 请求失败（如本地 dev 无 Worker）时静默隐藏，不影响关键词搜索。
 */
function SemanticResults() {
  // 注意：useKBar 的返回值始终是 { ...collected, query, options } 包装对象，
  // 选择器只能用于挑选字段，不能直接拿返回值当裸字符串用
  const { searchQuery } = useKBar((state) => ({ searchQuery: state.searchQuery }))
  const { query } = useKBar()
  const router = useRouter()
  const [hits, setHits] = useState<SemanticHit[]>([])
  const [loading, setLoading] = useState(false)

  const q = searchQuery.trim()
  useEffect(() => {
    if (q.length < 2) {
      setHits([])
      setLoading(false)
      return
    }
    const cached = semanticCache.get(q)
    if (cached) {
      setHits(cached)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/semantic-search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        const results: SemanticHit[] = Array.isArray(data.results) ? data.results : []
        semanticCache.set(q, results)
        setHits(results)
      } catch {
        // 语义搜索不可用时保持静默，关键词搜索照常工作
      } finally {
        setLoading(false)
      }
    }, 350)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q])

  if (q.length < 2) return null

  if (loading && hits.length === 0) {
    return (
      <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-400 dark:border-gray-800 dark:text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          AI 语义搜索中…
        </span>
      </div>
    )
  }
  if (hits.length === 0) return null

  return (
    <div className="border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-1.5 px-4 pb-1 pt-3 text-xs font-semibold uppercase text-primary-600 dark:text-primary-400">
        <Sparkles className="h-3.5 w-3.5" />
        AI 语义搜索
      </div>
      <ul>
        {hits.slice(0, 6).map((hit) => (
          <li key={hit.slug + hit.heading}>
            <button
              type="button"
              onClick={() => {
                query.toggle()
                router.push(new URL(hit.url).pathname)
              }}
              className="block w-full px-4 py-2 text-left hover:bg-primary-600/10 dark:hover:bg-primary-400/10"
            >
              <div className="text-[15px] text-gray-700 dark:text-gray-200">{hit.title}</div>
              {hit.heading && (
                <div className="text-xs text-primary-600/80 dark:text-primary-400/80">
                  § {hit.heading}
                </div>
              )}
              <div className="mt-0.5 line-clamp-2 text-xs text-gray-400 dark:text-gray-500">
                {hit.snippet}
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RenderResults() {
  const { results } = useMatches()

  if (results.length) {
    return (
      <KBarResults
        items={results}
        onRender={({ item, active }) => (
          <div>
            {typeof item === 'string' ? (
              <div className="pt-3">
                <div className="block border-t border-gray-100 px-4 pb-2 pt-6 text-xs font-semibold uppercase text-primary-600 dark:border-gray-800">
                  {item}
                </div>
              </div>
            ) : (
              <div
                className={`flex cursor-pointer justify-between px-4 py-2 ${
                  active
                    ? 'bg-primary-600 text-gray-100'
                    : 'bg-transparent text-gray-700 dark:text-gray-100'
                }`}
              >
                <div className={'flex space-x-2'}>
                  {item.icon && <div className={'self-center'}>{item.icon}</div>}
                  <div className="block">
                    {item.subtitle && (
                      <div className={`${active ? 'text-gray-200' : 'text-gray-400'} text-xs`}>
                        {item.subtitle}
                      </div>
                    )}
                    <div>{item.name}</div>
                  </div>
                </div>
                {item.shortcut?.length ? (
                  <div aria-hidden className="flex flex-row items-center justify-center gap-x-2">
                    {item.shortcut.map((sc) => (
                      <kbd
                        key={sc}
                        className={`flex h-7 w-6 items-center justify-center rounded border text-xs font-medium ${active ? 'border-gray-200 text-gray-200' : 'border-gray-400 text-gray-400'}`}
                      >
                        {sc}
                      </kbd>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      />
    )
  } else {
    return (
      <div className="block border-t border-gray-100 px-4 py-8 text-center text-gray-400 dark:border-gray-800 dark:text-gray-600">
        没有找到相关结果…
      </div>
    )
  }
}
