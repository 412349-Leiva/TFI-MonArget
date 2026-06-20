# Tunel HTTPS para demo PWA en celular (ngrok free)
# Requisitos: ngrok instalado -> https://ngrok.com/download
#
# Uso:
#   1. Backend:  cd backend && .\mvnw.cmd spring-boot:run
#   2. Frontend: cd frontend && npm run dev:host
#   3. En otra terminal: .\scripts\ngrok-dev.ps1
#   4. Copiar URLs ngrok a frontend/.env (VITE_API_URL) y backend/.env (CORS_ALLOWED_ORIGINS)
#   5. Reiniciar frontend y backend si cambiaste .env
#   6. Abrir URL HTTPS del FRONTEND en el celular -> Instalar PWA

Write-Host "=== MonArgent ngrok (2 tuneles) ===" -ForegroundColor Cyan
Write-Host "Frontend :5173 | Backend :8080"
Write-Host ""
Write-Host "Tras iniciar, configura:" -ForegroundColor Yellow
Write-Host "  frontend/.env  -> VITE_API_URL=https://<backend-ngrok>/api/v1"
Write-Host "  backend/.env   -> CORS_ALLOWED_ORIGINS=http://localhost:5173,https://<frontend-ngrok>"
Write-Host ""

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Error "ngrok no esta instalado. Descargalo de https://ngrok.com/download"
    exit 1
}

# ngrok free: un proceso por tunel (yml config)
$configPath = Join-Path $PSScriptRoot "ngrok.yml"
@"
version: "2"
tunnels:
  frontend:
    addr: 5173
    proto: http
  backend:
    addr: 8080
    proto: http
"@ | Set-Content -Path $configPath -Encoding UTF8

ngrok start --all --config $configPath
