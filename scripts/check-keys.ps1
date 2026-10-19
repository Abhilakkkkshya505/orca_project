# ==============================================================================
# ORCA Provider Keys & Connectivity Check (check-keys.ps1)
# ==============================================================================
[CmdletBinding()]
param()

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"

Push-Location $BackendDir
try {
    python manage.py check_providers
} finally {
    Pop-Location
}
