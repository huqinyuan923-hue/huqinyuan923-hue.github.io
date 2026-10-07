/**
 * 构建期语义索引生成器
 *
 * 读取 data/blog 下全部 MDX 文章，分块后用本地嵌入模型（bge-small-zh-v1.5）
 * 生成向量，写出两个产物：
 *   1. public/search-vectors.json —— Worker /api/semantic-search 与 /api/ask 的检索语料
 *   2. json/related-posts.json   —— 文章页「相关文章」静态数据
 *
 * 设计原则：任何失败都不能挡住博客构建。
 * 模型下载失败 / 嵌入异常时，若磁盘上已有旧索引则原样保留，否则写空索引，
 * 前端自动退回 kbar 关键词搜索（相关文章区块隐藏）。
 *
 * 手动执行：pnpm index   （pnpm build 会自动先跑这一步）
 * 跳过执行：SKIP_SEMANTIC_INDEX=1 pnpm build
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'fs'
import path from 'path'
import matter from 'gray-matter'

const ROOT = process.cwd()
const BLOG_DIR = path.join(ROOT, 'data', 'blog')
const VECTORS_TMP = path.join(ROOT, 'public', 'search-vectors.json.tmp')
const VECTORS_OUT = path.join(ROOT, 'public', 'search-vectors.json')
const RELATED_OUT = path.join(ROOT, 'json', 'related-posts.json')

const MODEL_ID = 'Xenova/bge-small-zh-v1.5'
const DIM = 384
const CHUNK_SIZE = 480
const CHUNK_OVERLAP = 80
const MIN_CHUNK_LEN = 24
const EMBED_BATCH = 8

const log = (...args) => console.log('[semantic-index]', ...args)

/**
 * slug 口径与 contentlayer.config.ts 的 computed slug 保持一致：
 *  - 新版 config 定义了 blogSlug()：kebab-case，如 'how-i-built-arcade-hub'
 *  - 旧版（未定义 blogSlug）：'日期目录/文件名'，如 '202610/How_I_Built_Arcade_Hub'
 * 构建时探测一次；related-posts.json 额外按两种口径各写一份键，渲染端无论
 * 用哪套 slug 都能命中。
 */
const KEYS = (() => {
  try {
    const cfg = readFileSync(path.join(ROOT, 'contentlayer.config.ts'), 'utf8')
    return { kebab: /function blogSlug/.test(cfg) }
  } catch {
    return { kebab: false }
  }
})()

