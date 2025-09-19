# ProByr Lite CRM

A modern, full-stack Customer Relationship Management (CRM) system built with Express.js and React. **100% local-first architecture** with no cloud dependencies.

## Features

### 🏢 Contact & Company Management
- Complete contact database with tagging system
- Company profiles with contact relationships
- Bulk operations for contact management
- CSV import/export functionality

### 🎯 Sales Pipeline
- Customizable sales pipelines with drag-and-drop
- Kanban and table views
- Deal tracking with value calculations
- Pipeline analytics and reporting

### ✅ Task Management
- Personal task dashboard
- Task assignment and due dates
- Integration with contacts and deals
- Overdue and upcoming task tracking

### 📧 Email Integration
- Send tracked emails directly from CRM
- Email open and click tracking
- Personal email account connections (Gmail, Outlook, SMTP)
- Automatic email signatures

### 📅 Meeting Scheduling
- Book meetings with contacts
- Calendar integration support
- Activity timeline tracking

### 🔧 Advanced Features
- API key management with granular permissions
- User management and role-based access
- Third-party integrations via REST API
- Real-time email validation
- Import wizard with field mapping

## Tech Stack

### Backend (Express.js)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with SQL migrations
- **API**: RESTful APIs with comprehensive validation
- **ORM**: Native PostgreSQL with connection pooling (pg library)
- **Security**: Helmet, CORS, and comprehensive error handling
- **Development**: Hot reload with tsx for TypeScript

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui component library
- **State Management**: TanStack Query for server state
- **Routing**: React Router
- **Build Tool**: Vite with HMR (Hot Module Replacement)

## Getting Started

### Prerequisites

#### For Development:
- Node.js 18 or later
- PostgreSQL 12 or later
- Git

#### For Production:
- Docker 20.10 or later (optional)
- Docker Compose 2.0 or later (optional)

### Quick Start (Development)

**Most Common Scenario** - Get up and running immediately:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/probyr-lite-crm.git
cd probyr-lite-crm

# Install dependencies
cd backend && npm install
cd ../frontend && npm install

# Start development servers (2 terminals)
# Terminal 1: Backend
cd backend
DB_USER=tsjohnnychan DB_PASSWORD="" npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

**Access Points:**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000

### Installation Options

#### Option 1: Development Setup (Recommended)

**Prerequisites**: PostgreSQL database `probyr_crm` must exist
```bash
# Create database (if needed)
psql -U postgres -c "CREATE DATABASE probyr_crm;"
```

**Quick Start**:
```bash
git clone https://github.com/YOUR_USERNAME/probyr-lite-crm.git
cd probyr-lite-crm

# Backend
cd backend && npm install
npm run migrate  # Run database migrations
DB_USER=tsjohnnychan DB_PASSWORD="" npm run dev &

# Frontend
cd frontend && npm install  
npm run dev
```

#### Option 2: Docker Deployment (Future)

*Docker deployment configuration is available but not yet updated for the new Express.js architecture.*

### Database Setup

The database schema is created through SQL migrations. The system includes:

- **PostgreSQL Database**: Local `probyr_crm` database
- **Migrations**: All database schema changes managed through SQL migration files in `backend/migrations/`
- **Sample Data**: Pre-populated with realistic demo data (contacts, companies, deals, tasks, pipelines)
- **Auto-Setup**: Run `npm run migrate` in the backend directory to set up everything

**Database Details**:
- **Database Name**: `probyr_crm`
- **User**: `tsjohnnychan` (or your system user)
- **Password**: Not required for local development
- **Tables**: 11 tables including people, companies, deals, tasks, pipelines, etc.

## Project Structure

```
probyr-lite-crm/
├── backend/                # Express.js backend
│   ├── src/
│   │   ├── app.ts         # Main Express application
│   │   ├── config/        # Database configuration
│   │   ├── routes/        # API route modules (9 modules)
│   │   │   ├── people.ts      # Contact management
│   │   │   ├── companies.ts   # Company management  
│   │   │   ├── deals.ts       # Deal pipeline
│   │   │   ├── pipelines.ts   # Pipeline management
│   │   │   ├── tasks.ts       # Task management
│   │   │   ├── tags.ts        # Tag system
│   │   │   ├── users.ts       # User management
│   │   │   ├── stages.ts      # Pipeline stages
│   │   │   └── activities.ts  # Activity tracking
│   │   └── types/         # TypeScript interfaces
│   ├── migrations/        # SQL database migrations
│   └── package.json
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (6 main tabs)
│   │   └── lib/           # Utility functions
│   └── package.json
├── HAZL.md               # Conversion documentation
├── DEPLOYMENT.md         # Development setup guide
└── README.md
```

