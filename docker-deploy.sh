#!/bin/bash

# Production Docker deployment script for Probyr Lite CRM
# Deploys the application using Docker Compose

set -e

# Get available port or use default
BACKEND_PORT=${BACKEND_PORT:-4000}

echo "🐳 Deploying Probyr Lite CRM with Docker on port $BACKEND_PORT..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Stop and remove existing containers
echo "🛑 Stopping existing containers..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

# Remove old images to force rebuild
echo "🗑️ Removing old images..."
docker rmi probyr-lite-crm-1757733081_probyr-crm 2>/dev/null || true

# Build and start the application
echo "🔨 Building and starting the application..."
export BACKEND_PORT=$BACKEND_PORT
if command -v docker-compose &> /dev/null; then
    docker-compose up --build -d
else
    docker compose up --build -d
fi

# Wait for the application to start
echo "⏳ Waiting for application to start..."
sleep 10

# Check if the application is running
if docker ps | grep -q probyr-crm; then
    echo "✅ Application deployed successfully!"
    echo "🌐 Application is available at: http://localhost:$BACKEND_PORT"
    echo "📊 Container status:"
    docker ps | grep probyr-crm
    echo ""
    echo "📝 Useful commands:"
    echo "  View logs: docker logs -f probyr-crm"
    echo "  Stop app: docker-compose down"
    echo "  Restart: docker-compose restart"
else
    echo "❌ Application failed to start. Check logs with: docker logs probyr-crm"
    exit 1
fi