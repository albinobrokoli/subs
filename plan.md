# PLAN.md — Subs Geliştirme Planı

Durum: v1.2.0, macOS arm64, imzasız. Tüm temel özellikler çalışıyor + Playwright testleri geçiyor.

## Faz 1: Teknik Borç Temizliği (kolay, risksiz)
- [ ] `package.json`'dan kullanılmayan `@tailwindcss/vite` + `tailwindcss` devDeps sil.
- [ ] `AppState.archivedVisible`, `groupSidebarSubs` dead alanlarını kaldır (store + UI).
- [ ] `electron-builder.yml` ile `package.json` build bloğu tekilleştir (package.json kazanır, yml silinebilir veya import edilebilir).
- [ ] `DAĞITILABILIRLIK.md`'yi güncelle (gerçek durumla).

## Faz 2: Özellik İyileştirmeleri
- [ ] **Gerçek ödeme geçmişi**: `Subscription` tipine `payments: {date, amount}[]` ekle; spend chart gerçek veriyi göstersin (şu an sadece güncel toplamı yansıtıyor).
- [ ] **Kategori banner** Unsplash yerine yerel görsele geç (TR erişim sorunu olabilir) — `assets/backgrounds` havuzunu kullan.
- [ ] **Arama (sidebar)**: abonelik sayısında arama kutusu var, dashboard'da da olsun.
- [ ] **Klavye kısayolları**: Cmd+N yeni abonelik, Cmd+F arama.
- [ ] **İhracat/İçe aktarma**: Ayarlar'da JSON yedek var, otomatik iCloud sync opsiyonu?

## Faz 3: Dağıtım (başkalarına satış)
- [ ] Apple Developer ID ($99/yıl) al.
- [ ] `electron-builder` ile `identity` + `hardenedRuntime: true` + entitlements.
- [ ] Notarization (cihazdan bağımsız, Apple sunucu).
- [ ] `mas` target (Mac App Store) mı yoksa doğrudan dağıtım mı? (App Store %15-30 komisyon, kural katı)
- [ ] Lisans: MIT mi, özel mi? Satış modeli (tek satın alma / abonelik)?

## Faz 4: Polis / Uzun Vadeli
- [ ] Otomatik güncelleme (`electron-updater`).
- [ ] Çoklu para birimi dashboard (TRY + USD karışıkken toplam).
- [ ] İstatistik: yıllık toplam, en pahalı kategori trendi.
- [ ] İçe aktarma: banka ekstresi / e-posta parse (ileri seviye).

## Notlar
- Her faz sonunda: build + Playwright + vision doğrulama + Telegram raporu.
- GitHub push öncesi HER ZAMAN kullanıcı onayı al.
- Yeni pencere açınca context kaybı olmasın diye bu 3 dosya (rules/AGENTS/plan) her oturumda okunur.
