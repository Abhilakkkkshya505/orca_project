# PowerShell Development Database & Cache Reset Helper for Windows
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\..\.."
$InfraDir = "$ProjectRoot\infra"

Write-Host "=== Resetting ORCA Development Environment ===" -ForegroundColor Red
$confirm = Read-Host "Are you sure you want to drop development data and volumes? (y/N)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "Reset cancelled."
    exit 0
}

try {
    docker ps | Out-Null
    Write-Host "[*] Tearing down Docker volumes..." -ForegroundColor Yellow
    docker compose -f "$InfraDir\docker-compose.yml" down -v
    
    Write-Host "[*] Re-starting services..." -ForegroundColor Cyan
    docker compose -f "$InfraDir\docker-compose.yml" up -d db redis
    
    Start-Sleep -Seconds 5
    Write-Host "[*] Running fresh migrations..." -ForegroundColor Cyan
    docker compose -f "$InfraDir\docker-compose.yml" up -d api
    Start-Sleep -Seconds 3
    docker compose -f "$InfraDir\docker-compose.yml" exec api python manage.py migrate
    
    Write-Host "[*] Seeding demo data..." -ForegroundColor Cyan
    docker compose -f "$InfraDir\docker-compose.yml" exec api python manage.py seed_demo_data
    
    Write-Host "[+] Environment reset and re-seeded successfully." -ForegroundColor Green
} catch {
    Write-Host "[!] Docker reset failed or Docker is offline." -ForegroundColor Red
}
