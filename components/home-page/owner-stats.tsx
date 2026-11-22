import clsx from 'clsx'
import type { HomeStats } from '.'

/**
 * 站点统计：文章数 / 标签数（任务 3 扩展总字数、运行天数、共鸣天数）。
 * variant="strip"：Hero 下的移动端横条；variant="card"：桌面左栏站长卡下的 HUD 卡。
 */
export function OwnerStats({
  stats,
  variant,
}: {
  stats: Pick<HomeStats, 'posts' | 'tags'>
  variant: 'strip' | 'card'
}) {
  return (
    <div
      className={clsx(
        variant === 'strip'
          ? 'flex items-center justify-center gap-8'
          : 'hud-corners relative rounded-2xl border border-border bg-card/60 px-4 py-3 backdrop-blur-md'
      )}
    >
      <div
        className={clsx(
          variant === 'strip'
            ? 'flex items-center gap-8'
            : 'grid grid-cols-2 divide-x divide-border'
        )}
      >
        <div className={clsx('text-center', variant === 'card' && 'py-1')}>
          <div className="font-mono text-xl font-medium text-primary-500">{stats.posts}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            文章
          </div>
        </div>
        <div className={clsx('text-center', variant === 'card' && 'py-1')}>
          <div className="font-mono text-xl font-medium text-primary-500">{stats.tags}</div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            标签
          </div>
        </div>
      </div>
    </div>
  )
}
