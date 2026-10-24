import { clsx } from 'clsx'
import { Image } from '~/components/ui/image'
import { Link } from '~/components/ui/link'
import { SITE_METADATA } from '~/data/site-metadata'

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label={SITE_METADATA.headerTitle}
      className={clsx(['group flex items-center gap-2.5', className])}
    >
      <span className="rounded-xl p-0.5 shadow-lg shadow-cyan-500/10 ring-1 ring-zinc-900/10 transition-shadow group-hover:shadow-cyan-400/30 dark:ring-white/10">
        <Image
          src="/static/images/avatar-128.webp"
          alt={SITE_METADATA.headerTitle}
          width={128}
          height={128}
          className="h-10 w-10 rounded-xl"
          loading="eager"
        />
      </span>
      <span className="hidden flex-col leading-none sm:flex">
        <span className="font-grotesk text-sm font-bold tracking-wide text-gray-900 dark:text-white">
          ADCakeyuan
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-gray-400 transition-colors group-hover:text-primary-500 dark:text-gray-500">
          blog.exe
        </span>
      </span>
    </Link>
  )
}
