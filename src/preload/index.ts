import { contextBridge, ipcRenderer } from 'electron'

export type Category = {
  id: string
  name: string
  color: string
  banner?: string
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

const api = {
  getState: (): Promise<AppState> => ipcRenderer.invoke('store:getState'),
  getMeta: () => ipcRenderer.invoke('store:getMeta'),

  addSubscription: (sub: Partial<Subscription>) => ipcRenderer.invoke('subs:add', sub),
  updateSubscription: (id: string, patch: Partial<Subscription>) =>
    ipcRenderer.invoke('subs:update', id, patch),
  deleteSubscription: (id: string) => ipcRenderer.invoke('subs:delete', id),
  archiveSubscription: (id: string, archived = true) =>
    ipcRenderer.invoke('subs:archive', id, archived),

  addCategory: (cat: Partial<Category>) => ipcRenderer.invoke('cats:add', cat),
  updateCategory: (id: string, patch: Partial<Category>) =>
    ipcRenderer.invoke('cats:update', id, patch),
  deleteCategory: (id: string) => ipcRenderer.invoke('cats:delete', id),

  setCurrency: (currency: string) => ipcRenderer.invoke('prefs:setCurrency', currency),
  setArchivedVisible: (visible: boolean) => ipcRenderer.invoke('prefs:setArchivedVisible', visible),
  setPrefs: (prefs: Partial<AppState>) => ipcRenderer.invoke('prefs:set', prefs),

  checkUpcoming: () => ipcRenderer.invoke('notify:checkUpcoming'),
}

contextBridge.exposeInMainWorld('sublist', api)
export type SublistApi = typeof api
