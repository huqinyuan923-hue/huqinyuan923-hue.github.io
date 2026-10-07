import 'css/tailwind.css'
import 'css/twemoji.css'
import 'react-medium-image-zoom/dist/styles.css'
import 'remark-github-blockquote-alert/alert.css'
import 'katex/dist/katex.css'

import clsx from 'clsx'
import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import { UmamiAnalytics } from '~/components/analytics/umami'
import { Footer } from '~/components/footer'
import { Header } from '~/components/header'
import { KBarSearchProvider } from '~/components/search/kbar-provider'
import { ReflectiveBlackBackground } from '~/components/effects/reflective-black-background'
import { SITE_METADATA } from '~/data/site-metadata'
import { ThemeProviders } from './theme-providers'

// 字体改用本地文件（fontsource 包随依赖安装），
// 构建时不再请求 Google Fonts——CI 网络抖动不再导致构建失败
const FONT_PLAYPEN_SANS = localFont({
  src: [
    {
      path: '../node_modules/@fontsource/playpen-sans/files/playpen-sans-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource/playpen-sans/files/playpen-sans-latin-800-normal.woff2',
      weight: '800',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-playpen-sans',
})

const FONT_NUNITO = localFont({
  src: [
    {
      path: '../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-normal.woff2',
      weight: '300 800',
      style: 'normal',
    },
    {
      path: '../node_modules/@fontsource-variable/nunito/files/nunito-latin-wght-italic.woff2',
      weight: '300 800',
      style: 'italic',
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
  variable: '--font-jetbrains-mono',
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
        FONT_PLAYPEN_SANS.variable
      )}
      suppressHydrationWarning
    >
      <link rel="apple-touch-icon" sizes="76x76" href={`${basePath}/static/favicons/favicon.ico`} />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href={`${basePath}/static/favicons/favicon.png`}
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href={`${basePath}/static/favicons/favicon.png`}
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
        <ThemeProviders>
          <UmamiAnalytics websiteId={SITE_METADATA.analytics.umamiAnalytics.websiteId} />
          <KBarSearchProvider configs={SITE_METADATA.search.kbarConfigs}>
            <Header />
            <main className="mb-auto grow">{children}</main>
          </KBarSearchProvider>
          <Footer />
        </ThemeProviders>
      </body>
    </html>
  )
}
