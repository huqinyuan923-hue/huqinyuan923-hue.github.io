import clsx from 'clsx'
import { Twemoji } from '~/components/ui/twemoji'

export function Greeting() {
  return (
    <div>
      <p className="kicker mb-3">{'// hello world'}</p>
      <div
        className={clsx(
          'font-grotesk font-bold tracking-tight',
          'text-[40px] leading-[60px] md:text-[68px] md:leading-[100px]',
          'bg-clip-text text-transparent',
          'bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500',
          'text-shimmer',
          'glow-title',
          'dark:from-cyan-300 dark:via-blue-400 dark:to-violet-400'
        )}
      >
        Howdy, fellow! <Twemoji emoji="waving-hand" size="base" />
      </div>
    </div>
  )
}
