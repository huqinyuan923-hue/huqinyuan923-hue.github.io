'use client'

import { clsx } from 'clsx'
import { useEffect, useRef } from 'react'
import Typed from 'typed.js'
import { Twemoji } from '~/components/ui/twemoji'

function createTypedInstance(el: HTMLElement) {
  return new Typed(el, {
    stringsElement: '#bios',
    typeSpeed: 40,
    backSpeed: 10,
    loop: true,
    backDelay: 1000,
  })
}

export function TypedBios() {
  const el = useRef(null)
  const typed = useRef<Typed | null>(null)

  useEffect(() => {
    if (el.current) {
      typed.current?.destroy()
      typed.current = createTypedInstance(el.current)
    }
  }, [])

  return (
    <div
      className={clsx([
        'flex min-h-8 items-center gap-0.5',
        [
          '[&_.typed-cursor]:inline-block',
          '[&_.typed-cursor]:w-2',
          '[&_.typed-cursor]:h-5.5',
          '[&_.typed-cursor]:text-transparent',
          '[&_.typed-cursor]:bg-slate-800',
          'dark:[&_.typed-cursor]:bg-slate-100',
        ],
      ])}
    >
      <ul id="bios" className="hidden">
        <li>
          I'm <span className="font-medium">ADCakeyuan</span>, a first-year university student from{' '}
          <b className="font-medium">Guangxi</b>.
        </li>
        <li>I'm learning programming and love tinkering with interesting tech.</li>
        <li>
          My first programming language was <b className="font-medium">JavaScript</b>.
        </li>
        <li>I love web development.</li>
        <li>
          I'm a cat-person. <Twemoji emoji="cat" />
        </li>
      </ul>
      <span ref={el} className="text-neutral-900 dark:text-neutral-200" />
    </div>
  )
}
