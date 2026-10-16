#!/data/data/com.termux/files/usr/bin/bash
set -u
mkdir -p "$HOME/storage/downloads" 2>/dev/null || true
OUT="$HOME/storage/downloads/studio-stt-log-$(date +%Y%m%d-%H%M%S).txt"
if ! command -v adb >/dev/null 2>&1; then
  echo 'Chưa có adb. Cài pkg install android-tools; bật Wireless debugging, ghép nối ADB trước.'
  exit 1
fi
if ! adb get-state 2>/dev/null | grep -q device; then
  echo 'ADB chưa kết nối. Bật Wireless debugging trong Developer options, chạy adb pair / adb connect.'
  exit 1
fi
printf 'Đang ghi logcat vào %s\nMở AI Subtitle Studio, chạy STT đến khi lỗi; quay lại Termux nhấn Ctrl+C.\n' "$OUT"
adb logcat -v threadtime '*:E' > "$OUT"
