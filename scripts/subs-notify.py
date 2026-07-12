#!/usr/bin/env python3
"""
Background notification service for Subs subscriptions.
Reads the electron-store JSON and sends native macOS notifications
for payments due within the configured window.

Run: python3 scripts/subs-notify.py
Designed to be called by launchd every 6 hours.
"""
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

STORE_DIR = Path.home() / "Library" / "Application Support" / "sublist-clone"
STATE_FILE = STORE_DIR / "sublist-state-v2.json"
NOTIFIED_FILE = STORE_DIR / ".subs-notified.json"

def load_state():
    if not STATE_FILE.exists():
        return None
    return json.loads(STATE_FILE.read_text())

def load_notified():
    if NOTIFIED_FILE.exists():
        try:
            return json.loads(NOTIFIED_FILE.read_text())
        except Exception:
            return {}
    return {}

def save_notified(data):
    NOTIFIED_FILE.write_text(json.dumps(data, indent=2))

def send_notification(title, message):
    """Send native macOS notification via osascript."""
    script = f'display notification "{message}" with title "{title}" sound name "default"'
    try:
        subprocess.run(["osascript", "-e", script], timeout=10, capture_output=True)
    except Exception as e:
        print(f"  notification failed: {e}", file=sys.stderr)

def main():
    state = load_state()
    if not state:
        print("no state file")
        return

    subs = state.get("subscriptions", [])
    notified = load_notified()
    today = datetime.now().date()
    today_str = today.isoformat()

    # clean old notified entries (older than 7 days)
    notified = {k: v for k, v in notified.items()
                if (today - datetime.fromisoformat(v).date()).days < 7}

    changed = False
    for sub in subs:
        if sub.get("archived") or not sub.get("nextDue") or sub.get("price", 0) <= 0:
            continue

        try:
            due = datetime.fromisoformat(sub["nextDue"]).date()
        except ValueError:
            continue

        days = (due - today).days
        if days < 0 or days > 7:
            continue

        # don't notify same day twice
        notify_key = f"{sub['id']}:{today_str}"
        if notify_key in notified:
            continue

        name = sub["name"]
        price = sub["price"]
        currency = sub.get("currency", "TRY")
        symbols = {"TRY": "₺", "USD": "$", "EUR": "€", "GBP": "£"}
        sym = symbols.get(currency, currency + " ")

        if days == 0:
            when = "bugün"
        elif days == 1:
            when = "yarın"
        else:
            when = f"{days} gün içinde"

        title = "Yaklaşan abonelik ödemesi"
        msg = f"{name} {when} ödenecek ({sym}{price:.2f})."

        print(f"notify: {name} — {when}")
        send_notification(title, msg)
        notified[notify_key] = today_str
        changed = True

    if changed:
        save_notified(notified)

    print(f"done — {len(notified)} notified today")

if __name__ == "__main__":
    main()
