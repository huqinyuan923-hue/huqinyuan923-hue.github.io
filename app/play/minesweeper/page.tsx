import { genPageMetadata } from '~/app/seo'
import { Container } from '~/components/ui/container'
import { PageHeader } from '~/components/ui/page-header'
import { Minesweeper } from '~/components/play/minesweeper'

export const metadata = genPageMetadata({ title: '扫雷小游戏' })

export default function MinesweeperPage() {
  return (
    <Container className="pt-4 lg:pt-12">
      <PageHeader
        title="Minesweeper"
        description="经典扫雷小游戏，直接在上面的棋盘上玩。三种难度任选，首次点击永远不会踩雷。"
        className="border-b border-gray-200 dark:border-gray-700"
      />
      <div className="py-10">
        <Minesweeper />
      </div>
    </Container>
  )
}
