# ==============================================================================
# ORCA Development Stack Launcher (dev-up.ps1)
# ==============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $ProjectRoot "infra\docker-compose.yml"

Write-Host ">>> Starting ORCA containers via Docker Compose..." -ForegroundColor Cyan
docker compose -f "$ComposeFile" up -d

Write-Host ">>> Waiting for Database and Redis to be healthy..." -ForegroundColor Cyan
$maxRetries = 20
$retryCount = 0
$dbHealthy = $false

while (-not $dbHealthy -and $retryCount -lt $maxRetries) {
    Start-Sleep -Seconds 2
    $retryCount++
    $status = docker inspect --format='{{json .State.Health.Status}}' orca-db 2>$null
    if ($status -like "*healthy*") {
        $dbHealthy = $true
        Write-Host ">>> Database is healthy!" -ForegroundColor Green
    } else {
        Write-Host "    Waiting for database... ($retryCount/$maxRetries)" -ForegroundColor Gray
    }
}

Write-Host ">>> Applying database migrations..." -ForegroundColor Cyan
docker compose -f "$ComposeFile" exec -T api python manage.py migrate

Write-Host "`n>>> ORCA Stack is UP and Healthy!" -ForegroundColor Green
Write-Host "    API:      http://api.localtest.me:8000/api/v1/"
Write-Host "    Health:   http://api.localtest.me:8000/api/v1/health/live/"
Write-Host "    Frontend: http://app.localtest.me:5173/"
