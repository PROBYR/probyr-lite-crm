#!/bin/bash

# Development deployment script for Probyr Lite CRM
# This script sets up the application with live code reflection

set -e

echo "🚀 Starting Probyr Lite CRM Development Deployment..."

# Kill any existing processes on port 8439
echo "🔪 Killing existing processes on port 8439..."
lsof -ti:8439 | xargs -r kill -9 || true

# Stop and remove any existing Docker containers
echo "🐳 Cleaning up existing Docker containers..."
docker-compose -f docker-compose.dev.yml down --remove-orphans || true

# Check if Encore CLI is installed
if ! command -v encore &> /dev/null; then
    echo "📦 Installing Encore CLI..."
    curl -L https://encore.dev/install.sh | bash
    export PATH="$PATH:$HOME/.local/bin"
fi

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "📦 Installing bun..."
    npm install -g bun
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd frontend && npm install && cd ..

# Generate frontend client
echo "🔧 Generating frontend client..."
cd backend && encore gen client --target leap && cd ..

# Start the development environment
echo "🚀 Starting development environment with live code reflection..."
docker-compose -f docker-compose.dev.yml up --build

echo "✅ Development environment is running!"
echo "🌐 Frontend: http://0.0.0.0:8439"
echo "🔧 Backend: http://0.0.0.0:4000"
echo "📝 Live code reflection is enabled - changes will be reflected automatically!"