@echo off
REM ==============================================================================
REM HoneyChain SIH 2026 — Startup Launcher for Windows
REM ==============================================================================

setlocal enabledelayedexpansion

echo ==================================================
echo   Starting HoneyChain SIH 2026 Platform (Windows)
echo ==================================================
echo.

REM Verify environment is ready
if not exist "backend\venv\Scripts\python.exe" (
    echo [WARNING] Virtual environment not found. Running setup.bat first...
    call setup.bat
)

if not exist "frontend\node_modules" (
    echo [WARNING] Frontend node_modules not found. Installing packages...
    cd frontend
    call npm install
    cd ..
)

REM Terminate existing processes on ports 8000 and 5173 if already running
echo Checking ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr /r ":8000 .*LISTENING"') do (
    echo Terminating stale process on port 8000 (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr /r ":5173 .*LISTENING"') do (
    echo Terminating stale process on port 5173 (PID: %%a)...
    taskkill /f /pid %%a >nul 2>&1
)

REM 1. Launch FastAPI Backend
echo.
echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000...
start "HoneyChain Backend (FastAPI)" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

REM 2. Launch Vite Frontend
echo [2/2] Launching Vite Frontend on http://127.0.0.1:5173...
start "HoneyChain Frontend (Vite + React)" cmd /k "cd frontend && npm run dev -- --host 127.0.0.1 --port 5173"

echo.
echo ==================================================
echo   Both HoneyChain services have been launched!
echo ==================================================
echo.
echo   Web Application:     http://localhost:5173
echo   FastAPI Swagger API: http://localhost:8000/docs
echo   Health Check:        http://localhost:8000/health
echo.
echo Demo Accounts (Password: password123):
echo   • Beekeeper: beekeeper@honeychain.com
echo   • Collector: collector@honeychain.com
echo   • Processor: processor@honeychain.com
echo   • Lab:       lab@honeychain.com
echo   • Admin:     admin@honeychain.com
echo.
echo Two console windows were opened (one for Backend, one for Frontend).
echo Close those windows when you want to stop the servers.
echo ==================================================
pause
