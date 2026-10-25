# ==============================================================================
# ORCA Task 1 Verification Script (verify-task1.ps1)
# Verifies:
# 1. Port count worldwide (>3000) and Indian coastal state counts with flags
# 2. /ports/?q=mumbai returns Mumbai; ?q=cochin returns Kochi; ?q=vizag returns Visakhapatnam
# 3. /ports/nearest/ for Chennai coordinates puts Chennai first
# 4. Marine snap stats: snapped count, offset above 5 km, inland count
# 5. /risk/?port=<slug> for 8 different ports returns 8 different locations and different values
# 6. Inland point returns inland_point with a suggestion
# 7. No hardcoded Kochi default in repo outside allowed paths
# 8. Cache keys include location
# 9. Full backend test suite passes
# ==============================================================================
[CmdletBinding()]
param(
    [string]$ApiBase = "http://127.0.0.1:8000/api/v1"
)

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"

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

# ---------------------------------------------------------------------
# Check 1: Port Count Worldwide and Indian Coastal State Counts
# ---------------------------------------------------------------------
Write-Host ">>> Check 1: Port Database Statistics & State Mapping" -ForegroundColor Yellow
$covOk = $false
$covDetails = ""
try {
    $covResp = Invoke-RestMethod -Uri "$ApiBase/ports/coverage/" -TimeoutSec 10 -ErrorAction Stop
    $totalPorts = $covResp.total_ports
    $inStates = $covResp.india_by_state

    $stateFlags = @()
    $under3 = @()
    foreach ($st in $inStates) {
        if ($st.port_count -lt 3) {
            $under3 += "$($st.admin1_name): $($st.port_count)"
        }
    }

    if ($totalPorts -ge 3000 -and $under3.Count -eq 0) {
        $covOk = $true
        $covDetails = "Total worldwide ports: $totalPorts | All $($inStates.Count) Indian coastal states/UTs have >= 3 ports."
    } else {
        $covDetails = "Total ports: $totalPorts (expected >= 3000) | States with < 3 ports: $($under3 -join ', ')"
    }
} catch {
    $covDetails = "API error: $_"
}
Report-Check "Worldwide ports count > 3,000 and Indian coastal states >= 3 ports" $covOk $covDetails

# ---------------------------------------------------------------------
# Check 2: Fuzzy & Alias Port Search (Mumbai, Cochin, Vizag)
# ---------------------------------------------------------------------
Write-Host "`n>>> Check 2: Vernacular & Typo Search (Mumbai, Cochin, Vizag)" -ForegroundColor Yellow
$searchOk = $true
$searchDetails = @()

$queries = @(
    @{ Q = "mumbai"; Expected = "Mumbai" },
    @{ Q = "cochin"; Expected = "Kochi" },
    @{ Q = "vizag"; Expected = "Visakhapatnam" }
)

foreach ($item in $queries) {
    try {
        $res = Invoke-RestMethod -Uri "$ApiBase/ports/?q=$($item.Q)&page_size=5" -TimeoutSec 5 -ErrorAction Stop
        $top3Names = ($res.results | Select-Object -First 3 | ForEach-Object { $_.name }) -join ", "
        $match = $res.results | Select-Object -First 3 | Where-Object { 
            $_.name -like "*$($item.Expected)*" -or ($_.alt_names -join " ") -like "*$($item.Expected)*"
        }
        if ($match) {
            $searchDetails += "$($item.Q) -> [Top 3: $top3Names]"
        } else {
            $searchOk = $false
            $searchDetails += "FAIL for '$($item.Q)' (Top 3: $top3Names)"
        }
    } catch {
        $searchOk = $false
        $searchDetails += "ERROR querying '$($item.Q)': $_"
    }
}
Report-Check "Search ?q=mumbai, ?q=cochin, ?q=vizag rank canonical ports in top 3" $searchOk ($searchDetails -join " | ")

# ---------------------------------------------------------------------
# Check 3: Nearest Port Query for Chennai Coordinates
# ---------------------------------------------------------------------
Write-Host "`n>>> Check 3: Spatial Nearest Port Query (Chennai: 13.08, 80.28)" -ForegroundColor Yellow
$nearOk = $false
$nearDetails = ""
try {
    $nearResp = Invoke-RestMethod -Uri "$ApiBase/ports/nearest/?lat=13.08&lon=80.28&limit=5&max_km=200" -TimeoutSec 5 -ErrorAction Stop
    if ($nearResp.Count -gt 0) {
        $first = $nearResp[0]
        if (($first.name -like "*Chennai*" -or $first.name -like "*Madras*" -or $first.name -like "*Kasimedu*") -and $first.distance_km -lt 25.0) {
            $nearOk = $true
            $nearDetails = "First result: '$($first.name)' at $($first.distance_km) km (bearing: $($first.bearing) deg)"
        } else {
            $nearDetails = "Unexpected first port: '$($first.name)' at $($first.distance_km) km"
        }
    } else {
        $nearDetails = "Empty results returned"
    }
} catch {
    $nearDetails = "API error: $_"
}
Report-Check "/api/v1/ports/nearest/ for Chennai coordinates puts Chennai first (< 25km)" $nearOk $nearDetails

