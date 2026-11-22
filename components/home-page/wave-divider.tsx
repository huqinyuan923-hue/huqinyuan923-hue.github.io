/** 星轨波浪：Hero 与内容区之间的双层半透明波浪过渡（纯装饰） */
export function WaveDivider() {
  return (
    <div aria-hidden="true" className="pointer-events-none relative h-14 w-full md:h-20">
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 96"
        preserveAspectRatio="none"
      >
        <path
          d="M0,64 C240,96 480,32 720,56 C960,80 1200,40 1440,64 L1440,96 L0,96 Z"
          fill="hsl(var(--primary) / 0.10)"
        />
        <path
          d="M0,72 C280,40 520,88 760,64 C1000,40 1240,84 1440,56 L1440,96 L0,96 Z"
          fill="rgb(167 139 250 / 0.10)"
        />
      </svg>
    </div>
  )
}
