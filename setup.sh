#!/usr/bin/env bash
# ==============================================================================
# HoneyChain SIH 2026 — Automated Environment Setup Script
# Works on Linux & macOS (Bash / Zsh)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=================================================="
echo "🍯 HoneyChain SIH 2026 — Initial Environment Setup"
echo "=================================================="
echo ""

# 1. System Requirements Check
echo "🔍 [1/5] Checking system prerequisites..."

if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed or not in PATH."
    echo "   Please install Python 3.10+ (recommended: Python 3.10, 3.11, or 3.12)."
    exit 1
fi

PYTHON_VER=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "   ✅ Found Python $PYTHON_VER"

if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed or not in PATH."
    echo "   Please install Node.js 18+ (https://nodejs.org)."
    exit 1
fi

NODE_VER=$(node -v)
echo "   ✅ Found Node.js $NODE_VER"

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed or not in PATH."
    exit 1
fi

NPM_VER=$(npm -v)
echo "   ✅ Found npm $NPM_VER"
echo ""

# 2. Backend Virtual Environment
echo "🐍 [2/5] Setting up Python virtual environment in backend/venv..."
if [ ! -d "$DIR/backend/venv" ]; then
    python3 -m venv "$DIR/backend/venv"
    echo "   ✅ Created virtual environment in backend/venv"
else
    echo "   ℹ️  Virtual environment already exists in backend/venv"
fi

# Ensure pip is up-to-date
"$DIR/backend/venv/bin/python" -m pip install --upgrade pip --quiet

# Install backend dependencies
echo "📦 Installing backend requirements from backend/requirements.txt..."
"$DIR/backend/venv/bin/pip" install -r "$DIR/backend/requirements.txt" --quiet
echo "   ✅ Backend dependencies installed successfully"
echo ""

# 3. Environment Variables Configuration
echo "⚙️  [3/5] Configuring environment variables..."
if [ ! -f "$DIR/backend/.env" ]; then
    if [ -f "$DIR/backend/.env.example" ]; then
        cp "$DIR/backend/.env.example" "$DIR/backend/.env"
        echo "   ✅ Created backend/.env from backend/.env.example"
    else
        touch "$DIR/backend/.env"
        echo "   ✅ Created empty backend/.env"
    fi
else
    echo "   ℹ️  backend/.env already exists"
fi
echo ""

# 4. Database Initialization & Demo User Seeding
echo "🗄️  [4/5] Initializing database and seeding demo user accounts..."
cd "$DIR/backend"
PYTHONPATH="$DIR/backend" "$DIR/backend/venv/bin/python" seed_demo_data.py
cd "$DIR"
echo "   ✅ Database initialized and demo accounts created"
echo ""

# 5. Frontend Dependencies
echo "⚛️  [5/5] Installing frontend dependencies..."
cd "$DIR/frontend"
npm install --silent
cd "$DIR"
echo "   ✅ Frontend dependencies installed successfully"
echo ""

# Set execution permissions for scripts
chmod +x "$DIR/start.sh" "$DIR/setup.sh"

echo "=================================================="
echo "🎉 Setup complete! You are ready to launch HoneyChain."
echo "=================================================="
echo ""
echo "To start the entire application (Backend + Frontend):"
echo "   ./start.sh"
echo ""
echo "Access points once running:"
echo "   👉 Frontend Web App:     http://localhost:5173"
echo "   👉 FastAPI Documentation: http://localhost:8000/docs"
echo "   👉 Health Check:          http://localhost:8000/health"
echo ""
echo "Pre-seeded Demo Login Accounts (Password: password123):"
echo "   • Beekeeper: beekeeper@honeychain.com"
echo "   • Collector: collector@honeychain.com"
echo "   • Processor: processor@honeychain.com"
echo "   • Lab:       lab@honeychain.com"
echo "   • Admin:     admin@honeychain.com"
echo "=================================================="
