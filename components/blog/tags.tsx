import { clsx } from 'clsx'
import { slug } from 'github-slugger'
import { Link } from '~/components/ui/link'

export function TagsList({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 md:gap-3">
      {tags.map((tag) => (
        <Tag key={tag} text={tag} />
      ))}
    </div>
  )
}

export function Tag({ text, size = 'sm' }: { text: string; size?: 'sm' | 'md' }) {
  const tagName = text.split(' ').join('-')
  return (
    <Link
      href={`/tags/${slug(text)}`}
      className={clsx([
        'rounded-lg px-2 py-0.5 font-mono text-sm font-medium',
        'bg-slate-100 text-gray-600',
        'border border-transparent transition-all duration-300',
        'hover:border-cyan-400/60 hover:text-cyan-600 hover:shadow-[0_0_10px_-2px_rgba(34,211,238,0.5)]',
        'dark:bg-gray-800/80 dark:text-gray-300 dark:hover:border-cyan-400/50 dark:hover:text-cyan-300',
        size === 'sm' ? 'text-sm' : 'text-base',
      ])}
    >
      <span data-umami-event={`tag-${tagName}`}>#{tagName}</span>
    </Link>
  )
}
