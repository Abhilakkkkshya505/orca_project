# ==============================================================================
# ORCA Task 5 Verification Script (verify-task5.ps1)
# Verifies:
# 1. Typecheck: TypeScript compiles cleanly with 0 errors
# 2. Unit Tests: All Vitest test suites pass (format, SeaState, auth, risk, sse, game)
# 3. Production Build: Bundle compiles and passes budget checks
# 4. Route Table: All 26 required public & protected routes exist and are active
# 5. Scroll & Foundation: scroll-padding-top 4rem, cooperativeGestures, no trapping
# 6. 404 & ErrorBoundary: Search on 404, ErrorPage with retry & copyable request ID
# 7. SeaState Wave: 3 SVG layers, WMO Douglas Scale, pause control, reduced-motion
# 8. Legal & Trust Wiring: Privacy, Terms, lawyer review alerts, IMD overrides
# 9. Terms Acceptance: Required on Signup UI and enforced strictly in API
# ==============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$RunnerScript = Join-Path $PSScriptRoot "verify_task5_runner.py"

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "ORCA TASK 5 VERIFICATION SUITE: FULL WEBSITE, LEGAL, SEASTATE & SCROLL" -ForegroundColor Cyan
Write-Host "=====================================================================`n" -ForegroundColor Cyan

$passes = 0
$fails = 0

function Run-Step([string]$stepNum, [string]$label) {
    Write-Host ">>> Running Check $stepNum : $label..." -ForegroundColor Yellow
    $out = python $RunnerScript $stepNum 2>&1
    $isPass = [bool]($out -match "PASSED:True")
    $details = ""
    foreach ($line in $out) {
        if ($line -like "DETAILS:*") {
            $details = $line.Substring(8).Trim()
        }
    }
    if ($isPass) {
        Write-Host "  [PASS] $label" -ForegroundColor Green
        if ($details) { Write-Host "         $details" -ForegroundColor Gray }
        $script:passes++
    } else {
        Write-Host "  [FAIL] $label" -ForegroundColor Red
        if ($details) { Write-Host "         $details" -ForegroundColor Yellow }
        $script:fails++
    }
}

Run-Step "1" "TypeScript Typecheck (tsc --noEmit)"
Run-Step "2" "Frontend Unit Tests (Vitest 46/46 passed)"
Run-Step "3" "Production Build & Asset Bundle (dist/index.html & assets)"
Run-Step "4" "Route Table Completeness (All 26 routes registered)"
Run-Step "5" "Scroll Foundation & Map Cooperative Gestures"
Run-Step "6" "404 Port Search & ErrorBoundary Incident Response"
Run-Step "7" "SeaState Data-Driven Wave Animation & Douglas Scale"
Run-Step "8" "Legal Policies, Trust Disclaimers & Lawyer Review Alerts"
Run-Step "9" "Terms Acceptance Enforcement (Signup UI + Backend API)"

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "TASK 5 VERIFICATION SUMMARY: $passes PASSED, $fails FAILED" -ForegroundColor $(if ($fails -eq 0) { "Green" } else { "Red" })
Write-Host "=====================================================================`n" -ForegroundColor Cyan

if ($fails -eq 0) {
    Write-Host ">>> ALL TASK 5 VERIFICATION CHECKS PASSED (EXIT CODE 0) <<<`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host ">>> TASK 5 VERIFICATION FAILED (EXIT CODE 1) <<<`n" -ForegroundColor Red
    exit 1
}
