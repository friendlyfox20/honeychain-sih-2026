@echo off
REM ==============================================================================
REM HoneyChain SIH 2026 — Automated Setup Script for Windows (CMD / PowerShell)
REM ==============================================================================

setlocal enabledelayedexpansion

echo ==================================================
echo   HoneyChain SIH 2026 - Windows Environment Setup
echo ==================================================
echo.

REM 1. Check Python
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    py -3 --version >nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Python is not installed or not in your PATH.
        echo Please install Python 3.10+ from https://www.python.org/downloads/
        echo Make sure to check "Add python.exe to PATH" during installation.
        pause
        exit /b 1
    ) else (
        set "PYTHON_CMD=py -3"
    )
) else (
    set "PYTHON_CMD=python"
)
for /f "tokens=*" %%i in ('%PYTHON_CMD% --version') do echo    Found %%i

REM 2. Check Node.js and npm
echo.
echo [2/5] Checking Node.js and npm...
node -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo    Found Node.js %%i

npm -v >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not installed or not in your PATH.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do echo    Found npm %%i

REM 3. Create Virtual Environment
echo.
echo [3/5] Setting up Python virtual environment in backend\venv...
if not exist "backend\venv" (
    %PYTHON_CMD% -m venv backend\venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
    echo    Created virtual environment in backend\venv
) else (
    echo    Virtual environment already exists in backend\venv
)

echo    Installing backend requirements...
backend\venv\Scripts\python.exe -m pip install --upgrade pip --quiet
backend\venv\Scripts\pip.exe install -r backend\requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b 1
)
echo    Backend dependencies installed successfully.

REM 4. Environment Variables & Seed Database
echo.
echo [4/5] Initializing database and seeding demo user accounts...
if not exist "backend\.env" (
    if exist "backend\.env.example" (
        copy "backend\.env.example" "backend\.env" >nul
        echo    Created backend\.env from backend\.env.example
    ) else (
        type nul > "backend\.env"
    )
)
cd backend
set PYTHONPATH=%CD%
venv\Scripts\python.exe seed_demo_data.py
cd ..
echo    Database initialized and demo accounts verified.

REM 5. Frontend Dependencies
echo.
echo [5/5] Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo    Frontend packages installed successfully.

echo.
echo ==================================================
echo   Setup Complete! You are ready to launch HoneyChain.
echo ==================================================
echo.
echo To start both Backend and Frontend, simply run:
echo    start.bat
echo.
echo Access URLs once started:
echo    Web Application:     http://localhost:5173
echo    API Documentation:   http://localhost:8000/docs
echo    Health Check:        http://localhost:8000/health
echo.
echo Demo Accounts (Password: password123):
echo    Beekeeper: beekeeper@honeychain.com
echo    Collector: collector@honeychain.com
echo    Processor: processor@honeychain.com
echo    Lab:       lab@honeychain.com
echo    Admin:     admin@honeychain.com
echo ==================================================
pause
