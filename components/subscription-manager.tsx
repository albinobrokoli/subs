"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import {
  LayoutDashboard,
  Calendar,
  Tag,
  Layers,
  ChevronDown,
  ChevronRight,
  Plus,
  Sparkles,
  Share,
  Bell,
  Leaf,
  Pencil,
  Trash2,
  X,
  Settings,
  Info,
  Search,
} from "lucide-react"
import {
  getState,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  setCurrency as persistCurrency,
  setArchivedVisible as persistArchived,
  meta,
} from "@/lib/dataService"

/* ----------------------------- helpers ----------------------------------- */

const PERIODS = ["Day", "Week", "Month", "Year"] as const
type Period = (typeof PERIODS)[number]

const CURRENCIES = ["USD", "EUR", "GBP", "CNY"] as const
// static rates relative to USD (mock — the data layer can supply real ones later)
const RATES: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, CNY: 7.15 }
const SYMBOLS: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", CNY: "CN¥" }

const PERIOD_DAYS: Record<Period, number> = { Day: 1, Week: 7, Month: 30, Year: 365 }

function toUSD(price: number, currency: string) {
  return price / (RATES[currency] ?? 1)
}
function fromUSD(usd: number, currency: string) {
  return usd * (RATES[currency] ?? 1)
}
function monthlyUSD(sub: { price: number; currency: string; plan: string }) {
  const usd = toUSD(sub.price, sub.currency)
  return sub.plan === "annual" ? usd / 12 : usd
}
function formatMoney(amount: number, currency: string) {
  const sym = SYMBOLS[currency] ?? "$"
  return `${sym}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function formatDate(iso: string) {
  if (!iso) return "None"
  const d = new Date(iso + "T00:00:00")
  if (Number.isNaN(d.getTime())) return "None"
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}
function daysUntil(iso: string) {
  if (!iso) return Infinity
  const d = new Date(iso + "T00:00:00").getTime()
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((d - now.getTime()) / 86400000)
}

const PAYMENT_TINT: Record<string, string> = {
  Apple: "#e7e9ea",
  Revolut: "#f97316",
  "WeChat Pay": "#22c55e",
  N26: "#a78bfa",
  PayPal: "#3b82f6",
  Card: "#94a3b8",
  Free: "#4ade80",
}

/* ----------------------------- primitives -------------------------------- */

function ServiceIcon({ name, accent, size = 40 }: { name: string; accent: string; size?: number }) {
  const letter = name.trim().charAt(0).toUpperCase() || "?"
  const dark = accent.toLowerCase() === "#e7e9ea"
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[13px] font-semibold card-sheen"
      style={{
        width: size,
        height: size,
        background: dark ? "rgba(255,255,255,0.06)" : `${accent}22`,
        color: dark ? "#e7e9ea" : accent,
        border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : accent + "55"}`,
        fontSize: size * 0.42,
      }}
      aria-hidden="true"
    >
      {letter}
    </span>
  )
}

function PaymentBadge({ method }: { method: string }) {
  const tint = PAYMENT_TINT[method] ?? "#94a3b8"
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: tint }} aria-hidden="true" />
      {method}
    </span>
  )
}

/* ----------------------------- sidebar ----------------------------------- */

type ViewKey = "dashboard" | "calendar" | "categories" | "all" | string

