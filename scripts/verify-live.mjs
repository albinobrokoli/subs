import { chromium } from 'playwright';
import path from 'path';

const exe = '/Applications/Subs.app/Contents/MacOS/Subs';
const out = '/Users/baran/Desktop/hermes/sublist-redesign/screenshots';
const shot = path.join(out, 'live-pc-dashboard.png');

const browser = await chromium.launch({
  executablePath: exe,
  args: ['--no-sandbox', '--disable-gpu'],
});
const ctx = await browser.newContext();
const page = await ctx.newPage();
const logs = [];
page.on('pageerror', (e) => logs.push(`[PAGEERROR] ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') logs.push(`[CONSOLE] ${m.text()}`); });

await page.waitForTimeout(4000);
await page.screenshot({ path: shot, fullPage: true });

// aksiyonları dene
const headerToggle = await page.locator('header button[aria-label="Kenar çubuğunu aç/kapat"]').count();
const sidebarToggle = await page.locator('aside button[aria-label="Kenar çubuğunu gizle"]').count();
const statIcons = await page.locator('.stat-icon').count();

console.log('header toggle (eski, 0 beklenir):', headerToggle);
console.log('sidebar toggle (yeni, 1 beklenir):', sidebarToggle);
console.log('stat-icon (3 beklenir):', statIcons);
console.log('errors:', logs.length ? logs.join('\n') : '(none)');
await browser.close();
console.log('SHOT:', shot);
