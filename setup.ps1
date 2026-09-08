<#
.SYNOPSIS
    HoneyChain SIH 2026 - Windows PowerShell Setup Script
.DESCRIPTION
    Automates environment verification, Python virtual environment creation,
    dependency installation, database seeding, and frontend package setup.
#>

$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "🍯 HoneyChain SIH 2026 - PowerShell Setup" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host ""

# 1. System Requirements Check
Write-Host "[1/5] Checking system prerequisites..." -ForegroundColor Cyan

$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
} else {
    Write-Error "Python is not installed or not in your PATH. Please install Python 3.10+ from https://python.org."
}

$pyVersion = & $pythonCmd --version
Write-Host "   ✅ Found $pyVersion" -ForegroundColor Green

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org."
}
$nodeVersion = node -v
Write-Host "   ✅ Found Node.js $nodeVersion" -ForegroundColor Green

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "npm is not installed."
}
$npmVersion = npm -v
Write-Host "   ✅ Found npm $npmVersion" -ForegroundColor Green
Write-Host ""

# 2. Virtual Environment Setup
Write-Host "[2/5] Setting up Python virtual environment in backend\venv..." -ForegroundColor Cyan
if (-not (Test-Path "backend\venv")) {
    & $pythonCmd -m venv backend\venv
    Write-Host "   ✅ Created virtual environment in backend\venv" -ForegroundColor Green
} else {
    Write-Host "   ℹ️  Virtual environment already exists in backend\venv" -ForegroundColor Gray
}

$venvPython = "backend\venv\Scripts\python.exe"
$venvPip = "backend\venv\Scripts\pip.exe"

Write-Host "📦 Installing backend requirements..." -ForegroundColor Cyan
& $venvPython -m pip install --upgrade pip --quiet
& $venvPip install -r backend\requirements.txt --quiet
Write-Host "   ✅ Backend requirements installed successfully" -ForegroundColor Green
Write-Host ""

# 3. Environment File Setup
Write-Host "[3/5] Configuring environment variables..." -ForegroundColor Cyan
if (-not (Test-Path "backend\.env")) {
    if (Test-Path "backend\.env.example") {
        Copy-Item "backend\.env.example" "backend\.env"
        Write-Host "   ✅ Created backend\.env from template" -ForegroundColor Green
    } else {
        New-Item -ItemType File -Path "backend\.env" -Force | Out-Null
        Write-Host "   ✅ Created empty backend\.env" -ForegroundColor Green
    }
} else {
    Write-Host "   ℹ️  backend\.env already exists" -ForegroundColor Gray
}
Write-Host ""

# 4. Database Initialization & Seeding
Write-Host "[4/5] Initializing database and seeding demo user accounts..." -ForegroundColor Cyan
$env:PYTHONPATH = (Resolve-Path "backend").Path
& $venvPython "backend\seed_demo_data.py"
Write-Host "   ✅ Database initialized and demo accounts created" -ForegroundColor Green
Write-Host ""

# 5. Frontend Dependencies
Write-Host "[5/5] Installing frontend dependencies..." -ForegroundColor Cyan
Push-Location "frontend"
npm install
Pop-Location
Write-Host "   ✅ Frontend dependencies installed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "==================================================" -ForegroundColor Yellow
Write-Host "🎉 Setup Complete! You are ready to launch HoneyChain." -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "To start the application, run:" -ForegroundColor White
Write-Host "   .\start.ps1   (or start.bat)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Demo Accounts (Password: password123):" -ForegroundColor White
Write-Host "   • Beekeeper: beekeeper@honeychain.com"
Write-Host "   • Collector: collector@honeychain.com"
Write-Host "   • Processor: processor@honeychain.com"
Write-Host "   • Lab:       lab@honeychain.com"
Write-Host "   • Admin:     admin@honeychain.com"
Write-Host "==================================================" -ForegroundColor Yellow
