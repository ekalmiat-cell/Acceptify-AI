#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Installing frontend dependencies"
(cd frontend && npm install)

echo "==> Setting up backend virtual environment"
cd backend
if [ ! -d .venv ]; then
  python3 -m venv .venv
fi
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install -e ".[dev]"
cd ..

cat <<'EOF'

==> Done. Next steps:
  1. Start Postgres:        docker compose up -d
  2. Copy env files:        cp frontend/.env.example frontend/.env.local
                             cp backend/.env.example backend/.env
  3. Fill in secrets (BETTER_AUTH_SECRET, OAuth credentials, etc.)
  4. Run everything:        npm run dev
EOF
