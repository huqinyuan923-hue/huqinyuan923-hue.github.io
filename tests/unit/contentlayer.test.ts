import { describe, expect, it, vi } from 'vitest'
import { allCoreContent, coreContent } from '~/utils/contentlayer'
import type { MDXDocument } from '~/types/data'

function makeDoc(overrides: Partial<MDXDocument> = {}, title = 'A post'): MDXDocument {
  return {
    body: { raw: 'raw body', code: 'code' },
    _raw: { sourceFilePath: 'blog/a.mdx' },
    _id: 'blog/a.mdx',
    title,
    ...overrides,
  } as MDXDocument
}

describe('coreContent', () => {
  it('strips body, _raw and _id', () => {
    const doc = makeDoc()
    const core = coreContent(doc)
    expect(core).toEqual({ title: 'A post' })
  })

  it('does not mutate the original document', () => {
    const doc = makeDoc()
    coreContent(doc)
    expect(doc._id).toBe('blog/a.mdx')
    expect(doc.body).toBeDefined()
  })
})

describe('allCoreContent', () => {
  it('keeps drafts in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.resetModules()
    const { allCoreContent: devAllCoreContent } = await import('~/utils/contentlayer')
    const docs = [makeDoc(), makeDoc({ _id: 'b', draft: true } as Partial<MDXDocument>)]
    expect(devAllCoreContent(docs)).toHaveLength(2)
  })

  it('filters out drafts in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.resetModules()
    const { allCoreContent: prodAllCoreContent } = await import('~/utils/contentlayer')
    const docs = [
      makeDoc({ _id: 'a', title: 'first' }),
      makeDoc({ _id: 'b', draft: true } as Partial<MDXDocument>),
      makeDoc({ _id: 'c', draft: false } as Partial<MDXDocument>, 'second'),
    ]
    const result = prodAllCoreContent(docs)
    expect(result).toHaveLength(2)
    expect(result.map((d) => d.title)).toEqual(['first', 'second'])
  })
})
