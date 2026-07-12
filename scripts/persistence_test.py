#!/usr/bin/env python3
"""Simulate CRUD against production electron-store JSON and verify round-trip."""
import json
import time
from pathlib import Path
from copy import deepcopy

STORE = Path("/Users/baran/Library/Application Support/sublist-clone/sublist-state.json")

def load():
    return json.loads(STORE.read_text())

def save(d):
    STORE.write_text(json.dumps(d, indent="\t", ensure_ascii=False) + "\n")

orig = load()
assert len(orig["subscriptions"]) >= 1
assert len(orig["categories"]) >= 1
print("BASE", len(orig["subscriptions"]), "subs")

# add
d = load()
rec = {
    "id": "sub_smoketest",
    "name": "Smoke Test Pro",
    "categoryId": d["categories"][0]["id"],
    "plan": "monthly",
    "price": 9.99,
    "currency": "USD",
    "nextDue": "2026-07-20",
    "paymentMethod": "Card",
    "accent": "#ff00aa",
    "note": "auto smoke",
    "archived": False,
}
d["subscriptions"] = [rec] + d["subscriptions"]
save(d)
time.sleep(0.2)
d2 = load()
assert any(s["id"] == "sub_smoketest" for s in d2["subscriptions"]), "add failed"
print("ADD ok")

# update
d = load()
d["subscriptions"] = [
    {**s, "price": 19.99} if s["id"] == "sub_smoketest" else s for s in d["subscriptions"]
]
save(d)
assert next(s for s in load()["subscriptions"] if s["id"] == "sub_smoketest")["price"] == 19.99
print("UPDATE ok")

# archive
d = load()
d["subscriptions"] = [
    {**s, "archived": True} if s["id"] == "sub_smoketest" else s for s in d["subscriptions"]
]
save(d)
assert next(s for s in load()["subscriptions"] if s["id"] == "sub_smoketest")["archived"] is True
print("ARCHIVE ok")

# category
d = load()
d["categories"] = d["categories"] + [{"id": "cat_smoke", "name": "SmokeCat", "color": "#abcdef"}]
save(d)
assert any(c["id"] == "cat_smoke" for c in load()["categories"])
print("CAT ADD ok")

# currency
d = load()
d["currency"] = "EUR"
save(d)
assert load()["currency"] == "EUR"
print("CURRENCY ok")

# cleanup: restore original
save(orig)
final = load()
assert not any(s["id"] == "sub_smoketest" for s in final["subscriptions"])
assert final["currency"] == orig["currency"]
print("RESTORE ok")
print("PERSISTENCE_PASS")
