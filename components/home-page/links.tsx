import { Link } from '~/components/ui/link'
import { Twemoji } from '~/components/ui/twemoji'
import { SITE_METADATA } from '~/data/site-metadata'

const LINKS = [
  {
    title: `What have I built?`,
    href: `/projects`,
    emoji: 'man-technologist',
    event: 'home-link-projects',
  },
  {
    title: `My writings`,
    href: `/blog`,
    emoji: 'memo',
    event: 'home-link-blog',
  },
  {
    title: `Snippets collection`,
    href: `/snippets`,
    emoji: 'dna',
    event: 'home-link-snippets',
  },
  {
    title: `My moment`,
    href: `/moment`,
    emoji: 'snowboarder',
    event: 'home-link-moment',
  },
  {
    title: `About me & this blog`,
    href: `/about`,
    emoji: 'smiling-face-with-sunglasses',
    event: 'home-link-about',
  },
]

export function BlogLinks() {
  const links = SITE_METADATA.analytics.umamiAnalytics.shareUrl
    ? [
        ...LINKS,
        {
          title: `Traffic and insights`,
          href: SITE_METADATA.analytics.umamiAnalytics.shareUrl,
          emoji: 'bar-chart',
          event: 'home-link-analytics',
        },
      ]
    : LINKS

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:gap-3">
      {links.map(({ title, href, emoji, event }) => (
        <Link
          key={title}
          href={href}
          data-umami-event={event}
          className="glass-card group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-400/60 hover:shadow-[0_8px_24px_-8px_rgba(34,211,238,0.35)]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gray-900/5 text-lg ring-1 ring-gray-900/10 transition-colors group-hover:bg-cyan-400/10 group-hover:ring-cyan-400/40 dark:bg-white/5 dark:ring-white/10">
            <Twemoji emoji={emoji} />
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-medium leading-6">{title}</span>
          <span className="translate-x-0 font-mono text-xs text-gray-400 opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary-500 group-hover:opacity-100 dark:text-gray-500">
            ↗
          </span>
        </Link>
      ))}
    </div>
  )
}
