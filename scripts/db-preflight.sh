#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[preflight] Starting local Supabase DB..."
npm run db:local:start

echo "[preflight] Resetting local DB and reapplying migrations..."
npm run db:local:reset

echo "[preflight] Checking applied migration versions..."
npx supabase db query "select version, name from supabase_migrations.schema_migrations order by version;"

echo "[preflight] Building frontend..."
npm run build

echo "[preflight] SUCCESS: local migrations + build are green."
