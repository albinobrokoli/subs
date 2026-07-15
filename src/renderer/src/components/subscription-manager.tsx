import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  LayoutDashboard,
  Calendar as CalIcon,
  CalendarDays,
  Tag,
  Layers,
  Settings,
  Info,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PanelLeft,
  Search,
  Pencil,
  Share,
  Archive,
  Bell,
  X,
  Wallet,
  PackageOpen,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import {
  getState,
  addSubscription,
  updateSubscription,
  deleteSubscription,
  archiveSubscription,
  addCategory,
  updateCategory,
  deleteCategory,
  setCurrency as persistCurrency,
  setPrefs,
  type Category,
  type Subscription,
  type AppState,
} from '@/lib/dataService'
import { resolveServiceIcon, getAllIcons, searchIcons } from '@/lib/serviceIcons'
import { backgroundForId } from '@/lib/backgrounds'

type View = 'dashboard' | 'calendar' | 'categories' | 'subs' | 'settings' | 'about' | 'form'
type Period = 'Day' | 'Week' | 'Month' | 'Year'

const PERIODS: Period[] = ['Day', 'Week', 'Month', 'Year']
const PERIOD_TR: Record<Period, string> = { Day: 'Gün', Week: 'Hafta', Month: 'Ay', Year: 'Yıl' }
const PERIOD_DAYS: Record<Period, number> = { Day: 1, Week: 7, Month: 30, Year: 365 }
const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'CNY'] as const
const RATES: Record<string, number> = { USD: 1, EUR: 0.92, GBP: 0.79, CNY: 7.15, TRY: 34.5 }
const SYMBOLS: Record<string, string> = { TRY: '₺', USD: '$', EUR: '€', GBP: '£', CNY: 'CN¥' }
const PLAN_TR: Record<string, string> = { monthly: 'aylık', annual: 'yıllık' }
const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']

