#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-local}"

if [[ "$MODE" != "local" && "$MODE" != "linked" ]]; then
  echo "Usage: $0 [local|linked]"
  exit 1
fi

node scripts/run-db-integrity-checklist.mjs "$MODE"
