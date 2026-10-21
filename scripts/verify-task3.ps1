# ==============================================================================
# ORCA Task 3 Verification Script (verify-task3.ps1)
# Verifies:
# 1. Chat works with LLM_PROVIDER=template and no keys
# 2. Timestamped stream proves incremental delivery (<500ms first status, event timeline)
# 3. 5 ports give 5 different results
# 4. Follow-up, compare and clarification flows
# 5. Validator rejects unsupported numbers
# 6. Adversarial tests pass
# 7. Eval accuracy for task, place and window (dev and held-out reported separately)
# 8. Optional provider check (Gemini/Anthropic if keys present, else TemplateProvider verified)
# 9. All Task 3 backend unit/integration tests pass (pytest tests/test_task3.py)
# 10. Frontend chat component tests pass (vitest)
# ==============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$RunnerScript = Join-Path $ProjectRoot "scripts\verify_task3_runner.py"

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
Write-Host "ORCA TASK 3 VERIFICATION SUITE: CHAT ASSISTANT & STREAMING ENGINE" -ForegroundColor Cyan
Write-Host "=====================================================================`n" -ForegroundColor Cyan

# Check 1: Chat works with LLM_PROVIDER=template and no keys
Write-Host ">>> Check 1: Chat Assistant with Template Explainer (Zero Keys)" -ForegroundColor Yellow
$out1 = python $RunnerScript 1 2>&1
$c1Pass = [bool]($out1 -match "PASSED:True")
$c1Details = ""
foreach ($l in $out1) {
    if ($l -like "EXPLANATION_SNIPPET:*") { $c1Details = $l }
}
Report-Check "Deterministic chat pipeline works with 0 keys ($c1Details)" $c1Pass

# Check 2: Timestamped stream incremental delivery & latency SLA
Write-Host "`n>>> Check 2: Timestamped Incremental Stream & First-Status Latency (<500ms)" -ForegroundColor Yellow
$out2 = python $RunnerScript 2 2>&1
$c2Pass = [bool]($out2 -match "PASSED:True")
$firstStatus = ""
$inTimeline = $false
Write-Host "  Timeline of SSE events:" -ForegroundColor Cyan
foreach ($l in $out2) {
    if ($l -like "FIRST_STATUS_MS:*") { $firstStatus = $l }
    if ($l -eq "TIMELINE_START") { $inTimeline = $true; continue }
    if ($l -eq "TIMELINE_END") { $inTimeline = $false; continue }
    if ($inTimeline) { Write-Host "  $l" -ForegroundColor Gray }
}
Report-Check "First status event delivered under 500ms SLA ($firstStatus)" $c2Pass

# Check 3: 5 ports give 5 different results
Write-Host "`n>>> Check 3: Multi-Port Risk Diversity (5 Coastal Ports)" -ForegroundColor Yellow
$out3 = python $RunnerScript 3 2>&1
$c3Pass = [bool]($out3 -match "PASSED:True")
foreach ($l in $out3) {
    if ($l -like "  *") { Write-Host "  $l" -ForegroundColor Gray }
}
Report-Check "5 distinct coastal ports evaluated with divergent ocean parameters" $c3Pass

# Check 4: Follow-up, compare and clarification flows
Write-Host "`n>>> Check 4: Multi-Turn Conversation Flows (Follow-up, Compare, Clarification)" -ForegroundColor Yellow
$out4 = python $RunnerScript 4 2>&1
$c4Pass = [bool]($out4 -match "PASSED:True")
$c4Details = ""
foreach ($l in $out4) {
    if ($l -like "COMPARE_PASSED:*") { $c4Details += "$l; " }
    if ($l -like "CLARIFICATION_PASSED:*") { $c4Details += $l }
}
Report-Check "Follow-up context reuse, dual-port comparison, and interactive clarification" $c4Pass $c4Details

# Check 5: Anti-hallucination number validator
Write-Host "`n>>> Check 5: Anti-Hallucination Number & Unit Validator (Rule S4)" -ForegroundColor Yellow
$out5 = python $RunnerScript 5 2>&1
$c5Pass = [bool]($out5 -match "PASSED:True")
$c5Details = ""
foreach ($l in $out5) {
    if ($l -like "HALLUCINATION_REJECTED:*") { $c5Details = $l }
}
Report-Check "Validator strictly accepts grounded values and rejects hallucinated numbers ($c5Details)" $c5Pass

# Check 6: Adversarial hardening
Write-Host "`n>>> Check 6: Adversarial Hardening (Prompt Injection, 10k Flood, RTL Text)" -ForegroundColor Yellow
$out6 = python $RunnerScript 6 2>&1
$c6Pass = [bool]($out6 -match "PASSED:True")
Report-Check "Prompt injection defense, flood protection, and RTL text resilience" $c6Pass

# Check 7: Evaluation accuracy report (Dev vs Held-Out split)
Write-Host "`n>>> Check 7: NLU Evaluation Accuracy (80 Hand-Crafted Queries across 25 Ports)" -ForegroundColor Yellow
$out7 = python $RunnerScript 7 2>&1
$c7Pass = [bool]($out7 -match "PASSED:True")
foreach ($l in $out7) {
    if ($l -like "*---*") { Write-Host "  $l" -ForegroundColor Cyan }
    if ($l -like "*Accuracy*") { Write-Host "  $l" -ForegroundColor Gray }
}
Report-Check "Eval accuracy above benchmark thresholds for task, place, and window" $c7Pass

# Check 8: Optional provider check
Write-Host "`n>>> Check 8: Optional External LLM Provider Key Verification" -ForegroundColor Yellow
$out8 = python $RunnerScript 8 2>&1
$c8Pass = [bool]($out8 -match "PASSED:True")
$c8Details = ""
foreach ($l in $out8) {
    if ($l -like "PROVIDER_STATUS:*") { $c8Details = $l }
    if ($l -like "PROVIDER:*") { $c8Details = $l }
}
Report-Check "LLM provider interface validation ($c8Details)" $c8Pass

# Check 9: Full Task 3 Backend Pytest Suite
Write-Host "`n>>> Check 9: Task 3 Pytest Test Suite (51 Unit, Integration, & Adversarial Tests)" -ForegroundColor Yellow
Push-Location $BackendDir
$pytestOut = python -m pytest tests/test_task3.py -q 2>&1
Pop-Location
$c9Pass = ($LASTEXITCODE -eq 0)
$c9Summary = ($pytestOut | Select-Object -Last 2) -join " "
Report-Check "All 51 Task 3 pytest tests pass ($c9Summary)" $c9Pass

# Check 10: Frontend Component Tests (Vitest)
Write-Host "`n>>> Check 10: Frontend Chat Component Vitest Suite" -ForegroundColor Yellow
Push-Location $FrontendDir
$vitestOut = npm test -- --run 2>&1
Pop-Location
$c10Pass = ($LASTEXITCODE -eq 0)
$c10Summary = ($vitestOut | Select-Object -Last 3) -join " "
Report-Check "All 24 frontend component & hook tests pass ($c10Summary)" $c10Pass

# Final Summary
Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "TASK 3 VERIFICATION SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  Total Passed: $passes" -ForegroundColor Green
Write-Host "  Total Failed: $fails" -ForegroundColor $(if ($fails -eq 0) { "Green" } else { "Red" })

if ($fails -eq 0) {
    Write-Host "`n>>> ALL 10 TASK 3 VERIFICATION CHECKS PASSED SUCCESSFULLY! <<<`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n>>> SOME TASK 3 VERIFICATION CHECKS FAILED! <<<`n" -ForegroundColor Red
    exit 1
}
