/**
 * 博客 AI 服务逻辑（同一份实现，两种部署形态共用）：
 *  - Cloudflare Pages：functions/api/[[route]].ts 调用 handleApiRequest（当前实际使用）
 *  - Workers with assets：默认导出 fetch 调用 handleApiRequest（保留兼容）
 *
 * 端点：
 *   GET  /api/health            存活检查
 *   GET  /api/semantic-search?q= 语义搜索（查询向量 × 本地索引余弦排序）
 *   POST /api/ask               RAG 问答（SSE 流式返回，附引用来源）
 *
 * 模型通过 wrangler.jsonc 的 vars 配置，默认：
 *   嵌入 @cf/baai/bge-small-zh-v1.5（与构建期 scripts/build-semantic-index.mjs 同一模型）
 *   生成 @cf/meta/llama-3.3-70b-instruct-fp8-fast
 */

export interface Env {
  AI?: { run: (model: string, input: Record<string, unknown>) => Promise<any> }
  ASSETS?: { fetch: (request: Request) => Promise<Response> }
  SITE_URL?: string
  EMBED_MODEL?: string
  QA_MODEL?: string
}

interface Chunk {
  s: string // 文章 slug
  t: string // 文章标题
  h: string // 小节标题（可空）
  x: string // 文本块
  v: number[] // 归一化向量
}

interface SearchIndex {
  model: string
  dim: number
  chunks: Chunk[]
}

// bge 中文检索官方推荐的查询侧指令前缀（文档侧不加）
const QUERY_PREFIX = '为这个句子生成表示以用于检索相关文章：'
const INDEX_TTL_MS = 5 * 60 * 1000
const MAX_Q_LEN = 120
const SEARCH_TOP_K = 8
const ASK_TOP_K = 6
const MAX_QUESTION_LEN = 500

let indexCache: { data: SearchIndex; at: number } | null = null

async function loadIndex(request: Request): Promise<SearchIndex> {
  if (indexCache && Date.now() - indexCache.at < INDEX_TTL_MS) return indexCache.data
  const res = await fetch(new URL('/search-vectors.json', request.url))
  if (!res.ok) throw new Error('search-vectors.json 不可用')
  const data = (await res.json()) as SearchIndex
  if (!Array.isArray(data.chunks)) throw new Error('索引格式非法')
  indexCache = { data, at: Date.now() }
  return data
}

function aiBinding(env: Env) {
  if (!env.AI) throw new Error('AI 绑定不可用（需部署在启用 Workers AI 的 Cloudflare 环境中）')
  return env.AI
}

async function embedQuery(env: Env, question: string): Promise<number[]> {
  const model = env.EMBED_MODEL || '@cf/baai/bge-small-zh-v1.5'
  const result = await aiBinding(env).run(model, { text: [QUERY_PREFIX + question] })
  const vec = result?.data?.[0]
  if (!Array.isArray(vec) || vec.length === 0) throw new Error('向量化失败')
  return vec
}

function rank(index: SearchIndex, queryVec: number[], topK: number) {
  // 构建期与查询侧向量均已归一化，点积即余弦相似度；防御性再除一次模长
  let qn = 0
  for (const x of queryVec) qn += x * x
  qn = Math.sqrt(qn) || 1
  const scored = index.chunks.map((c) => {
    let dot = 0
    let cn = 0
    const v = c.v
    for (let i = 0; i < v.length && i < queryVec.length; i++) {
      dot += v[i] * queryVec[i]
      cn += v[i] * v[i]
    }
    return { chunk: c, score: dot / (qn * (Math.sqrt(cn) || 1)) }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK)
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

// ---- 极简限流：按 IP 的固定窗口计数（隔离实例级，尽力而为，防滥用够用） ----
const rateBuckets = new Map<string, { count: number; resetAt: number }>()
function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const b = rateBuckets.get(key)
  if (!b || now > b.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (b.count >= limit) return false
  b.count += 1
  return true
}
function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') || 'unknown'
}

async function handleSemanticSearch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const q = (url.searchParams.get('q') || '').trim().slice(0, MAX_Q_LEN)
  if (!q) return json({ results: [] })
  if (!rateLimit(`search:${clientIp(request)}`, 120, 60_000)) {
    return json({ error: '请求过于频繁' }, 429)
  }
  const index = await loadIndex(request)
  if (index.chunks.length === 0) return json({ results: [] })
  const queryVec = await embedQuery(env, q)
  const top = rank(index, queryVec, SEARCH_TOP_K)
  const siteUrl = env.SITE_URL || 'https://adcakeyuan.top'
  return json({
    results: top.map(({ chunk, score }) => ({
      slug: chunk.s,
      title: chunk.t,
      heading: chunk.h,
      snippet: chunk.x.slice(0, 140) + (chunk.x.length > 140 ? '…' : ''),
      score: Math.round(score * 1000) / 1000,
      url: `${siteUrl}/blog/${chunk.s}`,
    })),
  })
}

