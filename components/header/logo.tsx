import { clsx } from 'clsx'
import { Image } from '~/components/ui/image'
import { Link } from '~/components/ui/link'
import { SITE_METADATA } from '~/data/site-metadata'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={SITE_METADATA.headerTitle}
      className={clsx([
        'rounded-2xl p-0.5',
        'ring-1 ring-zinc-900/5 dark:ring-white/10',
        'shadow-lg shadow-zinc-800/5',
        className,
      ])}
    >
      <Image
        src="/static/images/avatar-128.webp"
        alt={SITE_METADATA.headerTitle}
        width={128}
        height={128}
        className="h-10 w-10 rounded-2xl"
        loading="eager"
      />
    </Link>
  )
}
