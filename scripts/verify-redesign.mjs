import { _electron as electron } from 'playwright';
import path from 'path';
import fs from 'fs';

const root = '/Users/baran/Desktop/hermes/sublist-clone';
const out = '/Users/baran/Desktop/hermes/sublist-redesign/screenshots';
const userData = path.join(root, '.diag-user-data');
fs.rmSync(userData, { recursive: true, force: true });
fs.mkdirSync(userData, { recursive: true });

function electronPath() {
  const p = path.join(root, 'node_modules', 'electron', 'path.txt');
  if (fs.existsSync(p)) {
    const rel = fs.readFileSync(p, 'utf8').trim();
    return path.join(root, 'node_modules', 'electron', 'dist', rel);
  }
  return path.join(root, 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron');
}

const app = await electron.launch({
  executablePath: electronPath(),
  args: [root, `--user-data-dir=${userData}`],
  env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' },
});
const page = await app.firstWindow({ timeout: 30000 });
const logs = [];
page.on('pageerror', (err) => logs.push(`[PAGEERROR] ${err.message}`));
page.on('console', (msg) => { if (msg.type() === 'error') logs.push(`[CONSOLE] ${msg.text()}`); });

await page.waitForTimeout(6000);
await page.screenshot({ path: path.join(out, 'verify-dashboard.png'), fullPage: true });
console.log('shot: verify-dashboard');

// header'da sidebar toggle VAR MI? (eski konum) -> aria-label "Kenar çubuğunu aç/kapat" header'da olmamalı
const headerToggle = await page.locator('header button[aria-label="Kenar çubuğunu aç/kapat"]').count();
// sidebar içinde toggle VAR MI? (yeni konum)
const sidebarToggle = await page.locator('aside button[aria-label="Kenar çubuğunu gizle"]').count();

console.log('header toggle count (eski, beklenen 0):', headerToggle);
console.log('sidebar toggle count (yeni, beklenen 1):', sidebarToggle);

// stat kartlar ikon içeriyor mu?
const statIcons = await page.locator('.stat-icon').count();
console.log('stat-icon count (beklenen 3):', statIcons);

// sidebar collapse testi
if (sidebarToggle > 0) {
  await page.locator('aside button[aria-label="Kenar çubuğunu gizle"]').click();
  await page.waitForTimeout(600);
  const reveal = await page.locator('button[aria-label="Kenar çubuğunu aç"]').count();
  console.log('reveal button when collapsed (beklenen 1):', reveal);
  await page.screenshot({ path: path.join(out, 'verify-collapsed.png'), fullPage: true });
}

console.log('=== ERRORS ===');
console.log(logs.length ? logs.join('\n') : '(none)');
console.log('=== END ===');
await app.close();