function Sidebar({
  categories,
  subscriptions,
  view,
  onSelect,
}: {
  categories: { id: string; name: string; color: string }[]
  subscriptions: any[]
  view: ViewKey
  onSelect: (v: ViewKey) => void
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, c.id === "ai"])),
  )

  const countFor = (id: string) => subscriptions.filter((s) => s.categoryId === id && !s.archived).length

  const nav = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "calendar", label: "Calendar", icon: Calendar },
    { key: "categories", label: "Categories", icon: Tag },
    { key: "all", label: "All Subscriptions", icon: Layers },
  ] as const

  return (
    <aside className="glass flex w-64 shrink-0 flex-col rounded-2xl">
      {/* traffic lights */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      </div>

      <nav className="flex flex-col gap-1 px-3 pb-2">
        {nav.map((n) => {
          const active = view === n.key
          const Icon = n.icon
          return (
            <button
              key={n.key}
              onClick={() => onSelect(n.key)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                active ? "bg-accent/20 text-foreground" : "text-muted hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon size={17} strokeWidth={2} />
              {n.label}
            </button>
          )
        })}
      </nav>

      <div className="mx-3 my-1 h-px bg-white/8" />

      <div className="no-scrollbar flex-1 overflow-y-auto px-3 py-1">
        {categories.map((cat) => {
          const isOpen = open[cat.id]
          const subs = subscriptions.filter((s) => s.categoryId === cat.id)
          const active = view === cat.id
          return (
            <div key={cat.id} className="mb-0.5">
              <div
                className={`flex items-center gap-2 rounded-xl px-2 py-2 text-sm transition-colors ${
                  active ? "bg-accent/20 text-foreground" : "text-foreground/90 hover:bg-white/5"
                }`}
              >
                <button
                  onClick={() => setOpen((o) => ({ ...o, [cat.id]: !o[cat.id] }))}
                  className="text-muted hover:text-foreground"
                  aria-label={isOpen ? "Collapse" : "Expand"}
                >
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                </button>
                <button onClick={() => onSelect(cat.id)} className="flex flex-1 items-center gap-2 text-left">
                  <Tag size={15} style={{ color: cat.color }} />
                  <span className="flex-1 font-medium">{cat.name}</span>
                  <span className="text-xs text-muted">({countFor(cat.id)})</span>
                </button>
              </div>

              {isOpen && (
                <div className="mt-0.5 mb-1 flex flex-col gap-0.5 pl-3">
                  {subs.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => onSelect(cat.id)}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-muted transition-colors hover:bg-white/5 hover:text-foreground"
                    >
                      <span
                        className="h-4 w-4 shrink-0 rounded-[5px]"
                        style={{ background: s.accent + "aa" }}
                        aria-hidden="true"
                      />
                      <span className={`flex-1 truncate ${s.plan === "annual" ? "text-positive/80" : ""}`}>
                        {s.name}
                      </span>
                      {s.plan === "annual" && <Leaf size={12} className="text-positive/70" />}
                    </button>
                  ))}
                  {subs.length === 0 && <p className="px-2 py-1 text-xs text-muted/60">Empty</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mx-3 my-1 h-px bg-white/8" />
      <div className="flex flex-col gap-1 px-3 pb-3 pt-1">
        <button className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground">
          <Settings size={17} /> Settings
        </button>
        <button className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground">
          <Info size={17} /> About
        </button>
      </div>
    </aside>
  )
}

/* ----------------------------- card -------------------------------------- */

function SubscriptionCard({
  sub,
  currency,
  onEdit,
  onDelete,
}: {
  sub: any
  currency: string
  onEdit: () => void
  onDelete: () => void
}) {
  const displayPrice =
    sub.price === 0 ? formatMoney(0, sub.currency) : formatMoney(sub.price, sub.currency)
  const free = sub.price === 0
  const soon = daysUntil(sub.nextDue) <= 7 && daysUntil(sub.nextDue) >= 0

  return (
    <div className="glass-2 card-sheen card-lift group animate-rise relative flex flex-col rounded-[22px] p-6">
      <div className="flex items-start gap-3.5">
        <ServiceIcon name={sub.name} accent={sub.accent} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-semibold tracking-tight text-foreground">{sub.name}</h3>
          <p className="mt-0.5 text-xs text-faint">
            {sub.plan} <span className="px-0.5">·</span> {catName(sub.categoryId)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-faint">
          {sub.plan === "annual" && <Leaf size={14} className="text-positive/70" />}
          <Bell size={15} />
        </div>
      </div>

      {sub.note && <p className="mt-3.5 line-clamp-2 text-[13px] leading-relaxed text-faint">{sub.note}</p>}

      <div className="mt-auto flex items-end justify-between pt-6">
        <p
          className={`text-[26px] font-semibold leading-none tracking-tight tabular-nums ${
            free ? "text-faint" : "text-foreground"
          }`}
        >
          {displayPrice}
        </p>
        <PaymentBadge method={sub.paymentMethod} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3.5 text-xs">
        <span className="text-faint">
          {sub.nextDue ? "Next due" : "No renewal"}
          {soon && (
            <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 font-medium text-accent">soon</span>
          )}
        </span>
        <span className={soon ? "font-medium text-foreground" : "text-muted"}>{formatDate(sub.nextDue)}</span>
      </div>

      {/* hover actions */}
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={onEdit}
          className="glass grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-foreground"
          aria-label={`Edit ${sub.name}`}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={onDelete}
          className="glass grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-[#ff6b6b]"
          aria-label={`Delete ${sub.name}`}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// module-level lookup filled on render
let _categories: { id: string; name: string; color: string }[] = []
function catName(id: string) {
  return _categories.find((c) => c.id === id)?.name ?? ""
}

/* ----------------------------- editor modal ------------------------------ */

function EditorModal({
  initial,
  categories,
  onClose,
  onSave,
}: {
  initial: any
  categories: { id: string; name: string; color: string }[]
  onClose: () => void
  onSave: (data: any) => void
}) {
  const [form, setForm] = useState<any>(initial)
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const field = "w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-foreground outline-none focus:border-accent/60 transition-colors"
  const label = "mb-1.5 block text-xs font-medium text-muted"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="glass animate-rise relative z-10 w-full max-w-lg rounded-2xl p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{initial.id ? "Edit subscription" : "New subscription"}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={label}>Name</label>
            <input className={field} value={form.name} onChange={(e) => set("name", e.target.value)} autoFocus />
          </div>

          <div>
            <label className={label}>Category</label>
            <select className={field} value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              {categories.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#12141f]">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Plan</label>
            <select className={field} value={form.plan} onChange={(e) => set("plan", e.target.value)}>
              {meta.plans.map((p: string) => (
                <option key={p} value={p} className="bg-[#12141f]">
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Price</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={field}
              value={form.price}
              onChange={(e) => set("price", Number.parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <label className={label}>Currency</label>
            <select className={field} value={form.currency} onChange={(e) => set("currency", e.target.value)}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c} className="bg-[#12141f]">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>Next due</label>
            <input type="date" className={field} value={form.nextDue} onChange={(e) => set("nextDue", e.target.value)} />
          </div>

          <div>
            <label className={label}>Payment method</label>
            <select
              className={field}
              value={form.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)}
            >
              {meta.paymentMethods.map((p: string) => (
                <option key={p} value={p} className="bg-[#12141f]">
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className={label}>Note</label>
            <textarea
              className={field}
              rows={2}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
            />
          </div>

          <label className="col-span-2 flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.archived}
              onChange={(e) => set("archived", e.target.checked)}
              className="h-4 w-4 accent-[#6d7dff]"
            />
            Archived
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(form)}
            className="rounded-xl bg-accent px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/85"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- main -------------------------------------- */

export default function SubscriptionManager() {
  const [hydrated, setHydrated] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [currency, setCurrencyState] = useState("USD")
  const [archivedVisible, setArchivedVisibleState] = useState(false)

  const [view, setView] = useState<ViewKey>("ai")
  const [period, setPeriod] = useState<Period>("Month")
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<any | null>(null)

  const refresh = useCallback(() => {
    const s = getState()
    setCategories(s.categories)
    setSubscriptions(s.subscriptions)
    setCurrencyState(s.currency)
    setArchivedVisibleState(s.archivedVisible)
    _categories = s.categories
  }, [])

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [refresh])

  _categories = categories

  const activeCategory = categories.find((c) => c.id === view)
  const isCategoryView = !!activeCategory

  const visible = useMemo(() => {
    let list = subscriptions
    if (isCategoryView) list = list.filter((s) => s.categoryId === view)
    if (!archivedVisible) list = list.filter((s) => !s.archived)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q))
    }
    return list
  }, [subscriptions, view, isCategoryView, archivedVisible, query])

  const archivedCount = useMemo(() => {
    let list = subscriptions
    if (isCategoryView) list = list.filter((s) => s.categoryId === view)
    return list.filter((s) => s.archived).length
  }, [subscriptions, view, isCategoryView])

  // period-scaled estimated total (in selected currency)
  const scale = PERIOD_DAYS[period] / 30
  const estimatedTotal = useMemo(() => {
    const usd = visible.reduce((sum, s) => sum + monthlyUSD(s) * scale, 0)
    return fromUSD(usd, currency)
  }, [visible, scale, currency])

  // total due within the current period window
  const totalDue = useMemo(() => {
    const window = PERIOD_DAYS[period]
    const usd = visible.reduce((sum, s) => {
      const d = daysUntil(s.nextDue)
      if (d >= 0 && d <= window && s.price > 0) return sum + toUSD(s.price, s.currency)
      return sum
    }, 0)
    return fromUSD(usd, currency)
  }, [visible, period, currency])

  const monthlyTotalUSD = useMemo(
    () => subscriptions.filter((s) => !s.archived).reduce((sum, s) => sum + monthlyUSD(s), 0),
    [subscriptions],
  )

  const nextPayment = useMemo(() => {
    const upcoming = subscriptions
      .filter((s) => !s.archived && daysUntil(s.nextDue) >= 0 && s.nextDue)
      .sort((a, b) => daysUntil(a.nextDue) - daysUntil(b.nextDue))
    return upcoming[0]
  }, [subscriptions])

  const title = isCategoryView ? activeCategory!.name : view === "all" ? "All Subscriptions" : cap(view as string)
  const heroColor = activeCategory?.color ?? "#8b8ff0"

  /* actions */
  const handleSave = (data: any) => {
    if (data.id) updateSubscription(data.id, data)
    else addSubscription(data)
    setEditing(null)
    refresh()
  }
  const handleDelete = (id: string) => {
    deleteSubscription(id)
    refresh()
  }
  const handleAdd = () => {
    setEditing({
      name: "",
      categoryId: isCategoryView ? view : categories[0]?.id ?? "ai",
      plan: "monthly",
      price: 0,
      currency,
      nextDue: "",
      paymentMethod: "Card",
      accent: "#6d7dff",
      note: "",
      archived: false,
    })
  }
  const toggleArchived = () => {
    const next = !archivedVisible
    persistArchived(next)
    setArchivedVisibleState(next)
  }
  const cycleCurrency = () => {
    const idx = CURRENCIES.indexOf(currency as any)
    const next = CURRENCIES[(idx + 1) % CURRENCIES.length]
    persistCurrency(next)
    setCurrencyState(next)
  }

  if (!hydrated) {
    return <div className="app-atmosphere min-h-screen" />
  }

  return (
    <div className="app-atmosphere min-h-screen p-3 md:p-4">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] max-w-[1400px] gap-4 md:h-[calc(100vh-2rem)]">
        <Sidebar categories={categories} subscriptions={subscriptions} view={view} onSelect={setView} />

        {/* main pane */}
        <main className="glass flex min-w-0 flex-1 flex-col rounded-2xl">
          {/* top bar */}
          <header className="flex flex-wrap items-center gap-3 border-b border-white/8 px-5 py-3.5">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>

            <div className="ml-1 flex items-center gap-2">
              <button
                onClick={handleAdd}
                className="glass-2 grid h-9 w-9 place-items-center rounded-full text-foreground transition-transform hover:scale-105"
                aria-label="Add subscription"
              >
                <Plus size={18} />
              </button>
              <button
                className="glass-2 grid h-9 w-9 place-items-center rounded-full text-accent-2"
                aria-label="AI insights"
              >
                <Sparkles size={16} />
              </button>
            </div>

            {/* period segmented control */}
            <div className="glass-2 ml-auto flex items-center rounded-full p-1">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                    period === p ? "bg-white/12 text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              className="glass-2 grid h-9 w-9 place-items-center rounded-full text-muted hover:text-foreground"
              aria-label="Export"
            >
              <Share size={16} />
            </button>
            <button
              onClick={cycleCurrency}
              className="glass-2 flex h-9 items-center gap-1 rounded-full px-3 text-sm text-foreground"
            >
              {currency} {SYMBOLS[currency]}
              <ChevronDown size={14} className="text-muted" />
            </button>
          </header>

          {/* scroll area */}
          <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-5">
            {/* summary hero */}
            <section className="glass card-sheen relative mb-7 overflow-hidden rounded-[26px] p-7">
              {/* atmospheric, blurred, category-tinted glow sitting behind the glass */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 -z-10"
                style={{ background: heroAtmosphere(heroColor) }}
              />

              <div className="flex items-center gap-2.5">
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ background: heroColor, boxShadow: `0 0 16px ${heroColor}` }}
                />
                <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              </div>

              <div className="mt-6 flex flex-wrap items-end gap-x-14 gap-y-5">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">Total due</p>
                  <p className="mt-1.5 text-[32px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
                    {formatMoney(totalDue, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">
                    Estimated <span className="lowercase tracking-normal">/ {period.toLowerCase()}</span>
                  </p>
                  <p className="mt-1.5 text-[32px] font-semibold leading-none tracking-tight tabular-nums text-foreground">
                    {formatMoney(estimatedTotal, currency)}
                  </p>
                </div>
              </div>

              {archivedCount > 0 && (
                <button
                  onClick={toggleArchived}
                  className="mt-6 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-[5px] border transition-colors ${
                      archivedVisible ? "border-accent bg-accent" : "border-white/25"
                    }`}
                  >
                    {archivedVisible && <span className="h-1.5 w-1.5 rounded-sm bg-white" />}
                  </span>
                  Show archived ({archivedCount})
                </button>
              )}
            </section>

            {/* search */}
            <div className="glass-2 mb-5 flex items-center gap-2.5 rounded-xl px-3.5 py-2.5">
              <Search size={16} className="text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search subscriptions…"
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted/70"
              />
            </div>

            {/* grid */}
            {visible.length === 0 ? (
              <div className="glass-2 flex flex-col items-center justify-center rounded-2xl py-20 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/5">
                  <Layers size={24} className="text-muted" />
                </div>
                <p className="mt-4 text-sm text-muted">No subscriptions here yet.</p>
                <button
                  onClick={handleAdd}
                  className="mt-4 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent/85"
                >
                  Add subscription
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {visible.map((s) => (
                  <SubscriptionCard
                    key={s.id}
                    sub={s}
                    currency={currency}
                    onEdit={() => setEditing(s)}
                    onDelete={() => handleDelete(s.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* bottom bar */}
          <footer className="flex flex-wrap items-center gap-x-8 gap-y-1 border-t border-white/8 px-5 py-3 text-sm">
            <span className="text-muted">
              Subscriptions <span className="font-semibold text-foreground">{visible.length}</span>
            </span>
            <span className="text-muted">
              Monthly total{" "}
              <span className="font-semibold text-foreground">
                {formatMoney(fromUSD(monthlyTotalUSD, currency), currency)}
              </span>
            </span>
            {nextPayment && (
              <span className="ml-auto text-muted">
                Next payment{" "}
                <span className="font-semibold text-foreground">
                  {nextPayment.name} — {formatDate(nextPayment.nextDue)}
                </span>
              </span>
            )}
          </footer>
        </main>
      </div>

      {editing && (
        <EditorModal
          initial={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/* atmospheric, blurred, category-tinted glow used behind the hero glass.
   `color` is a 6-digit hex; alpha suffixes produce the layered nebula. */
function heroAtmosphere(color: string) {
  return [
    `radial-gradient(135% 155% at 14% -28%, ${color}99, transparent 50%)`,
    `radial-gradient(120% 135% at 104% -12%, ${color}5c, transparent 54%)`,
    `radial-gradient(115% 150% at 74% 132%, ${color}3d, transparent 56%)`,
    `linear-gradient(150deg, rgba(20, 22, 36, 0.28), rgba(8, 9, 15, 0.52))`,
  ].join(", ")
}
