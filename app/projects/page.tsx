import { genPageMetadata } from 'app/seo'
import { ProjectCard } from '~/components/cards/project'
import { Container } from '~/components/ui/container'
import { PageHeader } from '~/components/ui/page-header'
import { PROJECTS } from '~/data/projects'

export const metadata = genPageMetadata({ title: 'Projects' })

export default async function Projects() {
  const workProjects = PROJECTS.filter(({ type }) => type === 'work')
  const sideProjects = PROJECTS.filter(({ type }) => type === 'self')
  const hasWork = workProjects.length > 0

  return (
    <Container className="pt-4 lg:pt-12">
      <PageHeader
        title="Projects"
        description="我做过的项目：有为了好玩的在线游戏厅，有为了高效学习的工具，也有给新手写的教程网站。全部开源，欢迎 Star 与交流。"
        className="border-b border-gray-200 dark:border-gray-700"
      />

      {hasWork && (
        <div className="py-10">
          <h3 className="mb-8 text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-gray-100 md:text-3xl">
            Work
          </h3>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {workProjects.map((pro) => (
              <ProjectCard key={pro.title} project={pro} />
            ))}
          </div>
        </div>
      )}

      <div className={hasWork ? 'border-t border-gray-200 py-10 dark:border-gray-700' : 'py-10'}>
        <h3 className="mb-8 text-2xl font-bold leading-9 tracking-tight text-gray-900 dark:text-gray-100 md:text-3xl">
          个人项目
        </h3>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {sideProjects.map((pro) => (
            <ProjectCard key={pro.title} project={pro} />
          ))}
        </div>
      </div>
    </Container>
  )
}
