import type { SVGProps } from 'react'

export function Signature(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
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
          fontFamily="var(--font-playpen-sans), 'Segoe Script', 'Brush Script MT', cursive"
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
