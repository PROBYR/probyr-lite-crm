# ProByr CRM

A modern, full-stack Customer Relationship Management (CRM) system built with Encore.ts and React.

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

### Backend (Encore.ts)
- **Framework**: Encore.ts with TypeScript
- **Database**: PostgreSQL with SQL migrations
- **API**: Type-safe REST APIs with automatic validation
- **Infrastructure**: Built-in support for databases, secrets, and more

### Frontend (React)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui component library
- **State Management**: TanStack Query for server state
- **Routing**: React Router
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18 or later
- Encore CLI (`npm install -g @encore/cli`)

### Installation

1. **Clone the repository**:
```bash
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm
```

2. **Install dependencies**:
```bash
npm install
```

3. **Start the development environment**:
```bash
encore run
```

This will start both the backend API server and the frontend development server.

4. **Access the application**:
- Frontend: http://localhost:4000
- API Explorer: http://localhost:9400

### Database Setup

The database schema is automatically created when you first run the application. The system includes:

- **Demo data**: Pre-populated with sample contacts, companies, and deals
- **Migrations**: All database schema changes are managed through SQL migration files
- **Seed data**: Realistic demo data for immediate testing

## Project Structure

```
probyr-crm/
├── backend/                 # Encore.ts backend services
│   ├── activities/         # Activity tracking service
│   ├── company/           # Company management service
│   ├── deals/             # Deal pipeline service
│   ├── people/            # Contact management service
│   ├── tasks/             # Task management service
│   ├── outreach/          # Email and meeting service
│   ├── user_connections/  # Personal integrations service
│   ├── api_auth/          # API key management service
│   ├── third_party/       # External API endpoints
│   └── db/                # Database migrations and setup
├── frontend/               # React frontend application
│   ├── components/        # Reusable UI components
│   ├── pages/             # Page components
│   └── lib/               # Utility functions
└── README.md
```

## API Documentation

The CRM provides a comprehensive REST API for third-party integrations:

### Authentication
All API endpoints require an API key passed in the Authorization header:
```
Authorization: Bearer pbr_your_api_key_here
```

### Key Endpoints

**Create Lead**:
```bash
POST /api/v1/leads
Content-Type: application/json

{
  "contact": {
    "fullName": "John Smith",
    "email": "john@example.com",
    "companyName": "Example Corp"
  },
  "deal": {
    "dealName": "Enterprise License",
    "value": 50000,
    "pipelineName": "Sales Pipeline",
    "stageName": "Lead"
  },
  "note": {
    "content": "Interested in enterprise features"
  }
}
```

**Get Contacts**:
```bash
GET /api/v1/contacts?limit=50&offset=0
```

### Permissions System
API keys support granular permissions:
- `leads:create` - Create new leads and contacts
- `contacts:read` - Read contact information
- Additional permissions available in the UI

## Configuration

### Email Integration
1. Go to Settings → My Connections
2. Connect your email account (Gmail, Outlook, or SMTP)
3. Configure email signature if desired

### API Keys
1. Go to Settings → API Keys
2. Generate new API key with required permissions
3. Use the key for third-party integrations

### Pipeline Setup
1. Go to Settings → Pipelines
2. Create custom pipelines for different sales processes
3. Configure stages with win/loss indicators

## Deployment

The application is designed to be deployed using Encore's built-in deployment system:

```bash
git add .
git commit -m "Deploy to production"
git push encore main
```

For other deployment options, refer to the [Encore.ts deployment documentation](https://encore.dev/docs/deploy).

## Development

### Adding New Features

1. **Backend Services**: Create new services in the `backend/` directory
2. **Database Changes**: Add new migration files in `backend/db/migrations/`
3. **Frontend Components**: Add components in `frontend/components/`
4. **API Integration**: Use the auto-generated backend client from `~backend/client`

### Testing

Run the test suite:
```bash
npm test
```

The project includes:
- End-to-end tests with Playwright
- Component tests for critical UI flows
- API integration tests

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
- Check the [Encore.ts documentation](https://encore.dev/docs)
- Review the in-app help and tooltips

## Acknowledgments

- Built with [Encore.ts](https://encore.dev) - The Backend Development Platform
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide React](https://lucide.dev)
- Styled with [Tailwind CSS](https://tailwindcss.com)
