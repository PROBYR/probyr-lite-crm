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

### Method 2: Using Development Script
```bash
# Start both servers with one command
./start-dev.sh
```

### Method 3: Background Process
```bash
# Start backend in background
cd backend && DB_USER=tsjohnnychan DB_PASSWORD="" npm run dev &

# Start frontend normally
cd frontend && npm run dev
```

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