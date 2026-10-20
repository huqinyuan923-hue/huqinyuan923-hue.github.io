'use client'

import { useEffect, useRef, type SVGProps } from 'react'
import { PLAYPEN_STACK, loadPlaypenWhenVisible } from '~/utils/lazy-playpen'

export function Signature(props: SVGProps<SVGSVGElement>) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const element = svgRef.current
    if (!element) return
    return loadPlaypenWhenVisible(element)
  }, [])

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
          fontFamily={PLAYPEN_STACK}
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
