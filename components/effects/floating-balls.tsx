'use client'

import clsx from 'clsx'
import { ArrowUp, Dices, Moon, Search, Sun } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { requestOpenSearch } from '~/components/search/search-events'

/**
 * 右下悬浮球：回顶部 / 随机文章 / 搜索 / 主题切换。
 * 滚过 Hero 后渐显；位置在「问 AI」按钮上方堆叠。
 * 随机文章从构建时传入的 slug 池里抽（无额外 API）。
 */
export function FloatingBalls({ randomSlugs = [] }: { randomSlugs?: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => setVisible(window.scrollY > 480)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const toRandom = () => {
    if (!randomSlugs.length) {
      router.push('/blog')
      return
    }
    const slug = randomSlugs[Math.floor(Math.random() * randomSlugs.length)]
    router.push(`/blog/${slug}`)
  }

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  const items = [
    { key: 'top', label: '回顶部', icon: ArrowUp, onClick: toTop, show: visible },
    { key: 'random', label: '随手翻一篇', icon: Dices, onClick: toRandom, show: true },
    { key: 'search', label: '搜索', icon: Search, onClick: requestOpenSearch, show: true },
    {
      key: 'theme',
      label: '主题切换',
      icon: mounted && resolvedTheme === 'dark' ? Sun : Moon,
      onClick: toggleTheme,
      show: true,
    },
  ]

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 sm:bottom-8 sm:right-8 lg:right-[5.5rem]">
      {items.map(({ key, label, icon: Icon, onClick, show }) => (
        <button
          key={key}
          aria-label={label}
          title={label}
          onClick={onClick}
          data-umami-event={`floating-ball-${key}`}
          className={clsx(
            'group grid h-10 w-10 place-items-center rounded-full',
            'border border-border bg-card/80 backdrop-blur-md',
            'shadow-lg shadow-black/10 transition-all duration-300',
            'hover:-translate-y-0.5 hover:border-primary-400/60 hover:shadow-primary-500/30',
            'dark:shadow-black/40',
            show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
          )}
        >
          <Icon
            size={18}
            strokeWidth={1.5}
            className="text-muted-foreground group-hover:text-primary-500"
          />
        </button>
      ))}
    </div>
  )
}
