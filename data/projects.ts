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
    url: 'https://guide.adcakeyuan.top/',
    repo: 'huqinyuan923-hue/github-guide',
    builtWith: ['Html', 'CSS', 'JavaScript', 'GitHub'],
  },
  {
    type: 'self',
    title: 'Toolbox · 开发者工具箱',
    description:
      '纯前端的日常小工具集：JSON 格式化、时间戳转换、进制/编码、UUID、二维码、密码生成、Markdown 预览、每日一签等 15+ 工具，零框架零构建，数据不上传、可离线使用。',
    imgSrc: '/static/images/projects/toolbox.jpg',
    url: 'https://toolbox.adcakeyuan.top/',
    repo: 'huqinyuan923-hue/toolbox',
    builtWith: ['Html', 'CSS', 'JavaScript', 'GitHub'],
  },
  {
    type: 'self',
    title: 'GitHub Wrapped · 年度报告',
    description:
      '输入 GitHub 用户名，一键生成年度提交、星标、语言分布与活跃概览的可分享报告卡片，纯前端零依赖，数据来自 GitHub 公开 API，支持 Token 提升限额。',
    imgSrc: '/static/images/projects/github-wrapped.jpg',
    url: 'https://wrapped.adcakeyuan.top/',
    repo: 'huqinyuan923-hue/github-wrapped',
    builtWith: ['JavaScript', 'Html', 'CSS', 'GitHub'],
  },
  {
    type: 'self',
    title: '订阅站 RSS 阅读器',
    description:
      '私有订阅聚合服务：Vercel Cron 定时抓取订阅源、未读管理、站点自动发现订阅，多端同步你的信息流，数据存 Neon Postgres。',
    imgSrc: '/static/images/projects/rss-reader.jpg',
    url: 'https://rss-reader-topaz.vercel.app',
    repo: 'huqinyuan923-hue/rss-reader',
    builtWith: ['NextJS', 'React', 'TailwindCSS', 'TypeScript', 'Vercel'],
  },
  {
    type: 'self',
    title: 'Treasury · 书签云收藏',
    description:
      '私有部署的个人书签库：保存链接时自动抓取标题、标签整理、全文搜索，把分散的数字宝藏集中管理。',
    imgSrc: '/static/images/projects/treasury.jpg',
    url: 'https://treasury-tau.vercel.app',
    repo: 'huqinyuan923-hue/treasury',
    builtWith: ['NextJS', 'React', 'TailwindCSS', 'TypeScript', 'Vercel'],
  },
]
