# ==============================================================================
# ORCA Development Stack Reset (dev-reset.ps1)
# Wipes volumes, rebuilds, migrates, creates dev superuser, seeds demo data.
# ==============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $ProjectRoot "infra\docker-compose.yml"

Write-Host ">>> Wiping existing ORCA volumes and containers..." -ForegroundColor Yellow
docker compose -f "$ComposeFile" down -v

Write-Host ">>> Building and starting fresh ORCA containers..." -ForegroundColor Cyan
docker compose -f "$ComposeFile" up -d --build

Write-Host ">>> Waiting for Database to become healthy..." -ForegroundColor Cyan
$maxRetries = 30
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
        Write-Host "    Waiting for database container... ($retryCount/$maxRetries)" -ForegroundColor Gray
    }
}

Write-Host ">>> Running migrations..." -ForegroundColor Cyan
docker compose -f "$ComposeFile" exec -T api python manage.py migrate

Write-Host ">>> Creating development superuser..." -ForegroundColor Cyan
$createUserScript = "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@orca.example').exists():
    User.objects.create_superuser('admin@orca.example', 'admin', 'OrcaDevAdmin2026!')
    print('Superuser admin@orca.example created.')
else:
    print('Superuser already exists.')
"
docker compose -f "$ComposeFile" exec -T api python manage.py shell -c "$createUserScript"

Write-Host ">>> Seeding demo data..." -ForegroundColor Cyan
docker compose -f "$ComposeFile" exec -T api python manage.py seed_demo_data

Write-Host "`n>>> ORCA Stack Reset Complete and Verified!" -ForegroundColor Green
Write-Host "    Superuser: admin@orca.example / OrcaDevAdmin2026!"
