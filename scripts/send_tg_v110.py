#!/usr/bin/env python3
import json, urllib.parse, urllib.request
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

text = """🟢 Sublist — v1.1.0 yayınlandı

SubList ekran görüntülerine birebir yakın tasarım:

📋 Yeni tasarım:
• Koyu slate tema + #2F6BFF mavi accent
• Türkçe UI (Gösterge Paneli, Takvim, Kategoriler, Abonelikler, Ayarlar)
• TRY varsayılan para birimi (₺)
• Dashboard: özet kartlar, timeline, kategori dağılım çubuğu, aylık harcama grafiği
• Takvim: aylık/haftalık/yıllık toplamlar, ödeme günleri
• Kategoriler: banner arka planlı kartlar, alt abonelik listesi
• Abonelikler: sol liste + sağ detay (master-detail)
• Tam sayfa form: faturalama + hatırlatıcı
• 116 marka ikonu (simple-icons + favicon)
• Settings: tema, bildirim, kategori yönetimi

📋 Seed veriler:
Amazon Prime Video (₺69/ay), Google Gemini x2 (ücretsiz),
ChatGPT Plus, Spotify, Netflix, iCloud+, DigitalOcean

📦 Çıktılar:
• ~/Desktop/hermes/sublist-clone/release/mac-arm64/Sublist.app
• ~/Desktop/hermes/sublist-clone/release/Sublist-1.1.0-arm64.dmg (116MB)

Aç: open release/mac-arm64/Sublist.app
"""

data = urllib.parse.urlencode({"chat_id": chat, "text": text}).encode()
req = urllib.request.Request(
    f"https://api.telegram.org/bot{token}/sendMessage", data=data, method="POST"
)
with urllib.request.urlopen(req, timeout=20) as r:
    d = json.loads(r.read().decode())
print("ok" if d.get("ok") else d)
