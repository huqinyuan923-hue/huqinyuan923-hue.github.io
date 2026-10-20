// Minimal static file server for the Next.js `output: 'export'` build (out/).
// Used by Playwright e2e tests, local smoke checks and Lighthouse CI. No deps.
// `COMPRESS=1` additionally brotli/gzips text assets so Lighthouse sees the
// byte weights it would see from Cloudflare Pages (which always compresses).
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'

const root = process.argv[2] || 'out'
const port = Number(process.argv[3]) || 3000
const compress = process.env.COMPRESS === '1'

const COMPRESSIBLE = new Set([
  '.html',
  '.js',
  '.css',
  '.json',
  '.xml',
  '.txt',
  '.svg',
  '.webmanifest',
  '.map',
])
const compressCache = new Map()

function encode(body, file, ext, accept) {
  if (!compress || !COMPRESSIBLE.has(ext) || !accept) return { body, encoding: null }
  // keyed by path + byte length, so a rebuild that changes the file is never
  // served from a stale compressed cache
  const cacheKey = `${file}:${body.byteLength}:${accept}`
  const cached = compressCache.get(cacheKey)
  if (cached) return cached
  const result = accept.includes('br')
    ? {
        body: brotliCompressSync(body, {
          params: { [constants.BROTLI_PARAM_QUALITY]: 5 },
        }),
        encoding: 'br',
      }
    : accept.includes('gzip')
      ? { body: gzipSync(body, { level: 6 }), encoding: 'gzip' }
      : { body, encoding: null }
  compressCache.set(cacheKey, result)
  return result
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
}

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    path = normalize(path).replace(/^([/\\])+/, '')
    if (path === '' || path === '.') path = 'index.html'
    let file = join(root, path)
    let body
    try {
      body = await readFile(file)
    } catch {
      // directory-style URL: try /path/index.html then /path.html
      try {
        file = join(root, path, 'index.html')
        body = await readFile(file)
      } catch {
        file = join(root, `${path}.html`)
        body = await readFile(file)
      }
    }
    const type = MIME[extname(file).toLowerCase()] || 'application/octet-stream'
    const ext = extname(file).toLowerCase()
    const encoded = encode(body, file, ext, req.headers['accept-encoding'] || '')
    const headers = { 'Content-Type': type, Vary: 'Accept-Encoding' }
    if (encoded.encoding) headers['Content-Encoding'] = encoded.encoding
    res.writeHead(200, headers)
    res.end(encoded.body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`))