function buildContext(top: { chunk: Chunk; score: number }[], siteUrl: string) {
  const blocks: string[] = []
  const sources: { n: number; title: string; url: string }[] = []
  let n = 0
  for (const { chunk } of top) {
    n += 1
    const url = `${siteUrl}/blog/${chunk.s}`
    blocks.push(`[${n}] 《${chunk.t}》${chunk.h ? ` - ${chunk.h}` : ''} (${url})\n${chunk.x}`)
    if (!sources.some((s) => s.url === url)) sources.push({ n, title: chunk.t, url })
  }
  return { context: blocks.join('\n\n'), sources }
}

async function handleAsk(request: Request, env: Env): Promise<Response> {
  if (!rateLimit(`ask:${clientIp(request)}`, 15, 60_000)) {
    return json({ error: '提问太频繁了，稍等一分钟再试。' }, 429)
  }
  let body: { question?: string; history?: { role: string; content: string }[] }
  try {
    body = await request.json()
  } catch {
    return json({ error: '请求体非法' }, 400)
  }
  const question = String(body.question || '')
    .trim()
    .slice(0, MAX_QUESTION_LEN)
  if (question.length < 2) return json({ error: '问题太短了' }, 400)

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter(
      (m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string'
    )
    .slice(-4)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 1000) }))

  const index = await loadIndex(request)
  if (index.chunks.length === 0) {
    return json({ error: '语义索引为空，暂时无法回答。' }, 503)
  }
  const queryVec = await embedQuery(env, question.slice(0, MAX_Q_LEN))
  const top = rank(index, queryVec, ASK_TOP_K)
  const siteUrl = env.SITE_URL || 'https://adcakeyuan.top'
  const { context, sources } = buildContext(top, siteUrl)

  const system = [
    '你是一个中文技术博客的站内问答助手，博主叫 ADCakeyuan。',
    '只能依据下面提供的博客文章片段回答问题，并像 [1] 这样标注来源编号。',
    '片段不够时，坦诚说明没找到，并给出 2~3 个更合适的检索关键词，禁止编造。',
    '回答简洁（一般不超过 300 字），使用 Markdown 列表或短段落组织内容。',
  ].join('\n')

  const messages = [
    { role: 'system', content: `${system}\n\n=== 博客文章片段 ===\n${context}\n=== 片段结束 ===` },
    ...history,
    { role: 'user', content: question },
  ]

  const model = env.QA_MODEL || '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      try {
        const result = await aiBinding(env).run(model, { messages, stream: true, max_tokens: 1024 })
        const reader = result.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() || ''
          for (const line of lines) {
            const t = line.trim()
            if (!t.startsWith('data:')) continue
            const payload = t.slice(5).trim()
            if (!payload || payload === '[DONE]') continue
            try {
              const chunk = JSON.parse(payload)
              if (chunk.response) send({ t: chunk.response })
            } catch {
              // 忽略无法解析的心跳/注释行
            }
          }
        }
        send({ sources })
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      } catch (err) {
        send({ error: `AI 服务暂时不可用：${err instanceof Error ? err.message : '未知错误'}` })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    },
  })
}

/** /api/* 的统一处理入口，Pages Functions 与 Workers 入口都转发到这里 */
export async function handleApiRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const { pathname } = url
  try {
    if (pathname === '/api/health') return json({ ok: true, ts: Date.now() })
    if (pathname === '/api/semantic-search' && request.method === 'GET') {
      return await handleSemanticSearch(request, env)
    }
    if (pathname === '/api/ask' && request.method === 'POST') {
      return await handleAsk(request, env)
    }
    return json({ error: 'Not Found' }, 404)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : '服务异常' }, 500)
  }
}

export default {
  // Workers with assets 形态的入口（Pages 形态见 functions/api/[[route]].ts）
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/') && env.ASSETS) {
      return env.ASSETS.fetch(request)
    }
    return handleApiRequest(request, env)
  },
}
