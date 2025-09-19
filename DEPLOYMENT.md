# ProByr Lite CRM - Development Server Guide

**Quick Start for Continuous Development** - Get the server running immediately!

## 🚀 Start Development Servers (Quick)

**Most Common Scenario** - Database already exists:
```bash
# Terminal 1: Start Backend
cd backend
DB_USER=tsjohnnychan DB_PASSWORD="" npm run dev

# Terminal 2: Start Frontend  
cd frontend
npm run dev
```

**Access Points:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## 🐳 Quick Docker Start (Alternative)

**For containerized development with live code changes:**
```bash
# Start Docker development environment (recommended)
docker-compose -f docker-compose.dev.yml up --build

# Run migrations (first time only)  
docker-compose -f docker-compose.dev.yml exec backend npm run migrate

# Access: http://localhost:5173 (frontend) + http://localhost:4000 (API)
```

**For production deployment:**
```bash
# Start production containers
docker-compose up --build -d

# Run migrations (first time only)
docker exec probyr-lite-crm npm run migrate  

# Access: http://localhost:4000 (single endpoint for both frontend + API)
```

## 🏗️ Architecture Overview

- **Backend**: Express.js + TypeScript (Port 4000)
- **Frontend**: React + Vite (Port 5173) 
- **Database**: PostgreSQL `probyr_crm` (Local)
- **User**: `tsjohnnychan` (no password required)
- **No Cloud Dependencies**: 100% local development environment

## 🔧 First Time Setup (Only if needed)

