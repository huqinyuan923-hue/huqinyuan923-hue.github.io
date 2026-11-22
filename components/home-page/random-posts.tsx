'use client'

import clsx from 'clsx'
import type { Blog } from 'contentlayer/generated'
import { useState } from 'react'
import { Twemoji } from '~/components/ui/twemoji'
import { Link } from '~/components/ui/link'
import type { CoreContent } from '~/types/data'
import { formatDate } from '~/utils/misc'

const DISPLAY_COUNT = 3

/**
 * 随手翻一篇：构建时随机抽样的文章小列表 + 客户端「换一批」。
 * pool（8~10 篇）由 SSG 传入，前端轮转抽样，无额外 API。
 */
export function RandomPosts({
  initial,
  pool = [],
}: {
  initial: CoreContent<Blog>[]
  pool?: CoreContent<Blog>[]
}) {
  const [posts, setPosts] = useState(initial)

  const reshuffle = () => {
    if (pool.length <= DISPLAY_COUNT) return
    setPosts((prev) => {
      const current = new Set(prev.map((p) => p.slug))
      const rest = pool.filter((p) => !current.has(p.slug))
      const candidates = rest.length >= DISPLAY_COUNT ? rest : pool
      const next = [...candidates]
        .map((p) => ({ p, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .slice(0, DISPLAY_COUNT)
        .map(({ p }) => p)
      return next.length ? next : prev
    })
  }

  if (!initial.length) return null

  return (
    <section aria-label="随手翻一篇">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="kicker mb-2">{'~/random'}</p>
          <h2 className="flex items-center gap-2 font-heading text-2xl font-bold md:text-4xl">
            随手翻一篇
            <Twemoji emoji="game-die" size="base" />
          </h2>
        </div>
        {pool.length > DISPLAY_COUNT && (
          <button
            onClick={reshuffle}
            data-umami-event="home-random-reshuffle"
            className={clsx(
              'flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5',
              'font-mono text-xs text-muted-foreground transition-all',
              'hover:border-primary-400/60 hover:text-primary-500 hover:shadow-md hover:shadow-primary-500/30'
            )}
          >
            换一批
          </button>
        )}
      </div>
      <div className="glass-card divide-y divide-border rounded-2xl">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            data-umami-event="home-random-post"
            className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-primary-500/5"
          >
            <span className="min-w-0 truncate text-sm font-medium md:text-base">
              <span className="mr-2 font-mono text-xs text-primary-500 opacity-0 transition-opacity group-hover:opacity-100">
                {'> '}
              </span>
              {post.title}
            </span>
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {formatDate(post.date)} · {Math.ceil(post.readingTime.minutes)} min
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
