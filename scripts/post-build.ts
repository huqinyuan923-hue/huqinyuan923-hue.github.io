import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { generateRssFeed } from './rss'

async function postbuild() {
  await generateRssFeed()
  generateSlugRedirects()
}

/** 把解析出的目录限制在静态导出产物根目录内，防止映射数据异常时越界写入 */
function resolveWithinRoot(root: string, relative: string) {
  const base = path.resolve(root)
  const target = path.resolve(base, relative)
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error(`Redirect path escapes output root: ${relative}`)
  }
  return target
}

/**
 * 文章 URL 从 /blog/202610/Old_Name 迁移到 /blog/new-name 后，
 * 在静态导出产物里写入两层跳转，保证旧链接不 404：
 *  1. out/_redirects —— Cloudflare Workers/Pages 资源层原生支持，返回 301
 *  2. out/blog/<旧slug>/index.html —— meta refresh + JS 跳转兜底，任何静态托管都生效
 */
function generateSlugRedirects() {
  const outDir = path.join(process.cwd(), 'out')
  if (!existsSync(outDir)) return // 非静态导出构建（本地 next build）时跳过

  const mapPath = path.join(process.cwd(), 'json', 'slug-redirects.json')
  if (!existsSync(mapPath)) return

  const redirects: Record<string, string> = JSON.parse(readFileSync(mapPath, 'utf8'))
  const entries = Object.entries(redirects).filter(
    ([from, to]) => from.startsWith('/blog/') && to.startsWith('/blog/')
  )
  if (!entries.length) return

  const lines: string[] = []
  for (const [from, to] of entries) {
    lines.push(`${from} ${to} 301`)

    const stubDir = resolveWithinRoot(outDir, from.replace(/^\//, ''))
    mkdirSync(stubDir, { recursive: true })
    writeFileSync(path.join(stubDir, 'index.html'), redirectStubHtml(to))
  }
  writeFileSync(resolveWithinRoot(outDir, '_redirects'), lines.join('\n') + '\n')
  console.log(`🔗 Slug redirects generated: out/_redirects + ${entries.length} HTML stubs.`)
}

function redirectStubHtml(to: string) {
  const siteUrl = 'https://adcakeyuan.top'
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="robots" content="noindex" />
<link rel="canonical" href="${siteUrl}${to}" />
<meta http-equiv="refresh" content="0; url=${to}" />
<script>location.replace(${JSON.stringify(to)})</script>
<title>页面已迁移，正在跳转…</title>
</head>
<body>
<p>页面已迁移，正在跳转到 <a href="${to}">${to}</a>…</p>
</body>
</html>
`
}

postbuild()