### Database Setup (If not already done)
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database (if doesn't exist)
CREATE DATABASE probyr_crm;

# Grant permissions to your user
GRANT ALL PRIVILEGES ON DATABASE probyr_crm TO tsjohnnychan;
```

### Run Migrations (If database is empty)
```bash
cd backend
npm run migrate
```

### Environment Configuration (Optional)
The backend works with environment variables, but defaults are fine for development:
```bash
# Current working configuration
DB_HOST=localhost
DB_PORT=5432  
DB_NAME=probyr_crm
DB_USER=tsjohnnychan
DB_PASSWORD=""
PORT=4000
```

**Note**: No `.env` file needed - just pass `DB_USER=tsjohnnychan DB_PASSWORD=""` when starting!

### Install Dependencies (If needed)
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies  
cd frontend && npm install
```

## 🚀 Alternative Start Methods

### Method 1: Individual Terminals (Recommended)
```bash
# Terminal 1: Backend
cd backend
DB_USER=tsjohnnychan DB_PASSWORD="" npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

### Method 2: Docker Development (Live Code Mounting) 🐳
**Perfect for development with code changes reflected immediately**

```bash
# Start Docker development environment
docker-compose -f docker-compose.dev.yml up --build

# Or start in detached mode (background)
docker-compose -f docker-compose.dev.yml up --build -d

# Run database migrations (first time only)
docker-compose -f docker-compose.dev.yml exec backend npm run migrate

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop everything
docker-compose -f docker-compose.dev.yml down
```

**Access Points:**
- **Frontend**: http://localhost:5173 (with hot reload)
- **Backend API**: http://localhost:4000 (with hot reload)
- **Database**: localhost:5432 (postgres/password)

**Benefits:**
- ✅ **Live Code Changes**: Instant reflection of code changes
- ✅ **Isolated Environment**: No local dependencies needed
- ✅ **Hot Reload**: Both frontend and backend auto-restart on changes
- ✅ **Database Included**: PostgreSQL container with persistent data
- ✅ **Easy Reset**: Clean environment with `docker-compose down -v`

**Create `docker-compose.dev.yml` for development:**
```yaml
version: '3.8'
services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "4000:4000"
    environment:
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME=probyr_crm
      - DB_USER=postgres
      - DB_PASSWORD=password
      - NODE_ENV=development
    volumes:
      - ./backend/src:/app/src:ro        # Mount source code (read-only)
      - ./backend/package.json:/app/package.json:ro
      - ./backend/tsconfig.json:/app/tsconfig.json:ro
      - backend_node_modules:/app/node_modules  # Named volume for node_modules
    depends_on:
      - db
    restart: unless-stopped
    
  frontend:
    build:
      context: ./frontend  
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    environment:
      - VITE_API_URL=http://localhost:4000
    volumes:
      - ./frontend/src:/app/src:ro       # Mount source code (read-only)
      - ./frontend/public:/app/public:ro
      - ./frontend/package.json:/app/package.json:ro
      - ./frontend/vite.config.ts:/app/vite.config.ts:ro
      - frontend_node_modules:/app/node_modules  # Named volume for node_modules
    restart: unless-stopped
    
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=probyr_crm
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d:ro
    restart: unless-stopped

volumes:
  backend_node_modules:
  frontend_node_modules:
  postgres_data:
```

**Create `backend/Dockerfile.dev`:**
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Install development dependencies
RUN npm install -g tsx

# Copy source code (will be overridden by volume mount)
COPY . .

# Expose port
EXPOSE 4000

# Start with hot reload
CMD ["npm", "run", "dev"]
```

**Create `frontend/Dockerfile.dev`:**
```dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code (will be overridden by volume mount)
COPY . .

# Expose port
EXPOSE 5173

# Start with hot reload and host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

**Benefits of Docker Development Method:**
- ✅ **Isolated Environment**: Consistent development environment
- ✅ **Live Code Reload**: Changes reflect immediately via volume mounts
- ✅ **Database Included**: PostgreSQL runs in container
- ✅ **Port Forwarding**: Access via localhost:5173 and localhost:4000
- ✅ **Easy Cleanup**: `docker-compose down` removes everything
- ✅ **Team Consistency**: Same environment for all developers

### Method 3: Using Development Script
```bash
# Start both servers with one command
./start-dev.sh
```

### Method 4: Background Process
```bash
# Start backend in background
cd backend && DB_USER=tsjohnnychan DB_PASSWORD="" npm run dev &

# Start frontend normally
cd frontend && npm run dev
```

### Method 5: Docker Production Deployment ✅

**Fully working Docker setup for production deployment:**

```bash
# Build and start the application with database
docker-compose up --build -d

# Run database migrations (first time only)
docker exec probyr-lite-crm npm run migrate

# Check status
docker ps

# View logs
docker logs probyr-lite-crm -f

# Stop everything
docker-compose down
```

**What's included:**
- ✅ **Express.js Backend**: Serves both API and static frontend files
- ✅ **PostgreSQL Database**: Persistent data storage with health checks
- ✅ **Frontend Build**: React app built and served by Express
- ✅ **Production Ready**: Multi-stage build with security best practices
- ✅ **Health Checks**: Automatic container health monitoring
- ✅ **Database Migrations**: Easy migration management

**Access Points:**
- **Application**: http://localhost:4000 (both frontend and API)
- **Database**: localhost:5432 (postgres/password)

**Docker Architecture:**
- **Single Container**: Express.js serves both API and frontend
- **Separate Database**: PostgreSQL in dedicated container
- **Volume Persistence**: Database data persists between restarts
- **Health Monitoring**: Built-in health checks for both services

## 🔧 Development Environment Details

### Backend (Express.js)
- **Port**: 4000 (configurable via PORT env var)
- **Hot Reload**: Uses `tsx --watch` for TypeScript hot reloading
- **Database**: PostgreSQL with connection pooling
- **CORS**: Enabled for frontend communication
- **Middleware**: Helmet for security, body parsing, etc.

### Frontend (React + Vite)
- **Port**: 5173 (Vite default)
- **Hot Reload**: Vite HMR (Hot Module Replacement)
- **API Client**: Configured to connect to backend at `http://localhost:4000`
- **Development Mode**: Source maps and error overlay enabled

### Database (PostgreSQL)
- **Local Instance**: No cloud dependencies
- **Migrations**: SQL files in `backend/migrations/`
- **Sample Data**: Automatically loaded during migration
- **Connection Pooling**: Configured via `pg` library

## 📊 Available Endpoints

### Backend API Endpoints:
- **Health Check**: `GET http://localhost:4000/health`
- **People**: `GET/POST/PUT/DELETE http://localhost:4000/people`
- **Companies**: `GET/PUT http://localhost:4000/companies/:id`
- **Pipelines**: `GET/POST/PUT/DELETE http://localhost:4000/pipelines`
- **Deals**: `GET/POST/PUT/DELETE http://localhost:4000/deals`
- **Tasks**: `GET/POST/PUT http://localhost:4000/tasks`
- **Tags**: `GET http://localhost:4000/tags`
- **Users**: `GET http://localhost:4000/users`
- **Stages**: `GET http://localhost:4000/stages`
- **Activities**: `GET http://localhost:4000/activities`

### Frontend Application:
- **Main App**: `http://localhost:5173`
- **All CRM Tabs**: Contacts, Companies, Deals, Pipeline, Tasks, Settings

## 🧪 Testing the Setup

### 1. Test Backend API:
```bash
# Health check
curl http://localhost:4000/health

# Get people/contacts  
curl http://localhost:4000/people

# Get companies (need ID, try ID 1)
curl http://localhost:4000/companies/1

# Get all pipelines
curl http://localhost:4000/pipelines
```

### 2. Test Frontend:
- Open `http://localhost:5173` in your browser
- Navigate through all tabs:
  - ✅ Contacts Tab
  - ✅ Companies Tab  
  - ✅ Deals Tab
  - ✅ Pipeline Tab
  - ✅ Tasks Tab
  - ✅ Settings Tab

### 3. Test Database:
```bash
# Connect to database
psql -U tsjohnnychan -d probyr_crm

# Check tables
\dt

# Sample queries
SELECT COUNT(*) FROM people;
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM deals;
```

## 🔄 Development Workflow

### Code Changes:
- **Backend**: TypeScript files auto-reload with `tsx --watch`
- **Frontend**: React components hot-reload with Vite HMR
- **Database**: Run migrations manually when schema changes

### Adding New Features:
1. **Backend Routes**: Add to `backend/src/routes/`
2. **Frontend Components**: Add to `frontend/src/components/`
3. **Database Changes**: Create new migration in `backend/migrations/`

### Debugging:
- **Backend Logs**: Check terminal running `npm run dev`
- **Frontend Errors**: Check browser console and error overlay
- **Database Queries**: Enable query logging in database config

## ⚠️ Troubleshooting

### Common Issues:

**1. Port Already in Use**:
```bash
# Kill process on port 4000 (backend)
kill -9 $(lsof -t -i:4000)

# Kill process on port 5173 (frontend)
kill -9 $(lsof -t -i:5173)
```

**2. Database Connection Failed**:
```bash
# Check if PostgreSQL is running
brew services list | grep postgres

# Test database connection
psql -U tsjohnnychan -d probyr_crm -c "SELECT 1;"

# Check if database exists
psql -U postgres -l | grep probyr_crm
```

**3. Migration Errors**:
```bash
# Reset and re-run migrations
cd backend
npm run migrate
```

**4. Frontend API Errors**:
- Verify backend is running on port 4000
- Check CORS configuration in backend
- Verify API endpoints are responding

**5. Dependencies Issues**:
```bash
# Clean install backend
cd backend && rm -rf node_modules && npm install

# Clean install frontend  
cd frontend && rm -rf node_modules && npm install
```

**6. Docker Development Issues**:
```bash
# Stop and remove all containers
docker-compose -f docker-compose.dev.yml down

# Remove volumes and rebuild
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up --build

# Check container logs
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend

# Access container shell for debugging
docker-compose -f docker-compose.dev.yml exec backend sh
docker-compose -f docker-compose.dev.yml exec frontend sh
```

## 📝 Development Notes

### Project Structure:
```
probyr-lite-crm/
├── backend/                 # Express.js backend
│   ├── src/
│   │   ├── app.ts          # Main Express app
│   │   ├── config/         # Database config
│   │   ├── routes/         # API routes (9 modules)
│   │   └── types/          # TypeScript interfaces
│   ├── migrations/         # SQL migrations
│   └── package.json
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   └── lib/            # Utilities
│   └── package.json
└── HAZL.md                # Conversion documentation
```

### Key Features:
- ✅ **Zero Cloud Dependencies**: Completely local
- ✅ **Full CRUD Operations**: All CRM features working
- ✅ **Real-time Updates**: Live data synchronization  
- ✅ **Transaction Support**: Database consistency
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Type Safety**: Full TypeScript integration

---

**Status**: ✅ **Development Environment Ready**
**Last Updated**: September 19, 2025
**Conversion**: Encore.ts → Express.js **COMPLETE**