#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo "==> $(pwd)"
git pull
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=1400}"
npm ci
npm run build
pm2 delete gdefazan 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
curl -sS "http://127.0.0.1:3000/api/storefront/products" | head -c 500
echo ""
