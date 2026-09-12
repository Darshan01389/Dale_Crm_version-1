# Dale CRM Universal Start Script
$ErrorActionPreference = "SilentlyContinue"

# 1. Resolve Project Root
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (Test-Path "$scriptDir\backend") {
    $projectDir = $scriptDir
} elseif (Test-Path "$scriptDir\Dale_Crm_version-1\backend") {
    $projectDir = "$scriptDir\Dale_Crm_version-1"
} elseif (Test-Path "E:\Version 1\Dale_Crm_version-1\backend") {
    $projectDir = "E:\Version 1\Dale_Crm_version-1"
} else {
    $projectDir = (Get-Location).Path
}

$backendDir = Join-Path $projectDir "backend"
$frontendDir = Join-Path $projectDir "frontend"

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "       Starting Dale CRM Fullstack Platform       " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

# Helper function to check HTTP status
function Test-HttpEndpoint {
    param([string]$Url, [int]$TimeoutMs = 1200)
    try {
        $req = [System.Net.HttpWebRequest]::Create($Url)
        $req.Timeout = $TimeoutMs
        $res = $req.GetResponse()
        $statusCode = [int]$res.StatusCode
        $res.Close()
        return ($statusCode -ge 200 -and $statusCode -lt 400)
    } catch {
        return $false
    }
}

# 2. Check / Launch Backend (Port 8000)
$backendRunning = Test-HttpEndpoint -Url "http://127.0.0.1:8000/health"
if (-not $backendRunning) {
    Write-Host "[1/2] Launching Backend FastAPI on port 8000..." -ForegroundColor Yellow
    $backendCmd = "cmd.exe /c cd /d `"$backendDir`" && python -m uvicorn main:app --host 127.0.0.1 --port 8000"
    
    # Launch detached persistent process via WMI
    $proc = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine = $backendCmd}
    if ($proc.ReturnValue -ne 0) {
        # Fallback to Start-Process
        Start-Process -FilePath "python" -ArgumentList @("-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000") -WorkingDirectory $backendDir
    }

    # Wait for backend readiness (up to 10s)
    $retries = 0
    while (-not $backendRunning -and $retries -lt 15) {
        Start-Sleep -Milliseconds 700
        $backendRunning = Test-HttpEndpoint -Url "http://127.0.0.1:8000/health"
        $retries++
    }
}

if ($backendRunning) {
    Write-Host "  -> Backend is ONLINE  (http://127.0.0.1:8000) [OK]" -ForegroundColor Green
} else {
    Write-Host "  -> Backend initialized in background." -ForegroundColor Yellow
}

# 3. Check / Launch Frontend (Port 3000)
$frontendRunning = Test-HttpEndpoint -Url "http://localhost:3000/"
if (-not $frontendRunning) {
    Write-Host "[2/2] Launching Frontend Vite on port 3000..." -ForegroundColor Yellow
    $frontendCmd = "cmd.exe /c cd /d `"$frontendDir`" && npm run dev"
    
    # Launch detached persistent process via WMI
    $proc = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{CommandLine = $frontendCmd}
    if ($proc.ReturnValue -ne 0) {
        # Fallback to Start-Process
        Start-Process -FilePath "cmd.exe" -ArgumentList @("/c", "npm", "run", "dev") -WorkingDirectory $frontendDir
    }

    # Wait for frontend readiness (up to 10s)
    $retries = 0
    while (-not $frontendRunning -and $retries -lt 15) {
        Start-Sleep -Milliseconds 700
        $frontendRunning = Test-HttpEndpoint -Url "http://localhost:3000/"
        $retries++
    }
}

if ($frontendRunning) {
    Write-Host "  -> Frontend is ONLINE (http://localhost:3000) [OK]" -ForegroundColor Green
} else {
    Write-Host "  -> Frontend initialized in background." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "       Dale CRM is Running & Ready to Use!        " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host "  >> Frontend App : http://localhost:3000" -ForegroundColor Cyan
Write-Host "  >> Backend API  : http://localhost:8000" -ForegroundColor Cyan
Write-Host "  >> API Docs     : http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""

Write-Host "Opening Dale CRM in default web browser..." -ForegroundColor Green
Start-Process "http://localhost:3000"
