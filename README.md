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

#### For Development:
- Node.js 18 or later
- Encore CLI (`npm install -g @encore/cli`)

#### For Docker Deployment:
- Docker 20.10 or later
- Docker Compose 2.0 or later

### Installation Options

#### Option 1: Docker Deployment (Recommended for Production)

1. **Clone the repository**:
```bash
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm
```

2. **Deploy with Docker**:
```bash
./docker-deploy.sh
```

This will:
- Build the application using Docker
- Start the application in a container
- Make it available at http://localhost:4000

#### Option 2: Native Development

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
├── Dockerfile             # Production Docker configuration
├── docker-compose.yml     # Docker Compose configuration
├── docker-deploy.sh       # Docker deployment script
├── .dockerignore          # Docker ignore file
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

## 🚀 Deployment Guide

This section provides comprehensive deployment instructions for Probyr Lite CRM. Choose the deployment method that best fits your needs.

### 🎯 Quick Start (TL;DR)

**For Production (Recommended):**
```bash
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm
./docker-deploy.sh
# Access at http://localhost:4000
```

**For Development:**
```bash
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm
npm install
encore run
# Access at http://localhost:4000
```

### 📋 Deployment Options Summary

| Method | Best For | Difficulty | Setup Time | Production Ready |
|--------|----------|------------|------------|------------------|
| 🐳 Docker | Production | Easy | 5 minutes | ✅ Yes |
| ☁️ Encore Cloud | Managed hosting | Easy | 10 minutes | ✅ Yes |
| 🖥️ Custom Server | Self-hosted | Medium | 15 minutes | ✅ Yes |
| 🌐 Cloud Platforms | Scalable hosting | Medium | 20 minutes | ✅ Yes |
| 💻 Native | Development | Easy | 5 minutes | ❌ No |

### 🐳 Docker Deployment (Recommended for Production)

The application is fully dockerized and production-ready. This is the **recommended deployment method** for production environments.

#### Prerequisites
- Docker 20.10 or later
- Docker Compose 2.0 or later
- At least 2GB RAM available
- Port 4000 available (or configure custom port)

#### Quick Deployment (One Command)
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm

# Deploy with one command
./docker-deploy.sh
```

#### Manual Docker Deployment
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm

# Build and start the application
docker-compose up --build -d

# Check status
docker ps

# View logs
docker logs -f probyr-crm

# Stop the application
docker-compose down
```

#### Docker Configuration Features
- **Port**: 4000 (configurable in docker-compose.yml)
- **Health Check**: Built-in health monitoring every 30 seconds
- **Auto-restart**: Container restarts automatically on failure
- **Security**: Runs as non-root user (uid: 1001)
- **Multi-stage Build**: Optimized image size and build process
- **Production Ready**: Includes all necessary production optimizations

### ☁️ Encore Cloud Deployment

For Encore's managed cloud deployment (requires Encore CLI):

#### Prerequisites
- Encore CLI installed (`npm install -g @encore/cli`)
- Encore account and project setup

#### Deploy to Encore Cloud
```bash
# Initialize Encore project (if not already done)
encore app create

# Deploy to production
git add .
git commit -m "Deploy to production"
git push encore main
```

#### Benefits of Encore Cloud
- Automatic scaling and load balancing
- Built-in database management
- SSL certificates and CDN
- Monitoring and logging
- Zero-downtime deployments

### 🖥️ Custom Server Deployment

Deploy on your own server or VPS:

#### Option 1: Docker on Custom Server
```bash
# On your server, clone the repository
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm

# Build the Docker image
docker build -t probyr-crm .

# Run the container
docker run -d \
  --name probyr-crm \
  -p 4000:4000 \
  --restart unless-stopped \
  probyr-crm
```

#### Option 2: Docker Compose on Custom Server
```bash
# Clone and deploy
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm
docker-compose up -d
```

#### Option 3: Native Installation (Development Only)
```bash
# Install dependencies
npm install

# Install Encore CLI
npm install -g @encore/cli

# Start the application
encore run
```

### 🌐 Cloud Platform Deployments

#### AWS EC2 Deployment
```bash
# Launch EC2 instance (Ubuntu 20.04+ recommended)
# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y
sudo systemctl start docker
sudo systemctl enable docker

# Clone and deploy
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm
sudo docker-compose up -d
```

#### DigitalOcean Droplet Deployment
```bash
# Create a droplet (Ubuntu 20.04+ recommended)
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose -y

# Clone and deploy
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm
sudo docker-compose up -d
```

#### Google Cloud Platform Deployment
```bash
# Create a Compute Engine instance
# Install Docker
sudo apt update
sudo apt install docker.io docker-compose -y

# Clone and deploy
git clone https://github.com/YOUR_USERNAME/probyr-crm.git
cd probyr-crm
sudo docker-compose up -d
```

### ⚙️ Configuration

#### Environment Variables
The application supports the following environment variables:

- `NODE_ENV`: Set to `production` for production deployment
- `ENCORE_ENV`: Set to `production` for Encore backend configuration
- `PORT`: Override the default port (default: 4000)

#### Port Configuration
To change the port, update the `docker-compose.yml` file:
```yaml
ports:
  - "YOUR_PORT:4000"
```

Or set environment variable:
```bash
export PORT=8080
docker-compose up -d
```

#### SSL/HTTPS Setup
For production deployments, set up SSL certificates:

```bash
# Using Let's Encrypt with nginx reverse proxy
# Install nginx and certbot
sudo apt install nginx certbot python3-certbot-nginx

# Configure nginx reverse proxy
sudo nano /etc/nginx/sites-available/probyr-crm
```

Nginx configuration example:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Enable the site and get SSL certificate
sudo ln -s /etc/nginx/sites-available/probyr-crm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

For other deployment options, refer to the [Encore.ts deployment documentation](https://encore.dev/docs/deploy).

### Docker Troubleshooting

#### Common Issues

**Port already in use**:
```bash
# Check what's using port 4000
lsof -i :4000

# Kill the process
sudo kill -9 $(lsof -ti:4000)
```

**Docker build fails**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

**Container won't start**:
```bash
# Check container logs
docker logs probyr-crm

# Check container status
docker ps -a
```

**Permission issues**:
```bash
# Ensure Docker daemon is running
sudo systemctl start docker

# Add user to docker group (Linux)
sudo usermod -aG docker $USER
```

#### Docker Commands Reference

```bash
# View running containers
docker ps

# View all containers
docker ps -a

# View container logs
docker logs -f probyr-crm

# Execute commands in container
docker exec -it probyr-crm sh

# Stop and remove containers
docker-compose down

# Remove all containers and images
docker-compose down --rmi all

# View Docker system info
docker system df
```

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
