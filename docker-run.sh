#!/bin/bash

# Docker-based deployment script for Probyr Lite CRM
# Provides reliable deployment with live code reflection

set -e

# Get available port or use default
FRONTEND_PORT=${VITE_PORT:-8439}
VITE_PORT=${VITE_PORT:-8439}

echo "🐳 Deploying Probyr Lite CRM with Docker on port $FRONTEND_PORT..."

# Kill any existing processes on the specified port
echo "🔪 Cleaning up port $FRONTEND_PORT..."
lsof -ti:$FRONTEND_PORT | xargs -r kill -9 || true

# Stop and remove existing containers
echo "🐳 Cleaning up existing containers..."
docker stop probyr-frontend-dev 2>/dev/null || true
docker rm probyr-frontend-dev 2>/dev/null || true

# Build and run the development container
echo "🔨 Building development container..."
docker build -f Dockerfile.dev -t probyr-frontend-dev .

echo "🚀 Starting development container..."
docker run -d \
  --name probyr-frontend-dev \
  -p $FRONTEND_PORT:${VITE_PORT:-8439} \
  -v "$(pwd)/frontend:/app" \
  -v /app/node_modules \
  -e VITE_PORT=${VITE_PORT:-8439} \
  probyr-frontend-dev

echo "✅ Application deployed successfully!"
echo "🌐 Frontend: http://0.0.0.0:$FRONTEND_PORT"
echo "📝 Live code reflection enabled - changes will be reflected automatically!"
echo ""
echo "To view logs: docker logs -f probyr-frontend-dev"
echo "To stop: docker stop probyr-frontend-dev"