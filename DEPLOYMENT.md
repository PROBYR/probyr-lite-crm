# Probyr Lite CRM - Deployment Guide

This application is now configured for deployment on port 8439 with live code reflection.

## Quick Deployment Options

### Option 1: Native Development Server (Recommended)
```bash
./deploy.sh
```

### Option 2: Docker Development Server
```bash
./docker-run.sh
```

### Option 3: Manual Deployment
```bash
cd frontend
npm install
npx vite dev --host 0.0.0.0 --port 8439
```

## Features Enabled

✅ **Live Code Reflection**: Changes to source code are automatically reflected in the browser
✅ **Hot Module Replacement**: Instant updates without page refresh
✅ **External Access**: Bound to 0.0.0.0:8439 for external access
✅ **Development Mode**: Optimized for development with fast rebuilds
✅ **Volume Mounting**: Docker option includes volume mounting for live file watching

## Access Points

- **Frontend**: http://0.0.0.0:8439
- **Local Access**: http://localhost:8439

## Configuration

The application is configured with:
- Port: 8439
- Host: 0.0.0.0 (external access enabled)
- Development mode with live reload
- CORS enabled
- Strict port binding
- Optimized dependencies for React

## Troubleshooting

If the deployment fails:
1. Ensure port 8439 is not in use: `lsof -ti:8439`
2. Kill existing processes: `lsof -ti:8439 | xargs kill -9`
3. Try the Docker option for a clean environment
4. Check that all dependencies are installed: `cd frontend && npm install`

## Development Features

- **File Watching**: Automatically detects file changes
- **Fast Refresh**: React components update without losing state
- **Error Overlay**: Development errors are displayed in the browser
- **Source Maps**: Full debugging support in development