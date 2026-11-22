import clsx from 'clsx'
import type { Blog } from 'contentlayer/generated'
import { TagsList } from '~/components/blog/tags'
import { GrowingUnderline } from '~/components/effects/growing-underline'
import { Image } from '~/components/ui/image'
import { Link } from '~/components/ui/link'
import { SITE_METADATA } from '~/data/site-metadata'
import type { CoreContent } from '~/types/data'
import { formatDate } from '~/utils/misc'

/** 首页「最新文章」两列网格的紧凑卡：封面 + meta（字数/时长）+ 标题 + 摘要 + 标签 */
export function PostGridCard({
  post,
  loading = 'lazy',
}: {
  post: CoreContent<Blog>
  loading?: 'lazy' | 'eager'
}) {
  const { slug, date, title, summary, tags, images, readingTime } = post
  return (
    <article className="card-hover-glow glass-card group flex h-full flex-col rounded-2xl p-4">
      <Link
        href={`/blog/${slug}`}
        className="relative block overflow-hidden rounded-xl"
        aria-label={title}
        tabIndex={-1}
      >
        <Image
          src={images && images.length > 0 ? images[0] : SITE_METADATA.postFallback}
          alt={title}
          width={520}
          height={273}
          className="aspect-[40/21] w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          sizes="(min-width: 640px) 320px, 100vw"
          loading={loading}
        />
      </Link>
      <div className="flex flex-1 flex-col pt-4">
        <dl className="flex items-center gap-x-2 font-mono text-xs text-muted-foreground">
          <time dateTime={date}>{formatDate(date)}</time>
          <span className="text-muted-foreground/50">/</span>
          <span>
            {readingTime.words} 字 · {Math.ceil(readingTime.minutes)} min
          </span>
        </dl>
        <h3 className="mt-2 font-heading text-lg font-bold leading-snug tracking-tight">
          <Link href={`/blog/${slug}`} className="text-gray-900 dark:text-gray-100">
            <GrowingUnderline data-umami-event="home-post-title">{title}</GrowingUnderline>
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{summary}</p>
        <div className={clsx('mt-auto pt-3', !tags.length && 'hidden')}>
          <TagsList tags={tags} />
        </div>
      </div>
    </article>
  )
}
