import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = 'data/blog'

function mdxFiles(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...mdxFiles(p))
    else if (entry.name.endsWith('.mdx')) out.push(p)
  }
  return out
}

/**
 * `_…_` 收尾写成 `\_` 会让 emphasis 不成对：整段按普通文本渲染，
 * 读者看到的首尾两个下划线原样留在页面上。代码围栏里不检查。
 */
describe('MDX 斜体注记', () => {
  it('正文行不以转义下划线收尾', () => {
    const offenders: string[] = []
    for (const file of mdxFiles(ROOT)) {
      let inFence = false
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .forEach((line, i) => {
          if (line.trimStart().startsWith('```')) {
            inFence = !inFence
            return
          }
          if (!inFence && /\\_\s*$/.test(line)) offenders.push(`${file}:${i + 1}`)
        })
    }
    expect(offenders).toEqual([])
  })
})
