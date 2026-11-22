import { allBlogs, allSnippets } from 'contentlayer/generated'
import { Home, type HomeStats } from '~/components/home-page'
import { SITE_METADATA } from '~/data/site-metadata'
import tagData from '~/json/tag-data.json'
import { allCoreContent } from '~/utils/contentlayer'
import { sortPosts } from '~/utils/misc'

const MAX_POSTS_DISPLAY = 6
const MAX_SNIPPETS_DISPLAY = 6
const MAX_RANDOM_DISPLAY = 3

const DAY_MS = 24 * 60 * 60 * 1000

function daysSince(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / DAY_MS))
}

export default async function HomePage() {
  const posts = allCoreContent(sortPosts(allBlogs)).filter((p) => !p.draft)

  // ── 数据叙事（构建时统计）──
  const stats: HomeStats = {
    posts: posts.length,
    tags: Object.keys(tagData).length,
    words: posts.reduce((sum, p) => sum + (p.readingTime?.words ?? 0), 0),
    days: daysSince(SITE_METADATA.siteStartDate),
    resonation: posts.length
      ? daysSince(posts.reduce((min, p) => (p.date < min ? p.date : min), posts[0].date))
      : 0,
  }

  // ── 置顶卡：pinned: true 优先，否则最新一篇 ──
  const pinned = posts.find((p) => p.pinned) ?? posts[0]

  // ── 最新文章网格：排除置顶后的前 N 篇 ──
  const latest = posts.filter((p) => p.slug !== pinned?.slug).slice(0, MAX_POSTS_DISPLAY)

  // ── 随手翻一篇：构建时随机抽样 + 客户端「换一批」的 pool ──
  const pool = posts.filter((p) => p.slug !== pinned?.slug)
  const randomPosts = pool
    .map((p) => ({ p, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, MAX_RANDOM_DISPLAY)
    .map(({ p }) => p)
  const randomPool = pool
    .map((p) => ({ p, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 10)
    .map(({ p }) => p)

  const snippets = allCoreContent(sortPosts(allSnippets)).slice(0, MAX_SNIPPETS_DISPLAY)

  return (
    <Home
      pinned={pinned}
      posts={latest}
      snippets={snippets}
      randomPosts={randomPosts}
      randomPool={randomPool}
      stats={stats}
    />
  )
}
