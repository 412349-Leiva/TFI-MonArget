# MonArgent — demo PWA en celular (PC como servidor + ngrok)
#
# Requisitos:
#   - MySQL corriendo en localhost:3306
#   - backend/.env configurado (DB, JWT, GEMINI, MAIL)
#   - ngrok instalado y autenticado: https://ngrok.com/download
#     ngrok config add-authtoken TU_TOKEN
#
# Uso:
#   .\scripts\start-pwa-mobile.ps1
#
# El script:
#   1. Compila el frontend (PWA)
#   2. Levanta backend (:8080) y preview (:5173) en ventanas nuevas
#   3. Abre ngrok con 2 tuneles HTTPS
#   4. Escribe app-config.json con la URL del backend para el celular
#   5. Muestra la URL HTTPS del frontend para abrir en el celular e instalar la PWA

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Write-Step($msg) {
    Write-Host "`n==> $msg" -ForegroundColor Cyan
}

function Wait-ForHttp($Url, $Retries = 30) {
    for ($i = 1; $i -le $Retries; $i++) {
        try {
            Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 | Out-Null
            return $true
        } catch {
            Start-Sleep -Seconds 2
        }
    }
    return $false
}

function Get-NgrokTunnelUrl($name) {
    $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
    $tunnel = $resp.tunnels | Where-Object { $_.name -eq $name } | Select-Object -First 1
    if (-not $tunnel) {
        return $null
    }
    return ($tunnel.public_url -replace '^http://', 'https://')
}

function Write-AppConfig($backendUrl, $paths) {
    $apiBaseUrl = "$backendUrl/api/v1".Replace('//api', '/api')
    $json = @{ apiBaseUrl = $apiBaseUrl } | ConvertTo-Json -Compress
    foreach ($path in $paths) {
        $dir = Split-Path -Parent $path
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
        }
        Set-Content -Path $path -Value $json -Encoding UTF8
    }
    Write-Host "  app-config.json -> $apiBaseUrl" -ForegroundColor Green
}

Write-Host "=== MonArgent PWA movil (PC + ngrok) ===" -ForegroundColor Yellow

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Error "ngrok no esta instalado. Descargalo de https://ngrok.com/download"
}

if (-not (Test-Path "$Root\backend\.env")) {
    Write-Warning "No existe backend/.env — copia backend/.env.example y completa tus credenciales."
}

Write-Step "Compilando frontend (PWA)..."
Push-Location "$Root\frontend"
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Step "Iniciando backend Spring Boot (:8080)..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$Root\backend'; .\mvnw.cmd spring-boot:run"
)

Write-Step "Esperando backend..."
if (-not (Wait-ForHttp "http://localhost:8080/api/v1/health")) {
    Write-Warning "Backend no respondio en /health — puede tardar mas. Continuando..."
}

Write-Step "Iniciando frontend preview (:5173)..."
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$Root\frontend'; npm run preview:host"
)

Write-Step "Esperando frontend preview..."
if (-not (Wait-ForHttp "http://localhost:5173")) {
    Write-Warning "Frontend preview no respondio aun."
}

Write-Step "Iniciando ngrok (frontend:5173 + backend:8080)..."
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

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "ngrok start --all --config '$configPath'"
)

Write-Step "Obteniendo URLs publicas de ngrok..."
Start-Sleep -Seconds 4
$frontendUrl = Get-NgrokTunnelUrl "frontend"
$backendUrl = Get-NgrokTunnelUrl "backend"

$retries = 0
while ((-not $frontendUrl -or -not $backendUrl) -and $retries -lt 10) {
    Start-Sleep -Seconds 2
    $frontendUrl = Get-NgrokTunnelUrl "frontend"
    $backendUrl = Get-NgrokTunnelUrl "backend"
    $retries++
}

if ($backendUrl) {
    Write-AppConfig -backendUrl $backendUrl -paths @(
        "$Root\frontend\dist\app-config.json",
        "$Root\frontend\public\app-config.json"
    )
} else {
    Write-Warning "No se pudo leer el tunel backend. Configura manualmente frontend/dist/app-config.json"
}

Write-Host ""
Write-Host "=== LISTO PARA EL CELULAR ===" -ForegroundColor Green
Write-Host ""
if ($frontendUrl) {
    Write-Host "  1. Abri en el celular: $frontendUrl" -ForegroundColor White
    Write-Host "  2. Safari/Chrome -> Compartir -> Agregar a pantalla de inicio" -ForegroundColor White
    Write-Host "  3. Inicia sesion y proba Scan con la camara" -ForegroundColor White
} else {
    Write-Host "  Abri http://127.0.0.1:4040 y copia la URL HTTPS del tunel 'frontend'" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "  Panel ngrok: http://127.0.0.1:4040" -ForegroundColor DarkGray
Write-Host "  Backend local: http://localhost:8080/api/v1" -ForegroundColor DarkGray
Write-Host "  MySQL debe estar corriendo en localhost:3306" -ForegroundColor DarkGray
Write-Host ""
