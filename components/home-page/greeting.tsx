import clsx from 'clsx'
import { Twemoji } from '~/components/ui/twemoji'

export function Greeting() {
  return (
    <div>
      <p className="kicker mb-3">{'// hello world'}</p>
      <div
        className={clsx(
          'font-heading font-bold tracking-tight',
          'text-[40px] leading-[60px] md:text-[68px] md:leading-[100px]',
          'bg-clip-text text-transparent',
          'bg-[image:var(--gradient-button)]',
          'text-shimmer',
          'glow-title'
        )}
      >
        Howdy, fellow! <Twemoji emoji="waving-hand" size="base" />
      </div>
    </div>
  )
}
