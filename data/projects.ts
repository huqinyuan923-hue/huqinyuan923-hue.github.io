import type { Project } from '~/types/data'

export const PROJECTS: Project[] = [
  {
    type: 'self',
    title: 'Arcade Hub · 霓虹街机游戏厅',
    description:
      '在线街机游戏门户：站内自带 40 款自研经典小游戏（2048、贪吃蛇、俄罗斯方块、五子棋等），支持注册登录、收藏评分，并配有全站排行榜与完整的游戏 / 用户 / 数据管理后台。',
    imgSrc: '/static/images/projects/arcade-hub.jpg',
    url: 'https://arcade-hub-nu.vercel.app',
    repo: 'huqinyuan923-hue/arcade-hub',
    builtWith: ['NextJS', 'React', 'TailwindCSS', 'TypeScript', 'Node', 'Vercel'],
  },
  {
    type: 'self',
    title: '深学 DeepLearn',
    description:
      '中文学习平台：学习路线图打卡、章节测验、抽认卡与留言板，内置 AI·LLM·Agent、前端开发、Python、计算机基础四条学习线共 15 章原创内容，学习进度同步数据库。',
    imgSrc: '/static/images/projects/deeplearn.jpg',
    url: 'https://deeplearn.vercel.app',
    repo: 'huqinyuan923-hue/deeplearn',
    builtWith: ['NextJS', 'React', 'TailwindCSS', 'TypeScript', 'Vercel'],
  },
  {
    type: 'self',
    title: 'GitHub 新手村完全指南',
    description:
      '写给零基础小白的 GitHub 入门网站：Git 与 GitHub 区别、10 个核心概念比喻讲解、8 步上手教程、Pages 建站与首个 PR 实战，以及 ZCode / OpenCode / DSH 三款 AI 编程工具详解。',
    imgSrc: '/static/images/projects/github-guide.jpg',
    url: 'https://huqinyuan923-hue.github.io/github-guide/',
    repo: 'huqinyuan923-hue/github-guide',
    builtWith: ['Html', 'CSS', 'JavaScript', 'GitHub'],
  },
]
