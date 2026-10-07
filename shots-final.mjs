import { chromium, devices } from '@playwright/test';
const browser = await chromium.launch();
const BASE = 'http://localhost:3435';
const OUT = 'C:/works/_test-assets/final';

const pages = [
  ['home', '/'],
  ['blog', '/blog'],
  ['post', '/blog/how-i-built-arcade-hub'],
  ['projects', '/projects'],
  ['about', '/about'],
];

// Desktop light
const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
for (const [name, url] of pages) {
  await d.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 });
  await d.waitForTimeout(700);
  await d.screenshot({ path: `${OUT}/desktop-${name}.png` });
}

// Desktop dark
const dctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'dark' });
const dd = await dctx.newPage();
await dd.addInitScript(() => localStorage.setItem('theme', 'dark'));
for (const [name, url] of [['home', '/'], ['post', '/blog/how-i-built-arcade-hub']]) {
  await dd.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 });
  await dd.waitForTimeout(700);
  await dd.screenshot({ path: `${OUT}/desktop-dark-${name}.png` });
}

// Post scrolled (light) — code block + TOC visible
await d.goto(BASE + '/blog/how-i-built-arcade-hub', { waitUntil: 'networkidle' });
await d.evaluate(() => window.scrollBy(0, 1800));
await d.waitForTimeout(400);
await d.screenshot({ path: `${OUT}/desktop-post-scrolled.png` });
// progress bar check (near bottom)
await d.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await d.waitForTimeout(400);
await d.screenshot({ path: `${OUT}/desktop-post-bottom.png` });

// Mobile
const mctx = await browser.newContext({ ...devices['iPhone 13'] });
const m = await mctx.newPage();
for (const [name, url] of pages) {
  await m.goto(BASE + url, { waitUntil: 'networkidle', timeout: 30000 });
  await m.waitForTimeout(700);
  await m.screenshot({ path: `${OUT}/mobile-${name}.png` });
}
// mobile menu open
await m.goto(BASE + '/', { waitUntil: 'networkidle' });
await m.tap('button[aria-label="Toggle Menu"]');
await m.waitForTimeout(600);
await m.screenshot({ path: `${OUT}/mobile-menu.png` });
await m.tap('button[aria-label="Toggle Menu"]');
// mobile kbar open
await m.goto(BASE + '/blog', { waitUntil: 'networkidle' });
await m.tap('button[aria-label="Search"]');
await m.waitForTimeout(600);
await m.keyboard.type('街机');
await m.waitForTimeout(1200);
await m.screenshot({ path: `${OUT}/mobile-kbar.png` });

// Tablet width (nav crowding check)
const t = await browser.newPage({ viewport: { width: 800, height: 900 } });
await t.goto(BASE + '/', { waitUntil: 'networkidle' });
await t.waitForTimeout(500);
await t.screenshot({ path: `${OUT}/tablet-home.png` });

await browser.close();
console.log('done');
