#!/bin/bash

# Simple deployment script for Probyr Lite CRM
# Deploys the frontend on port 8439 with live code reflection

set -e

echo "🚀 Deploying Probyr Lite CRM on port 8439..."

# Kill any existing processes on port 8439
echo "🔪 Cleaning up port 8439..."
lsof -ti:8439 | xargs -r kill -9 || true

# Navigate to frontend directory
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development server
echo "🌐 Starting Vite development server on port 8439..."
echo "📝 Live code reflection enabled - changes will be reflected automatically!"
echo "🌐 Application will be available at: http://0.0.0.0:8439"

# Start Vite with proper configuration
npx vite dev --host 0.0.0.0 --port 8439 --clearScreen false