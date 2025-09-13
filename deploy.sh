#!/bin/bash

# Simple deployment script for Probyr Lite CRM
# Deploys the frontend with dynamic port assignment

set -e

# Get available port or use default
FRONTEND_PORT=${VITE_PORT:-0}  # 0 = auto-assign
BACKEND_PORT=${ENCORE_PORT:-4000}

echo "🚀 Deploying Probyr Lite CRM..."
echo "🔧 Backend will use port: $BACKEND_PORT"
echo "🌐 Frontend will auto-assign port (starting from $FRONTEND_PORT)..."

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Set environment variables for dynamic configuration
export VITE_PORT=$FRONTEND_PORT
export VITE_BACKEND_URL="http://localhost:$BACKEND_PORT"

# Start the development server
echo "🌐 Starting Vite development server..."
echo "📝 Live code reflection enabled - changes will be reflected automatically!"
echo "🔧 Backend URL: $VITE_BACKEND_URL"

# Start Vite with dynamic port assignment
npx vite dev --host 0.0.0.0 --port $FRONTEND_PORT --clearScreen false