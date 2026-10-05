import { describe, expect, it, vi } from 'vitest'
import { formatDate, dateSortDesc } from '~/utils/date'
import { capitalize, kebabCaseToPlainText, getTimeAgo, sortPosts } from '~/utils/misc'
import { escape } from '~/utils/html-escaper'
import type { MDXDocumentDate } from '~/types/data'

describe('formatDate', () => {
  it('formats an ISO date as "Aug 14, 2026" style', () => {
    expect(formatDate('2026-08-14T00:00:00.000Z')).toMatch(/Aug 1[34], 2026/)
  })
})

describe('dateSortDesc', () => {
  it('sorts dates descending', () => {
    expect(['2026-01-01', '2026-03-01', '2025-12-31'].sort(dateSortDesc)).toEqual([
      '2026-03-01',
      '2026-01-01',
      '2025-12-31',
    ])
  })
})

describe('kebabCaseToPlainText', () => {
  it('converts kebab-case to spaces', () => {
    expect(kebabCaseToPlainText('my-cool-tag')).toBe('my cool tag')
  })
})

describe('capitalize', () => {
  it('capitalizes the first letter', () => {
    expect(capitalize('hello')).toBe('Hello')
  })
})

describe('escape', () => {
  it('escapes HTML entities', () => {
    expect(escape('<a href="x">&\'')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;')
  })
})

describe('getTimeAgo', () => {
  const now = new Date('2026-10-05T12:00:00Z').getTime()

  it('returns "just now" for the current time', () => {
    expect(getTimeAgo(new Date(now), now)).toBe('just now')
  })

  it('returns minutes/hours/days ago', () => {
    expect(getTimeAgo(now - 5 * 60 * 1000, now)).toBe('5 minutes ago')
    expect(getTimeAgo(now - 3 * 60 * 60 * 1000, now)).toBe('3 hours ago')
    expect(getTimeAgo(now - 2 * 24 * 60 * 60 * 1000, now)).toBe('2 days ago')
  })
})

describe('sortPosts', () => {
  it('sorts posts by date descending', () => {
    const posts = [
      { date: '2026-01-01', title: 'old' },
      { date: '2026-09-01', title: 'new' },
      { date: '2026-05-01', title: 'middle' },
    ]
    const sorted = sortPosts(posts as unknown as MDXDocumentDate[])
    expect(sorted.map((p) => p.title)).toEqual(['new', 'middle', 'old'])
  })

  it('supports a custom date key', () => {
    const posts = [
      { lastmod: '2026-01-01', title: 'old' },
      { lastmod: '2026-02-01', title: 'new' },
    ]
    expect(sortPosts(posts as unknown as MDXDocumentDate[], 'lastmod').map((p) => p.title)).toEqual(
      ['new', 'old']
    )
  })
})