## API Documentation

The CRM provides a comprehensive REST API with the following endpoints:

### Core Endpoints

**People/Contacts**:
```bash
GET    /people                    # List all contacts
POST   /people                    # Create new contact
PUT    /people/:id                # Update contact
DELETE /people/:id                # Delete contact
POST   /people/bulk-tag-update    # Bulk tag operations
POST   /people/assign-owner       # Bulk assign owner
POST   /people/delete-contacts    # Bulk delete
POST   /people/export-contacts    # Export to CSV
```

**Companies**:
```bash
GET    /companies/:id             # Get company details
PUT    /companies/:id             # Update company
GET    /companies                 # List all companies
```

**Deals & Pipelines**:
```bash
GET    /deals                     # List deals
POST   /deals                     # Create deal
PUT    /deals/:id                 # Update deal
DELETE /deals/:id                 # Delete deal
GET    /deals/table               # Table view with filters

GET    /pipelines                 # List pipelines
GET    /pipelines/:id             # Get pipeline details
POST   /pipelines                 # Create pipeline
PUT    /pipelines/:id             # Update pipeline
DELETE /pipelines/:id             # Delete pipeline
```

**Tasks**:
```bash
GET    /tasks                     # List tasks (with date filtering)
POST   /tasks                     # Create task
PUT    /tasks/:id                 # Update task
# Supports query parameters: dueBefore, dueAfter, isCompleted
```

**Other Endpoints**:
```bash
GET    /tags                      # List all tags
GET    /users                     # List all users
GET    /stages                    # List pipeline stages
GET    /activities                # List activities
GET    /health                    # Health check
```

### API Features
- **Full CRUD Operations**: Complete create, read, update, delete for all entities
- **Bulk Operations**: Efficient bulk updates for contacts
- **Date Filtering**: Advanced date-based filtering for tasks
- **Transaction Support**: Database consistency for complex operations
- **Error Handling**: Comprehensive error responses with meaningful messages

## Configuration

### Application Settings
The CRM includes a comprehensive Settings tab with:

1. **Company Information**: Edit company details and branding
2. **Pipeline Management**: Create and configure sales pipelines with custom stages
3. **User Management**: Manage team members and permissions
4. **Tags System**: Organize contacts with custom tags
5. **Data Export**: Export contacts and deals to CSV

### Development Configuration
- **Database**: Configure via environment variables or direct connection
- **CORS**: Enabled for frontend communication (localhost:5173)
- **Hot Reload**: Both backend (tsx) and frontend (Vite HMR) support live reloading
- **Error Handling**: Comprehensive error logging and user feedback

## 🚀 Quick Development Guide

### 🎯 TL;DR - Get Running in 2 Minutes

**For Development (Most Common):**
```bash
git clone https://github.com/YOUR_USERNAME/probyr-lite-crm.git
cd probyr-lite-crm

# Backend (Terminal 1)
cd backend && npm install
DB_USER=tsjohnnychan DB_PASSWORD="" npm run dev

# Frontend (Terminal 2)  
cd frontend && npm install && npm run dev

# Access at:
# Frontend: http://localhost:5173
# Backend: http://localhost:4000
```

**First Time Setup:**
```bash
# Create database (if needed)
psql -U postgres -c "CREATE DATABASE probyr_crm;"

# Run migrations (if database is empty)
cd backend && npm run migrate
```

### 📋 Current Architecture Status

| Component | Status | Technology | Port |
|-----------|--------|------------|------|
| 🗄️ **Backend** | ✅ **Complete** | Express.js + TypeScript | 4000 |
| 🎨 **Frontend** | ✅ **Complete** | React + Vite | 5173 |
| 🗃️ **Database** | ✅ **Complete** | PostgreSQL (Local) | 5432 |
| 🐳 **Docker** | ⚠️ **Needs Update** | Docker config outdated | - |
| ☁️ **Cloud Deploy** | ⚠️ **Future** | Not yet configured | - |

**Current Status**: ✅ **Fully Functional Development Environment**

### 🔧 Development Features

**✅ What's Working:**
- **All CRM Tabs**: Contacts, Companies, Deals, Pipeline, Tasks, Settings
- **Full CRUD Operations**: Create, read, update, delete for all entities
- **Real-time Updates**: Live data synchronization between frontend and backend
- **Hot Reload**: Both backend (tsx) and frontend (Vite HMR)
- **Database Transactions**: Consistent data operations
- **Bulk Operations**: Efficient contact management
- **Date Filtering**: Advanced task filtering by due dates
- **Error Handling**: Comprehensive error management and user feedback

