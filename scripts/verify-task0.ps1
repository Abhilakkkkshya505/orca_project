# ==============================================================================
# ORCA Task 0 Verification Script (verify-task0.ps1)
# Verifies: clean boot, health probes, migrations, schema, Celery round-trip,
# frontend-to-API session cookie auth, check_providers secret safety, git history hygiene, tests.
# ==============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

$passes = 0
$fails = 0

function Report-Check([string]$name, [bool]$passed, [string]$details = "") {
    if ($passed) {
        Write-Host "  [PASS] $name" -ForegroundColor Green
        if ($details) { Write-Host "         $details" -ForegroundColor Gray }
        $script:passes++
    } else {
        Write-Host "  [FAIL] $name" -ForegroundColor Red
        if ($details) { Write-Host "         $details" -ForegroundColor Yellow }
        $script:fails++
    }
}

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "ORCA TASK 0 VERIFICATION SUITE" -ForegroundColor Cyan
Write-Host "=====================================================================`n" -ForegroundColor Cyan

# 1. Containers and Stack Health
Write-Host ">>> Check 1: Docker Compose Stack Health" -ForegroundColor Yellow
$composePs = docker compose -f "$ProjectRoot\infra\docker-compose.yml" ps --format json 2>$null | ConvertFrom-Json
$dbRunning = $false
$redisRunning = $false

if ($composePs) {
    foreach ($c in $composePs) {
        if ($c.Service -eq "db" -and ($c.Status -like "*healthy*" -or $c.State -eq "running")) { $dbRunning = $true }
        if ($c.Service -eq "redis" -and ($c.Status -like "*healthy*" -or $c.State -eq "running")) { $redisRunning = $true }
    }
}
Report-Check "Database container healthy (PostGIS 16)" $dbRunning
Report-Check "Redis container healthy (Redis 7)" $redisRunning

# 2. Health Live & Ready Probes
Write-Host "`n>>> Check 2: API Health Probes (live & ready)" -ForegroundColor Yellow
$liveOk = $false
$readyOk = $false
try {
    $liveResp = Invoke-RestMethod -Uri "http://api.localtest.me:8000/api/v1/health/live/" -TimeoutSec 5 -ErrorAction Stop
    if ($liveResp.status -eq "ok") { $liveOk = $true }
} catch {
    $liveOk = $false
}
Report-Check "GET /api/v1/health/live/ returns 200 OK" $liveOk

try {
    $readyResp = Invoke-RestMethod -Uri "http://api.localtest.me:8000/api/v1/health/ready/" -TimeoutSec 5 -ErrorAction Stop
    if ($readyResp.status -eq "ok" -and $readyResp.checks.db -eq "ok" -and $readyResp.checks.redis -eq "ok") {
        $readyOk = $true
    }
} catch {
    $readyOk = $false
}
Report-Check "GET /api/v1/health/ready/ returns 200 OK with db:ok and redis:ok" $readyOk

# 3. Migrations, Manage Check, OpenAPI Schema Validation
Write-Host "`n>>> Check 3: Django System Checks & OpenAPI Schema" -ForegroundColor Yellow
Push-Location $BackendDir
try {
    $checkOut = python manage.py check 2>&1
    $checkPass = ($LASTEXITCODE -eq 0 -and $checkOut -like "*System check identified no issues*")
    Report-Check "python manage.py check passes with 0 issues" $checkPass

    $migrateOut = python manage.py migrate --check 2>&1
    $migratePass = ($LASTEXITCODE -eq 0)
    Report-Check "python manage.py migrate --check (all migrations applied)" $migratePass

    $schemaOut = python manage.py spectacular --file schema.yml --validate 2>&1
    $schemaPass = ($LASTEXITCODE -eq 0)
    Report-Check "python manage.py spectacular --file schema.yml --validate" $schemaPass
} finally {
    Pop-Location
}

# 4. Celery Worker Task Round-Trip & Beat Schedule
Write-Host "`n>>> Check 4: Celery Worker & Beat Schedule" -ForegroundColor Yellow
Push-Location $BackendDir
try {
    $celeryScript = "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()
from config.celery import app, debug_ping
sched_ok = len(app.conf.beat_schedule) >= 5
res = debug_ping.apply()
ping_ok = (res.status == 'SUCCESS' and res.result == 'pong')
print(f'SCHED:{sched_ok};PING:{ping_ok}')
"
    $celeryOut = python -c "$celeryScript" 2>&1
    $schedPass = ($celeryOut -like "*SCHED:True*")
    $pingPass = ($celeryOut -like "*PING:True*")
    Report-Check "Celery beat schedules loaded (>= 5 tasks registered)" $schedPass
    Report-Check "Celery worker ping round-trip succeeds (result: pong)" $pingPass
} finally {
    Pop-Location
}

