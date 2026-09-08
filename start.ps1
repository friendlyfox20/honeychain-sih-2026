<#
.SYNOPSIS
    HoneyChain SIH 2026 - Windows PowerShell Startup Script
.DESCRIPTION
    Frees ports 8000/5173 and launches backend and frontend in concurrent processes.
#>

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "🍯 Starting HoneyChain SIH 2026 Platform" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host ""

# Verify environment
if (-not (Test-Path "backend\venv\Scripts\python.exe")) {
    Write-Warning "Virtual environment not found. Running setup.ps1 first..."
    & .\setup.ps1
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Warning "Frontend node_modules not found. Installing packages..."
    Push-Location "frontend"
    npm install
    Pop-Location
}

# Free port 8000 and 5173 if busy
$ports = @(8000, 5173)
foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $conns) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill) {
                Write-Host "Terminating process on port $port (PID: $pidToKill)..." -ForegroundColor Yellow
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        # Continue if NetTCPConnection is unavailable on older Windows versions
    }
}

# 1. Start FastAPI Backend in a separate window
Write-Host "🚀 [1/2] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# 2. Start Vite Frontend in a separate window
Write-Host "⚡ [2/2] Launching Vite Frontend on http://127.0.0.1:5173..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --host 127.0.0.1 --port 5173"

Write-Host ""
Write-Host "✅ Both HoneyChain services launched!" -ForegroundColor Green
Write-Host "   👉 Web Application:     http://localhost:5173" -ForegroundColor White
Write-Host "   👉 FastAPI Swagger API: http://localhost:8000/docs" -ForegroundColor White
Write-Host "   👉 Health Check:        http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "Demo Accounts (Password: password123):" -ForegroundColor White
Write-Host "   • Beekeeper: beekeeper@honeychain.com"
Write-Host "   • Collector: collector@honeychain.com"
Write-Host "   • Processor: processor@honeychain.com"
Write-Host "   • Lab:       lab@honeychain.com"
Write-Host "   • Admin:     admin@honeychain.com"
Write-Host "==================================================" -ForegroundColor Yellow
