#Requires -Version 5.1
$ErrorActionPreference = "Stop"

Write-Host "==> Installing frontend dependencies" -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\frontend"
npm install
Pop-Location

Write-Host "==> Setting up backend virtual environment" -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\backend"
if (-not (Test-Path ".venv")) {
    py -m venv .venv
}
& ".\.venv\Scripts\python.exe" -m pip install --upgrade pip
& ".\.venv\Scripts\python.exe" -m pip install -e ".[dev]"
Pop-Location

Write-Host ""
Write-Host "==> Done. Next steps:" -ForegroundColor Green
Write-Host "  1. Start Postgres:        docker compose up -d"
Write-Host "  2. Copy env files:        cp frontend/.env.example frontend/.env.local"
Write-Host "                            cp backend/.env.example backend/.env"
Write-Host "  3. Fill in secrets (BETTER_AUTH_SECRET, OAuth credentials, etc.)"
Write-Host "  4. Run everything:        npm run dev"
