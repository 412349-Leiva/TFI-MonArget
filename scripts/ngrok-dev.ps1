# Tunel HTTPS para demo PWA en celular (ngrok free)
# Un solo tunel al frontend; /api/v1 se proxea al backend local.
#
# Uso (backend + preview ya corriendo):
#   .\scripts\ngrok-dev.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

function Get-NgrokTunnelUrl() {
    try {
        $resp = Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels"
        $tunnel = $resp.tunnels | Select-Object -First 1
        if ($tunnel) {
            return ($tunnel.public_url -replace '^http://', 'https://')
        }
    } catch {
        return $null
    }
    return $null
}

function Write-AppConfig() {
    $json = @{ apiBaseUrl = "/api/v1" } | ConvertTo-Json -Compress
    foreach ($path in @(
        "$Root\frontend\dist\app-config.json",
        "$Root\frontend\public\app-config.json"
    )) {
        $dir = Split-Path -Parent $path
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        Set-Content -Path $path -Value $json -Encoding UTF8
    }
    Write-Host "  app-config.json -> /api/v1 (mismo dominio)" -ForegroundColor Green
}

Write-Host "=== MonArgent ngrok (1 tunel -> frontend :5173) ===" -ForegroundColor Cyan
Write-Host ""

if (-not (Get-Command ngrok -ErrorAction SilentlyContinue)) {
    Write-Error "ngrok no esta instalado. Descargalo de https://ngrok.com/download"
}

$userConfig = Join-Path $env:LOCALAPPDATA "ngrok\ngrok.yml"
if (-not (Test-Path $userConfig)) {
    Write-Error "No hay authtoken de ngrok. Ejecuta: ngrok config add-authtoken TU_TOKEN"
}

$configPath = Join-Path $PSScriptRoot "ngrok.yml"
if (-not (Test-Path $configPath)) {
    Write-Error "Falta scripts/ngrok.yml"
}

Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "ngrok start frontend --config '$userConfig' --config '$configPath'"
)

Write-Host "Esperando tunel ngrok..." -ForegroundColor Yellow
Start-Sleep -Seconds 4

$frontendUrl = $null
for ($i = 0; $i -lt 15; $i++) {
    $frontendUrl = Get-NgrokTunnelUrl
    if ($frontendUrl) { break }
    Start-Sleep -Seconds 2
}

Write-AppConfig

Write-Host ""
if ($frontendUrl) {
    Write-Host "URL PWA para el celular: $frontendUrl" -ForegroundColor Green
} else {
    Write-Host "Panel ngrok: http://127.0.0.1:4040" -ForegroundColor Yellow
}
Write-Host "Panel ngrok: http://127.0.0.1:4040" -ForegroundColor DarkGray
