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
 * `_…_` 收尾被写成 `\_` 时 emphasis 不成对，整段按普通文本渲染，读者会看到
 * 首尾两个裸下划线。prettier 在重排含特殊符号的行内代码时会做这种转义，
 * 所以这条断言要跑在提交之后的文件上。
 *
 * 围栏跟踪按 CommonMark 的长度规则来：文章里用 ```` 包含 ``` 的样本，
 * 只看「行首三个反引号」会数错进出围栏的次数。
 */
function bodyLines(text: string): string[] {
  const lines = text.split(/\r?\n/)
  const body: string[] = []
  let fence: { char: string; length: number } | null = null
  for (const line of lines) {
    const open = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line)
    if (!fence && open) {
      fence = { char: open[1][0], length: open[1].length }
      continue
    }
    if (fence) {
      const close = /^ {0,3}(`{3,}|~{3,})\s*$/.exec(line)
      if (close && close[1][0] === fence.char && close[1].length >= fence.length) fence = null
      continue
    }
    body.push(line)
  }
  return body
}

describe('MDX 斜体注记', () => {
  it('正文行不以转义下划线收尾', () => {
    const offenders: string[] = []
    for (const file of mdxFiles(ROOT)) {
      bodyLines(readFileSync(file, 'utf8')).forEach((line, i) => {
        if (/\\_\s*$/.test(line)) offenders.push(`${file}:${i + 1}`)
      })
    }
    expect(offenders).toEqual([])
  })
})