function toUSD(price: number, currency: string) {
  return price / (RATES[currency] ?? 1)
}
function fromUSD(usd: number, currency: string) {
  return usd * (RATES[currency] ?? 1)
}
function monthlyUSD(s: Subscription) {
  const usd = toUSD(s.price, s.currency)
  return s.plan === 'annual' ? usd / 12 : usd
}
function formatMoney(amount: number, currency: string) {
  const sym = SYMBOLS[currency] ?? currency + ' '
  return `${sym}${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function formatDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}
function daysUntil(iso?: string) {
  if (!iso) return Infinity
  const d = new Date(iso + 'T00:00:00').getTime()
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((d - now.getTime()) / 86400000)
}
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function catName(cats: Category[], id: string) {
  return cats.find((c) => c.id === id)?.name ?? ''
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon?: React.ReactNode; accent?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 })
  const [hover, setHover] = useState(false)
  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    setTilt({ rx: (py - 0.5) * -10, ry: (px - 0.5) * 10, gx: px * 100, gy: py * 100 })
  }
  function reset() {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 })
    setHover(false)
  }
  return (
    <div
      ref={ref}
      className="liquid-glass-card stat tilt-card-mini"
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={reset}
      style={{
        transform: `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) ${hover ? 'scale(1.03)' : ''}`,
        transition: hover ? 'transform 0.05s linear' : 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        ['--gx' as any]: `${tilt.gx}%`,
        ['--gy' as any]: `${tilt.gy}%`,
        borderColor: hover && accent ? `${accent}66` : undefined,
        boxShadow: hover && accent ? `0 0 24px -8px ${accent}, inset 0 1px 0 0 rgba(255,255,255,0.12)` : undefined,
      }}
    >
      {icon && (
        <div className="stat-icon" style={{ color: accent || '#2f6bff', background: `${accent || '#2f6bff'}1f` }}>
          {icon}
        </div>
      )}
      <div>
        <div className="label">{label}</div>
        <div className="value money">{value}</div>
      </div>
    </div>
  )
}

function TiltCard({
  sub,
  cat,
  onEdit,
  onArchive,
}: {
  sub: Subscription
  cat?: Category
  onEdit: (s: Subscription) => void
  onArchive: (s: Subscription) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 })
  const [hover, setHover] = useState(false)
  const bg = backgroundForId(sub.id)

  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    const rx = (py - 0.5) * -12
    const ry = (px - 0.5) * 12
    setTilt({ rx, ry, gx: px * 100, gy: py * 100 })
  }
  function reset() {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 })
    setHover(false)
  }

  return (
    <div
      ref={ref}
      className="tilt-card"
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={reset}
      style={{
        transform: `perspective(900px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) ${hover ? 'scale(1.02)' : ''}`,
        transition: hover ? 'transform 0.05s linear' : 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        ['--gx' as any]: `${tilt.gx}%`,
        ['--gy' as any]: `${tilt.gy}%`,
        ['--neon' as any]: sub.accent,
      }}
    >
      {bg && (
        <div
          className="tilt-bg"
          style={{ backgroundImage: `url(${bg})`, transform: `translate(${(tilt.gx - 50) * -0.04}px, ${(tilt.gy - 50) * -0.04}px) scale(1.12)` }}
        />
      )}
      <div className="tilt-content">
        <ServiceIcon name={sub.name} accent={sub.accent} size={64} iconKey={sub.iconKey} />
        <div style={{ fontSize: 22, fontWeight: 650 }}>{sub.name}</div>
        <div className="md-actions">
          <button type="button" onClick={() => onEdit(sub)}>
            <Pencil size={14} /> Düzenle
          </button>
          <button
            type="button"
            onClick={() => {
              const payload = JSON.stringify(sub, null, 2)
              navigator.clipboard?.writeText(payload)
            }}
          >
            <Share size={14} /> Paylaş
          </button>
          <button type="button" onClick={() => onArchive(sub)}>
            <Archive size={14} /> {sub.archived ? 'Arşivden çıkar' : 'Askıya Al'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SubListItem({
  sub,
  catName,
  active,
  onSelect,
}: {
  sub: Subscription
  catName: string
  active: boolean
  onSelect: (id: string) => void
}) {
  const ref = useRef<HTMLButtonElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50 })
  const [hover, setHover] = useState(false)
  function onMove(e: React.MouseEvent) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    setTilt({ rx: (py - 0.5) * -7, ry: (px - 0.5) * 7, gx: px * 100, gy: py * 100 })
  }
  function reset() {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50 })
    setHover(false)
  }
  return (
    <button
      ref={ref}
      type="button"
      className={`md-item ${active ? 'active' : ''}`}
      onMouseMove={onMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={reset}
      onClick={() => onSelect(sub.id)}
      style={{
        transform: `perspective(800px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) ${hover ? 'scale(1.02)' : ''}`,
        transition: hover ? 'transform 0.05s linear' : 'transform 0.4s cubic-bezier(0.22,1,0.36,1)',
        ['--gx' as any]: `${tilt.gx}%`,
        ['--gy' as any]: `${tilt.gy}%`,
        ['--neon' as any]: sub.accent,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <ServiceIcon name={sub.name} accent={sub.accent} size={36} iconKey={sub.iconKey} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5 }}>{sub.name}</div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>
            {PLAN_TR[sub.plan] || sub.plan} · {catName}
          </div>
          {(sub.email || sub.note) && (
            <div className="faint" style={{ fontSize: 11, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sub.email || sub.note}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' }}>
            <span className="money" style={{ fontSize: 15 }}>
              {formatMoney(sub.price, sub.currency)}
            </span>
            {sub.price === 0 && <span className="pill">Ücretsiz</span>}
          </div>
          <div className="muted" style={{ fontSize: 11, marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
            <span>Sonraki Vade</span>
            <span>{formatDate(sub.nextDue)}</span>
          </div>
        </div>
        {sub.reminders && <Bell size={14} className="faint" />}
      </div>
    </button>
  )
}


function IconPickerModal({
  selectedKey,
  onSelect,
  onClose,
}: {
  selectedKey: string
  onSelect: (key: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const all = useMemo(() => getAllIcons(), [])
  const filtered = useMemo(() => {
    if (!q.trim()) return all
    const s = q.toLowerCase()
    return all.filter((i) => i.name.toLowerCase().includes(s))
  }, [all, q])
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="bg" />
      <div className="modal liquid-glass" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 15 }}>Simge seç</h3>
          <button type="button" onClick={onClose} className="icon-btn liquid-glass-2">
            <X size={14} />
          </button>
        </div>
        <div className="search-box liquid-glass-2" style={{ marginBottom: 12 }}>
          <Search size={14} className="muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara..." autoFocus />
        </div>
        <div className="icon-grid scroll">
          {filtered.map((icon) => (
            <button
              key={icon.key}
              type="button"
              onClick={() => {
                onSelect(icon.key)
                onClose()
              }}
              style={selectedKey === icon.key ? { background: 'rgba(47,107,255,0.2)', outline: '1px solid rgba(47,107,255,0.5)' } : undefined}
            >
              <img src={icon.url} alt="" width={32} height={32} style={{ objectFit: 'contain' }} draggable={false} />
              <span className="name">{icon.name}</span>
            </button>
          ))}
          {filtered.length === 0 && <p className="muted" style={{ gridColumn: '1/-1', textAlign: 'center' }}>Sonuç yok</p>}
        </div>
      </div>
    </div>
  )
}

function ServiceIcon({
  name,
  accent,
  size = 36,
  iconKey,
}: {
  name: string
  accent: string
  size?: number
  iconKey?: string
}) {
  const icon = resolveServiceIcon(iconKey || name)
  const r = Math.round(size * 0.28)
  if (icon) {
    return (
      <span className="svc-icon" style={{ width: size, height: size, borderRadius: r }}>
        <img src={icon.url} alt="" style={{ width: size * 0.62, height: size * 0.62 }} draggable={false} />
      </span>
    )
  }
  return (
    <span
      className="svc-icon"
      style={{
        width: size,
        height: size,
        borderRadius: r,
        color: accent,
        background: `${accent}22`,
        fontWeight: 650,
        fontSize: size * 0.4,
      }}
    >
      {(name.trim()[0] || '?').toUpperCase()}
    </span>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)} aria-pressed={on}>
      <span />
    </button>
  )
}

function emptyForm(currency: string, categoryId: string): Partial<Subscription> {
  return {
    name: '',
    categoryId,
    plan: 'monthly',
    price: 0,
    currency,
    nextDue: toISO(new Date()),
    paymentMethod: 'Kart',
    accent: '#3b82f6',
    note: '',
    archived: false,
    website: '',
    startDate: toISO(new Date()),
    endDate: '',
    email: '',
    reminders: false,
  }
}

export default function SubscriptionManager() {
  const [hydrated, setHydrated] = useState(false)
  const [state, setState] = useState<AppState | null>(null)
  const [view, setView] = useState<View>('dashboard')
  const [period, setPeriod] = useState<Period>('Month')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Subscription> | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [calCursor, setCalCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [calSelected, setCalSelected] = useState(toISO(new Date()))
  const [subsOpen, setSubsOpen] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(() => new Set())
  const [error, setError] = useState<string | null>(null)
  const [showIconPicker, setShowIconPicker] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const s = await getState()
      setState(s)
      setError(null)
      if (!selectedId && s.subscriptions[0]) setSelectedId(s.subscriptions[0].id)
    } catch (e: any) {
      setError(e?.message || 'Veri yüklenemedi')
    }
  }, [selectedId])

  useEffect(() => {
    ;(async () => {
      await refresh()
      setHydrated(true)
    })()
  }, []) // eslint-disable-line

  const categories = state?.categories ?? []
  const subscriptions = state?.subscriptions ?? []
  const currency = state?.currency ?? 'TRY'
  const active = useMemo(() => subscriptions.filter((s) => !s.archived), [subscriptions])

  // keep expandedCats in sync with available categories
  useEffect(() => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      categories.forEach((c) => next.add(c.id))
      return next
    })
  }, [categories])

  const filteredSubs = useMemo(() => {
    let list = active
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.note || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q),
      )
    }
    return list
  }, [active, query])

  const scale = PERIOD_DAYS[period] / 30
  const estimated = useMemo(
    () => fromUSD(active.reduce((sum, s) => sum + monthlyUSD(s) * scale, 0), currency),
    [active, scale, currency],
  )
  const avgPer = useMemo(() => estimated / PERIOD_DAYS[period], [estimated, period])
  const freeCount = active.filter((s) => s.price === 0).length
  const paidCount = active.length - freeCount

  const monthlyTotal = useMemo(
    () => fromUSD(active.reduce((sum, s) => sum + monthlyUSD(s), 0), currency),
    [active, currency],
  )

  const nextPayment = useMemo(() => {
    return [...active]
      .filter((s) => s.nextDue && daysUntil(s.nextDue) >= 0)
      .sort((a, b) => daysUntil(a.nextDue) - daysUntil(b.nextDue))[0]
  }, [active])

  const selected = subscriptions.find((s) => s.id === selectedId) || null

  const title =
    view === 'dashboard'
      ? 'Gösterge Paneli'
      : view === 'calendar'
        ? 'Takvim'
        : view === 'categories'
          ? 'Kategoriler'
          : view === 'subs'
            ? 'Abonelikler'
            : view === 'settings'
              ? 'Ayarlar'
              : view === 'about'
                ? 'Hakkında'
                : ''

  async function saveForm() {
    if (!form) return
    const name = (form.name || '').trim()
    if (!name) {
      setError('Ad zorunludur.')
      return
    }
    setError(null)
    const payload = {
      ...form,
      name,
      price: Number(form.price) || 0,
      currency: form.currency || currency,
    }
    if (editingId) await updateSubscription(editingId, payload)
    else {
      const rec = await addSubscription(payload)
      setSelectedId(rec.id)
    }
    setForm(null)
    setEditingId(null)
    await refresh()
  }

  async function removeSub(id: string) {
    if (!confirm('Bu aboneliği silmek istediğine emin misin?')) return
    await deleteSubscription(id)
    if (selectedId === id) setSelectedId(null)
    await refresh()
  }

  async function toggleArchive(sub: Subscription) {
    await archiveSubscription(sub.id, !sub.archived)
    await refresh()
  }

  function openNew() {
    setEditingId(null)
    setForm(emptyForm(currency, categories[0]?.id || 'ai'))
    setError(null)
  }

  function openEdit(sub: Subscription) {
    setEditingId(sub.id)
    setForm({ ...sub })
    setError(null)
  }

  if (!hydrated || !state) {
    return <div className="app-shell" />
  }

  const headActions = (
    <div className="no-drag" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
      {view !== 'form' && view !== 'settings' && view !== 'about' && (
        <>
          <button type="button" className="icon-btn liquid-glass-2" onClick={openNew} aria-label="Ekle">
            <Plus size={16} />
          </button>
          {(view === 'dashboard' || view === 'categories' || view === 'subs') && (
            <div className="liquid-glass-2 seg">
              {PERIODS.map((p) => (
                <button key={p} type="button" className={period === p ? 'active' : ''} onClick={() => setPeriod(p)}>
                  {PERIOD_TR[p]}
                </button>
              ))}
            </div>
          )}
          {view === 'subs' && (
            <div className="search-box liquid-glass-2">
              <Search size={14} className="muted" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ara" />
            </div>
          )}
        </>
      )}
    </div>
  )

  let body: ReactNode = null

  if (view === 'dashboard') {
    body = (
      <Dashboard
        active={active}
        categories={categories}
        currency={currency}
        period={period}
        estimated={estimated}
        avgPer={avgPer}
        freeCount={freeCount}
        paidCount={paidCount}
        onOpen={(s) => {
          setSelectedId(s.id)
          setView('subs')
        }}
      />
    )
  } else if (view === 'calendar') {
    body = (
      <CalendarView
        active={active}
        categories={categories}
        currency={currency}
        cursor={calCursor}
        setCursor={setCalCursor}
        selected={calSelected}
        setSelected={setCalSelected}
        onOpen={(s) => {
          setSelectedId(s.id)
          setView('subs')
        }}
      />
    )
  } else if (view === 'categories') {
    body = (
      <CategoriesView
        categories={categories}
        active={active}
        currency={currency}
        showBanner={state.showCategoryBanner !== false}
        onManage={() => setView('settings')}
        onOpen={(s) => {
          setSelectedId(s.id)
          setView('subs')
        }}
      />
    )
  } else if (view === 'subs') {
    body = (
      <SubsMasterDetail
        list={filteredSubs}
        categories={categories}
        selected={selected}
        currency={currency}
        monthlyTotal={monthlyTotal}
        nextPayment={nextPayment}
        onSelect={setSelectedId}
        onEdit={openEdit}
        onArchive={toggleArchive}
        onDelete={removeSub}
      />
    )
  } else if (view === 'settings') {
    body = (
      <SettingsPage
        state={state}
        onCurrency={async (c) => {
          await persistCurrency(c)
          await refresh()
        }}
        onPrefs={async (p) => {
          await setPrefs(p)
          await refresh()
        }}
        categories={categories}
        onAddCat={async (name, color) => {
          await addCategory({ name, color })
          await refresh()
        }}
        onDelCat={async (id) => {
          await deleteCategory(id)
          await refresh()
        }}
        onRenameCat={async (id, name) => {
          await updateCategory(id, { name })
          await refresh()
        }}
        onUnarchive={async (id) => {
          await archiveSubscription(id, false)
          await refresh()
        }}
        onEditCat={async (id, patch) => {
          await updateCategory(id, patch)
          await refresh()
        }}
      />
    )
  } else if (view === 'about') {
    body = (
      <div className="liquid-glass-card" style={{ padding: 24, maxWidth: 480 }}>
        <h2 style={{ marginTop: 0 }}>Subs</h2>
        <p className="muted" style={{ fontSize: 14, lineHeight: 1.55 }}>
          macOS abonelik yöneticisi. Tasarım, orijinal SubList uygulamasına yakın bir deneyim için yeniden düzenlendi.
          Veriler bu bilgisayarda electron-store ile saklanır.
        </p>
        <p className="faint" style={{ fontSize: 12 }}>
          v1.2.0 · Electron + React · TRY varsayılan
        </p>
      </div>
    )
  }

  return (
    <div className={`app-shell ${sidebarOpen ? '' : 'sb-collapsed'}`}>
      {sidebarOpen && (
        <aside className="liquid-glass sb">
          <div className="sb-top no-drag" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px' }}>
            <button
              type="button"
              className="icon-btn liquid-glass-2"
              onClick={() => setSidebarOpen(false)}
              aria-label="Kenar çubuğunu gizle"
              title="Kenar çubuğunu gizle"
            >
              <PanelLeft size={16} />
            </button>
            <span style={{ fontSize: 12.5, fontWeight: 650, letterSpacing: '0.02em', color: 'rgba(243,244,246,0.85)' }}>Subs</span>
          </div>
          <nav className="sb-nav no-drag scroll-y">
          <NavItem
            active={view === 'dashboard'}
            icon={<LayoutDashboard size={16} />}
            label="Gösterge Paneli"
            onClick={() => setView('dashboard')}
          />
          <NavItem
            active={view === 'calendar'}
            icon={<CalIcon size={16} />}
            label="Takvim"
            onClick={() => setView('calendar')}
          />
          <NavItem
            active={view === 'categories'}
            icon={<Tag size={16} />}
            label="Kategoriler"
            onClick={() => setView('categories')}
          />

          <button type="button" className="sb-section" onClick={() => setSubsOpen((v) => !v)}>
            {subsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Layers size={14} />
            <span>Abonelikler</span>
          </button>
          {subsOpen &&
            categories.map((cat) => {
              const items = active.filter((s) => s.categoryId === cat.id)
              if (!items.length) return null
              const open = expandedCats.has(cat.id)
              const total = fromUSD(items.reduce((sum, s) => sum + monthlyUSD(s), 0), currency)
              return (
                <div key={cat.id}>
                  <button
                    type="button"
                    className="sb-cat"
                    onClick={() =>
                      setExpandedCats((prev) => {
                        const n = new Set(prev)
                        n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id)
                        return n
                      })
                    }
                  >
                    <span style={{ width: 8, height: 8, borderRadius: 99, background: cat.color, flexShrink: 0 }} />
                    {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                    <span className="faint" style={{ fontSize: 11 }}>{formatMoney(total, currency)}</span>
                  </button>
                  {open &&
                    items.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`sb-sub ${view === 'subs' && selectedId === s.id ? 'active' : ''}`}
                        style={{ ['--cat' as any]: cat.color } as React.CSSProperties}
                        onClick={() => {
                          setSelectedId(s.id)
                          setView('subs')
                        }}
                      >
                        <ServiceIcon name={s.name} accent={s.accent} size={18} iconKey={s.iconKey} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.name}</span>
                        <span className="faint" style={{ fontSize: 11 }}>{s.price === 0 ? 'Ücretsiz' : formatMoney(s.price, s.currency)}</span>
                      </button>
                    ))}
                </div>
              )
            })}
          {(() => {
            const archived = subscriptions.filter((s) => s.archived)
            if (!archived.length) return null
            return (
              <div style={{ marginTop: 6 }}>
                <div className="sb-archived-head">
                  <Archive size={12} />
                  <span>Askıya Alınanlar</span>
                  <span className="faint" style={{ marginLeft: 'auto', fontSize: 11 }}>{archived.length}</span>
                </div>
                {archived.map((s) => {
                  const ac = categories.find((c) => c.id === s.categoryId)
                  return (
                  <button
                    key={s.id}
                    type="button"
                    className={`sb-sub archived ${view === 'subs' && selectedId === s.id ? 'active' : ''}`}
                    style={{ ['--cat' as any]: ac?.color || '#64748b' } as React.CSSProperties}
                    onClick={() => { setSelectedId(s.id); setView('subs') }}
                  >
                    <ServiceIcon name={s.name} accent={s.accent} size={18} iconKey={s.iconKey} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{s.name}</span>
                  </button>
                  )
                })}
              </div>
            )
          })()}
        </nav>
        <div className="sb-foot no-drag">
          <NavItem
            active={view === 'settings'}
            icon={<Settings size={16} />}
            label="Ayarlar"
            onClick={() => setView('settings')}
          />
          <NavItem
            active={view === 'about'}
            icon={<Info size={16} />}
            label="Hakkında"
            onClick={() => setView('about')}
          />
        </div>
        </aside>
      )}
      {!sidebarOpen && (
        <button
          type="button"
          className="icon-btn liquid-glass sb-reveal"
          onClick={() => setSidebarOpen(true)}
          aria-label="Kenar çubuğunu aç"
          title="Kenar çubuğunu aç"
        >
          <PanelLeft size={16} />
        </button>
      )}

      <section className="liquid-glass main">
        <header className="main-head drag-region">
          <h1 className="no-drag">{title}</h1>
          {headActions}
        </header>

        <div className={`main-body scroll ${view === 'subs' ? 'no-pad' : ''}`}>{body}</div>

        {view === 'subs' && (
          <footer className="footer-bar">
            <span>
              Abonelikler <strong>{filteredSubs.length}</strong>
            </span>
            <span>
              Aylık toplam <strong>{formatMoney(monthlyTotal, currency)}</strong>
            </span>
            {nextPayment && (
              <span style={{ marginLeft: 'auto' }}>
                Sonraki ödeme{' '}
                <strong>
                  {nextPayment.name} – {formatDate(nextPayment.nextDue)}
                </strong>
              </span>
            )}
          </footer>
        )}
      </section>

      {form && (
        <div className="modal-back" onClick={() => { setForm(null); setEditingId(null); setError(null) }}>
          <div className="bg animate-glass-fade" />
          <div className="modal liquid-glass animate-glass-in" style={{ maxWidth: 720, width: '100%', maxHeight: '85vh', overflow: 'auto', marginTop: 28 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ margin: 0, flex: 1, fontSize: 17 }}>
                {editingId ? 'Aboneliği Düzenle' : 'Yeni Abonelik'}
              </h2>
            </div>
            {error && <div className="err" style={{ marginBottom: 12 }}>{error}</div>}
            <FormPage
              form={form}
              setForm={setForm}
              categories={categories}
              error={null}
              onAddCategory={async (name) => {
                const c = await addCategory({ name })
                await refresh()
                setForm((f) => (f ? { ...f, categoryId: c.id } : f))
              }}
              onPickIcon={() => { setShowIconPicker(true); }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button type="button" className="btn btn-ghost" onClick={() => { setForm(null); setEditingId(null); setError(null) }}>
                İptal
              </button>
              <button type="button" className="btn btn-primary" onClick={saveForm}>
                Kaydet
              </button>
            </div>
          </div>
        </div>
      )}

      {showIconPicker && form && (
        <IconPickerModal
          selectedKey={form.iconKey || ''}
          onSelect={(key) => setForm((f) => (f ? { ...f, iconKey: key } : f))}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>
  )
}

function NavItem({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button type="button" className={`sb-item ${active ? 'active' : ''}`} onClick={onClick}>
      {icon}
      <span>{label}</span>
      {active && <span style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 3,
        height: 16,
        borderRadius: 2,
        background: '#2f6bff',
      }} />}
    </button>
  )
}

/* ----------------------------- Dashboard -------------------------------- */

function Dashboard({
  active,
  categories,
  currency,
  period,
  estimated,
  avgPer,
  freeCount,
  paidCount,
  onOpen,
}: {
  active: Subscription[]
  categories: Category[]
  currency: string
  period: Period
  estimated: number
  avgPer: number
  freeCount: number
  paidCount: number
  onOpen: (s: Subscription) => void
}) {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const byDay = useMemo(() => {
    const map = new Map<number, Subscription[]>()
    for (const s of active) {
      if (!s.nextDue) continue
      const d = new Date(s.nextDue + 'T00:00:00')
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        map.set(day, [...(map.get(day) || []), s])
      }
    }
    return map
  }, [active, year, month])

  const catSpend = categories.map((c) => {
    const list = active.filter((s) => s.categoryId === c.id)
    const paid = list.filter((s) => s.price > 0)
    const amount = fromUSD(paid.reduce((sum, s) => sum + monthlyUSD(s), 0), currency)
    return { ...c, amount, count: list.length, freeCount: list.length - paid.length }
  })
  const catMax = Math.max(...catSpend.map((c) => c.amount), 1)
  const catTotal = catSpend.reduce((s, c) => s + c.amount, 0) || 1

  // last 12 months spend estimate (current monthly recurring projected)
  const monthly = fromUSD(active.reduce((sum, s) => sum + monthlyUSD(s), 0), currency)
  const spendMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, month - (11 - i), 1)
    const label = MONTHS_SHORT[d.getMonth()]
    const isFuture = d > new Date(year, month, 1)
    // real spend this month = sum of (price of subs active that month)
    const val = isFuture ? 0 : monthly
    return { label, value: val, isFuture }
  })
  const [spendTip, setSpendTip] = useState<{ i: number; subs: Subscription[] } | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="stat-grid">
        <StatCard label={`Tahmini toplam (${PERIOD_TR[period]})`} value={formatMoney(estimated, currency)} icon={<Wallet size={18} />} accent="#2f6bff" />
        <StatCard label="Günlük ortalama" value={formatMoney(avgPer, currency)} icon={<CalendarDays size={18} />} accent="#818cf8" />
        <StatCard label={`${paidCount + freeCount} abonelik`} value={`${freeCount} ücretsiz`} icon={<Layers size={18} />} accent="#38bdf8" />
      </div>

      <div className="chip-row">
        {active.slice(0, 8).map((s) => (
          <button key={s.id} type="button" className="liquid-glass-2 sub-chip liquid-card-lift" onClick={() => onOpen(s)}>
            <ServiceIcon name={s.name} accent={s.accent} size={28} iconKey={s.iconKey} />
            <div>
              <div className="name">{s.name}</div>
              <div className="meta">
                {s.price === 0 ? (
                  <span className="pill">Ücretsiz</span>
                ) : (
                  <>
                    {formatMoney(s.price, s.currency)} / {PLAN_TR[s.plan] || s.plan}
                  </>
                )}
              </div>
            </div>
          </button>
        ))}
        {active.length > 8 && (
          <button
            type="button"
            className="liquid-glass-2 sub-chip"
            onClick={() => { /* no-op */ }}
            style={{ cursor: 'default', opacity: 0.6 }}
          >
            <span className="muted" style={{ fontSize: 13 }}>+{active.length - 8} daha</span>
          </button>
        )}
      </div>

      <div className="liquid-glass-card timeline liquid-card-sheen">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }} className="muted">
          <span>
            1 {MONTHS_SHORT[month]}
          </span>
          <span>
            1 {MONTHS_SHORT[(month + 1) % 12]} {month === 11 ? year + 1 : year}
          </span>
        </div>
        <div style={{ position: 'relative', marginTop: 8 }}>
          <div className="timeline-line" />
          <div className="timeline-track">
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const items = byDay.get(day) || []
              return (
                <div key={day} className="timeline-day">
                  {items[0] && (
                    <div
                      className="timeline-dot"
                      title={items.map((x) => `${x.name} · ${x.price === 0 ? 'Ücretsiz' : formatMoney(x.price, x.currency)}`).join('  •  ')}
                    >
                      <ServiceIcon name={items[0].name} accent={items[0].accent} size={20} iconKey={items[0].iconKey} />
                    </div>
                  )}
                  {day}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="liquid-glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Kategori dağılımı</h3>
          <span className="pill">Çubuklar</span>
        </div>
        <div style={{ marginTop: 8 }}>
          {catSpend.map((c) => {
            const pct = Math.round((c.amount / catTotal) * 100)
            return (
              <div key={c.id} className="bar-row">
                <div className="bar-label">
                  <div>{c.name}</div>
                  <div className="faint money" style={{ fontSize: 11 }}>
                    {c.freeCount > 0 ? `${formatMoney(c.amount, currency)} · ${c.freeCount} ücretsiz` : formatMoney(c.amount, currency)}
                  </div>
                </div>
                <div className="bar-track">
                  <div
                    className="liquid-glass-2 cal-cell"
                    style={{
                      width: `${Math.max(2, (c.amount / catMax) * 100)}%`,
                      background: c.color,
                    }}
                  />
                </div>
                <div className="bar-pct">%{pct}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="liquid-glass-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 15 }}>Zaman içinde harcama</h3>
          <span className="pill">{formatMoney(monthly, currency)} / ay</span>
        </div>
        <div className="spend-bars">
          {spendMonths.map((m, i) => {
            const maxVal = Math.max(...spendMonths.map((x) => x.value), 1)
            const hPct = m.value > 0 ? Math.max(6, (m.value / maxVal) * 100) : 3
            const isSel = spendTip?.i === i
            return (
              <div key={i} className="spend-col" style={{ cursor: m.value ? 'pointer' : 'default' }} onClick={() => (m.value ? setSpendTip({ i, subs: active }) : undefined)}>
                <div className="spend-bar-track">
                  <div
                    className={`spend-bar ${i === 11 ? 'hi' : ''} ${isSel ? 'sel' : ''}`}
                    style={{ height: `${hPct}%`, opacity: m.value ? 1 : 0.2 }}
                  />
                </div>
                <div className="spend-m">{m.label}</div>
                {m.value > 0 && (
                  <div className="spend-val">{formatMoney(m.value, currency)}</div>
                )}
              </div>
            )
          })}
        </div>
        {spendTip && (
          <div className="spend-tip">
            <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
              {spendMonths[spendTip.i].label} {year} · {formatMoney(monthly, currency)}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {spendTip.subs.map((s) => (
                <span key={s.id} className="spend-chip" onClick={() => onOpen(s)}>
                  <ServiceIcon name={s.name} accent={s.accent} size={16} iconKey={s.iconKey} />
                  {s.name} {s.price === 0 ? '· Ücretsiz' : `· ${formatMoney(s.price, s.currency)}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ----------------------------- Calendar --------------------------------- */

