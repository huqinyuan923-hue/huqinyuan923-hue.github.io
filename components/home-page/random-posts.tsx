import type { Blog } from 'contentlayer/generated'
import { Twemoji } from '~/components/ui/twemoji'
import { Link } from '~/components/ui/link'
import type { CoreContent } from '~/types/data'
import { formatDate } from '~/utils/misc'

/** 随手翻一篇：构建时随机抽样的文章小列表（客户端「换一批」留给任务 5） */
export function RandomPosts({ posts }: { posts: CoreContent<Blog>[] }) {
  if (!posts.length) return null
  return (
    <section aria-label="随手翻一篇">
      <p className="kicker mb-2">{'~/random'}</p>
      <h2 className="mb-6 flex items-center gap-2 font-heading text-2xl font-bold md:text-4xl">
        随手翻一篇
        <Twemoji emoji="game-die" size="base" />
      </h2>
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
