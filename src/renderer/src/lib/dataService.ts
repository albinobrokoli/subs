export type Category = {
  id: string
  name: string
  color: string
}

export type Subscription = {
  id: string
  name: string
  categoryId: string
  plan: string
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
  theme?: string
  showCategoryBanner?: boolean
  groupSidebarSubs?: boolean
  remindersEnabled?: boolean
}

const FALLBACK_META = {
  paymentMethods: ['Yok', 'Kart', 'Apple', 'PayPal', 'Revolut', 'N26', 'WeChat Pay', 'Ücretsiz'],
  plans: ['monthly', 'annual'],
  rates: { USD: 1, EUR: 0.92, GBP: 0.79, CNY: 7.15, TRY: 34.5 },
  currencies: ['TRY', 'USD', 'EUR', 'GBP', 'CNY'],
}

function api() {
  if (typeof window === 'undefined' || !window.sublist) {
    throw new Error('Sublist IPC bridge is not available')
  }
  return window.sublist
}

export async function getState(): Promise<AppState> {
  return api().getState()
}

export async function getMeta() {
  try {
    return await api().getMeta()
  } catch {
    return FALLBACK_META
  }
}

export async function addSubscription(sub: Partial<Subscription>) {
  return api().addSubscription(sub)
}

export async function updateSubscription(id: string, patch: Partial<Subscription>) {
  return api().updateSubscription(id, patch)
}

export async function deleteSubscription(id: string) {
  return api().deleteSubscription(id)
}

export async function archiveSubscription(id: string, archived = true) {
  return api().archiveSubscription(id, archived)
}

export async function addCategory(cat: Partial<Category>) {
  return api().addCategory(cat)
}

export async function updateCategory(id: string, patch: Partial<Category>) {
  return api().updateCategory(id, patch)
}

export async function deleteCategory(id: string) {
  return api().deleteCategory(id)
}

export async function setCurrency(currency: string) {
  return api().setCurrency(currency)
}

export async function setArchivedVisible(visible: boolean) {
  return api().setArchivedVisible(visible)
}

export async function setPrefs(prefs: Partial<AppState>) {
  return api().setPrefs(prefs)
}

export async function checkUpcoming() {
  return api().checkUpcoming()
}

export const meta = {
  paymentMethods: FALLBACK_META.paymentMethods,
  plans: FALLBACK_META.plans,
}