**🛠️ Development Tools:**
- **API Testing**: All endpoints can be tested with curl
- **Database Access**: Direct PostgreSQL access for debugging
- **Type Safety**: Full TypeScript integration across stack
- **Migration System**: SQL-based database schema management

### 📚 Additional Documentation

For detailed setup and troubleshooting, see:

- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Complete development setup guide
- **[HAZL.md](HAZL.md)**: Conversion log from Encore.ts to Express.js
- **[DEVELOPMENT.md](DEVELOPMENT.md)**: Additional development notes

### 🔍 Testing Your Setup

**Test Backend API:**
```bash
# Health check
curl http://localhost:4000/health

# Get contacts
curl http://localhost:4000/people

# Get pipelines  
curl http://localhost:4000/pipelines
```

**Test Frontend:**
- Open http://localhost:5173
- Navigate through all 6 tabs
- Create/edit contacts, deals, tasks
- Verify all functionality works

## Development

### 🏗️ Architecture Conversion

This CRM was successfully converted from **Encore.ts** (cloud-dependent) to **Express.js** (local-first):

**Before (Encore.ts)**:
- Required cloud authentication (`encore auth login`)
- Cloud database provisioning
- Secrets management via api.encore.cloud
- Vendor lock-in to Encore platform

**After (Express.js)**:
- ✅ **100% Local**: No cloud dependencies
- ✅ **Self-Contained**: PostgreSQL + Express.js + React
- ✅ **Portable**: Can run anywhere with Node.js + PostgreSQL
- ✅ **Full Control**: Complete ownership of code and data

See [HAZL.md](HAZL.md) for complete conversion documentation.

### Adding New Features

1. **Backend Routes**: Add new endpoints in `backend/src/routes/`
2. **Database Changes**: Create new migration files in `backend/migrations/`
3. **Frontend Components**: Add components in `frontend/src/components/`
4. **API Integration**: Frontend uses fetch API to communicate with Express backend

### Current Feature Status

**✅ Fully Implemented:**
- Contact management with tagging and bulk operations
- Company management and relationships
- Deal pipeline with drag-and-drop Kanban view
- Task management with date filtering
- Pipeline and stage management
- Settings and configuration
- Data export functionality

**⚠️ Legacy Features (Not Yet Converted):**
- Email integration and tracking
- Meeting scheduling
- API key management
- Third-party integrations

### Testing

**Manual Testing:**
```bash
# Test all major endpoints
curl http://localhost:4000/health
curl http://localhost:4000/people
curl http://localhost:4000/companies/1
curl http://localhost:4000/pipelines
curl http://localhost:4000/tasks
```

**Frontend Testing:**
- Navigate through all tabs: Contacts, Companies, Deals, Pipeline, Tasks, Settings
- Test CRUD operations: Create, edit, delete contacts and deals
- Test bulk operations: Tag multiple contacts, assign owners
- Test pipeline functionality: Drag deals between stages
- Test task management: Create tasks, mark as complete

## Troubleshooting

### Common Development Issues

**Backend won't start**:
```bash
# Check if port 4000 is in use
lsof -i :4000

# Kill process using port 4000
kill -9 $(lsof -t -i:4000)

# Check database connection
psql -U tsjohnnychan -d probyr_crm -c "SELECT 1;"
```

**Frontend won't start**:
```bash
# Check if port 5173 is in use
lsof -i :5173

# Kill process and restart
kill -9 $(lsof -t -i:5173)
cd frontend && npm run dev
```

**Database connection failed**:
```bash
# Ensure PostgreSQL is running
brew services list | grep postgres

# Create database if missing
psql -U postgres -c "CREATE DATABASE probyr_crm;"

# Run migrations
cd backend && npm run migrate
```

**API errors in frontend**:
- Verify backend is running on port 4000
- Check browser console for CORS errors
- Ensure database has data (run migrations)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions and support:
- Open an issue on GitHub
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for setup issues
- Review [HAZL.md](HAZL.md) for conversion details
- Check [DEVELOPMENT.md](DEVELOPMENT.md) for additional development notes

## Acknowledgments

- **Backend**: Built with [Express.js](https://expressjs.com) and [PostgreSQL](https://postgresql.org)
- **Frontend**: UI components from [shadcn/ui](https://ui.shadcn.com)
- **Icons**: [Lucide React](https://lucide.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **Build Tools**: [Vite](https://vitejs.dev) for frontend, [tsx](https://github.com/esbuild-kit/tsx) for backend
- **Originally**: Converted from Encore.ts to Express.js for local-first architecture
