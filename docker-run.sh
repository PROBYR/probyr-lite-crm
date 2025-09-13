#!/bin/bash

# Docker-based deployment script for Probyr Lite CRM
# Provides reliable deployment with live code reflection

set -e

echo "🐳 Deploying Probyr Lite CRM with Docker on port 8439..."

# Kill any existing processes on port 8439
echo "🔪 Cleaning up port 8439..."
lsof -ti:8439 | xargs -r kill -9 || true

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
  -p 8439:8439 \
  -v "$(pwd)/frontend:/app" \
  -v /app/node_modules \
  probyr-frontend-dev

echo "✅ Application deployed successfully!"
echo "🌐 Frontend: http://0.0.0.0:8439"
echo "📝 Live code reflection enabled - changes will be reflected automatically!"
echo ""
echo "To view logs: docker logs -f probyr-frontend-dev"
echo "To stop: docker stop probyr-frontend-dev"