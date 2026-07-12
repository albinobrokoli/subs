# Sublist Clone (macOS Electron)

Working macOS desktop subscription manager built from the static Sublist UI.

## Stack
- Electron + electron-vite + React 19 + Tailwind CSS 4
- Persistent storage: `electron-store` (JSON under app userData)
- IPC bridge via preload (`window.sublist`)

## Scripts
```bash
npm install
npm run dev          # development
npm run dist         # build .app + .dmg into release/
npm run dist:dir     # unpacked .app only
```

## Features
- Subscription CRUD + archive
- Category CRUD
- Currency cycling (USD/EUR/GBP/CNY, fixed rates)
- Day/Week/Month/Year totals
- Search, filters, sidebar counts from live data
- Native notifications for payments due within 3 days
- JSON export
