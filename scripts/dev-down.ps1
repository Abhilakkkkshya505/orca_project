# ==============================================================================
# ORCA Development Stack Teardown (dev-down.ps1)
# ==============================================================================
[CmdletBinding()]
param()

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $ProjectRoot "infra\docker-compose.yml"

Write-Host ">>> Stopping ORCA containers..." -ForegroundColor Cyan
docker compose -f "$ComposeFile" down
Write-Host ">>> ORCA Stack stopped." -ForegroundColor Green
