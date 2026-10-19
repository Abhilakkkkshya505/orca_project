# ==============================================================================
# ORCA Task 2 Verification Script (verify-task2.ps1)
# Verifies:
# 1. All adapters import and pass recorded fixture tests
# 2. Real ingestion for Open-Meteo marine & forecast with row counts & valid_time
# 3. NOAA ERDDAP SST & Chlorophyll fetch and gradient computation
# 4. Copernicus and GFW disabled (no key) or OK in data-status
# 5. /api/v1/data-status/ returns complete provider list and attribution
# 6. Risk rules engine achieves 100% branch coverage
# 7. Property-based tests (Hypothesis) pass cleanly
# 8. 10-port risk evaluation table prints with differing values across ports
# 9. Synthetic generator strictly blocked in production mode
# 10. Thresholds file has safety banner and risk-thresholds-sources.md exists
# 11. Full backend test suite passes
# ==============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$RunnerScript = Join-Path $ProjectRoot "scripts\verify_task2_runner.py"

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
Write-Host "ORCA TASK 2 VERIFICATION SUITE: DATA PIPELINES & RISK ENGINE" -ForegroundColor Cyan
Write-Host "=====================================================================`n" -ForegroundColor Cyan

# Check 1: All Adapters & Fixtures
Write-Host ">>> Check 1: Adapters & Recorded-Response Fixtures" -ForegroundColor Yellow
$out1 = python $RunnerScript 1 2>&1
$c1Pass = [bool]($out1 -match "PASSED:True")
$c1Details = ""
foreach ($l in $out1) {
    if ($l -like "ADAPTERS:*") { $c1Details = $l }
}
Report-Check "All adapters import cleanly and fixtures exist ($c1Details)" $c1Pass

# Check 2: Real Ingestion
Write-Host "`n>>> Check 2: Real Ingestion for Open-Meteo Marine & Forecast" -ForegroundColor Yellow
$out2 = python $RunnerScript 2 2>&1
$c2Pass = [bool]($out2 -match "PASSED:True")
$c2Snaps = ""
$c2Valid = ""
foreach ($l in $out2) {
    if ($l -like "TOTAL_SNAPSHOTS:*") { $c2Snaps = $l }
    if ($l -like "NEWEST_VALID_TIME:*") { $c2Valid = $l }
}
Report-Check "Real ingestion row counts and newest valid_time ($c2Snaps; $c2Valid)" $c2Pass

# Check 3: ERDDAP SST & Chlorophyll
Write-Host "`n>>> Check 3: NOAA ERDDAP SST & Chlorophyll-a Normalization" -ForegroundColor Yellow
$out3 = python $RunnerScript 3 2>&1
$c3Pass = [bool]($out3 -match "PASSED:True")
$c3Details = ""
foreach ($l in $out3) {
    if ($l -like "SST_RECORDS:*") { $c3Details = $l }
}
Report-Check "NOAA ERDDAP satellite normalization & gradient computation ($c3Details)" $c3Pass

# Check 4: Copernicus & GFW Disabled Status
Write-Host "`n>>> Check 4: Credential-Gated Providers (Copernicus & GFW)" -ForegroundColor Yellow
$out4 = python $RunnerScript 4 2>&1
$c4Pass = [bool]($out4 -match "PASSED:True")
$c4Details = ""
foreach ($l in $out4) {
    if ($l -like "COPERNICUS:*") { $c4Details = $l }
}
Report-Check "Copernicus & GFW report disabled (no key) or OK ($c4Details)" $c4Pass

# Check 5: /api/v1/data-status/
Write-Host "`n>>> Check 5: Provider Status & Attribution Endpoint (/api/v1/data-status/)" -ForegroundColor Yellow
$out5 = python $RunnerScript 5 2>&1
$c5Pass = [bool]($out5 -match "PASSED:True")
$c5Details = ""
foreach ($l in $out5) {
    if ($l -like "SOURCES_COUNT:*") { $c5Details = $l }
}
Report-Check "Public data-status reports all sources, health status, and attributions ($c5Details)" $c5Pass

