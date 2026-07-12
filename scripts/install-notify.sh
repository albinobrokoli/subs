#!/bin/bash
set -e

PLIST_NAME="com.baran.subs.notify"
PLIST_SRC="$(dirname "$0")/com.baran.subs.notify.plist"
PLIST_DST="$HOME/Library/LaunchAgents/$PLIST_NAME.plist"
SCRIPT_DST="$HOME/Library/Application Support/sublist-clone/subs-notify.py"

echo "🔔 Subs bildirim servisi kuruluyor..."

# Copy notification script
mkdir -p "$HOME/Library/Application Support/sublist-clone"
cp "$(dirname "$0")/subs-notify.py" "$SCRIPT_DST"
chmod +x "$SCRIPT_DST"

# Generate plist with correct path
sed "s|__SCRIPT_PATH__|$SCRIPT_DST|g" "$PLIST_SRC" > "$PLIST_DST"

# Unload if already loaded
launchctl unload "$PLIST_DST" 2>/dev/null || true

# Load the service
launchctl load "$PLIST_DST"

echo "✅ Kuruldu!"
echo "   Servis: $PLIST_NAME"
echo "   Script: $SCRIPT_DST"
echo "   Her 6 saatte bir ve girişte çalışır"
echo ""
echo "   Test: python3 \"$SCRIPT_DST\""
echo "   Durdur: launchctl unload \"$PLIST_DST\""
echo "   Başlat: launchctl load \"$PLIST_DST\""
