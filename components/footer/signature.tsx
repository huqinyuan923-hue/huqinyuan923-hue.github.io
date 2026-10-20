'use client'

import { useEffect, useRef, useState, type SVGProps } from 'react'

const FAMILY = 'SignaturePlaypen'
const SRC = '/static/fonts/playpen-sans-latin-800-normal.woff2'
const FALLBACK = "'Segoe Script', 'Brush Script MT', cursive"

export function Signature(props: SVGProps<SVGSVGElement>) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [fontReady, setFontReady] = useState(false)

  // 签名装饰字（约 79KB）在页脚滚动进视口后才下载，否则每个页面首屏都要为
  // 一个单词付一个字体的带宽。系统手写体先顶上，字形到位后重绘。
  useEffect(() => {
    const element = svgRef.current
    if (fontReady || !element) return
    if (typeof IntersectionObserver === 'undefined' || typeof FontFace === 'undefined') return

    let face: FontFace | undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        observer.disconnect()
        face = new FontFace(FAMILY, `url(${SRC}) format("woff2")`, {
          weight: '800',
          style: 'normal',
        })
        face
          .load()
          .then((loaded) => {
            document.fonts.add(loaded)
            setFontReady(true)
          })
          .catch(() => undefined)
      },
      { rootMargin: '200px 0px' }
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [fontReady])

  return (
    <svg
      ref={svgRef}
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width="360"
      height="120"
      viewBox="0 0 360 120"
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <g transform="skewX(-20)">
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily={fontReady ? `${FAMILY}, ${FALLBACK}` : FALLBACK}
          fontStyle="italic"
          fontWeight="400"
          fontSize="44"
          fill="currentColor"
        >
          ADCakeyuan
        </text>
      </g>
    </svg>
  )
}
