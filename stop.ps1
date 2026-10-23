$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    $statePath = Join-Path $PSScriptRoot '.runtime/processes.json'
    if (Test-Path -LiteralPath $statePath) {
        $entries = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
        foreach ($entry in $entries) {
            $process = Get-Process -Id $entry.Id -ErrorAction SilentlyContinue
            if ($process -and $process.StartTime.ToUniversalTime().ToString('o') -eq $entry.StartTime) {
                $children = Get-CimInstance Win32_Process -Filter "ParentProcessId = $($entry.Id)"
                foreach ($child in $children) { Stop-Process -Id $child.ProcessId -Force -ErrorAction SilentlyContinue }
                Stop-Process -Id $entry.Id -Force -ErrorAction SilentlyContinue
            }
        }
        Remove-Item -LiteralPath $statePath
    }
    docker compose stop
    if ($LASTEXITCODE -ne 0) { throw 'Could not stop all services.' }
} finally {
    Pop-Location
}
