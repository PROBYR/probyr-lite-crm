# ProByr Enterprise CRM

A **comprehensive, modern Customer Relationship Management (CRM) system** built for Small and Medium-sized Enterprises (SMEs). This enterprise-grade CRM provides complete sales pipeline management, advanced analytics, and seamless relationship tracking in a single, powerful application.

## 🚀 Enterprise Features

### 📊 **Advanced CRM Pipeline Management**
- **Deal/Opportunity Tracking**: Complete sales pipeline from Lead → Qualified → Proposal → Negotiation → Closed Won/Lost
- **Pipeline Analytics**: Real-time deal progression, conversion rates, and pipeline health metrics
- **Deal Stages Configuration**: Customizable pipeline stages with probabilities and win/loss tracking
- **Revenue Forecasting**: Pipeline value tracking with expected close dates and probability weighting

### 🏢 **360° Customer Management**
- **Company Profiles**: Comprehensive company data with industry, size, revenue, and relationship history
- **Contact Management**: Full contact lifecycle with roles, relationships, and interaction history
- **Deal-Contact Associations**: Many-to-many relationships with role management (Decision Maker, Influencer, Champion)
- **Account Hierarchies**: Complete company-contact-deal relationship mapping

### 📈 **Real-Time Analytics & Reporting**
- **Executive Dashboard**: KPIs, pipeline health, deal progression, and performance metrics
- **Sales Analytics**: Monthly trends, top performing companies, conversion rates
- **Activity Analytics**: Communication tracking, meeting history, and engagement metrics
- **Custom Reporting**: Flexible data export and analysis capabilities

### 🎯 **Advanced CRM Features**
- **Activity Timeline**: Complete audit trail of all customer interactions (calls, meetings, emails)
- **Task & Calendar Management**: Integrated scheduling with CRM entity associations
- **Notes & Communications**: Entity-based note system with privacy controls
- **Email Templates**: Pre-built communication workflows for consistent messaging
- **Lead Scoring**: Automated lead qualification and prioritization system
- **Tags & Categorization**: Flexible tagging system for custom organization

### 🔗 **Modern CRM Associations**
- **Companies ↔ Contacts**: One-to-many with role management
- **Companies ↔ Deals**: Deal ownership and account management
- **Deals ↔ Contacts**: Multi-contact deal associations with stakeholder roles
- **Activities ↔ All Entities**: Universal activity tracking across companies, contacts, and deals
- **Calendar Events ↔ CRM**: Integrated meeting scheduling tied to deals and contacts

## 🏗️ **Technical Architecture**

### Database Schema
- **Deals Pipeline**: Complete opportunity management with stages, probabilities, and forecasting
- **CRM Activities**: Universal activity tracking system
- **Deal Stages**: Configurable pipeline management
- **Deal-Contact Relations**: Many-to-many associations with roles
- **Notes & Tags**: Flexible annotation system
- **Calendar Integration**: Event scheduling with CRM associations
- **Email Templates**: Communication workflow management
- **Lead Scoring Rules**: Automated qualification system
- **Analytics Snapshots**: Historical reporting data

### API Architecture
- **RESTful APIs**: Complete CRUD operations for all CRM entities
- **Advanced Endpoints**: `/api/deals`, `/api/activities`, `/api/analytics/dashboard`
- **Relationship Management**: Deal-contact associations, activity tracking
- **Real-time Analytics**: Live pipeline metrics and reporting
- **Integration Ready**: Webhook support and external API compatibility

## 🚀 Deployment

This application is designed to be deployed using Docker.

### Prerequisites
- Docker
- Docker Compose

### Steps
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Hudi-Cares/probyr-lite-crm.git
    cd probyr-lite-crm
    ```
2.  **Run the application:**
    ```bash
    docker-compose up -d
    ```
3.  **Access the application:**
    Open your browser and navigate to `http://localhost:8061`.

## 🎯 **CRM Best Practices Implemented**

1. **Complete Deal Lifecycle Management**
2. **360° Customer Relationship View**
3. **Activity-Based Selling Process**
4. **Pipeline Health Monitoring**
5. **Lead Qualification System**
6. **Customer Communication Workflows**
7. **Sales Performance Analytics**
8. **Relationship Mapping & Role Management**

## 🔧 **Enterprise Technical Stack**

- **Backend**: Node.js 18+ with Express.js
- **Database**: SQLite with better-sqlite3 (production-ready)
- **Frontend**: Modern Vanilla JavaScript with responsive design
- **Containerization**: Docker & Docker Compose
- **Architecture**: Microservices-ready single-file application
- **API**: RESTful with comprehensive endpoint coverage
- **Analytics**: Real-time dashboard with historical reporting
- **Security**: Production-ready security headers and validation

## 📊 **Real-Time CRM Metrics**

The system tracks comprehensive CRM metrics:

- **Pipeline Value**: Total and weighted pipeline values
- **Deal Conversion**: Stage-by-stage conversion rates  
- **Activity Volume**: Communication and meeting tracking
- **Customer Engagement**: Interaction frequency and quality
- **Sales Velocity**: Time-to-close and deal acceleration metrics
- **Territory Performance**: Account and rep performance tracking

---

**ProByr Enterprise CRM** - *Empowering SMEs with enterprise-grade customer relationship management*