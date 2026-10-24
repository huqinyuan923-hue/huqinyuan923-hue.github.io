'use client'

import { clsx } from 'clsx'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Image } from '~/components/ui/image'
import { SpotifyNowPlaying } from '~/components/ui/now-playing'
import { SITE_METADATA } from '~/data/site-metadata'
import { ProfileCardInfo } from './profile-info'

export function ProfileCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<React.CSSProperties>({})

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!ref.current || window.innerWidth < 1280) return

    const { clientX, clientY } = e
    const { width, height, x, y } = ref.current.getBoundingClientRect()
    const mouseX = Math.abs(clientX - x)
    const mouseY = Math.abs(clientY - y)
    const rotateMin = -12
    const rotateMax = 12
    const rotateRange = rotateMax - rotateMin

    const rotate = {
      x: rotateMax - (mouseY / height) * rotateRange,
      y: rotateMin + (mouseX / width) * rotateRange,
    }

    setStyle({
      transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
    })
  }, [])

  const onMouseLeave = useCallback(() => {
    setStyle({ transform: 'rotateX(0deg) rotateY(0deg)' })
  }, [])

  useEffect(() => {
    const { current } = ref
    if (!current) return
    current.addEventListener('mousemove', onMouseMove)
    current.addEventListener('mouseleave', onMouseLeave)
    return () => {
      if (!current) return
      current.removeEventListener('mousemove', onMouseMove)
      current.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [onMouseLeave, onMouseMove])

  return (
    <div
      className="z-10 mb-8 w-full max-w-xs transition-all duration-200 ease-out hover:z-50 md:mb-0 md:hover:scale-[1.03]"
      style={{ perspective: '900px' }}
      ref={ref}
    >
      {/* 全息旋转边框 + 3D 倾斜 */}
      <div
        style={style}
        className="holo-frame relative rounded-3xl transition-all duration-200 ease-out"
      >
        {/* HUD 取景角标 */}
        <span className="pointer-events-none absolute -left-px -top-px z-10 h-4 w-4 rounded-tl-3xl border-l-2 border-t-2 border-cyan-400/80" />
        <span className="pointer-events-none absolute -bottom-px -right-px z-10 h-4 w-4 rounded-br-3xl border-b-2 border-r-2 border-violet-400/80" />

        <div className="overflow-hidden rounded-3xl">
          <div className="relative">
            <Image
              src={SITE_METADATA.profileBanner}
              alt={SITE_METADATA.title}
              width={960}
              height={432}
              style={{
                objectPosition: '50% 15%',
                aspectRatio: '2.4/1',
              }}
              className="w-full shrink-0 opacity-90"
              loading="eager"
            />
            {/* 状态条：mono ID 编号 + 在线呼吸灯 */}
            <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 py-2 font-mono text-[10px] tracking-widest text-white/90">
              <span className="rounded bg-black/40 px-1.5 py-0.5 backdrop-blur-sm">ID-0x4144</span>
              <span className="flex items-center gap-1.5 rounded bg-black/40 px-1.5 py-0.5 backdrop-blur-sm">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                </span>
                ONLINE
              </span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <ProfileCardInfo />
            <SpotifyNowPlaying
              className={clsx([
                'mt-auto bg-gray-950/90 px-3 py-1.5',
                '[--song-color:theme(colors.gray.200)]',
                '[--artist-color:theme(colors.cyan.300)]',
              ])}
            />
          </div>
          <span className="h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" />
        </div>
      </div>
    </div>
  )
}
