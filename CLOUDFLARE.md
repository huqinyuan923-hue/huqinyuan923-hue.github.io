# 迁移到 Cloudflare Pages 指南

本博客是 **Next.js 纯静态导出**（`EXPORT=true` 时 `output: 'export'`），产物为纯静态文件，可以直接托管到 Cloudflare Pages，无需任何代码改动。

## 方式一：Git 集成（推荐）

1. Cloudflare Dashboard → **Workers & Pages → Create → Pages → Connect to Git**，选择本仓库（`huqinyuan923-hue/huqinyuan923-hue.github.io`）。
2. 构建配置填写：

   | 配置项 | 值 |
   | --- | --- |
   | Framework preset | `Next.js (Static HTML Export)`（没有就选 None） |
   | Build command | 见下方 |
   | Build output directory | `out` |
   | Root directory | （留空，仓库根） |

3. **Build command**（整段复制，与 `.github/workflows/deploy.yml` 等价）：

   ```bash
   mv app/api api.disabled && pnpm install && pnpm build && cp -r public/. out/
   ```

   说明：
   - `mv app/api api.disabled`：静态导出不支持 API 路由，先移走（`NEXT_PUBLIC_STATIC_EXPORT=true` 会让前端跳过对 /api 的请求）
   - `pnpm build` 内部会执行 `prisma generate && next build && postbuild`（postbuild 生成 RSS）
   - `cp -r public/. out/`：把 RSS feed 和 `_headers` 复制进产物

4. **环境变量**（Settings → Environment variables，Production 和 Preview 都配）：

   | 变量 | 值 |
   | --- | --- |
   | `EXPORT` | `true` |
   | `BASE_PATH` | ``（空字符串） |
   | `UNOPTIMIZED` | `true` |
   | `NEXT_PUBLIC_STATIC_EXPORT` | `true` |
   | `NEXT_PUBLIC_GISCUS_*` / `NEXT_UMAMI_ID` | （可选，同 GitHub 仓库 Variables 的值） |

   Node 版本：仓库已带 `.nvmrc`（22），Cloudflare Pages 会自动读取；也可在面板手动设 `NODE_VERSION=22`。

5. Save and Deploy。首次构建成功后即获得 `xxx.pages.dev` 域名，之后每次 push 到 main 自动重新部署。

6. （可选）绑定自定义域名：Pages 项目 → Custom domains → 添加你的域名，按提示加 CNAME。

## 方式二：直接上传产物（Wrangler）

```bash
mv app/api api.disabled
pnpm install
EXPORT=true UNOPTIMIZED=true NEXT_PUBLIC_STATIC_EXPORT=true pnpm build
cp -r public/. out/
npx wrangler pages deploy out --project-name=blog
```

## 迁移时的注意事项

- **`_headers` 已就位**：`public/_headers` 会在部署时复制到产物根目录，Cloudflare Pages 会应用与 `next.config.js` 相同的安全响应头（CSP 已包含 `static.cloudflareinsights.com`，接入 Cloudflare Web Analytics 无需改 CSP）。
- **图片**：静态导出下 next/image 已是 `unoptimized`（`UNOPTIMIZED=true`），CF 上行为一致。
- **GitHub Pages 可以共存**：先在 CF 上跑通 pages.dev 验证无误，再把域名切过去，最后视情况停用本仓库的 `deploy.yml` 或 GitHub Pages。
- **prisma / 数据库**：博客构建期只做 `prisma generate`（生成客户端），站点本身无服务端数据库连接；如果以后要用 ISR/SSR，需要改用 `@cloudflare/next-on-pages` 或切换到 SSG 全静态方案。

## 回滚

GitHub Pages 的 `deploy.yml` 在迁移期间保持开启即可——两边同时部署互不影响，域名指回 GitHub Pages 就完成回滚。