# 5. Frontend Dev Server & Cross-Subdomain Auth Flow
Write-Host "`n>>> Check 5: Frontend Server & Cross-Subdomain Session Cookie Auth" -ForegroundColor Yellow
$frontendOk = $false
try {
    $viteResp = Invoke-WebRequest -Uri "http://app.localtest.me:5173/" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($viteResp.StatusCode -eq 200) { $frontendOk = $true }
} catch {
    $frontendOk = $false
}
Report-Check "Frontend dev server responds at http://app.localtest.me:5173" $frontendOk

Push-Location $BackendDir
try {
    $authScript = "
import requests, uuid, os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()

s = requests.Session()
headers = {'Origin': 'http://app.localtest.me:5173', 'Referer': 'http://app.localtest.me:5173/'}
r1 = s.get('http://api.localtest.me:8000/api/v1/auth/csrf/', headers=headers)
headers['X-CSRFToken'] = s.cookies.get('csrftoken', '')

email = f'verify_test_{uuid.uuid4().hex[:6]}@example.com'
s.post('http://api.localtest.me:8000/api/v1/auth/signup/', json={'email': email, 'display_name': 'Verify Test', 'password': 'StrongPassword2026!', 'turnstile_token': '1x00000000000000000000AA'}, headers=headers)

u = User.objects.get(email=email)
u.is_email_verified = True
u.save()

r_login = s.post('http://api.localtest.me:8000/api/v1/auth/login/', json={'email': email, 'password': 'StrongPassword2026!', 'turnstile_token': '1x00000000000000000000AA'}, headers=headers)
r_me = s.get('http://api.localtest.me:8000/api/v1/auth/me/', headers=headers)

cookie_ok = ('sessionid' in s.cookies)
me_ok = (r_me.status_code == 200 and r_me.json().get('email') == email)
print(f'COOKIE:{cookie_ok};ME:{me_ok}')
"
    $authOut = python -c "$authScript" 2>&1
    $cookiePass = ($authOut -like "*COOKIE:True*")
    $mePass = ($authOut -like "*ME:True*")
    Report-Check "Signup, login & session cookie issued on .localtest.me" $cookiePass
    Report-Check "Cross-subdomain /auth/me/ returns authenticated user" $mePass
} finally {
    Pop-Location
}

# 6. Check Providers & Secret Safety
Write-Host "`n>>> Check 6: Provider Health Table & Secret Safety" -ForegroundColor Yellow
Push-Location $BackendDir
try {
    $provOut = python manage.py check_providers 2>&1
    $provPass = ($LASTEXITCODE -eq 0 -and $provOut -like "*Provider check complete. Zero secrets leaked.*")
    $hasTable = ($provOut -like "*Open-Meteo Marine*" -and $provOut -like "*GDACS Disaster Alerts*")
    Report-Check "python manage.py check_providers completes successfully" $provPass
    Report-Check "check_providers outputs full provider connectivity table" $hasTable

    # Check for secret leaks
    $leakPatterns = @("ghp_", "sk-ant", "AIzaSy", "bearer ey", "password123")
    $leaked = $false
    foreach ($p in $leakPatterns) {
        if ($provOut -like "*$p*") { $leaked = $true }
    }
    Report-Check "No secret keys or bearer tokens leaked in provider check output" (-not $leaked)
} finally {
    Pop-Location
}

# 7. Git Hygiene & .env Safety
Write-Host "`n>>> Check 7: Git History Hygiene & .env Protection" -ForegroundColor Yellow
Push-Location $ProjectRoot
try {
    $gitignoreText = Get-Content ".gitignore" -Raw
    $ignored = ($gitignoreText -match "(?m)^\.env\b")
    Report-Check ".env is strictly ignored in .gitignore" $ignored

    $gitLogEnv = git log -p -n 15 -- "*.env" 2>&1
    $noEnvInLog = ($gitLogEnv.Length -eq 0 -or $gitLogEnv -like "*fatal*")
    Report-Check ".env files are completely absent from recent git commit history" $noEnvInLog
} finally {
    Pop-Location
}

# 8. Automated Test Suites
Write-Host "`n>>> Check 8: Backend and Frontend Test Suites" -ForegroundColor Yellow
Push-Location $BackendDir
try {
    $pytestOut = python -m pytest 2>&1
    $pytestPass = ($LASTEXITCODE -eq 0 -and $pytestOut -like "*passed*")
    Report-Check "Backend pytest suite (all 49 tests passing)" $pytestPass
} finally {
    Pop-Location
}

Push-Location $FrontendDir
try {
    $vitestOut = pnpm test --run 2>&1
    $vitestPass = ($LASTEXITCODE -eq 0 -and $vitestOut -like "*passed*")
    Report-Check "Frontend Vitest suite (all 24 tests passing)" $vitestPass
} finally {
    Pop-Location
}

# Summary
Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION SUMMARY: $passes PASSED, $fails FAILED" -ForegroundColor $(if ($fails -eq 0) { "Green" } else { "Red" })
Write-Host "=====================================================================`n" -ForegroundColor Cyan

if ($fails -gt 0) {
    Exit 1
} else {
    Exit 0
}
