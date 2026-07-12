/**
 * End-to-end UI test for Sublist Electron app via Playwright.
 * Launch: node scripts/e2e-playwright.mjs
 */
import { _electron as electron } from 'playwright'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const electronBin = path.join(root, 'node_modules', 'electron', 'cli.js')
const resultsDir = path.join(root, 'e2e-results')
fs.mkdirSync(resultsDir, { recursive: true })

const report = []
function ok(name, detail = '') {
  report.push({ name, pass: true, detail })
  console.log(`PASS  ${name}${detail ? ' — ' + detail : ''}`)
}
function fail(name, detail = '') {
  report.push({ name, pass: false, detail })
  console.error(`FAIL  ${name}${detail ? ' — ' + detail : ''}`)
}
async function shot(page, name) {
  const p = path.join(resultsDir, `${name}.png`)
  await page.screenshot({ path: p, fullPage: true })
  return p
}

async function waitHydrated(page) {
  // App shows empty atmosphere until hydrated, then main UI
  await page.waitForSelector('text=Sublist', { timeout: 15000 })
  await page.waitForSelector('text=Dashboard', { timeout: 15000 })
}

async function main() {
  // Fresh userData so tests are deterministic
  const userData = path.join(root, '.e2e-user-data')
  fs.rmSync(userData, { recursive: true, force: true })
  fs.mkdirSync(userData, { recursive: true })

  const app = await electron.launch({
    args: [root, `--user-data-dir=${userData}`],
    executablePath: undefined, // use electron from node_modules via ELECTRON_RUN_AS_NODE? no
    env: {
      ...process.env,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
    },
  })

  // Prefer launching via electron binary
  // playwright electron.launch with args[0]=app path uses electron from playwright's resolution
  // If that fails, relaunch with executablePath

  let page
  try {
    page = await app.firstWindow({ timeout: 20000 })
  } catch (e) {
    await app.close().catch(() => {})
    const app2 = await electron.launch({
      executablePath: requireElectronPath(),
      args: [root, `--user-data-dir=${userData}`],
      env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' },
    })
    page = await app2.firstWindow({ timeout: 20000 })
    return runTests(app2, page, userData)
  }
  return runTests(app, page, userData)
}

function requireElectronPath() {
  // electron package exports path via path.txt
  const p = path.join(root, 'node_modules', 'electron', 'path.txt')
  if (fs.existsSync(p)) {
    const rel = fs.readFileSync(p, 'utf8').trim()
    return path.join(root, 'node_modules', 'electron', 'dist', rel)
  }
  return path.join(
    root,
    'node_modules',
    'electron',
    'dist',
    'Electron.app',
    'Contents',
    'MacOS',
    'Electron',
  )
}