# Check 6: 100% Branch Coverage on Rules Engine
Write-Host "`n>>> Check 6: Risk Engine 100% Branch Coverage" -ForegroundColor Yellow
$out6 = python $RunnerScript 6 2>&1
$c6Pass = [bool]($out6 -match "PASSED:True")
$c6Details = ""
foreach ($l in $out6) {
    if ($l -like "BRANCH_COVERAGE:*") { $c6Details = $l }
}
Report-Check "Deterministic rules engine achieves 100% branch coverage ($c6Details)" $c6Pass

# Check 7: Property-Based Tests
Write-Host "`n>>> Check 7: Property-Based Tests (Hypothesis Monotonicity & Clock Independence)" -ForegroundColor Yellow
$out7 = python $RunnerScript 7 2>&1
$c7Pass = [bool]($out7 -match "PASSED:True")
Report-Check "Property tests pass (monotonicity, required factor absence, determinism)" $c7Pass

# Check 8: 10-Port Risk Table
Write-Host "`n>>> Check 8: 10-Port Risk Assessment Table (Diverse Oceanographic Values)" -ForegroundColor Yellow
$out8 = python $RunnerScript 8 2>&1
$c8Pass = [bool]($out8 -match "PASSED:True")
Write-Host "         -------------------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ("         {0,-22} | {1,-8} | {2,-10} | {3,-10} | {4,-12} | {5,-8}" -f "Port", "Level", "Confidence", "Max Wave", "Max Wind", "Age") -ForegroundColor White
Write-Host "         -------------------------------------------------------------------------------" -ForegroundColor Gray
foreach ($l in $out8) {
    if ($l -like "ROW:*") {
        $parts = $l.Replace("ROW:", "").Split("|")
        if ($parts.Length -ge 6) {
            Write-Host ("         {0,-22} | {1,-8} | {2,-10} | {3,-10} | {4,-12} | {5,-8}" -f $parts[0], $parts[1], $parts[2], $parts[3], $parts[4], $parts[5]) -ForegroundColor Gray
        }
    }
}
Write-Host "         -------------------------------------------------------------------------------" -ForegroundColor Gray
Report-Check "10 Indian ports evaluated with differing oceanographic values" $c8Pass

# Check 9: Synthetic Generator Blocked in Production
Write-Host "`n>>> Check 9: Synthetic Generator Blocked in Production Mode" -ForegroundColor Yellow
$out9 = python $RunnerScript 9 2>&1
$c9Pass = [bool]($out9 -match "PASSED:True")
Report-Check "Synthetic generator strictly raises PermissionError when ENVIRONMENT=production" $c9Pass

# Check 10: Thresholds Safety Banner & Citations
Write-Host "`n>>> Check 10: Risk Thresholds Safety Banner & Cited Sources" -ForegroundColor Yellow
$out10 = python $RunnerScript 10 2>&1
$c10Pass = [bool]($out10 -match "PASSED:True")
Report-Check "thresholds.py has development banner and docs/risk-thresholds-sources.md exists" $c10Pass

# Check 11: Full Backend Pytest Suite
Write-Host "`n>>> Check 11: Full Backend Pytest Suite" -ForegroundColor Yellow
Push-Location $BackendDir
try {
    $pytestOut = python -m pytest --tb=short 2>&1
    $c11Pass = ($LASTEXITCODE -eq 0)
    $summaryLine = ($pytestOut | Select-String -Pattern "passed in") | Select-Object -Last 1
    Report-Check "Full backend test suite passes" $c11Pass $summaryLine
} finally {
    Pop-Location
}

# Final Summary
Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "TASK 2 VERIFICATION RESULT: $passes PASS, $fails FAIL" -ForegroundColor $(if ($fails -eq 0) { "Green" } else { "Red" })
Write-Host "=====================================================================`n" -ForegroundColor Cyan

if ($fails -gt 0) {
    exit 1
} else {
    exit 0
}
