#!/bin/bash

# Native development deployment script for Probyr Lite CRM
# This script runs the application natively with maximum live code reflection

set -e

# Get available ports or use defaults
BACKEND_PORT=${ENCORE_PORT:-4000}
FRONTEND_PORT=${VITE_PORT:-0}  # 0 = auto-assign

echo "🚀 Starting Probyr Lite CRM Native Development..."
echo "🔧 Backend port: $BACKEND_PORT"
echo "🌐 Frontend port: $FRONTEND_PORT (auto-assign if 0)"

# Kill any existing processes on the specified ports
echo "🔪 Cleaning up existing processes..."
if [ "$BACKEND_PORT" != "0" ]; then
    lsof -ti:$BACKEND_PORT | xargs -r kill -9 || true
fi
if [ "$FRONTEND_PORT" != "0" ]; then
    lsof -ti:$FRONTEND_PORT | xargs -r kill -9 || true
fi

# Check if Encore CLI is installed
if ! command -v encore &> /dev/null; then
    echo "📦 Installing Encore CLI..."
    curl -L https://encore.dev/install.sh | bash
    export PATH="$PATH:$HOME/.encore/bin"
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing bun..."
    npm install -g bun
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
fi
cd ..

# Generate frontend client
echo "🔧 Generating frontend client..."
cd backend
encore gen client --target leap
cd ..

# Function to start backend
start_backend() {
    echo "🔧 Starting Encore backend on port $BACKEND_PORT..."
    cd backend
    export ENCORE_PORT=$BACKEND_PORT
    encore run &
    BACKEND_PID=$!
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🌐 Starting Vite frontend on port $FRONTEND_PORT..."
    cd frontend
    export VITE_PORT=$FRONTEND_PORT
    export VITE_BACKEND_URL="http://localhost:$BACKEND_PORT"
    npx vite dev --host 0.0.0.0 --port $FRONTEND_PORT &
    FRONTEND_PID=$!
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo "🛑 Shutting down development servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start both services
start_backend
sleep 3
start_frontend

echo "✅ Development environment is running!"
echo "🌐 Frontend: http://0.0.0.0:$FRONTEND_PORT (check terminal for actual port if auto-assigned)"
echo "🔧 Backend: http://0.0.0.0:$BACKEND_PORT"
echo "📝 Live code reflection is enabled - changes will be reflected automatically!"
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait