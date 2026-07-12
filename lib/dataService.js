// ---------------------------------------------------------------------------
// Data access layer.
//
// This is the ONLY place the UI talks to for reading/writing data.
// Right now it is backed by localStorage with an in-memory fallback, but the
// public API (getState / getSubscriptions / addSubscription / updateSubscription
// / deleteSubscription / getCategories / setCurrency / setArchivedVisible) is
// storage-agnostic. Swap the internals for an API / DB later without touching
// the components.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "sublist.state.v1"

const CATEGORIES = [
  { id: "ai", name: "AI", color: "#6d7dff" },
  { id: "productivity", name: "Productivity", color: "#38bdf8" },
  { id: "streaming", name: "Streaming", color: "#fb7185" },
  { id: "travel", name: "Travel", color: "#f5b544" },
]

const PAYMENT_METHODS = ["Apple", "Revolut", "WeChat Pay", "N26", "PayPal", "Card", "Free"]
const PLANS = ["monthly", "annual"]

function uid() {
  return "sub_" + Math.random().toString(36).slice(2, 10)
}

function seed() {
  return {
    currency: "USD",
    archivedVisible: false,
    categories: CATEGORIES,
    subscriptions: [
      {
        id: uid(),
        name: "ChatGPT Plus",
        categoryId: "ai",
        plan: "annual",
        price: 200,
        currency: "USD",
        nextDue: "2027-03-30",
        paymentMethod: "Apple",
        accent: "#10a37f",
        note: "",
        archived: false,
      },
      {
        id: uid(),
        name: "GitHub Copilot Premium",
        categoryId: "ai",
        plan: "monthly",
        price: 0,
        currency: "USD",
        nextDue: "2026-07-18",
        paymentMethod: "Free",
        accent: "#8b5cf6",
        note: "AI coding assistant that helps you write code faster.",
        archived: false,
      },
      {
        id: uid(),
        name: "Google AI Pro",
        categoryId: "ai",
        plan: "annual",
        price: 99.99,
        currency: "USD",
        nextDue: "2027-01-08",
        paymentMethod: "Revolut",
        accent: "#4285f4",
        note: "Next payment: $199.99",
        archived: false,
      },
      {
        id: uid(),
        name: "Perplexity",
        categoryId: "ai",
        plan: "annual",
        price: 0,
        currency: "USD",
        nextDue: "2026-10-27",
        paymentMethod: "Free",
        accent: "#22d3ee",
        note: "Next payment: $200/year",
        archived: false,
      },
      {
        id: uid(),
        name: "Volcengine",
        categoryId: "ai",
        plan: "monthly",
        price: 49.9,
        currency: "CNY",
        nextDue: "2026-07-17",
        paymentMethod: "WeChat Pay",
        accent: "#3b82f6",
        note: "",
        archived: false,
      },
      {
        id: uid(),
        name: "X Premium+",
        categoryId: "ai",
        plan: "annual",
        price: 207.37,
        currency: "USD",
        nextDue: "2026-07-17",
        paymentMethod: "N26",
        accent: "#e7e9ea",
        note: "Welcome to X (formerly Twitter), your trusted digital town square.",
        archived: false,
      },
      {
        id: uid(),
        name: "Xiaomi MIMO",
        categoryId: "ai",
        plan: "monthly",
        price: 16,
        currency: "USD",
        nextDue: "",
        paymentMethod: "Card",
        accent: "#ff6900",
        note: "",
        archived: false,
      },
      {
        id: uid(),
        name: "z.ai",
        categoryId: "ai",
        plan: "annual",
        price: 136.76,
        currency: "USD",
        nextDue: "2027-06-18",
        paymentMethod: "Revolut",
        accent: "#5b6cff",
        note: "Coding Plan Pro",
        archived: false,
      },
      // Productivity
      {
        id: uid(),
        name: "Developer Program",
        categoryId: "productivity",
        plan: "annual",
        price: 99,
        currency: "USD",
        nextDue: "2026-11-02",
        paymentMethod: "Apple",
        accent: "#e7e9ea",
        note: "",
        archived: false,
      },
      {
        id: uid(),
        name: "DigitalOcean",
        categoryId: "productivity",
        plan: "monthly",
        price: 12,
        currency: "USD",
        nextDue: "2026-07-28",
        paymentMethod: "Card",
        accent: "#0080ff",
        note: "",
        archived: false,
      },
      {
        id: uid(),
        name: "Grok — AI Chat",
        categoryId: "productivity",
        plan: "monthly",
        price: 30,
        currency: "USD",
        nextDue: "2026-07-22",
        paymentMethod: "PayPal",
        accent: "#e7e9ea",
        note: "",
        archived: false,
      },
      {
        id: uid(),
        name: "iCloud+",
        categoryId: "productivity",
        plan: "monthly",
        price: 2.99,
        currency: "USD",
        nextDue: "2026-07-20",
        paymentMethod: "Apple",
        accent: "#3b9dff",
        note: "",
        archived: false,
      },
      // Streaming
      {
        id: uid(),
        name: "Apple TV+",
        categoryId: "streaming",
        plan: "monthly",
        price: 9.99,
        currency: "USD",
        nextDue: "2026-07-19",
        paymentMethod: "Apple",
        accent: "#e7e9ea",
        note: "",
        archived: false,
      },
      // Travel
      {
        id: uid(),
        name: "amaysim",
        categoryId: "travel",
        plan: "monthly",
        price: 15,
        currency: "USD",
        nextDue: "2026-08-01",
        paymentMethod: "Card",
        accent: "#ff5a1f",
        note: "",
        archived: false,
      },
      {
        id: uid(),
        name: "ClubSIM",
        categoryId: "travel",
        plan: "annual",
        price: 48,
        currency: "USD",
        nextDue: "2027-02-11",
        paymentMethod: "PayPal",
        accent: "#a78bfa",
        note: "",
        archived: false,
      },
      {
        id: uid(),
        name: "Felix eSIM",
        categoryId: "travel",
        plan: "monthly",
        price: 20,
        currency: "USD",
        nextDue: "2026-07-25",
        paymentMethod: "Card",
        accent: "#22c55e",
        note: "",
        archived: true,
      },
    ],
  }
}

let memoryState = null

function read() {
  if (memoryState) return memoryState
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        memoryState = JSON.parse(raw)
        return memoryState
      }
    } catch {
      // ignore corrupt storage
    }
  }
  memoryState = seed()
  write(memoryState)
  return memoryState
}

function write(state) {
  memoryState = state
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // ignore quota / private mode errors
    }
  }
  return state
}

// ---- Public API -----------------------------------------------------------

export function getState() {
  // return a deep-ish clone so callers cannot mutate the store directly
  return JSON.parse(JSON.stringify(read()))
}

export function getCategories() {
  return getState().categories
}

export function getSubscriptions() {
  return getState().subscriptions
}

export function addSubscription(sub) {
  const state = read()
  const record = {
    id: uid(),
    name: "Untitled",
    categoryId: state.categories[0]?.id ?? "ai",
    plan: "monthly",
    price: 0,
    currency: state.currency,
    nextDue: "",
    paymentMethod: "Card",
    accent: "#6d7dff",
    note: "",
    archived: false,
    ...sub,
  }
  const next = { ...state, subscriptions: [record, ...state.subscriptions] }
  write(next)
  return record
}

export function updateSubscription(id, patch) {
  const state = read()
  const subscriptions = state.subscriptions.map((s) => (s.id === id ? { ...s, ...patch } : s))
  write({ ...state, subscriptions })
  return subscriptions.find((s) => s.id === id)
}

export function deleteSubscription(id) {
  const state = read()
  const subscriptions = state.subscriptions.filter((s) => s.id !== id)
  write({ ...state, subscriptions })
}

export function setCurrency(currency) {
  const state = read()
  write({ ...state, currency })
  return currency
}

export function setArchivedVisible(visible) {
  const state = read()
  write({ ...state, archivedVisible: !!visible })
  return !!visible
}

export const meta = {
  categories: CATEGORIES,
  paymentMethods: PAYMENT_METHODS,
  plans: PLANS,
}