const toSlug = (rel /* 'blog/202610/How_I_Built_Arcade_Hub' */) =>
  KEYS.kebab
    ? rel.replace(/^blog\/\d{6}\//, '').toLowerCase().replace(/_/g, '-')
    : rel.replace(/^blog\//, '')

const toKebabSlug = (rel) => rel.replace(/^blog\/\d{6}\//, '').toLowerCase().replace(/_/g, '-')

function listMdx(dir) {
  const out = []
  const walk = (d) => {
    if (!existsSync(d)) return
    for (const name of readdirSync(d)) {
      const p = path.join(d, name)
      if (statSync(p).isDirectory()) walk(p)
      else if (name.endsWith('.mdx')) out.push(p)
    }
  }
  walk(dir)
  return out
}

/** MDX 原文 → 干净的纯文本（保留代码块内容，截断过长代码） */
function cleanMdx(raw) {
  return raw
    .replace(/^import[\s\S]*?from\s+['"].*['"]\s*$/gm, '')
    .replace(/^export\s+(const|default|function)[^\n]*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, (_, code) => {
      const lines = code.split('\n')
      return lines.length > 25
        ? '```\n' + lines.slice(0, 25).join('\n') + '\n…（代码略）\n```'
        : '```\n' + code + '```'
    })
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<\/?[a-zA-Z][^>\n]*>/g, '')
    .replace(/^\s*\*\s\*\s*\*\s*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** 纯文本 → 按 Markdown 标题切节，再按长度滑窗 */
function chunkText(text) {
  const sections = []
  let current = { h: '', lines: [] }
  for (const line of text.split('\n')) {
    const m = line.match(/^(#{1,6})\s+(.*)$/)
    if (m) {
      if (current.lines.join('').trim().length >= MIN_CHUNK_LEN) sections.push(current)
      current = { h: m[2].replace(/[*`_]/g, '').trim(), lines: [] }
    } else {
      current.lines.push(line)
    }
  }
  if (current.lines.join('').trim().length >= MIN_CHUNK_LEN) sections.push(current)

  const chunks = []
  for (const sec of sections) {
    const body = sec.lines
      .join('\n')
      .replace(/^[#>\-\s]*$/gm, (l) => (l.trim() === '' ? '' : l))
      .replace(/[`*_]{1,3}([^`*_]+)[`*_]{1,3}/g, '$1')
      .replace(/\n{2,}/g, '\n')
      .trim()
    if (body.length < MIN_CHUNK_LEN) continue
    if (body.length <= CHUNK_SIZE) {
      chunks.push({ h: sec.h, x: body })
      continue
    }
    let i = 0
    while (i < body.length) {
      let end = Math.min(body.length, i + CHUNK_SIZE)
      if (end < body.length) {
        const win = body.slice(i, end)
        const cut = Math.max(
          win.lastIndexOf('。'),
          win.lastIndexOf('！'),
          win.lastIndexOf('？'),
          win.lastIndexOf('；'),
          win.lastIndexOf('\n')
        )
        if (cut > CHUNK_SIZE * 0.5) end = i + cut + 1
      }
      const piece = body.slice(i, end).trim()
      if (piece.length >= MIN_CHUNK_LEN) chunks.push({ h: sec.h, x: piece })
      if (end >= body.length) break
      i = Math.max(end - CHUNK_OVERLAP, i + 1)
    }
  }
  return chunks
}

const normalize = (v) => {
  let n = 0
  for (let i = 0; i < v.length; i++) n += v[i] * v[i]
  n = Math.sqrt(n) || 1
  return v.map((x) => x / n)
}

async function main() {
  if (process.env.SKIP_SEMANTIC_INDEX === '1') {
    log('SKIP_SEMANTIC_INDEX=1，跳过。')
    return
  }
  const files = listMdx(BLOG_DIR)
  log(`发现 ${files.length} 篇文章`)

  const posts = []
  for (const file of files) {
    const raw = readFileSync(file, 'utf8')
    const { data, content } = matter(raw)
    if (data.draft === true) continue
    const rel = path.relative(BLOG_DIR, file).replace(/\\/g, '/').replace(/\.mdx$/, '')
    const chunks = chunkText(cleanMdx(content))
    // frontmatter 的 TL;DR 作为文章第一个语料块，问答与检索的命中最优先
    if (data.tldr) chunks.unshift({ h: '', x: `TL;DR：${data.tldr}` })
    posts.push({
      slug: toSlug('blog/' + rel),
      altSlug: toKebabSlug('blog/' + rel),
      title: String(data.title || rel),
      date: data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date || ''),
      chunks,
    })
  }
  const totalChunks = posts.reduce((n, p) => n + p.chunks.length, 0)
  log(`非草稿 ${posts.length} 篇，共 ${totalChunks} 个文本块`)

  let extractor
  try {
    const { pipeline } = await import('@huggingface/transformers')
    try {
      extractor = await pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' })
    } catch {
      log('q8 量化模型不可用，退回 fp32')
      extractor = await pipeline('feature-extraction', MODEL_ID)
    }
  } catch (err) {
    log('⚠️ 嵌入模型加载失败：', err.message)
    if (existsSync(VECTORS_OUT)) {
      log('保留已有 search-vectors.json，本次不更新。')
      return
    }
    mkdirSync(path.dirname(VECTORS_OUT), { recursive: true })
    mkdirSync(path.dirname(RELATED_OUT), { recursive: true })
    writeFileSync(
      VECTORS_OUT,
      JSON.stringify({ model: MODEL_ID, dim: DIM, builtAt: new Date().toISOString(), chunks: [] })
    )
    writeFileSync(RELATED_OUT, JSON.stringify({}, null, 2))
    log('已写出空索引（搜索将退回关键词模式）。')
    return
  }

  // 逐批嵌入：语料前拼接标题/小节，提高可检索性；向量 L2 归一化
  const flat = []
  for (const p of posts) {
    for (const c of p.chunks) {
      flat.push({ slug: p.slug, title: p.title, h: c.h, text: c.x, embed: `${p.title}${c.h ? ' · ' + c.h : ''}\n${c.x}` })
    }
  }

  const vectors = []
  for (let i = 0; i < flat.length; i += EMBED_BATCH) {
    const batch = flat.slice(i, i + EMBED_BATCH).map((f) => f.embed)
    const out = await extractor(batch, { pooling: 'mean', normalize: true })
    for (const v of out.tolist()) vectors.push(normalize(v))
    if ((i / EMBED_BATCH) % 10 === 0) log(`已嵌入 ${Math.min(i + EMBED_BATCH, flat.length)}/${flat.length}`)
  }

  const chunks = flat.map((f, i) => ({
    s: f.slug,
    t: f.title,
    h: f.h || '',
    x: f.text,
    v: vectors[i].map((n) => Math.round(n * 10000) / 10000),
  }))

  // 文章级向量 = 块向量均值（归一化），算 Top-3 相关文章
  const postVec = new Map()
  const sums = new Map(posts.map((p) => [p.slug, new Float64Array(DIM)]))
  for (let i = 0; i < flat.length; i++) {
    const acc = sums.get(flat[i].slug)
    for (let d = 0; d < DIM; d++) acc[d] += vectors[i][d]
  }
  for (const [slug, acc] of sums) {
    postVec.set(slug, normalize(Array.from(acc)))
  }

  const top3 = (keyOf) => {
    const map = {}
    for (const p of posts) {
      const pv = postVec.get(p.slug)
      map[keyOf(p)] = posts
        .filter((q) => keyOf(q) !== keyOf(p))
        .map((q) => {
          const qv = postVec.get(q.slug)
          let dot = 0
          for (let d = 0; d < DIM; d++) dot += pv[d] * qv[d]
          return { slug: keyOf(q), title: q.title, date: q.date, score: dot }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ slug, title, date }) => ({ slug, title, date }))
    }
    return map
  }
  // 双口径各写一份键：contentlayer 的 slug 用哪套，渲染端都能命中
  const related = top3((p) => p.slug)
  if (posts.some((p) => p.altSlug !== p.slug)) Object.assign(related, top3((p) => p.altSlug))

  writeFileSync(RELATED_OUT, JSON.stringify(related, null, 2))
  writeFileSync(
    VECTORS_TMP,
    JSON.stringify({
      model: MODEL_ID,
      dim: DIM,
      builtAt: new Date().toISOString(),
      chunks,
    })
  )
  renameSync(VECTORS_TMP, VECTORS_OUT)
  log(`✅ 写出 ${chunks.length} 个向量块 → public/search-vectors.json`)
  log(`✅ 相关文章数据 → json/related-posts.json`)
}

main().catch((err) => {
  console.error('[semantic-index] 失败：', err)
  if (existsSync(VECTORS_OUT)) {
    console.error('[semantic-index] 保留已有索引，继续构建。')
    process.exit(0)
  }
  // 没有旧索引也要写出空产物，保证 next build 的静态 import 不缺文件
  mkdirSync(path.dirname(VECTORS_OUT), { recursive: true })
  mkdirSync(path.dirname(RELATED_OUT), { recursive: true })
  writeFileSync(
    VECTORS_OUT,
    JSON.stringify({ model: MODEL_ID, dim: DIM, builtAt: new Date().toISOString(), chunks: [] })
  )
  writeFileSync(RELATED_OUT, JSON.stringify({}, null, 2))
  process.exit(0)
})