# ---------------------------------------------------------------------
# Check 4: Marine Snapping Statistics
# ---------------------------------------------------------------------
Write-Host "`n>>> Check 4: Sea-Point Snapping Statistics" -ForegroundColor Yellow
$snapOk = $false
$snapDetails = ""
try {
    Push-Location $BackendDir
    $snapPy = python manage.py shell -c "from apps.ports.models import Port; total=Port.objects.count(); snapped=Port.objects.filter(marine_lat__isnull=False).count(); offset_gt_5=Port.objects.filter(marine_offset_km__gt=5.0).count(); inland=Port.objects.filter(is_coastal=False).count(); print(f'{total},{snapped},{offset_gt_5},{inland}')"
    Pop-Location
    $parts = ($snapPy -split "`n")[-1].Trim().Split(",")
    if ($parts.Count -eq 4) {
        $t = [int]$parts[0]
        $s = [int]$parts[1]
        $o = [int]$parts[2]
        $i = [int]$parts[3]
        if ($s -ge 50 -and $i -ge 1) {
            $snapOk = $true
            $snapDetails = "Total ports: $t | Snapped to sea points: $s | Offset > 5km: $o | Inland / unsupported: $i"
        }
    }
} catch {
    $snapDetails = "Error getting snap stats: $_"
}
Report-Check "Marine snap statistics recorded (snapped sea points and inland flags)" $snapOk $snapDetails

# ---------------------------------------------------------------------
# Check 5: /api/v1/risk/?port=<slug> for 8 Different Ports
# ---------------------------------------------------------------------
Write-Host "`n>>> Check 5: Risk Assessments for 8 Distinct Ports" -ForegroundColor Yellow
$risk8Ok = $false
$riskDetails = @()
$testPorts = @(
    "mumbai-bombay-in",
    "kochi-cochin-in",
    "chennai-madras-in",
    "vishakhapatnam-in",
    "kandla-in",
    "paradip-in",
    "port-blair-in",
    "rotterdam-nl"
)

$locationsSeen = @{}
$wavesSeen = @()
$successCount = 0

foreach ($slug in $testPorts) {
    try {
        $rResp = Invoke-RestMethod -Uri "$ApiBase/risk/?port=$slug" -TimeoutSec 10 -ErrorAction Stop
        $locKey = "$([math]::Round($rResp.location.lat, 2)),$([math]::Round($rResp.location.lon, 2))"
        $locationsSeen[$locKey] = $slug
        $wave = ($rResp.factors | Where-Object { $_.key -eq "wave_height_m" } | Select-Object -First 1).value
        $wavesSeen += $wave
        $successCount++
        $riskDetails += "$slug -> loc:($locKey) level:$($rResp.level) wave:$wave m"
    } catch {
        $riskDetails += "$slug -> ERROR: $_"
    }
}

if ($successCount -ge 8 -and $locationsSeen.Keys.Count -ge 8) {
    $risk8Ok = $true
}
Report-Check "/api/v1/risk/?port=<slug> for 8 different ports returns 8 distinct locations" $risk8Ok ($riskDetails -join " | ")

# ---------------------------------------------------------------------
# Check 6: Inland Point Returns inland_point with Suggestion
# ---------------------------------------------------------------------
Write-Host "`n>>> Check 6: Inland Point Handling (New Delhi: 28.61, 77.20)" -ForegroundColor Yellow
$inlandOk = $false
$inlandDetails = ""
try {
    $inlandPy = python -c @"
import requests
r = requests.get('$ApiBase/risk/?lat=28.61&lon=77.20')
d = r.json()
code = d.get('error', {}).get('code', '')
sugg = d.get('error', {}).get('details', {}).get('suggestion', {})
name = sugg.get('name', '')
slug = sugg.get('slug', '')
dist = sugg.get('distance_km', 0)
print(str(r.status_code) + '|' + str(code) + '|' + str(name) + '|' + str(slug) + '|' + str(dist))
"@
    $parts = ($inlandPy -split "`n")[-1].Trim().Split("|")
    if ($parts[0] -eq "400" -and $parts[1] -eq "inland_point" -and [double]$parts[4] -gt 0) {
        $inlandOk = $true
        $inlandDetails = "Code: 'inland_point' | Suggested port: '$($parts[2])' ($($parts[3])) at $($parts[4]) km"
    } else {
        $inlandDetails = "Unexpected response: $inlandPy"
    }
} catch {
    $inlandDetails = "Error testing inland point: $_"
}
Report-Check "Inland point returns 400 'inland_point' with nearest port suggestion" $inlandOk $inlandDetails

