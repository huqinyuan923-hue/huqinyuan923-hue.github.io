/**
 * 批量生成文章封面 SVG 并注入 frontmatter images。
 * 用法: node scripts/gen-post-covers.mjs [--dry]
 */
import fs from 'node:fs'
import path from 'node:path'

const EMOJI_RULES = [
  [/llm|gpt|训练|模型|\bai\b|agent|智能/i, '🤖'],
  [/mcp|协议|server|服务/i, '🔌'],
  [/github|git\b|\bpr\b|开源/i, '🐙'],
  [/音乐|mp3|网易云|酷狗/i, '🎵'],
  [/面试|简历|发票|薪资|invoice|salary/i, '💼'],
  [/周报|复盘|review|weekly/i, '📊'],
  [/年度|summary|总结/i, '🎊'],
  [/日本|旅行|travels|香港|bank|银行/i, '✈️'],
  [/vue|pinia|组合/i, '💚'],
  [/react|next/i, '⚛️'],
  [/四级|英语|cet/i, '📝'],
  [/博客|blog|建站|网站/i, '✍️'],
  [/websocket|indexeddb|webview|android|录屏/i, '🔧'],
  [/源码|源代码|解析|flattening|interpreter|lexer|parser|compiler|vm|字节码|递归/i, '🔍'],
  [/部署|host|nginx|mysql|centos|strapi/i, '🛠️'],
  [/健康|youth|青春/i, '💪'],
  [/加入|join|招募/i, '🤝'],
  [/星系|galaxy|监控/i, '🌌'],
  [/skill|技巧|disclosure|渐进/i, '🎯'],
  [/微信|notice|通知/i, '📱'],
]
const COLORS = ['#22d3ee', '#a78bfa', '#ec4899', '#60a5fa', '#f59e0b', '#14b8a6', '#f97316', '#a3e635']
const OUT_DIR = 'public/static/images/blog'
const dry = process.argv.includes('--dry')

function walk(d, acc = []) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) walk(p, acc)
    else if (f.endsWith('.mdx')) acc.push(p)
  }
  return acc
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

let made = 0
let skipped = 0
for (const file of walk('data/blog')) {
  const t = fs.readFileSync(file, 'utf8')
  if (/^images:/m.test(t)) {
    skipped++
    continue
  }
  const titleM = t.match(/^title: '?(.*?)'?\s*$/m)
  const tagsM = t.match(/^tags: \[(.*?)\]/m)
  const title = titleM ? titleM[1] : path.basename(file, '.mdx')
  const tags = tagsM ? tagsM[1] : ''
  const hay = title + ' ' + tags
  let emoji = '✨'
  for (const [re, e] of EMOJI_RULES) {
    if (re.test(hay)) {
      emoji = e
      break
    }
  }
  let hash = 0
  for (const ch of file) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  const color = COLORS[hash % COLORS.length]

  const short = title.split(/[：:——]/)[0].slice(0, 24)
  const sub = tags ? tags.split(',')[0].replace(/['"]/g, '').trim() : 'ADCakeyuan'
  const slug = path.basename(file, '.mdx').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const outPath = path.join(OUT_DIR, `${slug}.svg`)

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#1e1b4b"/>
  </linearGradient>
  <radialGradient id="glow" cx="80%" cy="15%" r="70%">
    <stop offset="0" stop-color="${color}" stop-opacity=".45"/><stop offset="1" stop-color="${color}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="1200" height="630" fill="url(#bg)"/>
<rect width="1200" height="630" fill="url(#glow)"/>
<g opacity=".25">
  <circle cx="130" cy="520" r="160" fill="none" stroke="${color}" stroke-width="1.5"/>
  <circle cx="1075" cy="115" r="220" fill="none" stroke="${color}" stroke-width="1.5"/>
</g>
<circle cx="240" cy="235" r="95" fill="none" stroke="${color}" stroke-opacity=".55" stroke-width="2"/>
<text x="240" y="240" font-size="88" text-anchor="middle" dominant-baseline="central">${emoji}</text>
<text x="390" y="210" font-size="50" font-weight="800" fill="#f1f5f9" font-family="system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif">${esc(short)}</text>
<text x="392" y="270" font-size="26" fill="#94a3b8" font-family="system-ui,-apple-system,'PingFang SC','Microsoft YaHei',sans-serif">${esc(sub)}</text>
<rect x="392" y="330" width="120" height="5" rx="2.5" fill="${color}"/>
<text x="392" y="400" font-size="21" fill="#64748b" letter-spacing="4" font-family="ui-monospace,monospace">ADCAKEYUAN.TOP</text>
</svg>
`
  const rel = `/static/images/blog/${slug}.svg`
  if (!dry) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
    fs.writeFileSync(outPath, svg)
    const patched = t.replace(/^---\n/, `---\nimages: ['${rel}']\n`)
    fs.writeFileSync(file, patched)
  }
  made++
}
console.log(`generated ${made}, skipped(had cover) ${skipped}${dry ? ' (dry run)' : ''}`)