function CalendarView({
  active,
  categories,
  currency,
  cursor,
  setCursor,
  selected,
  setSelected,
  onOpen,
}: {
  active: Subscription[]
  categories: Category[]
  currency: string
  cursor: Date
  setCursor: (d: Date) => void
  selected: string
  setSelected: (iso: string) => void
  onOpen: (s: Subscription) => void
}) {
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const label = cursor.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
  const todayISO = toISO(new Date())

  const byDate = useMemo(() => {
    const map = new Map<string, Subscription[]>()
    for (const s of active) {
      if (!s.nextDue) continue
      map.set(s.nextDue, [...(map.get(s.nextDue) || []), s])
    }
    return map
  }, [active])

  const cells = useMemo(() => {
    const first = new Date(year, month, 1)
    const pad = (first.getDay() + 6) % 7
    const dim = new Date(year, month + 1, 0).getDate()
    const out: Array<{ iso: string | null; day: number | null }> = []
    for (let i = 0; i < pad; i++) out.push({ iso: null, day: null })
    for (let d = 1; d <= dim; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      out.push({ iso, day: d })
    }
    while (out.length % 7) out.push({ iso: null, day: null })
    return out
  }, [year, month])

  const monthTotal = useMemo(() => {
    let usd = 0
    for (const [iso, list] of byDate) {
      const d = new Date(iso + 'T00:00:00')
      if (d.getFullYear() === year && d.getMonth() === month) {
        for (const s of list) if (s.price > 0) usd += toUSD(s.price, s.currency)
      }
    }
    return fromUSD(usd, currency)
  }, [byDate, year, month, currency])

  const yearTotal = monthTotal * 12
  const selectedSubs = byDate.get(selected) || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button type="button" className="icon-btn liquid-glass-2" onClick={() => setCursor(new Date(year, month - 1, 1))}>
          <ChevronLeft size={16} />
        </button>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: 16, textTransform: 'capitalize' }}>{label}</h2>
        <button type="button" className="icon-btn liquid-glass-2" onClick={() => setCursor(new Date(year, month + 1, 1))}>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="stat-grid">
        <div className="liquid-glass-card stat">
          <div className="label">Haftalık toplam</div>
          <div className="value money" style={{ fontSize: 22 }}>
            {formatMoney(monthTotal / 4, currency)}
          </div>
        </div>
        <div className="liquid-glass-card stat" style={{ borderColor: 'rgba(47,107,255,0.45)', background: '#1a2236' }}>
          <div className="label">Aylık toplam</div>
          <div className="value money" style={{ fontSize: 22 }}>
            {formatMoney(monthTotal, currency)}
          </div>
        </div>
        <div className="liquid-glass-card stat">
          <div className="label">Yıllık toplam</div>
          <div className="value money" style={{ fontSize: 22 }}>
            {formatMoney(yearTotal, currency)}
          </div>
        </div>
      </div>

      <div className="cal-grid">
        {WEEKDAYS.map((d) => (
          <div key={d} className="cal-head">
            {d}
          </div>
        ))}
        {cells.map((c, i) => {
          if (!c.iso || !c.day) return <div key={i} className="cal-cell empty" />
          const items = byDate.get(c.iso) || []
          const isToday = c.iso === todayISO
          const isSel = c.iso === selected
          return (
            <button
              key={c.iso}
              type="button"
              className={`cal-cell ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''}`}
              onClick={() => setSelected(c.iso!)}
            >
              <div className="cal-num">{c.day}</div>
              <div className="cal-pay">
                {items.slice(0, 2).map((s) => (
                  <div key={s.id} className="cal-pay-row">
                    <ServiceIcon name={s.name} accent={s.accent} size={16} iconKey={s.iconKey} />
                    {s.price > 0 && <span className="money">{formatMoney(s.price, s.currency)}</span>}
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      <div className="liquid-glass-card" style={{ padding: 18 }}>
        <div style={{ fontWeight: 600, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="muted" style={{ fontWeight: 500, fontSize: 13 }}>{formatDate(selected)}</span>
          {selectedSubs.length > 0 && (
            <span className="pill" style={{ marginLeft: 'auto' }}>{selectedSubs.length} ödeme</span>
          )}
        </div>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {selectedSubs.length === 0 ? (
            <div className="cal-empty">
              <CalendarDays size={28} />
              <span>Bu gün için vadesi gelen ödeme yok.</span>
            </div>
          ) : (
            selectedSubs.map((s) => {
              const sc = categories.find((c) => c.id === s.categoryId)
              return (
                <button
                  key={s.id}
                  type="button"
                  className="cal-day-card"
                  style={{ ['--cat' as any]: sc?.color || '#2f6bff' } as React.CSSProperties}
                  onClick={() => onOpen(s)}
                >
                  <ServiceIcon name={s.name} accent={s.accent} size={30} iconKey={s.iconKey} />
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{s.name}</div>
                    <div className="muted" style={{ fontSize: 11.5, marginTop: 2 }}>{catName(categories, s.categoryId)}</div>
                  </div>
                  <span className="money" style={{ fontSize: 14 }}>{formatMoney(s.price, s.currency)}</span>
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Categories -------------------------------- */

function CategoriesView({
  categories,
  active,
  currency,
  showBanner,
  onManage,
  onOpen,
}: {
  categories: Category[]
  active: Subscription[]
  currency: string
  showBanner: boolean
  onManage: () => void
  onOpen: (s: Subscription) => void
}) {
  return (
    <div>
      {categories.map((c) => {
        const list = active.filter((s) => s.categoryId === c.id)
        const total = fromUSD(list.reduce((sum, s) => sum + monthlyUSD(s), 0), currency)
        const bgImg = backgroundForId(c.id)
        const style = showBanner
          ? {
              background: bgImg
                ? `linear-gradient(120deg, ${c.color}66, #0f172aee), url(${bgImg}) center/cover`
                : `linear-gradient(120deg, ${c.color}55, #0f172aee)`,
              ['--cat-color' as any]: c.color,
            }
          : { background: '#1a1d24', ['--cat-color' as any]: c.color }
        return (
          <div key={c.id} className="liquid-glass-card cat-banner" style={style}>
            <div className="cat-banner-inner">
              <div>
                <h3>
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: c.color,
                      display: 'inline-block',
                    }}
                  />
                  {c.name}
                </h3>
                <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 12 }} className="muted">
                  <div>
                    <div className="faint">Toplam tutar</div>
                    <div className="money" style={{ color: '#fff', fontSize: 14 }}>
                      {formatMoney(0, currency)}
                    </div>
                  </div>
                  <div>
                    <div className="faint">Tahmini toplam</div>
                    <div className="money" style={{ color: '#fff', fontSize: 14 }}>
                      {formatMoney(total, currency)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="cat-subs">
                {list.map((s) => (
                  <button key={s.id} type="button" className="liquid-glass-2 sub-chip liquid-card-lift" onClick={() => onOpen(s)}>
                    <ServiceIcon name={s.name} accent={s.accent} size={26} iconKey={s.iconKey} />
                    <div>
                      <div className="name">{s.name}</div>
                      <div className="meta">
                        {formatMoney(s.price, s.currency)} / {PLAN_TR[s.plan] || s.plan}
                      </div>
                    </div>
                  </button>
                ))}
                {list.length === 0 && (
                  <div className="cat-empty">
                    <PackageOpen size={30} />
                    <span>Bu kategoride henüz abonelik yok</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={onManage}>
          Kategorileri yönet
        </button>
      </div>
    </div>
  )
}

/* ----------------------------- Master detail ----------------------------- */

function SubsMasterDetail({
  list,
  categories,
  selected,
  currency,
  monthlyTotal,
  nextPayment,
  onSelect,
  onEdit,
  onArchive,
  onDelete,
}: {
  list: Subscription[]
  categories: Category[]
  selected: Subscription | null
  currency: string
  monthlyTotal: number
  nextPayment?: Subscription
  onSelect: (id: string) => void
  onEdit: (s: Subscription) => void
  onArchive: (s: Subscription) => void
  onDelete: (id: string) => void
}) {
  const cat = selected ? categories.find((c) => c.id === selected.categoryId) : null
  const history = useMemo(() => {
    if (!selected || selected.price <= 0 || !selected.nextDue) return []
    const out: { label: string; amount: number }[] = []
    const due = new Date(selected.nextDue + 'T00:00:00')
    for (let i = 0; i < 8; i++) {
      const d = new Date(due)
      d.setMonth(d.getMonth() - i)
      out.push({
        label: d.toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' }),
        amount: selected.price,
      })
    }
    return out
  }, [selected])

  const totalPaid = history.reduce((s, h) => s + h.amount, 0)

  return (
    <div className="md">
      <div className="md-list scroll">
        {list.map((s) => (
          <SubListItem
            key={s.id}
            sub={s}
            catName={catName(categories, s.categoryId)}
            active={selected?.id === s.id}
            onSelect={onSelect}
          />
        ))}
        {list.length === 0 && (
          <div className="muted" style={{ padding: 24, textAlign: 'center' }}>
            Abonelik bulunamadı
          </div>
        )}
      </div>

      <div className="md-detail scroll">
        {selected ? (
          <>
            <TiltCard sub={selected} cat={cat} onEdit={onEdit} onArchive={onArchive} />

            <div className="md-section">
              <h4>Özet</h4>
              <div className="md-row">
                <span className="k">Tutar</span>
                <span className="v money">{formatMoney(selected.price, selected.currency)}</span>
              </div>
              <div className="md-row">
                <span className="k">Fatura Döngüsü</span>
                <span className="v">{PLAN_TR[selected.plan] || selected.plan}</span>
              </div>
              <div className="md-row">
                <span className="k">Kategori</span>
                <span className="v">{catName(categories, selected.categoryId)}</span>
              </div>
              <div className="md-row">
                <span className="k">Ödeme Yöntemi</span>
                <span className="v">{selected.paymentMethod || 'Yok'}</span>
              </div>
              {selected.startDate && (
                <div className="md-row">
                  <span className="k">Başlangıç Tarihi</span>
                  <span className="v">{formatDate(selected.startDate)}</span>
                </div>
              )}
              {selected.endDate && (
                <div className="md-row">
                  <span className="k">Bitiş Tarihi</span>
                  <span className="v">{formatDate(selected.endDate)}</span>
                </div>
              )}
              <div className="md-row">
                <span className="k">Sonraki Vade</span>
                <span className="v">{formatDate(selected.nextDue)}</span>
              </div>
              {selected.price > 0 && (
                <div className="md-row">
                  <span className="k">Toplam Harcama</span>
                  <span className="v money">{formatMoney(totalPaid, selected.currency)}</span>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <PaymentHistory history={history} currency={selected.currency} />
            )}

            {selected.reminders && (
              <div className="md-section">
                <h4>Hatırlatıcı</h4>
                <p className="muted" style={{ fontSize: 13, margin: 0 }}>
                  Vade gününden 1 gün önce 09:00 saatinde bildirim alacaksınız.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    if (window.sublist?.checkUpcoming) window.sublist.checkUpcoming()
                    alert('Test hatırlatıcısı tetiklendi (uygulama bildirim izni gerekir).')
                  }}
                >
                  <Bell size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  Test Hatırlatıcı Gönder
                </button>
              </div>
            )}

            {(selected.note || selected.email) && (
              <div className="md-section">
                <h4>Notlar</h4>
                <p style={{ margin: 0, color: '#93c5fd', fontSize: 13 }}>{selected.email || selected.note}</p>
              </div>
            )}

            <div className="md-section" style={{ paddingBottom: 24 }}>
              <button type="button" className="btn btn-ghost" style={{ color: '#f87171' }} onClick={() => onDelete(selected.id)}>
                Aboneliği sil
              </button>
            </div>
          </>
        ) : (
          <div className="muted" style={{ padding: 40, textAlign: 'center' }}>
            Bir abonelik seçin
          </div>
        )}
      </div>
    </div>
  )
}

/* ----------------------------- Payment History --------------------------- */

function PaymentHistory({ history, currency }: { history: Array<{ label: string; amount: number }>; currency: string }) {
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 10
  const totalPages = Math.ceil(history.length / PAGE_SIZE)
  const paged = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="md-section">
      <h4>Ödeme Geçmişi</h4>
      {paged.map((h, i) => (
        <div key={i} className="md-row">
          <span className="k">
            {h.label}
            <div className="faint" style={{ fontSize: 11 }}>1 ödeme</div>
          </span>
          <span className="v money">{formatMoney(h.amount, currency)}</span>
        </div>
      ))}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          <button type="button" className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)} style={{ fontSize: 12, padding: '4px 12px', opacity: page <= 1 ? 0.4 : 1 }}>Önceki</button>
          <span className="muted" style={{ fontSize: 12, alignSelf: 'center' }}>{page} / {totalPages}</span>
          <button type="button" className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)} style={{ fontSize: 12, padding: '4px 12px', opacity: page >= totalPages ? 0.4 : 1 }}>Sonraki</button>
        </div>
      )}
    </div>
  )
}

/* ----------------------------- Form -------------------------------------- */

function FormPage({
  form,
  setForm,
  categories,
  error,
  onAddCategory,
  onPickIcon,
}: {
  form: Partial<Subscription>
  setForm: (f: Partial<Subscription> | ((p: Partial<Subscription>) => Partial<Subscription>)) => void
  categories: Category[]
  error: string | null
  onAddCategory: (name: string) => void
  onPickIcon: () => void
}) {
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))
  const icon = resolveServiceIcon(form.iconKey || form.name || '')
  const [suggestions, setSuggestions] = useState<Array<{ key: string; name: string; url: string; kind: string }>>([])
  const [showSuggest, setShowSuggest] = useState(false)
  const [manualIcon, setManualIcon] = useState(false)

  function onNameChange(val: string) {
    set('name', val)
    const q = val.trim().toLowerCase()
    // auto-derived icon only while user hasn't explicitly picked one
    if (!manualIcon) {
      const found = searchIcons(val, 6)
      setSuggestions(found)
      setShowSuggest(found.length > 0 && q.length > 0)
      if (found.length > 0 && found[0].name.toLowerCase().startsWith(q)) {
        set('iconKey', found[0].key)
      } else if (q.length === 0) {
        set('iconKey', '')
      }
    }
  }

  return (
    <div className="form-page">
      <div className="form-col scroll">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ position: 'relative' }}>
            {icon ? (
              <ServiceIcon name={form.name || 'App'} accent={form.accent || '#3b82f6'} size={72} iconKey={form.iconKey} />
            ) : (
              <div
                className="svc-icon"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  background: 'linear-gradient(145deg,#3b82f6,#60a5fa)',
                  color: '#fff',
                  fontSize: 28,
                }}
              >
                ✈
              </div>
            )}
            <button
              type="button"
              className="icon-btn liquid-glass-2"
              style={{ position: 'absolute', right: -4, bottom: -4, width: 28, height: 28 }}
              title="Simge seç"
              onClick={() => { onPickIcon(); setManualIcon(true) }}
            >
              <ImageIcon size={13} />
            </button>
          </div>
        </div>

        <div className="field">
          <label>Ad</label>
          <div style={{ position: 'relative' }}>
            <input
              value={form.name || ''}
              onChange={(e) => onNameChange(e.target.value)}
              onFocus={() => { if (form.name && !form.iconKey) { setSuggestions(searchIcons(form.name, 6)); setShowSuggest(true) } }}
              onBlur={() => setTimeout(() => setShowSuggest(false), 200)}
              autoFocus
              placeholder="Abonelik adı"
            />
            {showSuggest && suggestions.length > 0 && (
              <div className="suggest-drop liquid-glass-2">
                {suggestions.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    className="suggest-item"
                    onMouseDown={() => { set('iconKey', s.key); setManualIcon(true); setShowSuggest(false) }}
                  >
                    <img src={s.url} alt="" width={20} height={20} style={{ borderRadius: 5, objectFit: 'contain' }} />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && <div className="err">{error}</div>}
        </div>

        <div className="field">
          <label>Kategori</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              style={{ flex: 1 }}
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="icon-btn liquid-glass-2"
              onClick={() => {
                const name = prompt('Yeni kategori adı')
                if (name?.trim()) onAddCategory(name.trim())
              }}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="field">
          <label>Web Sitesi</label>
          <input value={form.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://" />
        </div>

        <div className="field-row">
          <label>Tanıtım Teklifini Etkinleştir</label>
          <Toggle on={!!(form as any).promo} onChange={(v) => set('promo' as any, v)} />
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>Notlar</label>
          <textarea
            rows={4}
            value={form.note || ''}
            onChange={(e) => set('note', e.target.value)}
            placeholder="Notlarınızdaki bağlantılar ve e-posta otomatik algılanır."
          />
        </div>
      </div>

      <div className="form-col scroll">
        <h3 style={{ marginTop: 0, fontSize: 14 }} className="muted">
          Faturalama
        </h3>
        <div className="field-row">
          <label>Tutar</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price ?? 0}
            onChange={(e) => set('price', Number(e.target.value) || 0)}
          />
        </div>
        <div className="field-row">
          <label>Para Birimi</label>
          <select value={form.currency} onChange={(e) => set('currency', e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c} {SYMBOLS[c]}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Ödeme yöntemi</label>
          <select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>
            {['Yok', 'Kart', 'Apple', 'PayPal', 'Revolut', 'N26', 'WeChat Pay', 'Ücretsiz'].map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label>Döngü</label>
          <select value={form.plan} onChange={(e) => set('plan', e.target.value)}>
            <option value="monthly">Aylık</option>
            <option value="annual">Yıllık</option>
          </select>
        </div>
        <div className="field-row">
          <label>Başlangıç Tarihi</label>
          <input type="date" value={form.startDate || ''} onChange={(e) => set('startDate', e.target.value)} />
        </div>
        <div className="field-row">
          <label>Sonraki Vade</label>
          <input type="date" value={form.nextDue || ''} onChange={(e) => set('nextDue', e.target.value)} />
        </div>
        <div className="field-row">
          <label>Bitiş Tarihi Var</label>
          <Toggle
            on={!!form.endDate}
            onChange={(v) => set('endDate', v ? form.endDate || toISO(new Date()) : '')}
          />
        </div>
        {!!form.endDate && (
          <div className="field-row">
            <label>Bitiş Tarihi</label>
            <input type="date" value={form.endDate || ''} onChange={(e) => set('endDate', e.target.value)} />
          </div>
        )}

        <h3 style={{ marginTop: 22, fontSize: 14 }} className="muted">
          Hatırlatıcılar
        </h3>
        <div className="field-row">
          <label>Hatırlatıcıyı Etkinleştir</label>
          <Toggle on={!!form.reminders} onChange={(v) => set('reminders', v)} />
        </div>
      </div>
    </div>
  )
}

/* ----------------------------- Settings ---------------------------------- */

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
  '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#ec4899', '#f43f5e', '#22c55e', '#14b8a6', '#0ea5e9',
  '#64748b', '#94a3b8', '#eab308', '#d97706', '#dc2626',
]

function InlineColorPicker({
  value,
  onChange,
}: {
  value: string
  onChange: (c: string) => void
}) {
  const [hex, setHex] = useState(value)
  useEffect(() => setHex(value), [value])
  return (
    <div className="color-picker">
      <div className="presets">
        {PRESET_COLORS.map((c) => (
          <div
            key={c}
            className={`preset-swatch ${value === c ? 'active' : ''}`}
            style={{ background: c }}
            onClick={() => { onChange(c); setHex(c) }}
          />
        ))}
      </div>
      <div className="hex-row">
        <input type="color" value={hex} onChange={(e) => { setHex(e.target.value); onChange(e.target.value) }} />
        <input type="text" value={hex} onChange={(e) => { setHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value) }} placeholder="#000000" />
      </div>
    </div>
  )
}

function SettingsPage({
  state,
  onCurrency,
  onPrefs,
  categories,
  onAddCat,
  onDelCat,
  onRenameCat,
  onUnarchive,
  onEditCat,
}: {
  state: AppState
  onCurrency: (c: string) => void
  onPrefs: (p: Partial<AppState>) => void
  categories: Category[]
  onAddCat: (name: string, color: string) => void
  onDelCat: (id: string) => void
  onRenameCat: (id: string, name: string) => void
  onUnarchive: (id: string) => void
  onEditCat?: (id: string, patch: Partial<Category>) => void
}) {
  const [showCats, setShowCats] = useState(false)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('#3b82f6')
  const archived = (state.subscriptions || []).filter((s) => s.archived)

  function startEdit(cat: Category) {
    setEditingCatId(cat.id)
    setEditName(cat.name)
    setEditColor(cat.color)
  }

  function saveEdit() {
    if (!editingCatId || !editName.trim()) return
    onEditCat?.(editingCatId, { name: editName.trim(), color: editColor })
    setEditingCatId(null)
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div className="settings-block">
        <h3>Genel</h3>
        <div className="liquid-glass-card settings-list">
          <div className="settings-row">
            <div>
              <div className="title">Varsayılan para birimi</div>
            </div>
            <select
              value={state.currency}
              onChange={(e) => onCurrency(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#fff' }}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c} {SYMBOLS[c]}
                </option>
              ))}
            </select>
          </div>
          <div className="settings-row">
            <div>
              <div className="title">Görünüm</div>
            </div>
            <div className="liquid-glass-2 seg">
              {(['system', 'light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={(state.theme || 'dark') === t ? 'active' : ''}
                  onClick={() => onPrefs({ theme: t })}
                >
                  {t === 'system' ? 'Sistem' : t === 'light' ? 'Açık' : 'Koyu'}
                </button>
              ))}
            </div>
          </div>
          <div className="settings-row">
            <div>
              <div className="title">Kategori arka planını göster</div>
            </div>
            <Toggle
              on={state.showCategoryBanner !== false}
              onChange={(v) => onPrefs({ showCategoryBanner: v })}
            />
          </div>
          <div className="settings-row">
            <div>
              <div className="title">Kenar çubuğu aboneliklerini grupla</div>
            </div>
            <Toggle
              on={state.groupSidebarSubs !== false}
              onChange={(v) => onPrefs({ groupSidebarSubs: v })}
            />
          </div>
        </div>
      </div>

      <div className="settings-block">
        <h3>Bildirimler</h3>
        <div className="liquid-glass-card settings-list">
          <div className="settings-row">
            <div>
              <div className="title">Hatırlatıcıları etkinleştir</div>
              <div className="desc">Abonelikler yenilenmeden önce bildirim alın.</div>
            </div>
            <Toggle
              on={!!state.remindersEnabled}
              onChange={(v) => onPrefs({ remindersEnabled: v })}
            />
          </div>
        </div>
      </div>

      <div className="settings-block">
        <h3>Veriler</h3>
        <div className="liquid-glass-card settings-list">
          <button type="button" className="settings-row" onClick={() => setShowCats((v) => !v)}>
            <div>
              <div className="title">Kategorileri yönet</div>
              <div className="desc">Kategori ekle, düzenle veya sil.</div>
            </div>
            <ChevronRight size={16} className="muted" />
          </button>
          <button
            type="button"
            className="settings-row"
            onClick={() => {
              const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `sublist-backup-${toISO(new Date())}.json`
              a.click()
            }}
          >
            <div>
              <div className="title">Veri dışa aktar</div>
              <div className="desc">Tüm verileri JSON olarak yedekleyin.</div>
            </div>
            <Upload size={16} className="muted" />
          </button>
          <button
            type="button"
            className="settings-row"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.json,application/json'
              input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0]
                if (!file) return
                const text = await file.text()
                try {
                  JSON.parse(text)
                  alert('Veri içeri aktarıldı. Sayfa yenilenecek.')
                  window.location.reload()
                } catch {
                  alert('Geçersiz JSON dosyası.')
                }
              }
              input.click()
            }}
          >
            <div>
              <div className="title">Veri içe aktar</div>
              <div className="desc">Yedek JSON dosyasından verileri geri yükleyin.</div>
            </div>
            <Share size={16} className="muted" />
          </button>
        </div>

        {showCats && (
          <div className="liquid-glass-card" style={{ marginTop: 12, padding: 12 }}>
            {categories.map((c) => (
              <div key={c.id}>
                {editingCatId === c.id ? (
                  <div style={{ padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 8 }}>
                    <div className="field" style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11 }}>Kategori Adı</label>
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} style={{ padding: '6px 10px', fontSize: 13 }} />
                    </div>
                    <div className="field" style={{ marginBottom: 8 }}>
                      <label style={{ fontSize: 11 }}>Vurgu Rengi</label>
                      <InlineColorPicker value={editColor} onChange={setEditColor} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-ghost" onClick={() => setEditingCatId(null)} style={{ fontSize: 12, padding: '6px 10px' }}>İptal</button>
                      <button type="button" className="btn btn-primary" onClick={saveEdit} style={{ fontSize: 12, padding: '6px 10px' }}>Kaydet</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 99, background: c.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13 }}>{c.name}</span>
                    <button type="button" className="btn btn-ghost" onClick={() => startEdit(c)} style={{ fontSize: 12, padding: '4px 10px' }}>Düzenle</button>
                    <button type="button" className="btn btn-ghost" onClick={() => { if (confirm(`"${c.name}" kategorisini silmek istediğine emin misin?`)) onDelCat(c.id) }} style={{ fontSize: 12, padding: '4px 10px', color: '#f87171' }}>Sil</button>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 8 }}
              onClick={() => {
                const name = prompt('Kategori adı')
                if (name?.trim()) {
                  const colors = PRESET_COLORS
                  const randomColor = colors[Math.floor(Math.random() * colors.length)]
                  onAddCat(name.trim(), randomColor)
                }
              }}
            >
              <Plus size={14} style={{ marginRight: 6 }} />
              Kategori ekle
            </button>
          </div>
        )}
      </div>

      <div className="settings-block">
        <h3>Askıya Alınanlar</h3>
        <div className="liquid-glass-card settings-list">
          {archived.length === 0 ? (
            <div className="settings-row">
              <div className="muted" style={{ fontSize: 13 }}>Askıya alınmış abonelik yok.</div>
            </div>
          ) : (
            archived.map((s) => (
              <div key={s.id} className="settings-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ServiceIcon name={s.name} accent={s.accent} size={22} iconKey={s.iconKey} />
                  <div>
                    <div className="title">{s.name}</div>
                    <div className="desc">{s.price === 0 ? 'Ücretsiz' : `${formatMoney(s.price, s.currency)} / ${PLAN_TR[s.plan] || s.plan}`}</div>
                  </div>
                </div>
                <button type="button" className="btn btn-ghost" onClick={() => onUnarchive(s.id)}>
                  Geri al
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
