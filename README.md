# ProByr Lite CRM

A simple, intuitive, and collaborative Customer Relationship Management (CRM) tool specifically designed for Small and Medium-sized Enterprises (SMEs). This single-file CRM application empowers teams to manage customer relationships, track sales pipelines, and stay organized without technological friction.

## Features

- **Dashboard**: Real-time overview of CRM metrics and activities
- **Companies**: Manage company profiles with contact details
- **Contacts**: Track individual contacts within companies
- **CRM Pipeline**: Visual pipeline management for sales tracking
- **CRM Inbox**: Centralized communication hub
- **Mailboxes**: Email management integration
- **Approvals**: Workflow approval system
- **Analytics**: Business intelligence and reporting
- **Settings**: Application configuration
- **Integrations**: Third-party service connections

## Production Deployment with Docker

### Prerequisites

- Docker
- Docker Compose

### Quick Start

1. **Clone the repository**:
   ```bash
   git clone <your-repository-url>
   cd probyr-lite-crm-1757619801
   ```

2. **Build and run with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - Open your browser and navigate to `http://localhost:8516`
   - The CRM will be ready to use immediately

### Docker Configuration

The application includes:

- **Dockerfile**: Production-ready container with Node.js 18 Alpine
- **docker-compose.yml**: Complete orchestration with networking and data persistence
- **Health checks**: Automatic container health monitoring
- **Data persistence**: SQLite database stored in Docker volumes

### Production Setup

For production deployment with SSL and reverse proxy:

1. **Configure SSL certificates** (optional):
   ```bash
   # Place your SSL certificates in the ssl/ directory
   mkdir ssl/
   # Add your certificate files
   ```

2. **Start with Nginx proxy**:
   ```bash
   docker-compose --profile production up -d
   ```

### Environment Variables

The application supports the following environment variables:

- `NODE_ENV`: Set to `production` for production deployment
- `PORT`: Server port (default: 8516)

### Data Management

- SQLite database is automatically created and managed
- Data is persisted in Docker volumes
- Backup the `data/` directory for data recovery

### Monitoring

The application includes built-in health checks accessible at:
- Health endpoint: `http://localhost:8516/api/health`
- Container health status via Docker commands

### Stopping the Application

```bash
docker-compose down
```

To remove all data and volumes:
```bash
docker-compose down -v
```

## Technical Stack

- **Backend**: Node.js with Express
- **Database**: SQLite with better-sqlite3
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Containerization**: Docker & Docker Compose
- **Architecture**: Single-file application for simplicity