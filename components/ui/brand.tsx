import Bash from '~/icons/bash.svg'
import CSS from '~/icons/css.svg'
import Commitlint from '~/icons/commitlint.svg'
import Env from '~/icons/env.svg'
import Git from '~/icons/git.svg'
import GitHub from '~/icons/github.svg'
import Html from '~/icons/html5.svg'
import Java from '~/icons/java.svg'
import JavaScript from '~/icons/javascript.svg'
import Liquid from '~/icons/liquid.svg'
import Markdown from '~/icons/markdown.svg'
import NextJS from '~/icons/nextjs.svg'
import Node from '~/icons/nodejs.svg'
import Npm from '~/icons/npm.svg'
import Postcss from '~/icons/postcss.svg'
import Prisma from '~/icons/prisma.svg'
import React from '~/icons/react.svg'
import Spotify from '~/icons/spotify.svg'
import TailwindCSS from '~/icons/tailwind.svg'
import TypeScript from '~/icons/typescript.svg'
import Umami from '~/icons/umami.svg'
import Vercel from '~/icons/vercel.svg'
import clsx from 'clsx'
import { Link } from '~/components/ui/link'

export const BrandsMap: Record<
  string,
  {
    Icon: React.FC<React.SVGProps<SVGSVGElement>>
    url?: string
  }
> = {
  Bash: { Icon: Bash, url: 'https://www.gnu.org/software/bash' },
  CSS: { Icon: CSS, url: 'https://www.w3.org/Style/CSS/' },
  Commitlint: { Icon: Commitlint },
  Env: { Icon: Env },
  Git: { Icon: Git, url: 'https://git-scm.com' },
  GitHub: { Icon: GitHub, url: 'https://github.com' },
  Html: { Icon: Html },
  Java: { Icon: Java, url: 'https://java.com' },
  JavaScript: { Icon: JavaScript, url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript' },
  Liquid: { Icon: Liquid, url: 'https://shopify.dev/docs/api/liquid' },
  Markdown: { Icon: Markdown, url: 'https://www.markdownguide.org' },
  NextJS: { Icon: NextJS, url: 'https://nextjs.org' },
  Node: { Icon: Node, url: 'https://nodejs.org' },
  Npm: { Icon: Npm, url: 'https://www.npmjs.com' },
  Postcss: { Icon: Postcss, url: 'https://postcss.org/' },
  Prisma: { Icon: Prisma, url: 'https://www.prisma.io' },
  React: { Icon: React, url: 'https://reactjs.org' },
  Spotify: { Icon: Spotify, url: 'https://spotify.com' },
  TailwindCSS: { Icon: TailwindCSS, url: 'https://tailwindcss.com' },
  TypeScript: { Icon: TypeScript, url: 'https://www.typescriptlang.org' },
  Umami: { Icon: Umami, url: 'https://umami.is' },
  Vercel: { Icon: Vercel, url: 'https://vercel.com' },
}

// 内容里的大小写并不统一（`Typescript` / `Javascript` 出现在 code-title 与 footer），
// 用忽略大小写的索引避免图标静默丢失。
const CASE_INSENSITIVE_LOOKUP = new Map(
  Object.entries(BrandsMap).map(([name, value]) => [name.toLowerCase(), value])
)

export function Brand(props: {
  name: keyof typeof BrandsMap
  as?: 'link' | 'icon'
  className?: string
  iconClassName?: string
}) {
  const { name, as = 'link', className, iconClassName } = props
  const entry =
    CASE_INSENSITIVE_LOOKUP.get(String(name || '').toLowerCase()) ?? BrandsMap[name as string]

  if (!entry) return <span className="hidden">Missing brand icon for {name}</span>

  const { Icon, url } = entry

  if (as === 'icon' || !url) {
    return <Icon className={clsx([className, iconClassName])} fill="currentColor" />
  }

  return (
    <Link href={`${url}?ref=mengke.me`} className={className}>
      <Icon className={iconClassName} fill="currentColor" />
    </Link>
  )
}
