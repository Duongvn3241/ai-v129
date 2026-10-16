#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

# Run from the project root regardless of the caller's current directory.
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Chua co Node.js. Cai Node.js trong Termux truoc." >&2; exit 1
fi
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: Chua co pnpm. Chay: npm install -g pnpm@9.12.0" >&2; exit 1
fi
if ! command -v eas >/dev/null 2>&1; then
  echo "ERROR: Chua co EAS CLI. Chay: npm install -g eas-cli" >&2; exit 1
fi

# Stale npm/yarn lockfiles make EAS select npm and fail at npm ci.
for f in package-lock.json npm-shrinkwrap.json yarn.lock; do
  if [ -f "$f" ]; then
    backup="$f.stale-backup"
    cp "$f" "$backup"
    rm -f "$f"
    echo "Da loai bo $f khoi project; ban sao luu tai $backup"
  fi
done

if [ ! -f pnpm-lock.yaml ]; then
  echo "ERROR: Khong tim thay pnpm-lock.yaml; dung build va kiem tra lai ZIP." >&2; exit 1
fi

node -e "const p=require('./package.json'); if(p.packageManager!=='pnpm@9.12.0') { console.error('packageManager phai la pnpm@9.12.0'); process.exit(1) }"

echo "==> Cai thu vien bang pnpm (lockfile bat buoc phai khop)..."
pnpm install --frozen-lockfile

echo "==> Kiem tra Expo..."
pnpm dlx expo-doctor

echo "==> Bat dau EAS Build APK Android..."
EAS_SKIP_AUTO_FINGERPRINT=1 eas build --platform android --profile preview
