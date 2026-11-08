#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"
command -v node >/dev/null || { echo 'Install Node.js 22+ first.'; exit 1; }
if [[ ! -d node_modules ]]; then npm ci; fi
exec npm run desktop -- "$@"
