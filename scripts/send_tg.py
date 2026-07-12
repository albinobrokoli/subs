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

token = env.get("TELEGRAM_BOT_TOKEN")
chat = env.get("TELEGRAM_HOME_CHANNEL")
if not token or not chat:
    raise SystemExit("missing telegram config")

text = """🟢 Sublist — ONAY NOKTASI 1 (Veri katmanı)

Tamamlanan:
• Repo incelendi (Next.js UI + localStorage dataService)
• electron-vite + React iskeleti kuruldu
• electron-store kalıcı JSON depolama aktif
  → Application Support/sublist-clone/sublist-state.json
  → seed: 4 kategori, 16 abonelik
• IPC: getState, subs CRUD/archive, cats CRUD, currency, totals, notify
• Smoke test: ADD/UPDATE/ARCHIVE/CAT/CURRENCY/DELETE/TOTALS → PASS
• Uygulama açılıyor (1280x800)

Teknik: sabit kur tablosu (USD bazlı), storage main process

Onay verirsen Adım 4–6'ya devam."""

data = urllib.parse.urlencode({"chat_id": chat, "text": text}).encode()
req = urllib.request.Request(
    f"https://api.telegram.org/bot{token}/sendMessage", data=data, method="POST"
)
with urllib.request.urlopen(req, timeout=20) as r:
    d = json.loads(r.read().decode())
print("ok" if d.get("ok") else d)
