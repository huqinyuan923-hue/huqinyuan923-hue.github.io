import Script from 'next/script.js'

interface UmamiAnalyticsProps {
  websiteId?: string
  src?: string
}

// 静态导出没有 rewrites，直接请求 Umami，避免依赖不存在的 /stats 反代
export function UmamiAnalytics({
  websiteId,
  src = 'https://analytics.umami.is/script.js',
}: UmamiAnalyticsProps) {
  if (websiteId) {
    // Delay loading analytics to reduce TBT impact on initial render.
    return <Script strategy="lazyOnload" async defer data-website-id={websiteId} src={src} />
  }
  return null
}
