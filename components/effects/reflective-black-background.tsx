import { clsx } from 'clsx'

/**
 * 「霓虹黑曜石」全站背景。
 * 暗色：深空黑蓝基底 + 科技网格 + 青/紫双极光晕（呼吸漂移）。
 * 亮色：冷调云白 + 极淡网格 + 柔和光斑。
 * 大半径 blur 在移动端光栅化代价高，小屏只保留静态渐变。
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
      {/* 基底渐变：暗色深空 / 亮色冷云白 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-cyan-50 to-indigo-100 dark:from-[#04060c] dark:via-[#070b16] dark:to-[#04050a]" />

      {/* 极光晕：暗色青紫两极 + 一束中央辉光；亮色柔和光斑 */}
      <div className="pointer-events-none absolute inset-0 hidden overflow-hidden sm:block">
        <div className="absolute -left-[12%] -top-[14%] h-[55%] max-h-[62vh] w-[55%] max-w-[62vh] animate-flow-1 rounded-full bg-cyan-300/50 blur-[110px] motion-reduce:animate-none dark:bg-cyan-500/15" />
        <div className="absolute -bottom-[12%] -right-[10%] h-[50%] max-h-[55vh] w-[50%] max-w-[55vh] animate-flow-2 rounded-full bg-violet-300/45 blur-[110px] motion-reduce:animate-none dark:bg-violet-600/15" />
        <div className="absolute left-[30%] top-[30%] h-[40%] max-h-[46vh] w-[40%] max-w-[46vh] animate-flow-3 rounded-full bg-blue-300/40 blur-[110px] motion-reduce:animate-none dark:bg-blue-600/10" />
      </div>

      {/* 顶部扫描高光线：增加 HUD 质感（仅暗色） */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent dark:block" />
    </div>
  )
}
