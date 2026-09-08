#!/usr/bin/env bash
# ==============================================================================
# HoneyChain SIH 2026 — Single-Command Startup Script
# Works on Linux & macOS across all shells (Bash, Zsh, Fish)
# ==============================================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=================================================="
echo "🍯 Starting HoneyChain SIH 2026 Platform"
echo "=================================================="

# Check if environment is prepared
if [ ! -d "$DIR/backend/venv" ] && [ ! -d "$DIR/backend/.venv" ] && [ ! -d "$DIR/.venv" ]; then
    echo "⚠️  Virtual environment not found!"
    echo "   Running automated setup first..."
    "$DIR/setup.sh"
fi

if [ ! -d "$DIR/frontend/node_modules" ]; then
    echo "⚠️  Frontend node_modules not found!"
    echo "   Running npm install..."
    (cd "$DIR/frontend" && npm install)
fi

# Locate uvicorn runner
UVICORN_BIN=""
if [ -f "$DIR/backend/venv/bin/uvicorn" ]; then
    UVICORN_BIN="$DIR/backend/venv/bin/uvicorn"
elif [ -f "$DIR/backend/.venv/bin/uvicorn" ]; then
    UVICORN_BIN="$DIR/backend/.venv/bin/uvicorn"
elif [ -f "$DIR/.venv/bin/uvicorn" ]; then
    UVICORN_BIN="$DIR/.venv/bin/uvicorn"
elif command -v uvicorn &> /dev/null; then
    UVICORN_BIN="uvicorn"
fi

if [ -z "$UVICORN_BIN" ]; then
    echo "❌ Error: Could not locate uvicorn. Please run ./setup.sh first."
    exit 1
fi

# Check if port 8000 or 5173 are already bound
if command -v lsof &> /dev/null; then
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port 8000 is already in use. Terminating existing process..."
        kill -9 $(lsof -ti:8000) 2>/dev/null || true
    fi

    if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port 5173 is already in use. Terminating existing process..."
        kill -9 $(lsof -ti:5173) 2>/dev/null || true
    fi
fi

# 1. Start Backend
echo "🚀 [1/2] Launching FastAPI Backend on http://127.0.0.1:8000..."
(cd "$DIR/backend" && "$UVICORN_BIN" app.main:app --host 127.0.0.1 --port 8000 --reload) &
BACKEND_PID=$!

# 2. Start Frontend
echo "⚡ [2/2] Launching Vite + React Frontend on http://127.0.0.1:5173..."
cd "$DIR/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "✅ Both HoneyChain services are up and running!"
echo "   👉 Web Application: http://localhost:5173"
echo "   👉 Backend API:     http://localhost:8000"
echo "   👉 API Docs:        http://localhost:8000/docs"
echo "   👉 Health Check:    http://localhost:8000/health"
echo ""
echo "Demo Accounts (Password: password123):"
echo "   • beekeeper@honeychain.com  (Beekeeper role)"
echo "   • collector@honeychain.com  (Collector role)"
echo "   • processor@honeychain.com  (Processor role)"
echo "   • lab@honeychain.com        (Lab Analyst role)"
echo "   • admin@honeychain.com      (System Administrator)"
echo ""
echo "Press Ctrl+C at any time to cleanly stop both services."
echo "=================================================="

# Clean shutdown on Ctrl+C or kill
cleanup() {
    echo ""
    echo "🛑 Shutting down HoneyChain services..."
    kill -TERM $BACKEND_PID 2>/dev/null || true
    kill -TERM $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID 2>/dev/null || true
    wait $FRONTEND_PID 2>/dev/null || true
    echo "👋 All HoneyChain services stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
