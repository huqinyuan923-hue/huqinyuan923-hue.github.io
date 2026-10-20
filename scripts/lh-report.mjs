// Summarise Lighthouse CI reports: `node scripts/lh-report.mjs <dir> [...dirs]`
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function load(dir) {
  const byUrl = new Map()
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const raw = readFileSync(join(dir, file), 'utf8').trim()
    if (!raw.startsWith('{')) continue
    let report
    try {
      report = JSON.parse(raw)
    } catch {
      continue
    }
    if (!report.finalDisplayedUrl || !report.categories?.performance) continue
    const url = report.finalDisplayedUrl.replace(/^https?:\/\/[^/]+/, '')
    const runs = byUrl.get(url) || []
    runs.push(report)
    byUrl.set(url, runs)
  }
  return byUrl
}

const avg = (values) => Math.round(values.reduce((a, b) => a + b, 0) / values.length)
const KB = 1024

/** Lighthouse's numeric `value` is absent in the uploaded LHRs, so read displayValue. */
function numeric(report, id) {
  const audit = report.audits[id]
  if (!audit) return null
  if (typeof audit.value === 'number') return audit.value
  const text = String(audit.displayValue ?? '')
  const match = text.match(/([\d.,]+)\s*(ms|s|%)?.*/)
  if (!match) return null
  const number = Number(match[1].replace(/,/g, ''))
  if (match[2] === 's') return number * 1000
  if (match[2] === '%') return number
  if (text.includes('MiB')) return Math.round(number * 1024 * KB)
  if (text.includes('KiB')) return Math.round(number * KB)
  return number
}

for (const dir of process.argv.slice(2)) {
  console.log(`\n=== ${dir} ===`)
  for (const [url, runs] of load(dir)) {
    const perf = avg(runs.map((r) => r.categories.performance.score * 100))
    const timings = [
      ['FCP', 'first-contentful-paint'],
      ['LCP', 'largest-contentful-paint'],
      ['TBT', 'total-blocking-time'],
      ['SI', 'speed-index'],
      ['TTI', 'interactive'],
    ]
      .map(([label, id]) => {
        const values = runs.map((r) => numeric(r, id)).filter((v) => v != null)
        return `${label}=${values.length ? `${avg(values)}ms` : '-'}`
      })
      .join(' ')
    const bytes = runs.map((r) => numeric(r, 'total-byte-weight')).filter((v) => v != null)
    const cls = runs[0].audits['cumulative-layout-shift']?.displayValue ?? '-'
    console.log(`${url.padEnd(9)} perf ${String(perf).padStart(3)}  ${timings} CLS=${cls} ${bytes.length ? `weight=${avg(bytes) / KB | 0}KB` : ''}`)
    for (const [index, r] of runs.entries()) {
      const one = [['FCP', 'first-contentful-paint'], ['LCP', 'largest-contentful-paint'], ['TBT', 'total-blocking-time']]
        .map(([label, id]) => `${label}=${numeric(r, id) ?? '-'}ms`)
        .join(' ')
      console.log(`    run${index + 1} ${one} ${r.categories.performance.score * 100 | 0}`)
    }
    for (const r of runs) {
      const phases = r.audits['lcp-phases-insight']?.details?.items?.[0]?.items
      if (phases) console.log('   ', phases.map((p) => `${p.label}=${Math.round(p.duration)}ms`).join(' '))
    }
  }
}
