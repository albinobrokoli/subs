import Store from 'electron-store'

export type Category = {
  id: string
  name: string
  color: string
  /** CSS gradient or image url for category banner */
  banner?: string
}

export type Subscription = {
  id: string
  name: string
  categoryId: string
  plan: 'monthly' | 'annual' | string
  price: number
  currency: string
  nextDue: string
  paymentMethod: string
  accent: string
  note: string
  archived: boolean
  website?: string
  startDate?: string
  endDate?: string
  email?: string
  iconKey?: string
  reminders?: boolean
}

export type AppState = {
  currency: string
  archivedVisible: boolean
  categories: Category[]
  subscriptions: Subscription[]
  theme?: 'system' | 'light' | 'dark'
  showCategoryBanner?: boolean
  groupSidebarSubs?: boolean
  remindersEnabled?: boolean
}

export const PAYMENT_METHODS = ['Yok', 'Kart', 'Apple', 'PayPal', 'Revolut', 'N26', 'WeChat Pay', 'Ücretsiz']
export const PLANS = ['monthly', 'annual']

// Fixed rates relative to USD
export const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CNY: 7.15,
  TRY: 34.5,
}

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'entertainment',
    name: 'Eğlence',
    color: '#f87171',
    banner:
      'linear-gradient(120deg, rgba(15,23,42,0.55), rgba(15,23,42,0.75)), url(https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=60) center/cover',
  },
  {
    id: 'ai',
    name: 'Yapay Zeka',
    color: '#818cf8',
    banner:
      'linear-gradient(120deg, rgba(15,23,42,0.55), rgba(15,23,42,0.8)), url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=60) center/cover',
  },
  {
    id: 'productivity',
    name: 'Verimlilik',
    color: '#38bdf8',
    banner:
      'linear-gradient(120deg, rgba(15,23,42,0.55), rgba(15,23,42,0.8)), url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=60) center/cover',
  },
  {
    id: 'travel',
    name: 'Seyahat',
    color: '#f5b544',
    banner:
      'linear-gradient(120deg, rgba(15,23,42,0.55), rgba(15,23,42,0.8)), url(https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=60) center/cover',
  },
]

function uid(prefix = 'sub') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function seedSubscriptions(): Subscription[] {
  return [
    {
      id: uid(),
      name: 'Amazon Prime Video',
      categoryId: 'entertainment',
      plan: 'monthly',
      price: 69,
      currency: 'TRY',
      nextDue: '2026-07-17',
      paymentMethod: 'Kart',
      accent: '#00a8e1',
      note: '',
      archived: false,
      startDate: '2025-11-17',
      iconKey: 'primevideo',
      reminders: true,
    },
    {
      id: uid(),
      name: 'Google Gemini',
      categoryId: 'ai',
      plan: 'monthly',
      price: 0,
      currency: 'TRY',
      nextDue: '2026-07-20',
      paymentMethod: 'Ücretsiz',
      accent: '#8b8ff0',
      note: 'sinirbilimportali@gmail.com',
      email: 'sinirbilimportali@gmail.com',
      archived: false,
      startDate: '2025-05-20',
      endDate: '2026-08-20',
      iconKey: 'gemini',
      reminders: true,
    },
    {
      id: uid(),
      name: 'Google Gemini',
      categoryId: 'ai',
      plan: 'monthly',
      price: 0,
      currency: 'TRY',
      nextDue: '2026-07-18',
      paymentMethod: 'Ücretsiz',
      accent: '#8b8ff0',
      note: 'baranboga0@gmail.com',
      email: 'baranboga0@gmail.com',
      archived: false,
      startDate: '2025-05-18',
      iconKey: 'gemini',
      reminders: true,
    },
    {
      id: uid(),
      name: 'ChatGPT Plus',
      categoryId: 'ai',
      plan: 'monthly',
      price: 799,
      currency: 'TRY',
      nextDue: '2026-08-05',
      paymentMethod: 'Kart',
      accent: '#10a37f',
      note: '',
      archived: false,
      iconKey: 'openai',
    },
    {
      id: uid(),
      name: 'Spotify',
      categoryId: 'entertainment',
      plan: 'monthly',
      price: 59.99,
      currency: 'TRY',
      nextDue: '2026-07-25',
      paymentMethod: 'Kart',
      accent: '#1db954',
      note: '',
      archived: false,
      iconKey: 'spotify',
    },
    {
      id: uid(),
      name: 'Netflix',
      categoryId: 'entertainment',
      plan: 'monthly',
      price: 149.99,
      currency: 'TRY',
      nextDue: '2026-07-28',
      paymentMethod: 'Kart',
      accent: '#e50914',
      note: '',
      archived: false,
      iconKey: 'netflix',
    },
    {
      id: uid(),
      name: 'iCloud+',
      categoryId: 'productivity',
      plan: 'monthly',
      price: 29.99,
      currency: 'TRY',
      nextDue: '2026-07-22',
      paymentMethod: 'Apple',
      accent: '#3b9dff',
      note: '',
      archived: false,
      iconKey: 'icloud',
    },
    {
      id: uid(),
      name: 'DigitalOcean',
      categoryId: 'productivity',
      plan: 'monthly',
      price: 12,
      currency: 'USD',
      nextDue: '2026-07-28',
      paymentMethod: 'Kart',
      accent: '#0080ff',
      note: '',
      archived: false,
      iconKey: 'digitalocean',
    },
  ]
}

