'use client'

import { useEffect, useRef } from 'react'
import Typed from 'typed.js'
import { Twemoji } from '~/components/ui/twemoji'

function createTypedInstance(el: HTMLElement) {
  return new Typed(el, {
    stringsElement: '#hero-bios',
    typeSpeed: 38,
    backSpeed: 12,
    loop: true,
    backDelay: 1600,
  })
}

/**
 * 机兵 HUD 开机终端：`$ whoami` → 共鸣者档案打字输出。
 * 复用站内 typed.js；窗口带 HUD 角标（.hud-corners）与 mono 标题栏。
 */
export function HeroTerminal() {
  const el = useRef(null)
  const typed = useRef<Typed | null>(null)

  useEffect(() => {
    if (el.current) {
      typed.current?.destroy()
      typed.current = createTypedInstance(el.current)
    }
    return () => {
      typed.current?.destroy()
      typed.current = null
    }
  }, [])

  return (
    <div className="hud-corners relative mx-auto mt-10 w-full max-w-xl rounded-lg border border-border bg-card/60 backdrop-blur-md">
      {/* 标题栏：mono 小字 + 机身编号 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 font-mono text-[11px] tracking-widest text-muted-foreground">
        <span>{'[ RESONANCE TERMINAL ]'}</span>
        <span className="text-primary-500">{'ID-0x4144'}</span>
      </div>
      <div className="px-5 py-4 font-mono text-sm leading-relaxed">
        <div className="text-muted-foreground">
          <span className="text-primary-500">$</span> {'whoami'}
        </div>
        <ul id="hero-bios" className="hidden">
          <li>共鸣者档案 · ADCakeyuan</li>
          <li>广西在读 · 正在学编程</li>
          <li>
            第一门语言是 <b className="font-medium">JavaScript</b>
          </li>
          <li>喜欢 Web 开发，会做一些小东西</li>
          <li>过程写成文章，放在这个博客</li>
          <li>
            我是猫奴。 <Twemoji emoji="cat" />
          </li>
        </ul>
        <span
          ref={el}
          className={[
            'inline-block min-h-6 text-foreground',
            '[&_.typed-cursor]:inline-block',
            '[&_.typed-cursor]:w-2',
            '[&_.typed-cursor]:h-5',
            '[&_.typed-cursor]:text-transparent',
            '[&_.typed-cursor]:bg-primary-500',
          ].join(' ')}
        />
      </div>
    </div>
  )
}