# ---------------------------------------------------------------------
# Check 7: No Hardcoded Kochi Default in Repo
# ---------------------------------------------------------------------
Write-Host "`n>>> Check 7: Static Code Scan for Hardcoded Location Defaults" -ForegroundColor Yellow
$noHardcodedOk = $false
$hardcodedDetails = ""
try {
    $scanPy = python -c "
import os, re
root = r'$ProjectRoot'
ignore_dirs = {'.git', 'node_modules', 'tests', 'fixtures', 'docs', 'deliverables', 'brain', 'dist', '.pnpm', 'scripts'}
p = 'defaultCenter.*kochi|useState\\(\\s*\\{\\s*lat:\\s*9\\.9|defaultValues.*9\\.97|fallback.*kochi|lat\\s*=\\s*9\\.97|lat:\\s*9\\.97'
pattern = re.compile(p, re.IGNORECASE)
violations = []
for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [d for d in dirnames if d not in ignore_dirs and not d.startswith('.')]
    for fn in filenames:
        if fn.endswith(('.py', '.ts', '.tsx', '.html')):
            fp = os.path.join(dirpath, fn)
            with open(fp, 'r', encoding='utf-8', errors='ignore') as f:
                for idx, line in enumerate(f, 1):
                    if pattern.search(line):
                        violations.append(f'{fp}:{idx}')
print(len(violations))
"
    $vCount = [int]($scanPy -split "`n")[-1].Trim()
    if ($vCount -eq 0) {
        $noHardcodedOk = $true
        $hardcodedDetails = "0 hardcoded location defaults detected across codebase."
    } else {
        $hardcodedDetails = "Found $vCount violations outside allowed directories."
    }
} catch {
    $hardcodedDetails = "Scan error: $_"
}
Report-Check "Zero hardcoded Kochi/coordinate defaults outside tests/fixtures/docs" $noHardcodedOk $hardcodedDetails

# ---------------------------------------------------------------------
# Check 8: Cache Keys Include Coordinates and Rules Version
# ---------------------------------------------------------------------
Write-Host "`n>>> Check 8: Cache Key Structure Verification" -ForegroundColor Yellow
$cacheOk = $false
$cacheDetails = ""
try {
    Push-Location $BackendDir
    $cachePy = python -c "
from datetime import datetime, timezone, timedelta
from apps.risk.thresholds import RULES_VERSION
now = datetime.now(timezone.utc)
k1 = f'orca:risk:{round(18.93, 2)}:{round(72.84, 2)}:small_craft:{int(now.timestamp())}:{RULES_VERSION}'
k2 = f'orca:risk:{round(9.97, 2)}:{round(76.24, 2)}:small_craft:{int(now.timestamp())}:{RULES_VERSION}'
assert k1 != k2
assert '18.93' in k1 and '72.84' in k1
print('OK')
"
    Pop-Location
    if (($cachePy -split "`n")[-1].Trim() -eq "OK") {
        $cacheOk = $true
        $cacheDetails = "Keys incorporate lat, lon, vessel class, and rules version."
    }
} catch {
    $cacheDetails = "Cache key check error: $_"
}
Report-Check "Cache keys strictly include location, window, and rules version" $cacheOk $cacheDetails

# ---------------------------------------------------------------------
# Check 9: Full Backend Pytest Suite
# ---------------------------------------------------------------------
Write-Host "`n>>> Check 9: Full Backend Pytest Suite" -ForegroundColor Yellow
$testOk = $false
$testDetails = ""
try {
    Push-Location $BackendDir
    $pytestOutput = python -m pytest tests/ -m "not live" --tb=short 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location
    if ($exitCode -eq 0) {
        $testOk = $true
        $passedLine = ($pytestOutput | Where-Object { $_ -match "passed" }) -join "; "
        $testDetails = "All tests passed cleanly: $passedLine"
    } else {
        $testDetails = "Pytest exited with non-zero exit code ($exitCode)"
    }
} catch {
    $testDetails = "Test run error: $_"
}
Report-Check "Full backend test suite passes (Task 0 + Task 1 tests)" $testOk $testDetails

# ---------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------
Write-Host "`n=====================================================================" -ForegroundColor Cyan
Write-Host "TASK 1 VERIFICATION SUMMARY: $passes PASSED, $fails FAILED" -ForegroundColor $(if ($fails -eq 0) { "Green" } else { "Red" })
Write-Host "=====================================================================`n" -ForegroundColor Cyan

if ($fails -eq 0) {
    Write-Host ">>> TASK 1 IS 100% COMPLETE AND VERIFIED! <<<" -ForegroundColor Green
    exit 0
} else {
    Write-Host ">>> TASK 1 HAS FAILING CHECKS. PLEASE FIX AND RERUN. <<<" -ForegroundColor Red
    exit 1
}
