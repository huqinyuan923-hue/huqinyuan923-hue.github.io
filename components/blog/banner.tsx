import { clsx } from 'clsx'
import { GritBackground } from '~/components/effects/grit-background'
import { Image } from '~/components/ui/image'
import { Zoom } from '~/components/ui/zoom'
import { Link } from '~/components/ui/link'
import { capitalize, kebabCaseToPlainText } from '~/utils/misc'

export function Banner({ banner, className }: { banner: string; className?: string }) {
  const [path, author, id] = banner.split('__')
  const handle = path.split('/').pop() || ''
  return (
    <div className={clsx('hud-corners relative', className)}>
      <Zoom>
        <Image
          src={banner}
          alt={capitalize(kebabCaseToPlainText(handle)) || 'Article banner photo'}
          width={1600}
          height={900}
          className="banner-reveal h-auto w-full rounded-lg border border-gray-900/10 shadow-2xl shadow-cyan-500/10 dark:border-white/10"
        />
      </Zoom>
      <GritBackground className="inset-0 rounded-lg opacity-75" />
    </div>
  )
}

interface CreditProps {
  author: string
  id: string
  className?: string
}

function Credit({ author, id, className }: CreditProps) {
  if (author && id) {
    return (
      <div className={clsx('italic', className)}>
        Photo by{' '}
        <Link
          className="underline-offset-4 hover:underline"
          href={`https://unsplash.com/@${author}`}
        >
          <span data-umami-event="banner-author">@{author}</span>
        </Link>{' '}
        on{' '}
        <Link
          className="underline-offset-4 hover:underline"
          href={`https://unsplash.com/photos/${id}`}
        >
          <span data-umami-event="banner-unsplash">Unsplash</span>
        </Link>
      </div>
    )
  }
  return null
}
