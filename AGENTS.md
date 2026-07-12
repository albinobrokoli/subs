# AGENTS.md — Subs Project Context

Proje: **Subs** — macOS için yerel abonelik yöneticisi (Electron + React 19).
Çıktı: `/Applications/Subs.app` (Spotlight'tan açılır).
Repo: github.com/albinobrokoli/subs (main). Son commit: `4d7908e`.

## Dizin Yapısı
```
sublist-clone/
├── src/
│   ├── main/
│   │   ├── index.ts        # BrowserWindow, IPC, Tray, notify, vibrancy:'sidebar'
│   │   └── store.ts        # electron-store v2, TRY, tipler, seed
│   ├── preload/index.ts    # IPC bridge → window.sublist
│   └── renderer/
│       ├── index.html
│       └── src/
│           ├── App.tsx
│           ├── components/subscription-manager.tsx  # TÜM UI (1900+ satır)
│           ├── index.css                           # saf CSS, liquid glass
│           ├── lib/
│           │   ├── dataService.ts  # tip re-export + window.sublist tipleri
│           │   ├── serviceIcons.ts  # 243 ikon ALIASES + searchIcons()
│           │   └── backgrounds.ts   # 39 bg import + backgroundForId()
│           └── assets/
│               ├── service-icons/   # 243 dosya + manifest.json
│               └── backgrounds/     # 39 jpg
├── build/icon.{svg,png}    # app icon
├── scripts/                # e2e, notify (launchd), send_tg_*.py
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
├── rules.md · plan.md · DAĞITILABILIRLIK.md
```

## Komutlar (her zaman tam yol / node ile)
- Dev: `npm run dev` (electron-vite dev)
- Build: `node ./node_modules/electron-vite/bin/electron-vite.js build`
- Paketle dir: `node ./node_modules/electron-builder/cli.js --mac --dir`
- Paketle dmg: `node ./node_modules/electron-builder/cli.js --mac dmg`
- E2E: `node scripts/e2e-playwright.mjs`

## IPC Sözleşmesi (window.sublist)
- `getState()`, `addSubscription(payload)`, `updateSubscription(id, patch)`
- `deleteSubscription(id)`, `archiveSubscription(id, bool)`
- `addCategory`, `updateCategory`, `deleteCategory`
- `persistCurrency(cur)`, `setPrefs(patch)`, `getMeta()`
- `getUpcomingPayments(withinDays)` — `remindersEnabled` false ise []

## UI Mimarisi (subscription-manager.tsx)
Tek büyük default export `SubscriptionManager` + alt bileşenler:
- `Dashboard` (stat kartları tilt + timeline + kategori dağılımı + spend chart)
- `SubsMasterDetail` → `SubListItem` (tilt kartları) + `TiltCard` (detail, bg görseli + neon)
- `FormPage` (typeahead ikon tahmini, manualIcon flag)
- `SettingsPage` (para birimi, tema, askıya alınanlar geri alma)
- `CalendarView`, `CategoriesView`, `IconPickerModal`, `StatCard`

## Tasarım Sözleşmeleri
- Koyu tema + liquid glass (`backdrop-filter` + `vibrancy:'sidebar'`).
- Renk: arka plan `#111318`, accent mavi `#2f6bff`, kategori renkleri (Eğlence kırmızı, YZ mor, Verimlilik mavi, Seyahat sarı).
- Tilt kartlar: mouse pozisyonuna göre `rotateX/rotateY`, `--neon` ile glow.
- Typeahead: isim yazarken `searchIcons()` → öneri; kullanıcı seçince `manualIcon=true` (sonra otomatik değişmez).

## Yaygın Tuzaklar
- `import.meta.glob` renderer'da çalışmadı → backgrounds.ts'te explicit import.
- Tailwind 4 build hatası → tamamen kaldırıldı, saf CSS.
- `const [x] = useState(() => new Set(categories...))` erken erişim hatası verir → expandedCats boş başlat, effect'te doldur.
- macOS'ta `timeout` komutu YOK (shell builtin değil).
- Playwright `executablePath: '/Applications/Subs.app/Contents/MacOS/Subs'`.
