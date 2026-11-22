import { ProfileCard } from '~/components/cards/profile'
import { Container } from '~/components/ui/container'
import type { CoreContent } from '~/types/data'
import type { Blog, Snippet } from '~/.contentlayer/generated'
import { BlogLinks } from './links'
import { FeaturedCategories } from './featured-categories'
import { Hero } from './hero'
import { LatestPosts } from './latest-posts'
import { OwnerStats } from './owner-stats'
import { PinnedPost } from './pinned-post'
import { RandomPosts } from './random-posts'
import { WaveDivider } from './wave-divider'

export type HomeStats = {
  posts: number
  tags: number
  /** 全站总字数（构建时统计） */
  words: number
  /** 建站运行天数 */
  days: number
  /** 共鸣天数（首篇文章至今） */
  resonation: number
}

/**
 * 首页骨架（参考站同构，爱弥斯主题）：
 * 全屏 Hero（HUD 终端 + 星屑）→ 星轨波浪
 * → 左栏站长卡（sticky）/ 右栏内容流：置顶大卡 → 最新文章网格 → 精选分类 → 随手翻一篇 → 传送门。
 */
export function Home({
  pinned,
  posts,
  snippets,
  randomPosts,
  randomPool,
  stats,
}: {
  pinned: CoreContent<Blog>
  posts: CoreContent<Blog>[]
  snippets: CoreContent<Snippet>[]
  randomPosts: CoreContent<Blog>[]
  randomPool: CoreContent<Blog>[]
  stats: HomeStats
}) {
  return (
    <div className="pt-0">
      <Hero stats={stats} />
      <WaveDivider />
      <Container as="div" className="pb-8">
        <div className="mt-4 gap-10 lg:mt-6 lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* 左栏：站长卡（HUD 全息卡 + Spotify 在播）+ 统计卡，桌面端吸顶 */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6 pb-6">
              <ProfileCard />
              <OwnerStats stats={stats} variant="card" />
            </div>
          </aside>

          {/* 右栏：内容流 */}
          <div className="min-w-0 space-y-12 md:space-y-16">
            <PinnedPost post={pinned} />
            <LatestPosts posts={posts} snippets={snippets} />
            <FeaturedCategories />
            <RandomPosts initial={randomPosts} pool={randomPool} />
            <section aria-label="传送门" className="md:mt-10">
              <p className="kicker mb-2">{'~/teleport'}</p>
              <h2 className="mb-6 font-heading text-2xl font-bold md:text-4xl">传送门</h2>
              <BlogLinks />
            </section>
          </div>
        </div>
      </Container>
    </div>
  )
}
