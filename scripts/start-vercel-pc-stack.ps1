# MonArgent — produccion hibrida
#   Frontend PWA  -> Vercel
#   Backend + MySQL -> esta PC + ngrok (backend)
#
# Uso:
#   .\scripts\start-vercel-pc-stack.ps1
#
# Requisitos:
#   - MySQL en localhost:3306
#   - backend/.env configurado (ver backend/.env.example seccion PRODUCCION)
#   - Dominio ngrok reservado en scripts/ngrok-backend.yml
#   - ngrok autenticado: ngrok config add-authtoken TU_TOKEN

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$BackendEnv = Join-Path $Root "backend\.env"
$NgrokBackendConfig = Join-Path $PSScriptRoot "ngrok-backend.yml"

function Write-Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Wait-ForHttp($Url, $Retries = 40) {
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3 | Out-Null
            return $true
        } catch {
            Start-Sleep -Seconds 3
        }
    }
    return $false
}

function Get-BackendNgrokUrl($configPath) {
    try {
        $yaml = Get-Content $configPath -Raw
        if ($yaml -match 'domain:\s*(\S+)') {
            $domain = $Matches[1].Trim()
            if ($domain -and $domain -ne 'REPLACE_BACKEND_DOMAIN') {
                return "https://$domain"
            }
        }
    } catch { }
    return $null
}

Write-Host "=== MonArgent: PC (backend + MySQL) + ngrok ===" -ForegroundColor Yellow
Write-Host "Frontend: deploy en Vercel (no se levanta aqui)" -ForegroundColor DarkGray
Write-Host ""

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Error "ngrok no esta instalado. https://ngrok.com/download"
}

if (-not (Test-Path $BackendEnv)) {
    Write-Error "Falta backend/.env — copia backend/.env.example y completa la seccion PRODUCCION."
}

if (-not (Test-Path $NgrokBackendConfig)) {
    Write-Error "Falta scripts/ngrok-backend.yml"
}

$reservedUrl = Get-BackendNgrokUrl $NgrokBackendConfig
if (-not $reservedUrl) {
    Write-Error @"
Edita scripts/ngrok-backend.yml y reemplaza REPLACE_BACKEND_DOMAIN por tu dominio reservado en ngrok.
Ejemplo: monargent-api.ngrok-free.dev
"@
}

$userConfig = Join-Path (Join-Path ${env:LOCALAPPDATA} 'ngrok') 'ngrok.yml'
if (-not (Test-Path $userConfig)) {
    Write-Error "Ejecuta: ngrok config add-authtoken TU_TOKEN"
}

Write-Step "Iniciando Spring Boot (:8080)..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$Root\backend'; .\mvnw.cmd spring-boot:run"
)

Write-Step "Esperando backend /health..."
if (-not (Wait-ForHttp "http://localhost:8080/api/v1/health")) {
    Write-Warning "Backend lento o fallo — revisa la ventana de Spring Boot."
}

Write-Step "Iniciando ngrok (backend)..."
Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "ngrok start backend --config '$userConfig' --config '$NgrokBackendConfig'"
)

Start-Sleep -Seconds 3

$apiBase = "$reservedUrl/api/v1"

Write-Host ""
Write-Host "=== STACK LOCAL LISTO ===" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend publico:  $apiBase" -ForegroundColor White
Write-Host "  Health check:     $apiBase/health" -ForegroundColor DarkGray
Write-Host "  MySQL:            localhost:3306" -ForegroundColor DarkGray
Write-Host "  Panel ngrok:      http://127.0.0.1:4040" -ForegroundColor DarkGray
Write-Host ""
Write-Host "=== CONFIGURA EN VERCEL (Settings -> Environment Variables) ===" -ForegroundColor Cyan
Write-Host "  VITE_API_URL = $apiBase" -ForegroundColor Yellow
Write-Host ""
Write-Host "=== CONFIGURA EN backend/.env ===" -ForegroundColor Cyan
Write-Host "  APP_FRONTEND_URL = https://monargent-frontend.vercel.app" -ForegroundColor Yellow
Write-Host "  MAIL_USERNAME / MAIL_PASSWORD = SMTP para codigos de verificacion" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pagos grupales: alias MP + comprobante (sin OAuth en Developers)." -ForegroundColor DarkGray
Write-Host ""
Write-Host "Mantene esta PC encendida y ngrok activo mientras uses la app en produccion." -ForegroundColor Magenta
Write-Host ""
