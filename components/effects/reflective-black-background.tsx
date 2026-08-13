import { clsx } from 'clsx'

/**
 * Reflective background inspired by blog.the37777777.top/friends.
 * Light mode: soft pastel gradient. Dark mode: reflective black with glow orbs.
 */
export function ReflectiveBlackBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx([
        'pointer-events-none fixed inset-0 isolate -z-50 overflow-hidden',
        'h-[100dvh] min-h-[100lvh] w-full contain-paint',
        className,
      ])}
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-indigo-100 to-cyan-200 dark:from-[#07070b] dark:via-[#0b0b12] dark:to-[#050508]" />

      {/* Glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[55%] max-h-[60vh] w-[55%] max-w-[60vh] animate-flow-1 rounded-full bg-blue-300/60 blur-[100px] motion-reduce:animate-none dark:bg-indigo-500/15" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[50%] max-h-[55vh] w-[50%] max-w-[55vh] animate-flow-2 rounded-full bg-purple-300/50 blur-[100px] motion-reduce:animate-none dark:bg-purple-500/10" />
        <div className="absolute left-[20%] top-[25%] h-[45%] max-h-[50vh] w-[45%] max-w-[50vh] animate-flow-3 rounded-full bg-cyan-300/50 blur-[100px] motion-reduce:animate-none dark:bg-blue-500/10" />
      </div>
    </div>
  )
}
