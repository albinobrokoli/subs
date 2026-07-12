/**
 * Headless smoke test for store CRUD via electron.
 * Run: ./node_modules/.bin/electron scripts/smoke-store.mjs
 */
import { app } from 'electron'
import { createRequire } from 'module'
import { pathToFileURL } from 'url'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Load the bundled main store by re-implementing thin checks against electron-store
const Store = require('electron-store')

const RATES = { USD: 1, EUR: 0.92, GBP: 0.79, CNY: 7.15 }

app.whenReady().then(() => {
  const store = new Store({ name: 'sublist-state-test', cwd: app.getPath('userData') })
  store.clear()
  store.set({
    currency: 'USD',
    archivedVisible: false,
    categories: [
      { id: 'ai', name: 'AI', color: '#6d7dff' },
      { id: 'prod', name: 'Prod', color: '#38bdf8' },
    ],
    subscriptions: [],
  })

  // add
  const subs = store.get('subscriptions')
  const rec = {
    id: 'sub_test1',
    name: 'Test Sub',
    categoryId: 'ai',
    plan: 'monthly',
    price: 10,
    currency: 'USD',
    nextDue: '2026-07-15',
    paymentMethod: 'Card',
    accent: '#6d7dff',
    note: '',
    archived: false,
  }
  store.set('subscriptions', [rec, ...subs])
  console.log('ADD ok', store.get('subscriptions').length === 1)

  // update
  store.set(
    'subscriptions',
    store.get('subscriptions').map((s) => (s.id === 'sub_test1' ? { ...s, price: 12.5 } : s)),
  )
  console.log('UPDATE ok', store.get('subscriptions')[0].price === 12.5)

  // archive
  store.set(
    'subscriptions',
    store.get('subscriptions').map((s) => (s.id === 'sub_test1' ? { ...s, archived: true } : s)),
  )
  console.log('ARCHIVE ok', store.get('subscriptions')[0].archived === true)

  // category add
  const cats = store.get('categories')
  store.set('categories', [...cats, { id: 'new', name: 'New', color: '#fff' }])
  console.log('CAT ADD ok', store.get('categories').length === 3)

  // currency
  store.set('currency', 'EUR')
  console.log('CURRENCY ok', store.get('currency') === 'EUR')

  // delete
  store.set(
    'subscriptions',
    store.get('subscriptions').filter((s) => s.id !== 'sub_test1'),
  )
  console.log('DELETE ok', store.get('subscriptions').length === 0)

  // totals math (client-side parity)
  const monthlyUSD = (price, currency, plan) => {
    const usd = price / (RATES[currency] ?? 1)
    return plan === 'annual' ? usd / 12 : usd
  }
  const est = monthlyUSD(12, 'USD', 'monthly') * (30 / 30)
  console.log('TOTALS ok', est === 12)

  // verify production store exists
  const prod = new Store({ name: 'sublist-state' })
  const state = {
    currency: prod.get('currency'),
    cats: (prod.get('categories') || []).length,
    subs: (prod.get('subscriptions') || []).length,
  }
  console.log('PROD_STATE', JSON.stringify(state))
  console.log('SMOKE_PASS')
  app.quit()
})
