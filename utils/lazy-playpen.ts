export const PLAYPEN_FAMILY = 'SignaturePlaypen'
const SRC = '/static/fonts/playpen-sans-latin-800-normal.woff2'

/** 装饰性手写文字的字体栈：Playpen 到位前先用系统手写体顶上。 */
export const PLAYPEN_STACK = `'${PLAYPEN_FAMILY}', 'Segoe Script', 'Brush Script MT', cursive`

let pending: Promise<void> | null = null

/**
 * Playpen Sans 单个字重就有约 80KB，全站只需要首页问候语和页脚签名两处，
 * 所以不进首屏字体表，等这两处进入视口后再手动注册。
 */
export function loadPlaypen(): Promise<void> {
  if (typeof FontFace === 'undefined') return Promise.resolve()
  if (!pending) {
    const face = new FontFace(PLAYPEN_FAMILY, `url(${SRC}) format("woff2")`, {
      weight: '800',
      style: 'normal',
    })
    pending = face
      .load()
      .then((loaded) => {
        document.fonts.add(loaded)
      })
      .catch(() => undefined)
  }
  return pending
}

/** 元素进入（或即将进入）视口时下载一次，之后不再观察。返回清理函数。 */
export function loadPlaypenWhenVisible(element: Element): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => undefined
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      void loadPlaypen()
    },
    { rootMargin: '200px 0px' }
  )
  observer.observe(element)
  return () => observer.disconnect()
}