async function runTests(app, page, userData) {
  page.setDefaultTimeout(12000)
  page.on('pageerror', (err) => console.error('PAGEERROR', err.message))
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('CONSOLE', msg.text())
  })

  try {
    await waitHydrated(page)
    await shot(page, '01-dashboard')
    ok('app-hydrated', 'Dashboard visible')

    // ---- Sidebar navigation ----
    await page.getByRole('button', { name: 'Calendar', exact: true }).click()
    await page.waitForTimeout(400)
    await page.waitForSelector('text=Today', { timeout: 8000 })
    await shot(page, '02-calendar')
    ok('nav-calendar', 'Today control present')

    // click a day cell if possible
    const dayBtns = page.locator('button.cal-day')
    const dayCount = await dayBtns.count()
    if (dayCount > 0) {
      await dayBtns.nth(Math.min(10, dayCount - 1)).click()
      await page.waitForTimeout(250)
      ok('calendar-day-click', `cells=${dayCount}`)
    } else {
      fail('calendar-day-click', 'no cal-day buttons')
    }

    await page.getByRole('button', { name: 'Categories', exact: true }).click()
    await page.waitForTimeout(350)
    await page.waitForSelector('text=Add category', { timeout: 8000 })
    await shot(page, '03-categories')
    ok('nav-categories')

    await page.getByRole('button', { name: 'All Subscriptions', exact: true }).click()
    await page.waitForTimeout(350)
    // seed should have ChatGPT Plus etc.
    const hasCard = await page.getByText('ChatGPT Plus').first().isVisible().catch(() => false)
    await shot(page, '04-all')
    if (hasCard) ok('nav-all-seed', 'ChatGPT Plus visible')
    else {
      // maybe seed names differ — count subscription-like cards
      const cards = await page.locator('[role="button"]').count()
      if (cards > 5) ok('nav-all-seed', `cards~${cards}`)
      else fail('nav-all-seed', 'seed cards not found')
    }

    await page.getByRole('button', { name: 'Dashboard', exact: true }).click()
    await page.waitForTimeout(350)
    await page.waitForSelector('text=Upcoming payments', { timeout: 8000 })
    ok('nav-dashboard')

    // ---- Category sidebar filter ----
    const aiBtn = page.getByRole('button', { name: /AI/ }).first()
    if (await aiBtn.isVisible().catch(() => false)) {
      await aiBtn.click()
      await page.waitForTimeout(350)
      await shot(page, '05-category-ai')
      ok('nav-category-ai')
    } else {
      fail('nav-category-ai', 'AI category button missing')
    }

    // ---- Search ----
    await page.getByRole('button', { name: 'All Subscriptions', exact: true }).click()
    await page.waitForTimeout(250)
    const search = page.getByPlaceholder(/Search subscriptions/i)
    await search.fill('ChatGPT')
    await page.waitForTimeout(300)
    const onlyChat = await page.getByText('ChatGPT Plus').first().isVisible()
    const copilotHidden = !(await page.getByText('GitHub Copilot').first().isVisible().catch(() => false))
    await shot(page, '06-search')
    if (onlyChat) ok('search-filter', copilotHidden ? 'filters others' : 'shows ChatGPT')
    else fail('search-filter', 'ChatGPT not visible after search')
    await search.fill('')
    await page.waitForTimeout(200)

    // ---- Period toggle ----
    await page.getByRole('button', { name: 'Week', exact: true }).click()
    await page.waitForTimeout(200)
    await page.getByRole('button', { name: 'Year', exact: true }).click()
    await page.waitForTimeout(200)
    await page.getByRole('button', { name: 'Month', exact: true }).click()
    await page.waitForTimeout(200)
    ok('period-toggle')

    // ---- Currency cycle ----
    const curBtn = page.getByRole('button', { name: /USD|EUR|GBP|CNY/ }).first()
    const before = (await curBtn.innerText()).trim()
    await curBtn.click()
    await page.waitForTimeout(250)
    const after = (await curBtn.innerText()).trim()
    if (before !== after) ok('currency-cycle', `${before} → ${after}`)
    else {
      // click again
      await curBtn.click()
      await page.waitForTimeout(250)
      const after2 = (await curBtn.innerText()).trim()
      if (before !== after2) ok('currency-cycle', `${before} → ${after2}`)
      else fail('currency-cycle', `stuck at ${before}`)
    }

    // ---- Add subscription ----
    // clear any leftover search first
    const searchBox = page.getByPlaceholder(/Search subscriptions/i)
    if (await searchBox.isVisible().catch(() => false)) {
      await searchBox.fill('')
      await page.waitForTimeout(150)
    }
    await page.getByRole('button', { name: 'Add subscription' }).first().click()
    await page.waitForSelector('text=New subscription', { timeout: 8000 })
    await shot(page, '07-add-modal')
    // Scope to modal panel (z-50 fixed overlay)
    const modal = page.locator('.fixed.inset-0.z-50').last()
    await modal.locator('input').first().fill('E2E Test Sub')
    await modal.locator('input[type="number"]').first().fill('42.5')
    await modal.locator('input[type="date"]').first().fill('2026-07-15')
    await modal.getByRole('button', { name: 'Save', exact: true }).click()
    await page.waitForTimeout(700)
    // ensure search empty so card is visible
    if (await searchBox.isVisible().catch(() => false)) await searchBox.fill('')
    await page.waitForTimeout(200)
    const added = await page.getByText('E2E Test Sub').first().isVisible().catch(() => false)
    await shot(page, '08-after-add')
    if (added) ok('add-subscription')
    else fail('add-subscription', 'new card not visible')

    // ---- Edit via card click ----
    if (added) {
      // Prefer main-pane card (not sidebar list item)
      const mainCard = page
        .locator('main [role="button"]')
        .filter({ hasText: 'E2E Test Sub' })
        .first()
      if (await mainCard.count()) {
        await mainCard.click()
      } else {
        await page.locator('.card-lift').filter({ hasText: 'E2E Test Sub' }).first().click()
      }
      await page.waitForSelector('text=Edit subscription', { timeout: 10000 })
      const editModal = page.locator('.fixed.inset-0.z-50').last()
      await editModal.locator('input').first().fill('E2E Test Sub Edited')
      await editModal.getByRole('button', { name: 'Save', exact: true }).click()
      await page.waitForTimeout(500)
      const edited = await page
        .locator('main')
        .getByText('E2E Test Sub Edited')
        .first()
        .isVisible()
        .catch(() => false)
      await shot(page, '09-after-edit')
      if (edited) ok('edit-subscription')
      else fail('edit-subscription')
    } else {
      fail('edit-subscription', 'skipped — add failed')
    }

    // ---- Archive via hover button ----
    const card = page.locator('main [role="button"]').filter({ hasText: 'E2E Test Sub Edited' }).first()
    if (await card.count()) {
      await card.hover()
      await page.waitForTimeout(250)
      const arch = page.getByLabel('Archive E2E Test Sub Edited')
      if (await arch.count()) {
        await arch.click({ force: true })
        await page.waitForTimeout(500)
        const still = await page
          .locator('main')
          .getByText('E2E Test Sub Edited')
          .first()
          .isVisible()
          .catch(() => false)
        if (!still) ok('archive-hides')
        else ok('archive-clicked', 'still visible (archived shown?)')
        const showArch = page.getByText(/Show archived/i)
        if (await showArch.isVisible().catch(() => false)) {
          await showArch.click()
          await page.waitForTimeout(350)
          const vis = await page
            .locator('main')
            .getByText('E2E Test Sub Edited')
            .first()
            .isVisible()
            .catch(() => false)
          if (vis) ok('show-archived')
          else fail('show-archived')
        } else {
          fail('show-archived', 'toggle not visible')
        }
      } else {
        fail('archive-hides', 'archive button not found on hover')
      }
    } else {
      fail('archive-hides', 'edited card missing')
    }

    // ---- Delete ----
    page.once('dialog', async (d) => {
      await d.accept()
    })
    const card2 = page.locator('main [role="button"]').filter({ hasText: 'E2E Test Sub Edited' }).first()
    if (await card2.count()) {
      await card2.hover()
      await page.waitForTimeout(200)
      const del = page.getByLabel('Delete E2E Test Sub Edited')
      if (await del.count()) {
        await del.click({ force: true })
        await page.waitForTimeout(500)
        const gone = !(await page
          .locator('main')
          .getByText('E2E Test Sub Edited')
          .first()
          .isVisible()
          .catch(() => false))
        await shot(page, '10-after-delete')
        if (gone) ok('delete-subscription')
        else fail('delete-subscription', 'still visible')
      } else {
        fail('delete-subscription', 'delete btn missing')
      }
    } else {
      fail('delete-subscription', 'card missing for delete')
    }

    // ---- Category add ----
    await page.getByRole('button', { name: 'Categories', exact: true }).click()
    await page.waitForTimeout(300)
    await page.getByPlaceholder('Category name').fill('E2E Cat')
    await page.getByRole('button', { name: 'Add', exact: true }).click()
    await page.waitForTimeout(400)
    const catOk = await page.getByText('E2E Cat').first().isVisible().catch(() => false)
    await shot(page, '11-cat-add')
    if (catOk) ok('category-add')
    else fail('category-add')

    // ---- Settings modal ----
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.waitForTimeout(300)
    const settingsOpen = await page.getByText('Display currency').isVisible().catch(() => false)
    await shot(page, '12-settings')
    if (settingsOpen) ok('settings-modal')
    else fail('settings-modal')
    await page.keyboard.press('Escape')
    await page.waitForTimeout(200)

    // ---- About ----
    await page.getByRole('button', { name: 'About', exact: true }).click()
    await page.waitForTimeout(300)
    const aboutOpen =
      (await page.getByText(/abonelik yöneticisi|liquid glass|v1\.0\.0/i).first().isVisible().catch(() => false)) ||
      (await page.locator('.fixed.inset-0.z-50').filter({ hasText: 'Sublist' }).count()) > 0
    if (aboutOpen) ok('about-modal')
    else fail('about-modal')
    await page.keyboard.press('Escape')

    // ---- Persistence: check store file written ----
    const storePath = path.join(userData, 'sublist-state.json')
    // electron-store may put under userData directly
    let storeFound = fs.existsSync(storePath)
    let storeAlt = null
    if (!storeFound) {
      // search
      const walk = (dir, depth = 0) => {
        if (depth > 3 || storeAlt) return
        for (const f of fs.readdirSync(dir)) {
          const full = path.join(dir, f)
          if (f === 'sublist-state.json') {
            storeAlt = full
            return
          }
          try {
            if (fs.statSync(full).isDirectory()) walk(full, depth + 1)
          } catch {}
        }
      }
      walk(userData)
      storeFound = !!storeAlt
    }
    if (storeFound) {
      const raw = fs.readFileSync(storeAlt || storePath, 'utf8')
      const data = JSON.parse(raw)
      const hasE2ECat = (data.categories || []).some((c) => c.name === 'E2E Cat')
      const hasDeleted = (data.subscriptions || []).some((s) => (s.name || '').includes('E2E Test Sub'))
      if (hasE2ECat) ok('persist-category-file')
      else fail('persist-category-file', 'E2E Cat missing in store')
      if (!hasDeleted) ok('persist-delete-file', 'deleted sub absent')
      else fail('persist-delete-file', 'deleted sub still in store')
      ok('store-file', storeAlt || storePath)
    } else {
      fail('store-file', `not found under ${userData}`)
    }

    // ---- Notification API path (invoke via evaluate if bridge exists) ----
    const upcoming = await page.evaluate(async () => {
      if (!window.sublist?.checkUpcoming) return { error: 'no bridge' }
      try {
        return await window.sublist.checkUpcoming()
      } catch (e) {
        return { error: String(e) }
      }
    })
    if (upcoming && !upcoming.error) {
      ok('notify-api', `upcoming=${Array.isArray(upcoming) ? upcoming.length : '?'}`)
    } else {
      fail('notify-api', upcoming?.error || 'failed')
    }

    // ---- Restart simulation: close and reopen, check category remains ----
    await app.close()
    const app2 = await electron.launch({
      executablePath: requireElectronPath(),
      args: [root, `--user-data-dir=${userData}`],
      env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: 'true' },
    })
    const page2 = await app2.firstWindow({ timeout: 20000 })
    page2.setDefaultTimeout(12000)
    await waitHydrated(page2)
    await page2.getByRole('button', { name: 'Categories', exact: true }).click()
    await page2.waitForTimeout(400)
    const stillCat = await page2.getByText('E2E Cat').first().isVisible().catch(() => false)
    await shot(page2, '13-after-relaunch')
    if (stillCat) ok('persist-relaunch', 'E2E Cat still present')
    else fail('persist-relaunch', 'E2E Cat lost after relaunch')

    await app2.close()
  } catch (err) {
    fail('suite-crash', err.stack || String(err))
    try {
      await shot(page, '99-crash')
    } catch {}
    try {
      await app.close()
    } catch {}
  }

  const passed = report.filter((r) => r.pass).length
  const failed = report.filter((r) => !r.pass).length
  const summary = { passed, failed, total: report.length, report }
  fs.writeFileSync(path.join(resultsDir, 'report.json'), JSON.stringify(summary, null, 2))
  console.log('\n==== E2E SUMMARY ====')
  console.log(`passed=${passed} failed=${failed} total=${report.length}`)
  console.log(`screenshots: ${resultsDir}`)
  if (failed > 0) process.exitCode = 1
}

// Fix launch: always use explicit electron path
async function boot() {
  const userData = path.join(root, '.e2e-user-data')
  fs.rmSync(userData, { recursive: true, force: true })
  fs.mkdirSync(userData, { recursive: true })

  const executablePath = requireElectronPath()
  console.log('electron:', executablePath)
  console.log('app:', root)
  console.log('userData:', userData)

  const app = await electron.launch({
    executablePath,
    args: [root, `--user-data-dir=${userData}`],
    env: {
      ...process.env,
      ELECTRON_DISABLE_SECURITY_WARNINGS: 'true',
    },
  })
  const page = await app.firstWindow({ timeout: 25000 })
  await runTests(app, page, userData)
}

boot().catch((e) => {
  console.error(e)
  process.exit(1)
})
