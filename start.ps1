param([switch]$Docker, [switch]$SkipBuild)

$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot '.runtime'
$savedEnvironment = @{}
$started = @()

function Set-RunEnvironment([string]$Name, [string]$Value) {
    if (-not $savedEnvironment.ContainsKey($Name)) {
        $savedEnvironment[$Name] = [Environment]::GetEnvironmentVariable($Name, 'Process')
    }
    [Environment]::SetEnvironmentVariable($Name, $Value, 'Process')
}

function Wait-Ready([string]$Url, $Process) {
    $deadline = (Get-Date).AddSeconds(120)
    do {
        if ($Process.HasExited) { throw "Process exited. See logs in $runtime" }
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5
            if ($response.StatusCode -eq 200) { return }
        } catch {}
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)
    throw "Timed out waiting for $Url. See logs in $runtime"
}

Push-Location $PSScriptRoot
try {
    if (-not (Test-Path -LiteralPath '.env')) { Copy-Item '.env.example' '.env' }
    if ($Docker) {
        docker compose up -d --build --wait --wait-timeout 300
        if ($LASTEXITCODE -ne 0) { throw 'Docker startup failed. Run docker compose logs --tail 100.' }
        return
    }

    Get-Content '.env' | ForEach-Object {
        if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { Set-RunEnvironment $matches[1] $matches[2] }
    }
    foreach ($port in @([int]$env:APP_PORT, [int]$env:FRONTEND_PORT)) {
        if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
            throw "Port $port is already in use. Stop the existing instance before starting again."
        }
    }

    if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
        $jdk = Get-ChildItem (Join-Path $env:USERPROFILE '.jdks') -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '21' -and (Test-Path (Join-Path $_.FullName 'bin\java.exe')) } |
            Select-Object -First 1
        if ($jdk) { Set-RunEnvironment 'JAVA_HOME' $jdk.FullName }
    }
    if (-not $env:JAVA_HOME) { throw 'Set JAVA_HOME to a Java 21 JDK first.' }
    Set-RunEnvironment 'Path' "$env:JAVA_HOME\bin;$env:Path"
    $java = (Get-Command java.exe -ErrorAction Stop).Source
    $node = (Get-Command node.exe -ErrorAction Stop).Source
    $null = Get-Command npm.cmd -ErrorAction Stop

    docker compose up -d --wait --wait-timeout 120 postgres redis minio mailpit
    if ($LASTEXITCODE -ne 0) { throw 'Could not start the infrastructure services.' }
    docker compose run --rm --no-deps minio-init
    if ($LASTEXITCODE -ne 0) { throw 'Could not initialize the storage bucket.' }

    if (-not $SkipBuild) {
        Push-Location (Join-Path $PSScriptRoot 'Backend')
        try {
            & .\mvnw.cmd -B -ntp package -DskipTests
            if ($LASTEXITCODE -ne 0) { throw 'Backend build failed.' }
        } finally { Pop-Location }
    }
    if (-not (Test-Path 'Frontend/node_modules/next/dist/bin/next')) {
        npm.cmd --prefix Frontend ci --no-audit --no-fund
        if ($LASTEXITCODE -ne 0) { throw 'Frontend dependency installation failed.' }
    }
    $jar = Get-ChildItem 'Backend/target/*.jar' | Where-Object { $_.Name -notmatch 'sources|javadoc' } | Select-Object -First 1
    if (-not $jar) { throw 'Backend JAR missing. Run again without -SkipBuild.' }

    Set-RunEnvironment 'SERVER_PORT' $env:APP_PORT
    Set-RunEnvironment 'DATABASE_URL' "jdbc:postgresql://localhost:$($env:POSTGRES_PORT)/$($env:POSTGRES_DB)"
    Set-RunEnvironment 'REDIS_HOST' 'localhost'
    Set-RunEnvironment 'MINIO_ENDPOINT' "http://localhost:$($env:MINIO_PORT)"
    Set-RunEnvironment 'SMTP_HOST' 'localhost'
    Set-RunEnvironment 'SMTP_PORT' $env:MAIL_SMTP_PORT
    Set-RunEnvironment 'SPRING_DOCKER_COMPOSE_ENABLED' 'false'
    Set-RunEnvironment 'VIDEO_TRANSCODE_WORK_DIR' (Join-Path $runtime 'transcode')
    Set-RunEnvironment 'VIDEO_TRANSCODE_NICE_ENABLED' 'false'
    Set-RunEnvironment 'VIDEO_TRANSCODE_IONICE_ENABLED' 'false'
    Set-RunEnvironment 'NEXT_TELEMETRY_DISABLED' '1'

    New-Item -ItemType Directory -Path $runtime -Force | Out-Null
    $backend = Start-Process -FilePath $java -ArgumentList @('-jar', ('"' + $jar.FullName + '"')) -WorkingDirectory (Join-Path $PSScriptRoot 'Backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput "$runtime/backend.log" -RedirectStandardError "$runtime/backend-error.log"
    $started += $backend
    Wait-Ready "http://localhost:$($env:APP_PORT)/actuator/health" $backend

    $frontend = Start-Process -FilePath $node -ArgumentList @('node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', $env:FRONTEND_PORT) -WorkingDirectory (Join-Path $PSScriptRoot 'Frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput "$runtime/frontend.log" -RedirectStandardError "$runtime/frontend-error.log"
    $started += $frontend
    Wait-Ready "http://localhost:$($env:FRONTEND_PORT)/login" $frontend
    @($started | ForEach-Object { @{ Id = $_.Id; StartTime = $_.StartTime.ToUniversalTime().ToString('o') } }) | ConvertTo-Json | Set-Content "$runtime/processes.json"
    Write-Host "Frontend: http://localhost:$($env:FRONTEND_PORT)"
    Write-Host "Backend API: http://localhost:$($env:APP_PORT)/swagger-ui/index.html"
    Write-Host "Local email / OTP: http://localhost:$($env:MAIL_UI_PORT)"
} catch {
    foreach ($process in $started) { if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue } }
    throw
} finally {
    foreach ($entry in $savedEnvironment.GetEnumerator()) { [Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, 'Process') }
    Pop-Location
}
