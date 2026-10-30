import 'css/tailwind.css'
import 'css/twemoji.css'

import clsx from 'clsx'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { AskAILazy } from '~/components/ai/ask-ai-lazy'
import { UmamiAnalytics } from '~/components/analytics/umami'
import { Footer } from '~/components/footer'
import { Header } from '~/components/header'
import { SiteSearch } from '~/components/search/site-search'
import { ReflectiveBlackBackground } from '~/components/effects/reflective-black-background'
import { EntranceOverlay } from '~/components/effects/entrance-overlay'
import { ScrollProgress } from '~/components/effects/scroll-progress'
import { ScrollReveal } from '~/components/effects/scroll-reveal'
import { SITE_METADATA } from '~/data/site-metadata'
import { ThemeProviders } from './theme-providers'

// 字体改用本地文件（fontsource 包随依赖安装），
// 构建时不再请求 Google Fonts——CI 网络抖动不再导致构建失败
// 页脚签名的 Playpen Sans 由 components/footer/signature.tsx 滚动到视口后再下载

const FONT_NUNITO = localFont({
  src: [
    {
      path: '../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2',
      weight: '300 800',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-nunito',
})

const FONT_JETBRAINS_MONO = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  display: 'swap',
  preload: false,
  variable: '--font-jetbrains-mono',
})

// 标题/数字的科技感字体：Space Grotesk
const FONT_GROTESK = localFont({
  src: [
    {
      path: '../node_modules/@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2',
      weight: '300 700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-grotesk',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_METADATA.siteUrl),
  title: {
    default: SITE_METADATA.title,
    template: `%s | ${SITE_METADATA.title}`,
  },
  description: SITE_METADATA.description,
  keywords: ['blog', 'programming', 'frontend', 'javascript', 'react', 'nextjs', 'web development'],
  authors: [{ name: SITE_METADATA.author }],
  creator: SITE_METADATA.author,
  openGraph: {
    title: SITE_METADATA.title,
    description: SITE_METADATA.description,
    url: SITE_METADATA.siteUrl,
    siteName: SITE_METADATA.title,
    images: [SITE_METADATA.socialBanner],
    locale: 'en_US',
    type: 'website',
  },
  alternates: {
    canonical: SITE_METADATA.siteUrl,
    types: {
      'application/rss+xml': `${SITE_METADATA.siteUrl}/feed.xml`,
    },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  twitter: {
    title: SITE_METADATA.title,
    card: 'summary_large_image',
    images: [SITE_METADATA.socialBanner],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const basePath = process.env.BASE_PATH || ''

  return (
    <html
      lang={SITE_METADATA.language}
      className={clsx(
        'scroll-smooth',
        FONT_NUNITO.variable,
        FONT_JETBRAINS_MONO.variable,
        FONT_GROTESK.variable
      )}
      suppressHydrationWarning
    >
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href={`${basePath}/static/favicons/favicon-180x180.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`${basePath}/static/favicons/favicon-32x32.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`${basePath}/static/favicons/favicon-16x16.png`}
      />
      <link rel="manifest" href={`${basePath}/static/favicons/site.webmanifest`} />
      <link
        rel="mask-icon"
        href={`${basePath}/static/favicons/safari-pinned-tab.svg`}
        color="#5bbad5"
      />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#fff" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000" />
      <link rel="alternate" type="application/rss+xml" href={`${basePath}/feed.xml`} />
      {/* 进站动画会话标记：水合前执行——
          看过 → data-boot=done（跳过）；首访 → playing（遮罩立即上屏），
          等遮罩首帧真正可见后再切 go 起播，慢网络下动画不会被截断；
          水合迟迟不来时：go 后 6s（未起播则 10s）淡出兜底，绝不长期挡住内容。 */}
      <script
        dangerouslySetInnerHTML={{
          __html: `try{var d=document.documentElement,s=sessionStorage;d.classList.add('js-anim');if(s.getItem('hud-boot-seen')){d.dataset.boot='done'}else{s.setItem('hud-boot-seen','1');d.dataset.boot='playing';var cap=function(){if(d.dataset.boot==='playing'||d.dataset.boot==='go'){d.classList.add('boot-exiting');setTimeout(function(){if(d.dataset.boot!=='done')d.dataset.boot='done'},800)}};var capTimer=setTimeout(cap,10000);var start=function(){if(d.dataset.boot==='playing'){d.dataset.boot='go';window.__bootT0=performance.now();clearTimeout(capTimer);capTimer=setTimeout(cap,6000)}};var go=function(){if(d.dataset.boot!=='playing')return;if(!document.querySelector('.entrance-overlay')){if(go.n++!==100){setTimeout(go,30);return}}var r=window.requestAnimationFrame;if(r){r(function(){r(start)})}else{setTimeout(start,32)}};go.n=0;go()}}catch(e){}`,
        }}
      />
      <body
        className={clsx([
          'antialiased',
          'relative min-h-screen pl-[calc(100vw-100%)]',
          'flex flex-col',
          'bg-white text-gray-900',
          'dark:bg-dark dark:text-gray-100',
        ])}
      >
        <ReflectiveBlackBackground />
        <EntranceOverlay />
        <ScrollProgress />
        <ScrollReveal />
        <ThemeProviders>
          <UmamiAnalytics websiteId={SITE_METADATA.analytics.umamiAnalytics.websiteId} />
          <Header />
          <main className="mb-auto grow">{children}</main>
          <AskAILazy />
          <SiteSearch configs={SITE_METADATA.search.kbarConfigs} />
          <Footer />
        </ThemeProviders>
      </body>
    </html>
  )
}
