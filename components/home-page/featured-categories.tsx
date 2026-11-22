import tagData from '~/json/tag-data.json'
import { Link } from '~/components/ui/link'

/** 标签 → 卡片 emoji 的简单映射（命中关键词用专属图标，否则用通用标签） */
const EMOJI_RULES: Array<[string, string]> = [
  ['emulator', '🕹️'],
  ['从零手写', '🧪'],
  ['handwrit', '🧪'],
  ['web', '🌐'],
  ['javascript', '✨'],
  ['typescript', '🧩'],
  ['react', '⚛️'],
  ['next', '▲'],
  ['css', '🎨'],
  ['git', '🌿'],
  ['docker', '🐳'],
  ['工具', '🛠️'],
  ['tool', '🛠️'],
  ['游戏', '🎮'],
  ['game', '🎮'],
  ['音乐', '🎧'],
  ['日常', '☕'],
  ['life', '☕'],
  ['deflate', '📦'],
  ['jpeg', '🖼️'],
]

function emojiFor(tag: string): string {
  const lower = tag.toLowerCase()
  for (const [keyword, emoji] of EMOJI_RULES) {
    if (lower.includes(keyword.toLowerCase())) return emoji
  }
  return '🏷️'
}

/** 精选分类卡：tag-data.json 按篇数排序取前 6（key 已是 kebab-case slug） */
export function FeaturedCategories() {
  const tags = Object.entries(tagData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  return (
    <section aria-label="精选分类">
      <p className="kicker mb-2">{'~/categories'}</p>
      <h2 className="mb-6 font-heading text-2xl font-bold md:text-4xl">精选分类</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        {tags.map(([tag, count]) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            data-umami-event={`home-category-${tag}`}
            className="glass-card card-hover-glow group flex items-center justify-between gap-2 rounded-2xl px-4 py-3.5"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="text-xl" aria-hidden="true">
                {emojiFor(tag)}
              </span>
              <span className="truncate text-sm font-medium md:text-base">{tag}</span>
            </span>
            <span className="shrink-0 font-mono text-sm text-primary-500">{count}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
