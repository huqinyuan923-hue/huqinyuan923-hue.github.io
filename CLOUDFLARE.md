# 迁移到 Cloudflare 完整部署教程

> 本博客是 **Next.js 纯静态导出**。仓库里已有 `wrangler.jsonc`（声明 Worker 名称 `huqinyuan923-hue-github-io`、静态资源目录 `./out`、404 页处理），Cloudflare 构建时会自动使用它。

## 一、项目设置（Cloudflare 面板）

项目：`huqinyuan923-hue-github-io` → **设置 → 构建 → 编辑**

| 配置项 | 值 |
| --- | --- |
| 构建命令 | `mv app/api api.disabled && pnpm install --frozen-lockfile && EXPORT=true UNOPTIMIZED=true NEXT_PUBLIC_STATIC_EXPORT=true pnpm build && cp -r public/. out/` |
| 部署命令 | `npx wrangler deploy` |
| 根目录 | `/`（留空） |

**构建变量**（同一个设置页，**只加这 3 条**）：

| 名称 | 值 |
| --- | --- |
| `EXPORT` | `true` |
| `UNOPTIMIZED` | `true` |
| `NEXT_PUBLIC_STATIC_EXPORT` | `true` |

> ⚠️ **不要创建 `BASE_PATH`**。如果之前加过（无论留空还是 `""`），**整条删除**——留空字符串会让 Next 报 `Specified basePath has to start with a /` 构建失败。

各段命令的作用：
- `mv app/api api.disabled`：静态导出不支持 API 路由，先移走（前端有 `NEXT_PUBLIC_STATIC_EXPORT` 标记会跳过对 /api 的请求）
- `EXPORT=true`：让 next.config.js 启用 `output: 'export'` 静态导出
- `UNOPTIMIZED=true`：静态托管下 next/image 必须关闭优化
- `cp -r public/. out/`：把 postbuild 生成的 RSS（`/feed.xml`）和 `_headers` 安全响应头复制进产物

## 二、部署

**部署页 → 重试部署**（或随便 push 一个提交触发）。构建成功后：

- 预览地址：`https://huqinyuan923-hue-github-io.2978599735.workers.dev`（大陆访问不了 workers.dev，属正常，用自定义域验证）
- 正式地址：`https://adcakeyuan.top`（自定义域已在「域」页绑定）

## 三、自定义域名

「域」页应显示 `adcakeyuan.top`（生产）。DNS 由 Cloudflare 自动接管，不需要手动 A/CNAME 记录。

可选：再添加一个自定义域，子域名填 `www`，让 `www.adcakeyuan.top` 也能访问。

## 四、日常更新

写完文章 / 改完代码 → `git push` 到 main → CF 自动构建部署（约 3 分钟）。GitHub Pages 的同名部署与它互不干扰，旧地址会 301 跳转过来。

## 五、常见报错对照

| 报错 | 原因 | 解决 |
| --- | --- | --- |
| `Specified basePath has to start with a /, found """"` | 构建变量里存在 `BASE_PATH`（值为空/引号） | 删除 `BASE_PATH` 变量 |
| `WORKER_SELF_REFERENCE references Worker 'xxx' not found` | 仓库缺 `wrangler.jsonc` 或被删 | 确认仓库根有 `wrangler.jsonc`（已提交） |
| `Specified "rewrites"/"headers" will not automatically work` | 静态导出的预期警告 | 忽略，安全头由 `public/_headers` 提供 |
| workers.dev 打不开 | 大陆网络封锁 workers.dev | 用自定义域 adcakeyuan.top 验证 |
| 页面 404 但首页正常 | 少了 `cp -r public/. out/` 或 `mv app/api` 步骤 | 检查构建命令是否完整复制 |
