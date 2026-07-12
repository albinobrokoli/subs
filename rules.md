# Subs — Kurallar (RULES)

Bu proje Baran'ın macOS abonelik yöneticisi. Aşağıdaki kurallar değiştirilemez.

## Genel
- Dil: Türkçe arayüz metinleri, teknik terimler İngilizce (build, electron, IPC vb.).
- Konuşma dili: Türkçe.
- GUI uygulaması: macOS'ta Spotlight'tan / Applications'tan açılır, terminal gerekmez.

## Teknik Yığın (stack)
- Electron + electron-vite + React 19 (TSX).
- CSS: Tailwind **kaldırıldı** — saf CSS (`src/renderer/src/index.css`). `@tailwindcss/vite` ve `tailwindcss` package.json'da hâlâ duruyor ama kullanılmıyor; ileride temizlenecek.
- State: `electron-store` (main process, `src/main/store.ts`) + preload IPC bridge (`window.sublist`).
- Renderer doğrudan store'a yazmaz; sadece `window.sublist.*` çağırır.
- Para birimi: varsayılan **TRY (₺)**. Kur sabit tablo (`RATES` in store.ts) — canlı API yok. `TRY: 34.5` sabit.
- İkonlar: 243 adet (`src/renderer/src/assets/service-icons/`, Simple Icons SVG + DuckDuckGo favicon PNG). `serviceIcons.ts` ALIASES ile isim→ikon eşlemesi.
- Arka plan görselleri: 39 adet (`src/renderer/src/assets/backgrounds/*.jpg`), `lib/backgrounds.ts` içinde explicit import edilir (import.meta.glob çalışmadı). `backgroundForId(id)` hash ile atar.

## Build & Paketleme
- Build: `node ./node_modules/electron-vite/bin/electron-vite.js build`
- Paketle (dir): `node ./node_modules/electron-builder/cli.js --mac --dir`
- Paketle (dmg): `node ./node_modules/electron-builder/cli.js --mac dmg`
- İmza YOK (`identity: null`) → Gatekeeper uyarısı. Kurulumdan sonra: `xattr -cr /Applications/Subs.app`
- Kurulum: `cp -R release/mac-arm64/Subs.app ~/Applications/Subs.app` + Finder osascript ile `/Applications/'`a kopyala (sudo yok).

## Çalıştırma / Test
- Test: Playwright (`scripts/e2e-playwright.mjs`) — `node scripts/e2e-playwright.mjs` (app açıkken).
- Screenshot + vision ile görsel doğrulama yapılır.
- Electron'da `backdrop-filter` sadece `vibrancy: 'sidebar'` (main.ts) ile çalışır.

## Güvenlik (değiştirilemez)
- İzinsiz dosya silme, mesaj atma, dışarıya veri paylaşma YOK.
- GitHub push = dışarıya veri → önce onay al.
- Telegram raporları sadece `/Users/baran/.hermes/.env` içindeki token ile, script okuyarak gönderilir.

## Dağıtılabilirlik (önemli)
- Şu an SADECE kendi PC'sinde çalışır (imzasız).
- Başkalarına satmak isterse: $99/yıl Apple Developer ID + notarization gerekir.
- Detay: `DAĞITILABILIRLIK.md` (proje kökünde).

## Bilinen Sorunlar / Teknik Borç
- `package.json` hâlâ `@tailwindcss/vite` + `tailwindcss` devDependencies'te (kullanılmıyor, silinebilir).
- `AppState.archivedVisible` ve `groupSidebarSubs` alanları artık kullanılmıyor (dead code).
- Kategori banner'ları Unsplash URL kullanıyor — TR'den bazen erişilemeyebilir.
- Spend chart (Zaman içinde harcama) gerçek ödeme geçmişi TUTMAZ; sadece güncel aylık toplamı 12 aya yansıtır (gelecek aylar 0).
- `electron-builder.yml` dosyası var ama build bloğu `package.json`'da — yinelenmiş; hangisinin geçerli olduğu belirsiz (package.json kazanır).
