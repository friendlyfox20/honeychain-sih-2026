#!/usr/bin/env bash
# ==============================================================================
# HoneyChain SIH 2026 — Single-Command Startup Script
# Works from any shell (Bash, Zsh, Fish)
# ==============================================================================

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "=================================================="
echo "🍯 Starting HoneyChain SIH 2026 Platform"
echo "=================================================="

# Check if port 8000 or 5173 are already bound
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8000 is already in use. Terminating existing process..."
    kill -9 $(lsof -ti:8000) 2>/dev/null || true
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 5173 is already in use. Terminating existing process..."
    kill -9 $(lsof -ti:5173) 2>/dev/null || true
fi

# 1. Start Backend
echo "🚀 [1/2] Launching FastAPI Backend on http://127.0.0.1:8000..."
(cd "$DIR/backend" && "$DIR/backend/venv/bin/uvicorn" app.main:app --host 127.0.0.1 --port 8000 --reload) &
BACKEND_PID=$!

# 2. Start Frontend
echo "⚡ [2/2] Launching Vite + React Frontend on http://127.0.0.1:5173..."
cd "$DIR/frontend"
npm run dev -- --host 127.0.0.1 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "✅ Both services running!"
echo "   👉 Frontend: http://localhost:5173"
echo "   👉 Backend API: http://localhost:8000"
echo "   👉 API Docs: http://localhost:8000/docs"
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
    echo "👋 All HoneyChain services stopped."
    exit 0
}

trap cleanup SIGINT SIGTERM

wait
