'use client'

/**
 * 浏览器端嵌入器：与构建期索引（scripts/build-semantic-index.mjs）使用完全相同的
 * 模型 Xenova/bge-small-zh-v1.5（q8 量化，约 25MB，首次加载后由浏览器 Cache API 缓存），
 * 保证查询向量与文档向量处于同一空间。
 * 模型与 wasm 按需加载，不进入首屏 bundle。
 */

const MODEL_ID = 'Xenova/bge-small-zh-v1.5'

type Extractor = (
  texts: string | string[],
  opts: { pooling: string; normalize: boolean }
) => Promise<{ tolist: () => number[][] }>

let extractorPromise: Promise<Extractor> | null = null

export interface LoadProgress {
  status: string
  progress?: number
  file?: string
}

export function getEmbedder(onProgress?: (p: LoadProgress) => void): Promise<Extractor> {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline } = await import('@huggingface/transformers')
      return pipeline('feature-extraction', MODEL_ID, {
        dtype: 'q8',
        progress_callback: onProgress,
      }) as unknown as Promise<Extractor>
    })()
  }
  return extractorPromise
}

/** 计算查询向量（与构建期相同：mean pooling + L2 归一化） */
export async function embedQuery(text: string): Promise<number[]> {
  const extractor = await getEmbedder()
  const out = await extractor(text, { pooling: 'mean', normalize: true })
  return out.tolist()[0]
}
