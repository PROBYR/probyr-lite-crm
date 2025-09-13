#!/bin/bash

# Native development deployment script for Probyr Lite CRM
# This script runs the application natively with maximum live code reflection

set -e

echo "🚀 Starting Probyr Lite CRM Native Development..."

# Kill any existing processes on ports 4000 and 8439
echo "🔪 Killing existing processes on ports 4000 and 8439..."
lsof -ti:4000 | xargs -r kill -9 || true
lsof -ti:8439 | xargs -r kill -9 || true

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
    echo "🔧 Starting Encore backend on port 4000..."
    cd backend
    encore run &
    BACKEND_PID=$!
    cd ..
}

# Function to start frontend
start_frontend() {
    echo "🌐 Starting Vite frontend on port 8439..."
    cd frontend
    npx vite dev --host 0.0.0.0 --port 8439 &
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
echo "🌐 Frontend: http://0.0.0.0:8439"
echo "🔧 Backend: http://0.0.0.0:4000"
echo "📝 Live code reflection is enabled - changes will be reflected automatically!"
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait