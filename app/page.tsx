import { allBlogs, allSnippets } from 'contentlayer/generated'
import { Home, type HomeStats } from '~/components/home-page'
import tagData from '~/json/tag-data.json'
import { allCoreContent } from '~/utils/contentlayer'
import { sortPosts } from '~/utils/misc'

const MAX_POSTS_DISPLAY = 5
const MAX_SNIPPETS_DISPLAY = 6

export default async function HomePage() {
  const stats: HomeStats = {
    posts: allBlogs.length,
    tags: Object.keys(tagData).length,
    words: 0, // 任务 3：构建时统计总字数
    days: 0, // 任务 3：建站运行天数
    resonation: 0, // 任务 3：共鸣天数
  }

  return (
    <Home
      posts={allCoreContent(sortPosts(allBlogs)).slice(0, MAX_POSTS_DISPLAY)}
      snippets={allCoreContent(sortPosts(allSnippets)).slice(0, MAX_SNIPPETS_DISPLAY)}
      stats={stats}
    />
  )
}
