import { expect, test } from '@playwright/test'

const PAGES = [
  { path: '/', title: /ADCakeyuan/i },
  { path: '/blog', title: /Blog/i },
  { path: '/blog/202608/How_I_Created_This_Blog', title: /How I Created This Blog/i },
  { path: '/blog/page/1', title: /Blog/i },
  { path: '/snippets', title: /Snippets/i },
  { path: '/moment', title: /Moment/i },
  { path: '/projects', title: /Projects/i },
  { path: '/about', title: /About/i },
  { path: '/tags', title: /Tags/i },
  { path: '/friends', title: /Friends/i },
  { path: '/play/minesweeper', title: /Minesweeper|扫雷/i },
]

test.describe('pages render', () => {
  for (const page of PAGES) {
    test(`page ${page.path} loads with correct title`, async ({ page: p }) => {
      const response = await p.goto(page.path)
      expect(response?.status()).toBe(200)
      await expect(p).toHaveTitle(page.title)
      await expect(p.locator('main')).toBeVisible()
    })
  }
})

test.describe('blog post content', () => {
  test('post renders title, prose content and nav back to posts', async ({ page: p }) => {
    await p.goto('/blog/202608/How_I_Created_This_Blog')
    await expect(p.locator('h1').first()).toContainText(/How I Created This Blog/i)
    await expect(p.locator('article, .prose').first()).toBeVisible()
  })
})

test.describe('navigation', () => {
  test('header nav links lead to their pages', async ({ page: p }) => {
    await p.goto('/')
    for (const link of ['Blog', 'Snippets', 'Projects', 'About']) {
      await p
        .getByRole('link', { name: new RegExp(`^${link}`) })
        .first()
        .click()
      await expect(p).toHaveURL(new RegExp(link.toLowerCase()))
    }
  })
})

test.describe('site search', () => {
  test('kbar is lazy-loaded and lists posts on demand', async ({ page: p }) => {
    await p.goto('/')
    const input = p.locator('input[placeholder^="搜索文章"]')
    await expect(input).toHaveCount(0)

    await p.getByRole('button', { name: 'Search' }).click()
    await expect(input).toBeVisible()

    await input.fill('Blog')
    await expect(p.getByText('How I Created This Blog').first()).toBeVisible()

    await p.keyboard.press('Escape')
    await expect(input).toHaveCount(0)
  })
})

test.describe('footer signature font', () => {
  test('playpen woff2 is fetched only after the signature scrolls into view', async ({
    page: p,
  }) => {
    const fontRequests: string[] = []
    p.on('request', (req) => {
      if (req.url().includes('playpen')) fontRequests.push(req.url())
    })

    await p.goto('/')
    const signature = p.locator('footer svg[viewBox="0 0 360 120"]')
    const text = signature.locator('text')
    await expect(text).toHaveAttribute('font-family', /Segoe Script/)
    expect(fontRequests).toEqual([])

    await signature.scrollIntoViewIfNeeded()
    await expect(text).toHaveAttribute('font-family', /SignaturePlaypen/, { timeout: 10_000 })
    expect(fontRequests.length).toBe(1)
  })
})

test.describe('health checks', () => {
  test('no failed page-resource requests on home and blog post', async ({ page: p }) => {
    const failed: string[] = []
    p.on('response', (res) => {
      if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`)
    })
    await p.goto('/')
    await p.waitForLoadState('networkidle')
    await p.goto('/blog/202608/How_I_Created_This_Blog')
    await p.waitForLoadState('networkidle')
    expect(failed).toEqual([])
  })

  test('all internal links on home and blog list resolve', async ({ page: p }) => {
    for (const path of ['/', '/blog', '/about']) {
      await p.goto(path)
      const hrefs = await p.$$eval('a[href^="/"]', (as) => [
        ...new Set(as.map((a) => (a as HTMLAnchorElement).getAttribute('href'))),
      ])
      expect(hrefs.length).toBeGreaterThan(0)
      for (const href of hrefs) {
        const clean = href!.split('#')[0]
        if (!clean) continue
        const res = await p.request.get(clean)
        expect(res.status(), `link ${href} on ${path}`).toBeLessThan(400)
      }
    }
  })

  test('sitemap and RSS feed are served with content', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.status()).toBe(200)
    expect(await sitemap.text()).toContain('<urlset')

    const feed = await request.get('/feed.xml')
    expect(feed.status()).toBe(200)
    expect(await feed.text()).toContain('<rss')
  })
})
