# ==============================================================================
# ORCA Task 4 Verification Script (verify-task4.ps1)
# Verifies:
# 1. orca_ml package installation & 15-feature canonical schema
# 2. Adoption Gate rules loaded from gate.yaml
# 3. Model 1 (Fishing Zone Suitability) - HistGradientBoosting, GroupKFold, honest UNFINISHED
# 4. Model 2 (Chlorophyll Anomaly) - z >= 2.5, 4+ cell cluster, cloud < 50%, active backtest
# 5. Model 3 (Intent Classifier) - Macro-F1 >= rules + 3%, min recall >= 0.80, latency < 5ms, active
# 6. Model 4 (Wave Forecast Error) - Quantile regressor, honest SKIPPED
# 7. Public API endpoints (GET /api/v1/models/ & /card/ in JSON and Markdown)
# 8. Feature Drift (PSI) Monitoring Celery task
# 9. All Task 4 backend unit/integration tests pass (pytest tests/test_task4.py)
# ==============================================================================
[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$RunnerScript = Join-Path $BackendDir "scripts\verify_task4_runner.py"

Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "ORCA TASK 4 VERIFICATION SUITE: MACHINE LEARNING & ADOPTION GATES" -ForegroundColor Cyan
Write-Host "=====================================================================`n" -ForegroundColor Cyan

# Run the python verification runner using active python
Push-Location $BackendDir
try {
    python $RunnerScript
    $runnerExit = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($runnerExit -eq 0) {
    Write-Host "`n>>> ALL TASK 4 CHECKS PASSED (EXIT CODE 0) <<<`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n>>> TASK 4 VERIFICATION FAILED (EXIT CODE $runnerExit) <<<`n" -ForegroundColor Red
    exit 1
}
