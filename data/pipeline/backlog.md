# 自动写作流水线 · 选题库

> 每周自动写作任务从这里取题：选第一个未被 `[x]` 标记的选题，写完发布后把它标为 `[x]`。
> 素材来源：C:/works 下的真实项目（以仓库 README + 源码为准），文章必须基于实际代码，禁止虚构。
> 发布规则：文末必须带「本文由 AI 自动写作流水线生成」的标注段。

## 待写（按顺序取用）

- [x] How_I_Built_Filekit：纯前端文件工具箱（filekit-01/02/03 三张截图可用），讲压缩与合并的浏览器端实现，为什么选择零上传
- [x] How_I_Built_Imgbed：图床项目（imgbed/），讲 Cloudflare Pages + KV 的图片托管与直链设计
- [x] How_I_Built_Pomobox：番茄钟（pomobox/），讲纯前端状态机与通知系统的取舍
- [x] How_I_Built_Salarycalc：薪资计算器（salarycalc/），讲五险一金/税前税后的计算口径与边界情况（2026-10-21 已发布）
- [x] How_I_Built_Timemark：timemark-vercel / TimeMark 事件提醒系统（不是时间戳工具），讲日期时区、NTP 校时、Vercel 单函数与通知调度（2026-10-21 已发布）
- [x] How_I_Built_Video2code_Replica：video2code 看视频复刻 Raycast 首页，讲计划-取证-审计工作流、证据哈希与还原度评估（2026-10-21 已发布，项目已归档到 \_archive）
- [x] How_I_Built_Deeplearn_Backend：深学后端（deeplearn/api/index.js），讲 Hono 单函数 + Neon + AI 出题缓存；与已发布的 How_I_Built_DeepLearn 内容架构篇互补（2026-10-21 已发布）
- [x] How_I_Host_Everything：15 个站点的托管地图（10 Vercel / 3 GitHub Pages / 2 Cloudflare Pages）+ 免费额度与成本账单（2026-10-21 已发布）
- [ ] How_I_Built_Blog_Rag：给博客装上语义搜索与站内 AI 问答——浏览器端嵌入模型 + Pages Functions + Workers AI 的三次架构转向（素材：本仓库 scripts/build-semantic-index.mjs、functions/api/[[route]].ts、utils/embedding.ts、utils/semantic-search.ts，以及 wrangler.jsonc）
- [ ] How_I_Built_Auto_Writer：自动写作流水线的设计与安全边界——PR 人工审阅版与 AI 直发版两条路线的取舍、选题查重机制、AI 内容标注规范（素材：.github/auto-writer.md、data/pipeline/backlog.md 的真实运行记录）
- [ ] How_I_Built_Cha_Dual_Engine：把一门语言的双引擎塞进浏览器——双后端各自的 Worker 会话、对照模式与分歧检测、loopBudget 与输出闸门；与第 8 章的编译原理视角互补，这篇讲工程整合（素材：C:/works/cha-lang 的 playground/main.ts 与本仓库 public/cha/cha-worker.js、components/cha/playground.tsx）
- [ ] How_I_Built_Arcade_Hub_Backend：40 款游戏背后的账号、排行榜与数据后台——Neon Postgres + Vercel 上的用户系统、统一计分协议与防刷分设计（素材：C:/works/arcade-hub 的 db/seed.ts、API 路由与后台页面）
- [ ] How_I_Migrated_Mengke：39 篇旧博客文章的迁移与内容治理——frontmatter 批量治理、字体本地化防构建失败、旧 URL 兼容（素材：git 历史 cc4232e / 1f510e2 / 3f836ef 三个提交的完整过程）

## 已发布

- [x] 2026-10-21 批次：How_I_Built_Salarycalc / How_I_Built_Timemark / How_I_Built_Video2code_Replica / How_I_Built_Deeplearn_Backend / How_I_Host_Everything
- [x] Cha 系列 1~8 章（2026-10-07，第 8 章为收官）
- [x] How_I_Built_Arcade_Hub / DeepLearn / GitHub_Guide / GitHub_Wrapped / Rss_Reader / Toolbox / Treasury
- [x] How_I_Host_My_Projects
