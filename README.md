# ADCakeyuan's blog

个人博客，基于 [astro-koharu](https://github.com/cosZone/astro-koharu) 模板（Astro + Tailwind）构建。

## 内容

- `src/content/blog/` — 74 篇文章（自 2020 年 6 月起），分类：笔记 / 随笔 / 周刊
- `src/constants/projects.ts` — 项目页数据（25 个自研项目）
- `config/site.yaml` — 站点信息、导航、友链、评论等配置

## 常用命令

```bash
pnpm install        # 安装依赖
pnpm dev            # 本地开发 (http://localhost:4321)
pnpm build          # 构建静态站点到 dist/
pnpm preview        # 预览构建产物
```

## 部署

Vercel（主）/ Cloudflare Pages（备）自动构建：`pnpm build` → 静态输出 `dist/`。
旧链接 `/blog/<slug>` 由 vercel.json + public/_redirects 301 到 `/post/<slug>`。

## 待办

- [ ] 评论：到 [giscus.app](https://giscus.app) 用本仓库生成配置，填入 `config/site.yaml` 的 `comment.giscus` 并把 provider 改回 `giscus`（旧站即 giscus）
- [ ] 统计：从 Vercel 环境变量 `NEXT_UMAMI_ID` 找回 Umami websiteId，填入 `config/site.yaml` 的 `analytics.umami`
