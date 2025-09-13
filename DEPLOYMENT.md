# Probyr Lite CRM - Deployment Guide

This application now supports **dynamic port assignment** to avoid conflicts when deploying on different computers.

## 🚀 Quick Deployment Options

### Option 1: Auto-Deploy (Recommended)
Automatically finds available ports and deploys:
```bash
./auto-deploy.sh
```

### Option 2: Native Development Server
```bash
./deploy.sh
```

### Option 3: Docker Development Server
```bash
./docker-run.sh
```

### Option 4: Docker Production Server
```bash
./docker-deploy.sh
```

### Option 5: Manual Deployment
```bash
cd frontend
npm install
npx vite dev --host 0.0.0.0 --port 0  # 0 = auto-assign port
```

## Features Enabled

✅ **Dynamic Port Assignment**: Automatically finds available ports to avoid conflicts
✅ **Live Code Reflection**: Changes to source code are automatically reflected in the browser
✅ **Hot Module Replacement**: Instant updates without page refresh
✅ **External Access**: Bound to 0.0.0.0 for external access
✅ **Development Mode**: Optimized for development with fast rebuilds
✅ **Volume Mounting**: Docker option includes volume mounting for live file watching
✅ **Environment Variables**: Configurable via ENCORE_PORT, VITE_PORT, VITE_BACKEND_URL

## Access Points

The application will automatically assign available ports:
- **Frontend**: http://localhost:[AUTO-ASSIGNED-PORT]
- **Backend**: http://localhost:[AUTO-ASSIGNED-PORT]

## Configuration

The application supports dynamic configuration via environment variables:
- `ENCORE_PORT`: Backend port (default: 4000)
- `VITE_PORT`: Frontend port (default: 0 = auto-assign)
- `VITE_BACKEND_URL`: Backend URL for frontend (default: http://localhost:4000)
- Host: 0.0.0.0 (external access enabled)
- Development mode with live reload
- CORS enabled
- Flexible port binding
- Optimized dependencies for React

## Troubleshooting

If the deployment fails:
1. **Port Conflicts**: Use `./auto-deploy.sh` to automatically find available ports
2. **Manual Port Check**: `lsof -ti:4000` or `lsof -ti:3000` to check port usage
3. **Kill Existing Processes**: `lsof -ti:[PORT] | xargs kill -9`
4. **Docker Clean Environment**: Try `./docker-run.sh` or `./docker-deploy.sh`
5. **Dependencies**: Check that all dependencies are installed: `cd frontend && npm install`
6. **Environment Variables**: Set custom ports: `ENCORE_PORT=5000 VITE_PORT=3001 ./start-dev.sh`

## Environment Variables

You can customize the deployment by setting these environment variables:

```bash
# Custom ports
export ENCORE_PORT=5000        # Backend port
export VITE_PORT=3001          # Frontend port (0 = auto-assign)
export VITE_BACKEND_URL="http://localhost:5000"  # Backend URL for frontend

# Then run any deployment script
./start-dev.sh
```

## Development Features

- **File Watching**: Automatically detects file changes
- **Fast Refresh**: React components update without losing state
- **Error Overlay**: Development errors are displayed in the browser
- **Source Maps**: Full debugging support in development