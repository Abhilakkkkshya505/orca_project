# PowerShell Development Startup Helper for Windows
param (
    [switch]$Build = $false,
    [switch]$NoFrontend = $false
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path "$ScriptDir\..\.."
$InfraDir = "$ProjectRoot\infra"

Write-Host "=== Starting ORCA Local Stack ===" -ForegroundColor Cyan

# Ensure .env files exist
if (-not (Test-Path "$ProjectRoot\backend\.env")) {
    Write-Host "[*] Copying backend/.env.example to backend/.env..." -ForegroundColor Yellow
    Copy-Item "$ProjectRoot\backend\.env.example" "$ProjectRoot\backend\.env"
}
if (-not (Test-Path "$ProjectRoot\frontend\.env")) {
    Write-Host "[*] Copying frontend/.env.example to frontend/.env..." -ForegroundColor Yellow
    Copy-Item "$ProjectRoot\frontend\.env.example" "$ProjectRoot\frontend\.env"
}

# Start Docker containers if Docker daemon is responsive
$dockerRunning = $false
try {
    docker ps | Out-Null
    $dockerRunning = $true
} catch {
    $dockerRunning = $false
}

if ($dockerRunning) {
    Write-Host "[+] Docker is active. Launching db, redis, api..." -ForegroundColor Green
    $composeArgs = @("-f", "$InfraDir\docker-compose.yml", "up", "-d")
    if ($Build) { $composeArgs += "--build" }
    & docker compose $composeArgs
    
    Write-Host "[*] Running migrations in api container..." -ForegroundColor Cyan
    docker compose -f "$InfraDir\docker-compose.yml" exec api python manage.py migrate
} else {
    Write-Host "[!] Docker daemon not responsive. Falling back to local services." -ForegroundColor Yellow
    Write-Host "    Make sure PostgreSQL/PostGIS (port 5432) and Redis (port 6379) are running." -ForegroundColor Yellow
}

if (-not $NoFrontend) {
    Write-Host "[*] Launching frontend Vite dev server..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\frontend'; pnpm dev"
}

Write-Host "`nLocal Endpoints:" -ForegroundColor Green
Write-Host "  Frontend: http://app.localtest.me:5173" -ForegroundColor White
Write-Host "  API:      http://api.localtest.me:8000/api/v1/" -ForegroundColor White
Write-Host "  Admin:    http://api.localtest.me:8000/admin/" -ForegroundColor White
Write-Host "  Docs:     http://api.localtest.me:8000/api/v1/docs/" -ForegroundColor White
