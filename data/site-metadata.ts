export const SITE_METADATA = {
  title: `ADCakeyuan's blog`,
  author: 'ADCakeyuan',
  headerTitle: `ADCakeyuan's blog`,
  description:
    "I'm ADCakeyuan, a first-year university student from Guangxi. This is my personal blog for documenting my learning, life, and thoughts.",
  language: 'en-US',
  theme: 'system', // system, dark or light
  siteUrl: 'https://huqinyuan923-hue.github.io',
  siteRepo: 'https://github.com/huqinyuan923-hue/huqinyuan923-hue.github.io',
  siteLogo: `${process.env.BASE_PATH || ''}/static/favicons/favicon-800x800.png`,
  socialBanner: `${process.env.BASE_PATH || ''}/static/favicons/favicon-800x800.png`,

  locale: 'en-US',
  stickyNav: true,
  analytics: {
    umamiAnalytics: {
      websiteId: process.env.NEXT_UMAMI_ID,
      shareUrl: '',
    },
  },
  comments: {
    giscusConfig: {
      // https://giscus.app/
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO!,
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID!,
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY!,
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID!,
      mapping: 'title', // supported options: pathname, url, title
      reactions: '1', // Emoji reactions: 1 = enable / 0 = disable
      metadata: '0',
      theme: 'light',
      darkTheme: 'transparent_dark',
      themeURL: '',
      lang: 'zh-CN',
    },
  },
  search: {
    kbarConfigs: {
      // path to load documents to search
      searchDocumentsPath: `${process.env.BASE_PATH || ''}/search.json`,
    },
  },
}
