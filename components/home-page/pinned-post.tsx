import clsx from 'clsx'
import type { Blog } from 'contentlayer/generated'
import { TagsList } from '~/components/blog/tags'
import { GrowingUnderline } from '~/components/effects/growing-underline'
import { Image } from '~/components/ui/image'
import { Link } from '~/components/ui/link'
import { SITE_METADATA } from '~/data/site-metadata'
import type { CoreContent } from '~/types/data'
import { formatDate } from '~/utils/misc'

/** 首页置顶文章大卡：封面 + meta + 渐变标题 + 摘要 + 标签（pinned 优先，否则最新一篇） */
export function PinnedPost({ post }: { post: CoreContent<Blog> }) {
  const { slug, date, title, summary, tags, images, readingTime } = post
  return (
    <section aria-label="置顶文章">
      <p className="kicker mb-2">{'~/pinned'}</p>
      <h2 className="mb-6 font-heading text-2xl font-bold md:text-4xl">置顶文章</h2>
      <Link href={`/blog/${slug}`} className="group block" aria-label={title}>
        <article
          className={clsx(
            'card-hover-glow glass-card relative overflow-hidden rounded-3xl p-4 md:p-6'
          )}
        >
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
            <div className="shrink-0 md:w-[21rem]">
              <Image
                src={images && images.length > 0 ? images[0] : SITE_METADATA.postFallback}
                alt={title}
                width={520}
                height={273}
                className="aspect-[40/21] w-full rounded-2xl object-cover shadow-xl"
                sizes="(min-width: 768px) 336px, 100vw"
                loading="eager"
                fetchPriority="high"
              />
            </div>
            <div className="min-w-0 space-y-3">
              <dl className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted-foreground">
                <span className="rounded-md bg-primary-500/15 px-2 py-0.5 text-primary-600 dark:text-primary-300">
                  置顶
                </span>
                <dd>
                  <time dateTime={date}>{formatDate(date)}</time>
                </dd>
                <span className="text-muted-foreground/50">/</span>
                <span>
                  {readingTime.words} 字 · {Math.ceil(readingTime.minutes)} min
                </span>
              </dl>
              <h3 className="font-heading text-2xl font-bold leading-snug tracking-tight md:text-3xl">
                <span className="text-gray-900 dark:text-gray-100">
                  <GrowingUnderline data-umami-event="pinned-post-title" duration={500}>
                    {title}
                  </GrowingUnderline>
                </span>
              </h3>
              <p className="line-clamp-3 text-sm leading-6 text-muted-foreground md:text-base">
                {summary}
              </p>
              <TagsList tags={tags} />
            </div>
          </div>
        </article>
      </Link>
    </section>
  )
}
