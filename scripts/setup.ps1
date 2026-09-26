#Requires -Version 5.1
$ErrorActionPreference = "Stop"

Write-Host "==> Installing dependencies" -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\frontend"
npm install

if (-not (Test-Path ".env.local")) {
    Copy-Item ".env.example" ".env.local"
    Write-Host "==> Created frontend/.env.local from .env.example" -ForegroundColor Cyan
}
Pop-Location

Write-Host ""
Write-Host "==> Done. Next steps:" -ForegroundColor Green
Write-Host "  1. Start Postgres (docker compose up -d) or put a Neon URL in DATABASE_URL"
Write-Host "  2. Fill in frontend/.env.local (BETTER_AUTH_SECRET, GEMINI_API_KEY, ...)"
Write-Host "  3. Create the tables:     npm run db:migrate"
Write-Host "  4. Start the app:         npm run dev"
