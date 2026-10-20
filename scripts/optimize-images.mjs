/**
 * 构建期图片优化：把仓库里的大尺寸位图转成 WebP，并生成一个
 * 原图 → 优化图的映射，供 components/ui/image.tsx 在渲染时替换。
 *
 * 设计原则：
 *  - 只处理确实会拖慢首屏的图（>150KB 的 png/jpg），已优化过的 webp/svg 不动；
 *  - 输出不存在或源文件更新时才重新编码，构建可重复执行；
 *  - 特殊尺寸（头像、个人横幅、社交卡片）单独裁剪，避免拿 2400px 原图当缩略图。
 */
import { closeSync, existsSync, openSync, readSync, statSync } from 'fs'
import { mkdir, readdir, readFile, rename, stat, writeFile } from 'fs/promises'
import path from 'path'
import sharp from 'sharp'

const ROOT = process.cwd()
const PUBLIC_DIR = path.join(ROOT, 'public')
const IMAGES_DIR = path.join(PUBLIC_DIR, 'static', 'images')
const MANIFEST_PATH = path.join(ROOT, 'data', 'image-variants.json')
const LARGE_FILE_BYTES = 150 * 1024
const MAX_WIDTH = 1280
const WEBP_QUALITY = 80

const log = (...args) => console.log('[images]', ...args)

const urlFor = (file) => '/' + path.relative(PUBLIC_DIR, file).split(path.sep).join('/')

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

/** 防止把零字节/占位文件当成有效缓存 */
function hasValidSignature(file) {
  try {
    const fd = openSync(file, 'r')
    const header = Buffer.alloc(12)
    readSync(fd, header, 0, 12, 0)
    closeSync(fd)
    const riff = header.toString('latin1', 0, 4) === 'RIFF' && header.toString('latin1', 8, 12) === 'WEBP'
    const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff
    const png = header.subarray(0, 8).equals(PNG_SIGNATURE)
    return riff || jpeg || png
  } catch {
    return false
  }
}

function isFresher(output, source) {
  try {
    return (
      hasValidSignature(output) && statSync(output).mtimeMs >= statSync(source).mtimeMs
    )
  } catch {
    return false
  }
}

async function writeImage(pipeline, output, label) {
  await mkdir(path.dirname(output), { recursive: true })
  const tmp = `${output}.tmp`
  await pipeline.toFile(tmp)
  await rename(tmp, output)
  const { size } = await stat(output)
  log(`${label} → ${urlFor(output)} (${Math.round(size / 1024)}KB)`)
}

async function toWebp(source, output, { width = MAX_WIDTH, height, fit, quality = WEBP_QUALITY } = {}) {
  if (isFresher(output, source)) return
  let pipeline = sharp(source).rotate()
  if (width || height) {
    pipeline = pipeline.resize({ width, height, fit, withoutEnlargement: true })
  }
  await writeImage(pipeline.webp({ quality, effort: 5 }), output, path.basename(source))
}

async function toJpeg(source, output, { width, height, fit, quality = 82 } = {}) {
  if (isFresher(output, source)) return
  let pipeline = sharp(source).rotate()
  if (width || height) {
    pipeline = pipeline.resize({ width, height, fit, withoutEnlargement: true })
  }
  await writeImage(pipeline.jpeg({ quality, mozjpeg: true }), output, path.basename(source))
}

async function toPng(source, output, size) {
  if (isFresher(output, source)) return
  await writeImage(
    sharp(source)
      .rotate()
      .resize({ width: size, height: size, fit: 'cover' })
      .png({ compressionLevel: 9, palette: true, quality: 85 }),
    output,
    path.basename(source)
  )
}

async function walk(dir, files = []) {
  if (!existsSync(dir)) return files
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) await walk(full, files)
    else files.push(full)
  }
  return files
}

const variants = {}

async function main() {
  await mkdir(path.dirname(MANIFEST_PATH), { recursive: true })

  const avatar = path.join(IMAGES_DIR, 'avatar.jpg')
  const banner = path.join(IMAGES_DIR, 'homepage-banner.jpg')
  const favicon = path.join(PUBLIC_DIR, 'static', 'favicons', 'favicon-800x800.png')

  if (existsSync(avatar)) {
    const small = path.join(IMAGES_DIR, 'avatar-128.webp')
    const logo = path.join(IMAGES_DIR, 'avatar-256.webp')
    await toWebp(avatar, small, { width: 128, height: 128, fit: 'cover', quality: 82 })
    await toWebp(avatar, logo, { width: 256, height: 256, fit: 'cover', quality: 82 })
    variants['/static/images/avatar.jpg'] = urlFor(small)
  }

  if (existsSync(banner)) {
    const profile = path.join(IMAGES_DIR, 'profile-banner.webp')
    const social = path.join(IMAGES_DIR, 'social-banner.jpg')
    const fallback = path.join(IMAGES_DIR, 'post-fallback.webp')
    await toWebp(banner, profile, { width: 960, quality: 80 })
    await toJpeg(banner, social, { width: 1200, height: 630, fit: 'cover' })
    await toWebp(banner, fallback, { width: 800, height: 450, fit: 'cover', quality: 80 })
    variants['/static/images/homepage-banner.jpg'] = urlFor(profile)
  }

  if (existsSync(favicon)) {
    await toPng(favicon, path.join(PUBLIC_DIR, 'static', 'favicons', 'favicon-512x512.png'), 512)
    await toPng(favicon, path.join(PUBLIC_DIR, 'static', 'favicons', 'favicon-180x180.png'), 180)
  }

  // 其他大图：生成同名 .webp，交给 Image 组件按映射替换
  const largeImages = (await walk(IMAGES_DIR)).filter((file) => {
    if (!/\.(png|jpe?g)$/i.test(file)) return false
    if (file === avatar || file === banner) return false
    return statSync(file).size >= LARGE_FILE_BYTES
  })

  for (const source of largeImages) {
    const output = source.replace(/\.(png|jpe?g)$/i, '.webp')
    await toWebp(source, output, { width: MAX_WIDTH, quality: 82 })
    variants[urlFor(source)] = urlFor(output)
  }

  const sorted = Object.fromEntries(Object.entries(variants).sort(([a], [b]) => a.localeCompare(b)))
  const previous = existsSync(MANIFEST_PATH) ? await readFile(MANIFEST_PATH, 'utf8') : ''
  const next = JSON.stringify(sorted, null, 2) + '\n'
  if (previous !== next) {
    await writeFile(MANIFEST_PATH, next)
    log(`manifest updated (${Object.keys(sorted).length} entries)`)
  } else {
    log(`manifest unchanged (${Object.keys(sorted).length} entries)`)
  }
}

main().catch((error) => {
  console.error('[images] failed:', error)
  process.exitCode = 1
})
