import { Twemoji } from '~/components/ui/twemoji'
import { AUTHOR_INFO } from '~/data/author-info'

export function Intro() {
  return (
    <h1 className="text-neutral-900 dark:text-neutral-200">
      I'm <span className="font-medium">{AUTHOR_INFO.name}</span>, a first-year university student
      from <span className="font-medium">Guangxi</span> <Twemoji emoji="flag-china" size="base" />
    </h1>
  )
}
