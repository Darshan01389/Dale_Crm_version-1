# Stop Dale CRM Fullstack Platform
Write-Host "Stopping Dale CRM services..." -ForegroundColor Yellow

function Stop-PortProcess {
    param([int]$Port)
    $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conns) {
        foreach ($c in $conns) {
            $p = Get-Process -Id $c.OwningProcess -ErrorAction SilentlyContinue
            if ($p) {
                Write-Host "  -> Stopping $($p.ProcessName) (PID $($p.Id)) on port $Port..." -ForegroundColor Cyan
                Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            }
        }
    } else {
        Write-Host "  -> No active service found on port $Port." -ForegroundColor Gray
    }
}

Stop-PortProcess -Port 8000
Stop-PortProcess -Port 3000

Write-Host "Dale CRM services have been stopped." -ForegroundColor Green
