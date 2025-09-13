#!/bin/bash

# Auto-deployment script for Probyr Lite CRM
# Automatically finds available ports and deploys the application

set -e

echo "🚀 Auto-deploying Probyr Lite CRM with dynamic port assignment..."

# Function to find an available port
find_available_port() {
    local start_port=$1
    local port=$start_port
    
    while lsof -ti:$port >/dev/null 2>&1; do
        port=$((port + 1))
        # Prevent infinite loop
        if [ $port -gt $((start_port + 100)) ]; then
            echo "❌ Could not find available port starting from $start_port"
            exit 1
        fi
    done
    
    echo $port
}

# Find available ports
echo "🔍 Finding available ports..."
BACKEND_PORT=$(find_available_port 4000)
FRONTEND_PORT=$(find_available_port 3000)  # Start from 3000 for frontend

echo "✅ Found available ports:"
echo "   Backend: $BACKEND_PORT"
echo "   Frontend: $FRONTEND_PORT"

# Export environment variables
export ENCORE_PORT=$BACKEND_PORT
export VITE_PORT=$FRONTEND_PORT
export VITE_BACKEND_URL="http://localhost:$BACKEND_PORT"
export BACKEND_PORT=$BACKEND_PORT
export FRONTEND_PORT=$FRONTEND_PORT
export PORT=$BACKEND_PORT  # For Docker containers

echo ""
echo "🔧 Configuration:"
echo "   ENCORE_PORT=$BACKEND_PORT"
echo "   VITE_PORT=$FRONTEND_PORT"
echo "   VITE_BACKEND_URL=$VITE_BACKEND_URL"
echo "   PORT=$BACKEND_PORT (Docker)"
echo ""

# Ask user which deployment method to use
echo "📋 Choose deployment method:"
echo "1) Native development (recommended)"
echo "2) Docker development"
echo "3) Docker production"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🚀 Starting native development deployment..."
        ./start-dev.sh
        ;;
    2)
        echo "🐳 Starting Docker development deployment..."
        ./docker-run.sh
        ;;
    3)
        echo "🐳 Starting Docker production deployment..."
        ./docker-deploy.sh
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment completed!"
echo "🌐 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔧 Backend: http://localhost:$BACKEND_PORT"
echo ""
echo "📝 Environment variables used:"
echo "   ENCORE_PORT=$BACKEND_PORT"
echo "   VITE_PORT=$FRONTEND_PORT"
echo "   VITE_BACKEND_URL=$VITE_BACKEND_URL"
echo "   PORT=$BACKEND_PORT (Docker)"