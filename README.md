# ADCakeyuan's blog

个人博客，基于 [astro-koharu](https://github.com/cosZone/astro-koharu) 模板（Astro + Tailwind）构建，线上 [adcakeyuan.top](https://adcakeyuan.top)。

## 内容

- `src/content/blog/` — 35 篇文章（扁平存放，文件名 = URL slug），分类：笔记 / 周刊
- `src/data/projects.ts` — 项目页数据（25 个自研项目）
- `config/site.yaml` — 站点信息、导航、友链、评论、BGM、统计
- `public/_redirects` — 旧链接 301（Cloudflare Pages 生效）
- `public/_headers` — CSP / HSTS / 缓存策略（Cloudflare Pages 生效）

## 常用命令

```bash
pnpm install        # 安装依赖
pnpm dev            # 本地开发 (http://localhost:4321)
pnpm build          # 构建静态站点到 dist/（含 koharu migrate --check）
pnpm check          # astro check
pnpm test           # 单元测试
pnpm preview        # 预览构建产物
```

## 部署

唯一发布线是 **Cloudflare Pages**（项目 `huqinyuan923-hue-github-io`，分支 `main`）：
`git push origin astro:main` → 自动 `pnpm build` → 输出 `dist/` → 2~3 分钟上线。
Vercel 上那个同名空项目只是历史残留，不参与发布。

## 已完成

- [x] 评论：giscus（本仓库 Discussions / 分类 General，`mapping: pathname`）
- [x] 安全响应头：`public/_headers` 重建 CSP、HSTS、`/_astro/*` 长缓存

## 待办

- [ ] 统计：Umami 需在 [cloud.umami.is](https://cloud.umami.is) 新建站点后把 websiteId 填入 `config/site.yaml` 的 `analytics.umami.id` 并 `enabled: true`（旧站从未上报过，没有可迁的 ID）
- [ ] 删除 Vercel 上的残留项目 `adc-akeyuan/mengke.me`，避免每次 push 白跑一次构建
