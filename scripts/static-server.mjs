// Minimal static file server for the Next.js `output: 'export'` build (out/).
// Used by Playwright e2e tests and local smoke checks. No dependencies.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = process.argv[2] || 'out'
const port = Number(process.argv[3]) || 3000

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
    res.writeHead(200, { 'Content-Type': type })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not Found')
  }
}).listen(port, () => console.log(`serving ${root} on http://localhost:${port}`))
