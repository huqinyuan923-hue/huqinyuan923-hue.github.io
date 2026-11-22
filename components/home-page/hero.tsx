import { Container } from '~/components/ui/container'
import { Twemoji } from '~/components/ui/twemoji'
import type { HomeStats } from '.'
import { HeroTerminal } from './hero-terminal'
import { OwnerStats } from './owner-stats'
import { StarField } from './star-field'

/**
 * 全屏 Hero：深空渐变（背景由全局 ReflectiveBlackBackground 提供）
 * + 星屑漂浮 + 得意黑大字 + 机兵 HUD 开机终端。
 */
export function Hero({ stats }: { stats: HomeStats }) {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-glow absolute inset-0" aria-hidden="true" />
      <StarField />
      <Container as="div" className="relative pb-8 pt-14 md:pb-14 md:pt-24">
        <p className="kicker mb-4 text-center">{'// 星海轻歌 · STARLIGHT LOG'}</p>
        <h1
          className={[
            'text-center font-heading font-bold tracking-tight',
            'text-[56px] leading-tight md:text-[88px] md:leading-none',
            'bg-clip-text text-transparent',
            'bg-[image:var(--gradient-button)]',
            'text-shimmer glow-title',
          ].join(' ')}
        >
          ADCakeyuan
        </h1>
        <p className="mt-4 flex items-center justify-center gap-2 text-base text-muted-foreground md:text-lg">
          在星海敲代码的在读学生 <Twemoji emoji="sparkles" size="base" />
        </p>
        <HeroTerminal />
        {/* 移动端统计条：桌面端由左栏站长卡下的统计卡承担 */}
        <div className="mt-8 xl:hidden">
          <OwnerStats stats={stats} variant="strip" />
        </div>
      </Container>
    </section>
  )
}
