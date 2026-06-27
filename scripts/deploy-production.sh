#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
ECOSYSTEM_FILE="${ECOSYSTEM_FILE:-$APP_DIR/ecosystem.config.cjs}"

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_file() {
  if [[ ! -f "$1" ]]; then
    echo "Missing required file: $1" >&2
    exit 1
  fi
}

require_command npm
require_command pm2
require_file "$BACKEND_DIR/package.json"
require_file "$FRONTEND_DIR/package.json"
require_file "$BACKEND_DIR/.env"
require_file "$FRONTEND_DIR/.env"
require_file "$ECOSYSTEM_FILE"

cd "$APP_DIR"

echo "==> Installing backend dependencies"
npm ci --prefix "$BACKEND_DIR"

echo "==> Installing frontend dependencies"
npm ci --prefix "$FRONTEND_DIR"

echo "==> Building frontend"
npm --prefix "$FRONTEND_DIR" run build

echo "==> Reloading PM2 apps"
pm2 startOrReload "$ECOSYSTEM_FILE" --update-env
pm2 save

echo "==> Deploy complete"
