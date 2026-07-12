#!/usr/bin/env python3
import json
import urllib.parse
import urllib.request
from pathlib import Path

env = {}
for line in Path("/Users/baran/.hermes/.env").read_text().splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    k, v = line.split("=", 1)
    env[k] = v.strip().strip('"').strip("'")

token = env["TELEGRAM_BOT_TOKEN"]
chat = env["TELEGRAM_HOME_CHANNEL"]

text = """🟢 Sublist — ONAY NOKTASI 2 (Build + test)

Çalışan:
• Electron macOS uygulaması (Sublist.app)
• Sidebar: Dashboard / Calendar / Categories / All + kategori filtreleri
• Calendar: ay takvimi, gün seçimi, ödemeler listesi
• CRUD + arşiv + kategori yönetimi + para birimi + arama + period totals
• Liquid glass geçiş animasyonları (view-glass-in)
• electron-store kalıcılık (kapat/aç aynı userData)
• Native Notification (3 gün içi ödemeler)
• Smoke + persistence testleri PASS

Build çıktıları:
• ~/Desktop/hermes/sublist-clone/release/mac-arm64/Sublist.app
• ~/Desktop/hermes/sublist-clone/release/Sublist-1.0.0-arm64.dmg (109MB)

Test senaryoları:
1. App açılıyor (release .app doğrulandı)
2. Store: 16 abonelik / 4 kategori seed
3. ADD/UPDATE/ARCHIVE/CAT/CURRENCY/DELETE → PASS
4. JSON kalıcılık restore → PASS
5. DMG manuel hdiutil ile üretildi (electron-builder hdiutil busy hatası aşıldı)

Bilinen sınırlar:
• Code signing yok (identity: null) — Gatekeeper uyarısı olabilir
• Varsayılan Electron ikonu
• Kurlar sabit tablo (canlı API yok)
• İlk açılışta yaklaşan ödemeler için macOS bildirim izni isteyebilir

Komutlar:
npm run dev | open release/mac-arm64/Sublist.app
"""

data = urllib.parse.urlencode({"chat_id": chat, "text": text}).encode()
req = urllib.request.Request(
    f"https://api.telegram.org/bot{token}/sendMessage", data=data, method="POST"
)
with urllib.request.urlopen(req, timeout=20) as r:
    d = json.loads(r.read().decode())
print("ok" if d.get("ok") else d)
