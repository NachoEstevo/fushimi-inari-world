param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$viewerUrl = 'http://127.0.0.1:8420/geography/index.html'
$listener = Get-NetTCPConnection -LocalPort 8420 -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
    $pythonExe = (Get-Command python.exe -ErrorAction Stop).Source
    $logDir = Join-Path $projectRoot 'outputs/geography'
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $serverArgs = @('-m', 'http.server', '8420', '--bind', '127.0.0.1', '--directory', "`"$projectRoot`"")
    Start-Process -FilePath $pythonExe -ArgumentList $serverArgs -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logDir 'server.stdout.log') `
        -RedirectStandardError (Join-Path $logDir 'server.stderr.log') | Out-Null
}
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    try {
        $response = Invoke-WebRequest -Uri $viewerUrl -UseBasicParsing -TimeoutSec 2
        if ($response.Content -notmatch 'geo|Territorio') { throw 'Otro servicio ocupa el puerto 8420.' }
        if (-not $NoBrowser) { Start-Process $viewerUrl }
        exit 0
    } catch {
        if ($attempt -eq 19) { throw "No se pudo abrir el visor en el puerto 8420. $($_.Exception.Message)" }
        Start-Sleep -Milliseconds 250
    }
}
