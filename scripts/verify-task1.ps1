# ==============================================================================
# ORCA Task 1 Verification Script (verify-task1.ps1)
# Verifies:
# 1. Worldwide port count (> 3000) and Indian coastal state counts (>= 3 per state)
# 2. Port search queries (mumbai, cochin, vizag)
# 3. Nearest ports API for Chennai coordinates
# 4. Marine snapping stats (total snapped, offset > 5km, inland count)
# 5. Risk assessment for 8 different ports (8 distinct locations and values)
# 6. Deep inland coordinate check (inland_point error + coastal port suggestion)
# 7. Scan codebase for hardcoded Kochi defaults
# 8. Cache keys include rounded location and rules version
# 9. Full backend test suite passes
# ==============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$RunnerScript = Join-Path $ProjectRoot "scripts\verify_task1_runner.py"

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
Write-Host "ORCA TASK 1 VERIFICATION SUITE" -ForegroundColor Cyan
Write-Host "=====================================================================`n" -ForegroundColor Cyan

# Check 1: Port Count Worldwide and Indian Coastal States
Write-Host ">>> Check 1: Port Counts Worldwide & Indian Coastal States" -ForegroundColor Yellow
$out1 = python $RunnerScript 1 2>&1
$c1Pass = [bool]($out1 -match "PASSED:True")
$totalW = ""
$indiaW = ""
foreach ($l in $out1) {
    if ($l -like "WORLDWIDE:*") { $totalW = $l.Replace("WORLDWIDE:", "") }
    if ($l -like "INDIA_TOTAL:*") { $indiaW = $l.Replace("INDIA_TOTAL:", "") }
    if ($l -like "STATE:*") {
        $st = $l.Replace("STATE:", "")
        Write-Host "         - $st" -ForegroundColor Gray
    }
}
Report-Check "Worldwide ports count ($totalW >= 3000) and Indian coastal states ($indiaW ports, all >= 3)" $c1Pass

# Check 2: Port Search Queries
Write-Host "`n>>> Check 2: Port Search Typos & Aliases (/api/v1/ports/?q=...)" -ForegroundColor Yellow
$out2 = python $RunnerScript 2 2>&1
$c2Pass = [bool]($out2 -match "PASSED:True")
foreach ($l in $out2) {
    if ($l -like "QUERY:*") {
        Write-Host "         $($l.Replace('QUERY:', ''))" -ForegroundColor Gray
    }
}
Report-Check "/ports/?q=mumbai -> Mumbai; ?q=cochin -> Kochi; ?q=vizag -> Visakhapatnam" $c2Pass

# Check 3: Nearest Port for Chennai Coordinates
Write-Host "`n>>> Check 3: Nearest Ports Endpoint (/api/v1/ports/nearest/)" -ForegroundColor Yellow
$out3 = python $RunnerScript 3 2>&1
$c3Pass = [bool]($out3 -match "PASSED:True")
$c3Details = ""
foreach ($l in $out3) {
    if ($l -like "FIRST:*") { $c3Details = $l }
}
Report-Check "/ports/nearest/ for Chennai (13.08, 80.28) ranks Chennai first with bearing" $c3Pass $c3Details

# Check 4: Marine Snapping Statistics
Write-Host "`n>>> Check 4: Marine Point Snapping Statistics" -ForegroundColor Yellow
$out4 = python $RunnerScript 4 2>&1
$c4Pass = [bool]($out4 -match "PASSED:True")
$c4Details = ""
foreach ($l in $out4) {
    if ($l -like "SNAPPED:*") { $c4Details = $l }
}
Report-Check "Marine points snapped (snapped >= 100, offset > 5km detected, inland handled)" $c4Pass $c4Details

# Check 5: Risk for 8 Diverse Ports
Write-Host "`n>>> Check 5: Risk Evaluation for 8 Ports (Distinct Locations & Telemetry)" -ForegroundColor Yellow
$out5 = python $RunnerScript 5 2>&1
$c5Pass = [bool]($out5 -match "PASSED:True")
foreach ($l in $out5) {
    if ($l -like "PORT:*") {
        Write-Host "         $($l.Replace('PORT:', ''))" -ForegroundColor Gray
    }
}
Report-Check "/risk/?port=<slug> for 8 diverse ports returns 8 distinct locations and levels" $c5Pass

# Check 6: Inland Point Returns Suggestion
Write-Host "`n>>> Check 6: Inland Point Fallback & Nearest Coastal Port Suggestion" -ForegroundColor Yellow
$out6 = python $RunnerScript 6 2>&1
$c6Pass = [bool]($out6 -match "PASSED:True")
$c6Details = ""
foreach ($l in $out6) {
    if ($l -like "CODE:*") { $c6Details = $l }
}
Report-Check "Deep inland point (New Delhi) returns HTTP 400 inland_point with suggestion" $c6Pass $c6Details

# Check 7: No Hardcoded Kochi in Source Code
Write-Host "`n>>> Check 7: Elimination of Hardcoded Kochi Defaults" -ForegroundColor Yellow
$out7 = python $RunnerScript 7 2>&1
$c7Pass = [bool]($out7 -match "PASSED:True")
$violationsCount = 0
foreach ($l in $out7) {
    if ($l -like "VIOLATION:*") {
        Write-Host "         $($l.Replace('VIOLATION:', ''))" -ForegroundColor Red
        $violationsCount++
    }
}
Report-Check "Zero hardcoded Kochi defaults/coordinates outside tests/fixtures/docs ($violationsCount violations)" $c7Pass

# Check 8: Cache Keys Include Location
Write-Host "`n>>> Check 8: Cache Key Structure (Includes Rounded Location & Rules Version)" -ForegroundColor Yellow
$out8 = python $RunnerScript 8 2>&1
$c8Pass = [bool]($out8 -match "PASSED:True")
Report-Check "Cache keys include rounded lat/lon and rules version (no collisions across ports)" $c8Pass

# Check 9: Full Backend Test Suite
Write-Host "`n>>> Check 9: Full Backend Pytest Suite" -ForegroundColor Yellow
Push-Location $BackendDir
try {
    $pytestOut = python -m pytest --tb=short 2>&1
    $c9Pass = ($LASTEXITCODE -eq 0)
    $summaryLine = ($pytestOut | Select-String -Pattern "passed in") | Select-Object -Last 1
    Report-Check "Full backend test suite passes" $c9Pass $summaryLine
} finally {
    Pop-Location
}

# Final Summary
Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "TASK 1 VERIFICATION RESULT: $passes PASS, $fails FAIL" -ForegroundColor $(if ($fails -eq 0) { "Green" } else { "Red" })
Write-Host "=====================================================================`n" -ForegroundColor Cyan

if ($fails -gt 0) {
    exit 1
} else {
    exit 0
}
