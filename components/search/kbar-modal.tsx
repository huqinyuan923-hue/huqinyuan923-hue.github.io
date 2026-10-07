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
import { embedQuery, getEmbedder } from '~/utils/embedding'
import { cosineRank, loadSearchIndex, type SemanticHit } from '~/utils/semantic-search'

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

const semanticCache = new Map<string, SemanticHit[]>()

/**
 * AI 语义搜索（纯本地）：查询向量在浏览器内计算（首次需下载约 25MB 模型，
 * 之后走浏览器缓存），与构建期生成的全站向量索引做余弦排序。
 * 任何失败都静默隐藏，不影响关键词搜索。
 */
function SemanticResults() {
  const searchQuery = useKBar((state) => state.searchQuery)
  const { query } = useKBar()
  const router = useRouter()
  const [hits, setHits] = useState<SemanticHit[]>([])
  const [status, setStatus] = useState('') // 非空 = 正在加载模型/索引

  const q = searchQuery.trim()
  useEffect(() => {
    if (q.length < 2) {
      setHits([])
      setStatus('')
      return
    }
    const cached = semanticCache.get(q)
    if (cached) {
      setHits(cached)
      setStatus('')
      return
    }
    let stale = false
    setStatus('准备中…')
    const timer = setTimeout(async () => {
      try {
        const index = await loadSearchIndex()
        if (stale) return
        setStatus('加载语义模型…')
        const vec = await embedQuery(q)
        if (stale) return
        setStatus('')
        const results = cosineRank(index, vec, 6)
        semanticCache.set(q, results)
        setHits(results)
      } catch {
        // 语义搜索不可用时保持静默，关键词搜索照常工作
        if (!stale) setStatus('')
      }
    }, 400)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [q])

  // 模型下载进度只在第一次加载时出现：监听全局进度回调
  useEffect(() => {
    if (q.length < 2) return
    const off = onModelProgress((p) => {
      if (p.file?.endsWith('.onnx') && typeof p.progress === 'number') {
        setStatus(`加载语义模型 ${Math.round(p.progress)}%…`)
      } else if (p.status === 'ready') {
        setStatus('')
      }
    })
    return off
  }, [q.length])

  if (q.length < 2) return null

  if (status) {
    return (
      <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-400 dark:border-gray-800 dark:text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 animate-pulse" />
          {status}
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
        {hits.map((hit) => (
          <li key={hit.slug + hit.heading}>
            <button
              type="button"
              onClick={() => {
                query.toggle()
                router.push(hit.url)
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

// ---- 模型下载进度广播（getEmbedder 只接受一次回调，这里做全局转发） ----
type ProgressListener = (p: { status: string; progress?: number; file?: string }) => void
const progressListeners = new Set<ProgressListener>()
let progressHooked = false

function onModelProgress(listener: ProgressListener): () => void {
  progressListeners.add(listener)
  if (!progressHooked) {
    progressHooked = true
    getEmbedder((p) => {
      for (const l of progressListeners) l(p)
    }).catch(() => {
      // 静默：具体调用方自行处理失败
    })
  }
  return () => progressListeners.delete(listener)
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
        No results for your search...
      </div>
    )
  }
}
