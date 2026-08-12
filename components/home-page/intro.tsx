import { AUTHOR_INFO } from '~/data/author-info'

export function Intro() {
  return (
    <h1 className="text-neutral-900 dark:text-neutral-200">
      我是 <span className="font-medium">{AUTHOR_INFO.name}</span>，一名
      <span className="font-medium"> {AUTHOR_INFO.work.occupation}</span>
    </h1>
  )
}
