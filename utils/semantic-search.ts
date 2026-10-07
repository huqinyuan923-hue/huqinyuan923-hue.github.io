'use client'

/**
 * 本地语义检索：加载构建期生成的全站向量索引，在浏览器内完成
 * 查询向量化（与文档同模型）与余弦排序，不依赖任何服务端接口。
 */

export interface SemanticHit {
  slug: string
  title: string
  heading: string
  snippet: string
  score: number
  url: string
}

interface IndexChunk {
  s: string
  t: string
  h: string
  x: string
  v: number[]
}

interface SearchIndex {
  model: string
  dim: number
  chunks: IndexChunk[]
}

let indexPromise: Promise<SearchIndex> | null = null

export function loadSearchIndex(): Promise<SearchIndex> {
  if (!indexPromise) {
    indexPromise = fetch('/search-vectors.json')
      .then((res) => {
        if (!res.ok) throw new Error(`索引加载失败（${res.status}）`)
        return res.json() as Promise<SearchIndex>
      })
      .catch((err) => {
        indexPromise = null
        throw err
      })
  }
  return indexPromise
}

export function cosineRank(index: SearchIndex, queryVec: number[], topK: number): SemanticHit[] {
  const scored = index.chunks.map((c) => {
    let dot = 0
    const v = c.v
    const n = Math.min(v.length, queryVec.length)
    for (let i = 0; i < n; i++) dot += v[i] * queryVec[i]
    return { c, score: dot }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, topK).map(({ c, score }) => ({
    slug: c.s,
    title: c.t,
    heading: c.h,
    snippet: c.x.slice(0, 140) + (c.x.length > 140 ? '…' : ''),
    score: Math.round(score * 1000) / 1000,
    url: `/blog/${c.s}`,
  }))
}
