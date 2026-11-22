import clsx from 'clsx'
import type { HomeStats } from '.'

/** 千位数字格式化：31200 → "31.2k" */
function formatCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)
}

function StatCell({ value, label, suffix }: { value: string; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="font-mono text-xl font-medium text-primary-500">
        {value}
        {suffix && <span className="ml-0.5 text-xs text-muted-foreground">{suffix}</span>}
      </div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
    </div>
  )
}

/**
 * 站点统计（数据叙事）：文章 / 标签 / 总字数 / 运行天数 / 共鸣天数。
 * variant="strip"：Hero 下的移动端横条；variant="card"：桌面左栏站长卡下的 HUD 卡。
 */
export function OwnerStats({ stats, variant }: { stats: HomeStats; variant: 'strip' | 'card' }) {
  return (
    <div
      className={clsx(
        variant === 'strip'
          ? 'flex justify-center'
          : 'hud-corners relative rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md'
      )}
    >
      <div
        className={clsx(
          'grid grid-cols-3 divide-x divide-border',
          variant === 'strip' && 'gap-x-8 divide-x-0'
        )}
      >
        <StatCell value={formatCount(stats.posts)} label="文章" />
        <StatCell value={formatCount(stats.tags)} label="标签" />
        <StatCell value={formatCount(stats.words)} label="字数" />
      </div>
      <div
        className={clsx(
          'mt-3 grid grid-cols-2 divide-x divide-border border-t border-dashed border-border pt-3',
          variant === 'strip' && 'mt-0 border-t-0 pt-0'
        )}
      >
        <StatCell value={formatCount(stats.days)} label="运行天数" suffix="天" />
        <StatCell value={formatCount(stats.resonation)} label="共鸣天数" suffix="天" />
      </div>
    </div>
  )
}
