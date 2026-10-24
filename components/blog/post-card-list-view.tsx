import clsx from 'clsx'
import type { Blog } from 'contentlayer/generated'
import { TagsList } from '~/components/blog/tags'
import { GritBackground } from '~/components/effects/grit-background'
import { GrowingUnderline } from '~/components/effects/growing-underline'
import { Image } from '~/components/ui/image'
import { Link } from '~/components/ui/link'
import { SITE_METADATA } from '~/data/site-metadata'
import type { CoreContent } from '~/types/data'
import { formatDate } from '~/utils/misc'

export function PostCardListView({
  post,
  loading,
  index,
}: {
  post: CoreContent<Blog>
  loading?: 'lazy' | 'eager'
  index?: number
}) {
  const { slug, date, title, summary, tags, images, readingTime } = post
  return (
    <article className="group relative">
      {/* 大号编号水印 */}
      {index !== undefined && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 right-0 select-none font-grotesk text-[88px] font-bold leading-none text-gray-900/[0.04] dark:text-white/[0.05]"
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      )}
      <div className="flex flex-col gap-2 space-y-3 md:flex-row md:gap-8">
        <Link
          href={`/blog/${slug}`}
          className={clsx([
            'relative block shrink-0',
            'h-auto w-full md:w-[22rem]',
            'pb-3 pl-0 pr-3 pt-0',
            'transition-all ease-in-out hover:pb-2 hover:pl-1 hover:pr-2 hover:pt-1',
          ])}
        >
          <Image
            src={images && images.length > 0 ? images[0] : SITE_METADATA.postFallback}
            alt={title}
            width={500}
            height={262}
            className="aspect-[40/21] h-full w-full rounded-xl object-cover shadow-2xl"
            loading={loading}
            fetchPriority={loading === 'eager' ? 'high' : undefined}
            sizes="(min-width: 768px) 352px, 100vw"
          />
          <GritBackground
            className={clsx([
              'bottom-0 left-3 right-0 top-3',
              'rounded-xl border-2 border-cyan-500/30 transition-colors duration-300 group-hover:border-violet-500/60 dark:border-cyan-400/25 dark:group-hover:border-violet-400/50',
            ])}
          />
        </Link>
        <div className="space-y-4 md:space-y-5">
          <div className="space-y-4 md:space-y-6">
            <div className="space-y-3">
              <dl className="font-mono text-xs text-gray-500 dark:text-gray-400">
                <dt className="sr-only">Published on</dt>
                <dd className="leading-6">
                  <time dateTime={date}>{formatDate(date)}</time>
                  <span className="mx-2 text-gray-400">/</span>
                  <span>{Math.ceil(readingTime.minutes)} mins read</span>
                </dd>
              </dl>
              <h2 className="pb-1 font-grotesk text-xl font-bold tracking-tight md:text-2xl">
                <Link href={`/blog/${slug}`} className="text-gray-900 dark:text-gray-100">
                  <GrowingUnderline data-umami-event="latest-post-title" duration={500}>
                    {title}
                  </GrowingUnderline>
                </Link>
              </h2>
              <TagsList tags={tags} />
            </div>
            <div className="line-clamp-2 text-gray-500 dark:text-gray-400 md:line-clamp-3">
              {summary}
            </div>
          </div>
          <div className="text-base font-medium leading-6">
            <Link
              href={`/blog/${slug}`}
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-300"
              aria-label={`Read article: ${title}`}
            >
              <GrowingUnderline data-umami-event="latest-post-read-more">
                Read article →
              </GrowingUnderline>
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
