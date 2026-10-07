import { chromium, devices } from '@playwright/test';
const browser = await chromium.launch();
const BASE = 'http://localhost:3435';
const OUT = 'C:/works/_test-assets/final';

const mctx = await browser.newContext({ ...devices['iPhone 13'] });
const m = await mctx.newPage();
// mobile kbar open + 中文搜索
await m.goto(BASE + '/blog', { waitUntil: 'networkidle' });
await m.tap('button[aria-label="Search"]');
await m.waitForTimeout(600);
await m.keyboard.type('街机');
await m.waitForTimeout(1500);
await m.screenshot({ path: `${OUT}/mobile-kbar.png` });
await m.keyboard.press('Escape');

// mobile post page
await m.goto(BASE + '/blog/how-i-built-arcade-hub', { waitUntil: 'networkidle' });
await m.waitForTimeout(600);
await m.screenshot({ path: `${OUT}/mobile-post.png` });

// tablet
const t = await browser.newPage({ viewport: { width: 800, height: 900 } });
await t.goto(BASE + '/', { waitUntil: 'networkidle' });
await t.waitForTimeout(500);
await t.screenshot({ path: `${OUT}/tablet-home.png` });

await browser.close();
console.log('done');
