import Link from 'next/link'
import relatedData from '~/json/related-posts.json'
import { formatDate } from '~/utils/misc'

interface RelatedPost {
  slug: string
  title: string
  date: string
}

/**
 * 「相关文章」：构建期由 scripts/build-semantic-index.mjs 用文章向量
 * 余弦相似度算出的 Top-3，静态导入零运行时开销。
 */
export function RelatedPosts({ slug }: { slug: string }) {
  const related = (relatedData as Record<string, RelatedPost[]>)[slug]
  if (!related || related.length === 0) return null

  return (
    <section className="not-prose pt-4">
      <h2 className="text-xl font-bold">继续阅读 · 相关文章</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        根据文章内容的语义相似度自动推荐
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col rounded-xl border border-gray-200 p-4 transition-all hover:border-primary-500/50 hover:shadow-md dark:border-gray-700 dark:hover:border-primary-400/50"
          >
            <time className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(post.date)}
            </time>
            <span className="mt-1.5 font-medium leading-snug text-gray-800 group-hover:text-primary-600 dark:text-gray-200 dark:group-hover:text-primary-400">
              {post.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