const defaults: AppState = {
  currency: 'TRY',
  archivedVisible: false,
  categories: DEFAULT_CATEGORIES,
  subscriptions: seedSubscriptions(),
  theme: 'dark',
  showCategoryBanner: true,
  groupSidebarSubs: true,
  remindersEnabled: false,
}

const store = new Store<AppState>({
  name: 'sublist-state-v2',
  defaults,
})

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

export function getState(): AppState {
  return clone({
    currency: store.get('currency'),
    archivedVisible: store.get('archivedVisible'),
    categories: store.get('categories'),
    subscriptions: store.get('subscriptions'),
    theme: store.get('theme') ?? 'dark',
    showCategoryBanner: store.get('showCategoryBanner') ?? true,
    groupSidebarSubs: store.get('groupSidebarSubs') ?? true,
    remindersEnabled: store.get('remindersEnabled') ?? false,
  })
}

function writeState(partial: Partial<AppState>): AppState {
  for (const [k, v] of Object.entries(partial)) {
    if (v !== undefined) store.set(k as keyof AppState, v as never)
  }
  return getState()
}

export function addSubscription(sub: Partial<Subscription> = {}): Subscription {
  const state = getState()
  const { id: _ignored, ...rest } = sub
  const record: Subscription = {
    id: uid(),
    name: 'Adsız',
    categoryId: state.categories[0]?.id ?? 'ai',
    plan: 'monthly',
    price: 0,
    currency: state.currency,
    nextDue: '',
    paymentMethod: 'Kart',
    accent: '#3b82f6',
    note: '',
    archived: false,
    website: '',
    startDate: new Date().toISOString().slice(0, 10),
    reminders: false,
    ...rest,
  }
  writeState({ subscriptions: [record, ...state.subscriptions] })
  return clone(record)
}

export function updateSubscription(id: string, patch: Partial<Subscription>): Subscription | null {
  const state = getState()
  const subscriptions = state.subscriptions.map((s) => (s.id === id ? { ...s, ...patch, id } : s))
  writeState({ subscriptions })
  return clone(subscriptions.find((s) => s.id === id) ?? null)
}

export function deleteSubscription(id: string): boolean {
  const state = getState()
  const next = state.subscriptions.filter((s) => s.id !== id)
  if (next.length === state.subscriptions.length) return false
  writeState({ subscriptions: next })
  return true
}

export function archiveSubscription(id: string, archived = true): Subscription | null {
  return updateSubscription(id, { archived })
}

export function addCategory(cat: Partial<Category> = {}): Category {
  const state = getState()
  const record: Category = {
    id: cat.id || uid('cat'),
    name: cat.name || 'Yeni kategori',
    color: cat.color || '#3b82f6',
    banner:
      cat.banner ||
      `linear-gradient(120deg, ${cat.color || '#3b82f6'}55, #0f172aee)`,
  }
  writeState({ categories: [...state.categories, record] })
  return clone(record)
}

export function updateCategory(id: string, patch: Partial<Category>): Category | null {
  const state = getState()
  const categories = state.categories.map((c) => (c.id === id ? { ...c, ...patch, id } : c))
  writeState({ categories })
  return clone(categories.find((c) => c.id === id) ?? null)
}

export function deleteCategory(id: string): boolean {
  const state = getState()
  if (state.categories.length <= 1) return false
  const categories = state.categories.filter((c) => c.id !== id)
  if (categories.length === state.categories.length) return false
  const fallback = categories[0].id
  const subscriptions = state.subscriptions.map((s) =>
    s.categoryId === id ? { ...s, categoryId: fallback } : s,
  )
  writeState({ categories, subscriptions })
  return true
}

export function setCurrency(currency: string): string {
  writeState({ currency })
  return currency
}

export function setArchivedVisible(visible: boolean): boolean {
  writeState({ archivedVisible: !!visible })
  return !!visible
}

export function setPrefs(prefs: Partial<AppState>): AppState {
  const allowed: (keyof AppState)[] = [
    'theme',
    'showCategoryBanner',
    'groupSidebarSubs',
    'remindersEnabled',
    'currency',
    'archivedVisible',
  ]
  const patch: Partial<AppState> = {}
  for (const k of allowed) {
    if (prefs[k] !== undefined) (patch as any)[k] = prefs[k]
  }
  return writeState(patch)
}

export function getMeta() {
  return {
    paymentMethods: PAYMENT_METHODS,
    plans: PLANS,
    rates: RATES,
    currencies: Object.keys(RATES),
  }
}

export function getUpcomingPayments(withinDays = 3) {
  const state = getState()
  if (!state.remindersEnabled) return []
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return state.subscriptions
    .filter((s) => !s.archived && s.nextDue && s.price > 0)
    .map((s) => {
      const d = new Date(s.nextDue + 'T00:00:00').getTime()
      const days = Math.round((d - now.getTime()) / 86400000)
      return { ...s, days }
    })
    .filter((s) => s.days >= 0 && s.days <= withinDays)
    .sort((a, b) => a.days - b.days)
}

/** estimated payment history months for detail view */
export function buildPaymentHistory(sub: Subscription, months = 8) {
  if (!sub.nextDue || sub.price <= 0) return []
  const out: { label: string; amount: number; count: number }[] = []
  const due = new Date(sub.nextDue + 'T00:00:00')
  for (let i = 0; i < months; i++) {
    const d = new Date(due)
    d.setMonth(d.getMonth() - i)
    const label = d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })
    out.push({ label, amount: sub.price, count: 1 })
  }
  return out
}
