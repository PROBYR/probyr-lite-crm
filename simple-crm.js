import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import multer from 'multer';
import Papa from 'papaparse';

const app = express();
const PORT = process.env.PORT || 8061;

// Initialize SQLite database
const db = new Database('simple-crm.db');

// Create comprehensive CRM tables
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    mobile TEXT,
    company_id INTEGER,
    position TEXT,
    department TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    birthday DATE,
    notes TEXT,
    lead_source TEXT,
    lead_status TEXT DEFAULT 'New Lead',
    priority TEXT DEFAULT 'Medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_contacted DATETIME,
    FOREIGN KEY (company_id) REFERENCES companies (id)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    company_id INTEGER,
    type TEXT NOT NULL, -- 'email', 'call', 'meeting', 'task', 'note'
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    due_date DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'system',
    FOREIGN KEY (contact_id) REFERENCES contacts (id),
    FOREIGN KEY (company_id) REFERENCES companies (id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    company_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
    priority TEXT DEFAULT 'medium',
    due_date DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    assigned_to TEXT DEFAULT 'system',
    FOREIGN KEY (contact_id) REFERENCES contacts (id),
    FOREIGN KEY (company_id) REFERENCES companies (id)
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    company_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    meeting_date DATETIME NOT NULL,
    duration INTEGER DEFAULT 60, -- minutes
    location TEXT,
    meeting_type TEXT DEFAULT 'in_person', -- 'in_person', 'phone', 'video', 'email'
    status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no_show'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts (id),
    FOREIGN KEY (company_id) REFERENCES companies (id)
  );

  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'sent', -- 'draft', 'sent', 'failed'
    FOREIGN KEY (contact_id) REFERENCES contacts (id)
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT DEFAULT 'default',
    preference_key TEXT NOT NULL,
    preference_value TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, preference_key)
  );
`);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CRM Dashboard Interface
app.get('/', (req, res) => {
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProByr CRM Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8f9fa; }
        
        .crm-layout { display: flex; height: 100vh; }
        
        /* Sidebar */
        .sidebar { width: 250px; background: #2c3e50; color: white; overflow-y: auto; }
        .sidebar-header { padding: 20px; border-bottom: 1px solid #34495e; }
        .sidebar-header h2 { color: #3498db; font-size: 1.5rem; }
        .nav-menu { list-style: none; }
        .nav-item { border-bottom: 1px solid #34495e; }
        .nav-link { 
            display: block; padding: 15px 20px; color: #bdc3c7; text-decoration: none; 
            transition: all 0.3s; cursor: pointer;
        }
        .nav-link:hover, .nav-link.active { background: #34495e; color: #3498db; }
        .nav-link i { margin-right: 10px; width: 16px; }
        
        /* Main Content */
        .main-content { flex: 1; display: flex; flex-direction: column; }
        .header { background: white; padding: 20px; border-bottom: 1px solid #e9ecef; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { color: #2c3e50; }
        .breadcrumb { color: #6c757d; margin-top: 5px; }
        
        /* Content Area */
        .content { flex: 1; padding: 20px; overflow-y: auto; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        /* Dashboard Cards */
        .dashboard-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .card-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
        .card-title { font-size: 1.2rem; color: #2c3e50; }
        .card-value { font-size: 2rem; font-weight: bold; color: #3498db; }
        .card-icon { font-size: 2rem; color: #95a5a6; }
        
        /* Forms */
        .form-container { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; margin-bottom: 8px; font-weight: 600; color: #2c3e50; }
        .form-input, .form-textarea, .form-select { 
            width: 100%; padding: 12px; border: 2px solid #e9ecef; border-radius: 6px; 
            font-size: 14px; transition: border-color 0.3s;
        }
        .form-input:focus, .form-textarea:focus, .form-select:focus { 
            outline: none; border-color: #3498db; 
        }
        .btn { 
            padding: 12px 24px; background: #3498db; color: white; border: none; 
            border-radius: 6px; cursor: pointer; font-size: 14px; transition: background 0.3s;
        }
        .btn:hover { background: #2980b9; }
        .btn-success { background: #27ae60; }
        .btn-success:hover { background: #229954; }
        
        /* Data Lists */
        .data-list { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .list-header { padding: 20px; border-bottom: 1px solid #e9ecef; }
        .list-item { 
            padding: 20px; border-bottom: 1px solid #f8f9fa; transition: background 0.3s;
        }
        .list-item:hover { background: #f8f9fa; }
        .list-item:last-child { border-bottom: none; }
        .item-name { font-weight: 600; color: #2c3e50; margin-bottom: 5px; }
        .item-details { color: #6c757d; font-size: 14px; }
        .item-meta { display: flex; gap: 15px; margin-top: 10px; }
        .item-tag { background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
        
        /* Messages */
        .alert { padding: 15px; border-radius: 6px; margin: 15px 0; }
        .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .alert-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        
        /* Pipeline */
        .pipeline-container { display: flex; gap: 20px; overflow-x: auto; padding: 20px 0; }
        .pipeline-stage { min-width: 300px; background: white; border-radius: 8px; padding: 15px; }
        .stage-header { background: #3498db; color: white; padding: 10px 15px; border-radius: 6px; margin-bottom: 15px; }
        .pipeline-item { background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 6px; border-left: 4px solid #3498db; }
        
        /* Analytics */
        .analytics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .chart-container { background: white; padding: 20px; border-radius: 8px; height: 300px; display: flex; align-items: center; justify-content: center; color: #6c757d; }
    </style>
</head>
<body>
    <div class="crm-layout">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>ProByr CRM</h2>
            </div>
            <nav>
                <ul class="nav-menu">
                    <li class="nav-item">
                        <a class="nav-link active" data-tab="dashboard">
                            <i>📊</i> Dashboard
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="pipeline">
                            <i>🔄</i> CRM Pipeline
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="contacts">
                            <i>👥</i> Contacts
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="companies">
                            <i>🏢</i> Companies
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="approvals">
                            <i>✅</i> Approvals
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="inbox">
                            <i>📧</i> CRM Inbox
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="mailboxes">
                            <i>📫</i> Mailboxes
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="analytics">
                            <i>📈</i> Analytics
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="settings">
                            <i>⚙️</i> Settings
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" data-tab="integrations">
                            <i>🔗</i> Integrations
                        </a>
                    </li>
                </ul>
            </nav>
        </div>

        <!-- Main Content -->
        <div class="main-content">
            <div class="header">
                <h1 id="pageTitle">Dashboard</h1>
                <div class="breadcrumb" id="breadcrumb">Home > Dashboard</div>
            </div>
            
            <div class="content">
                <!-- Dashboard Tab -->
                <div id="dashboard" class="tab-content active">
                    <div class="dashboard-cards">
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">Total Companies</div>
                                    <div class="card-value" id="totalCompanies">0</div>
                                </div>
                                <div class="card-icon">🏢</div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">Total Contacts</div>
                                    <div class="card-value" id="totalContacts">0</div>
                                </div>
                                <div class="card-icon">👥</div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">Active Deals</div>
                                    <div class="card-value">0</div>
                                </div>
                                <div class="card-icon">💼</div>
                            </div>
                        </div>
                        <div class="card">
                            <div class="card-header">
                                <div>
                                    <div class="card-title">Revenue</div>
                                    <div class="card-value">$0</div>
                                </div>
                                <div class="card-icon">💰</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-grid">
                        <div class="card">
                            <h3>Recent Companies</h3>
                            <div id="recentCompanies"></div>
                        </div>
                        <div class="card">
                            <h3>Recent Contacts</h3>
                            <div id="recentContacts"></div>
                        </div>
                    </div>
                </div>

                <!-- Pipeline Tab -->
                <div id="pipeline" class="tab-content">
                    <div class="pipeline-container">
                        <div class="pipeline-stage">
                            <div class="stage-header">Leads</div>
                            <div class="pipeline-item">
                                <div><strong>Potential Client A</strong></div>
                                <div>$10,000 - Initial Contact</div>
                            </div>
                        </div>
                        <div class="pipeline-stage">
                            <div class="stage-header">Qualified</div>
                            <div class="pipeline-item">
                                <div><strong>Potential Client B</strong></div>
                                <div>$25,000 - Demo Scheduled</div>
                            </div>
                        </div>
                        <div class="pipeline-stage">
                            <div class="stage-header">Proposal</div>
                            <div class="pipeline-item">
                                <div><strong>Potential Client C</strong></div>
                                <div>$50,000 - Proposal Sent</div>
                            </div>
                        </div>
                        <div class="pipeline-stage">
                            <div class="stage-header">Closed</div>
                            <div class="pipeline-item">
                                <div><strong>Success Story</strong></div>
                                <div>$75,000 - Deal Closed</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Contacts Tab -->
                <div id="contacts" class="tab-content">
                    <!-- Contact Actions Bar -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn" onclick="showAddContactForm()">➕ Add Contact</button>
                            <button class="btn" style="background: #17a2b8;" onclick="showImportModal()">📁 Import CSV</button>
                            <button class="btn" style="background: #28a745;" onclick="downloadSampleCsv()">📥 Download Sample</button>
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <label style="margin: 0;">View:</label>
                            <button class="btn" style="padding: 8px 12px;" onclick="setContactView('table')" id="tableViewBtn">📊 Table</button>
                            <button class="btn" style="padding: 8px 12px; background: #6c757d;" onclick="setContactView('list')" id="listViewBtn">📋 List</button>
                        </div>
                    </div>

                    <!-- Add Contact Form (Initially Hidden) -->
                    <div id="addContactSection" class="form-container" style="display: none; margin-bottom: 30px;">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 15px;">
                            <h3>Add New Contact</h3>
                            <button class="btn" style="background: #dc3545;" onclick="hideAddContactForm()">✕ Cancel</button>
                        </div>
                        <form id="contactForm">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Contact Name *</label>
                                    <input type="text" class="form-input" id="contactName" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-input" id="contactEmail">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Phone</label>
                                    <input type="text" class="form-input" id="contactPhone">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Company</label>
                                    <select class="form-select" id="contactCompany">
                                        <option value="">Select Company</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Position</label>
                                    <input type="text" class="form-input" id="contactPosition">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-textarea" id="contactNotes" rows="3"></textarea>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-success">Add Contact</button>
                        </form>
                        <div id="contactMessage"></div>
                    </div>
                    
                    <!-- Contacts Display -->
                    <div class="data-list">
                        <div class="list-header">
                            <h3 id="contactsTitle">All Contacts</h3>
                            <div style="margin-top: 10px;">
                                <input type="text" class="form-input" id="contactSearch" placeholder="🔍 Search contacts..." style="max-width: 300px; display: inline-block;">
                            </div>
                        </div>
                        
                        <!-- Bulk Actions (Initially Hidden) -->
                        <div id="bulkActionsBar" style="display: none; background: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 6px; border: 2px solid #e9ecef;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <span id="selectionCount">0 contacts selected</span>
                                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                    <button class="btn" style="background: #17a2b8; padding: 8px 16px;" onclick="bulkExportContacts()">📥 Export Selected</button>
                                    <button class="btn" style="background: #ffc107; color: #212529; padding: 8px 16px;" onclick="bulkUpdateContacts()">✏️ Bulk Update</button>
                                    <button class="btn" style="background: #dc3545; padding: 8px 16px;" onclick="bulkDeleteContacts()">🗑️ Delete Selected</button>
                                    <button class="btn" style="background: #6c757d; padding: 8px 16px;" onclick="clearSelection()">❌ Clear Selection</button>
                                </div>
                            </div>
                        </div>

                        <!-- Table View -->
                        <div id="contactsTable" style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; background: white;">
                                <thead>
                                    <tr style="background: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; width: 40px;">
                                            <input type="checkbox" id="selectAll" onchange="toggleSelectAll()">
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortContacts('name')">
                                            Name <span id="nameSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortContacts('email')">
                                            Email <span id="emailSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortContacts('phone')">
                                            Phone <span id="phoneSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortContacts('company_name')">
                                            Company <span id="companySort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortContacts('position')">
                                            Position <span id="positionSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortContacts('created_at')">
                                            Added <span id="createdSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="contactsTableBody">
                                    <!-- Table rows will be populated by JavaScript -->
                                </tbody>
                            </table>
                        </div>
                        
                        <!-- List View -->
                        <div id="contactsList">
                            <!-- List items will be populated by JavaScript -->
                        </div>
                    </div>
                </div>

                <!-- Companies Tab -->
                <div id="companies" class="tab-content">
                    <!-- Company Management Header -->
                    <div class="card" style="margin-bottom: 20px;">
                        <div style="display: flex; justify-content: between; align-items: center; flex-wrap: wrap; gap: 15px;">
                            <div>
                                <h2 id="companiesTitle">All Companies</h2>
                                <p style="color: #6c757d; margin: 0;">Manage your company database with comprehensive CRM features</p>
                            </div>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                <button class="btn btn-success" onclick="showAddCompanyForm()">+ Add Company</button>
                                <button class="btn" style="background: #17a2b8;" onclick="importCompanies()">📥 Import</button>
                                <button class="btn" style="background: #ffc107; color: #212529;" onclick="exportCompanies()">📤 Export</button>
                                <button class="btn" style="background: #6c757d;" onclick="showColumnSettings()">⚙️ Columns</button>
                            </div>
                        </div>
                    </div>

                    <!-- Add Company Form (Initially Hidden) -->
                    <div id="addCompanySection" class="card" style="display: none; margin-bottom: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <h3>Add New Company</h3>
                            <button onclick="hideAddCompanyForm()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕ Close</button>
                        </div>
                        <form id="companyForm">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label class="form-label">Company Name *</label>
                                    <input type="text" class="form-input" id="companyName" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-input" id="companyEmail">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Phone</label>
                                    <input type="text" class="form-input" id="companyPhone">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Website</label>
                                    <input type="url" class="form-input" id="companyWebsite">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Industry</label>
                                    <select class="form-select" id="companyIndustry">
                                        <option value="">Select Industry</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Retail">Retail</option>
                                        <option value="Education">Education</option>
                                        <option value="Real Estate">Real Estate</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Company Size</label>
                                    <select class="form-select" id="companySize">
                                        <option value="">Select Size</option>
                                        <option value="1-10">1-10 employees</option>
                                        <option value="11-50">11-50 employees</option>
                                        <option value="51-200">51-200 employees</option>
                                        <option value="201-500">201-500 employees</option>
                                        <option value="501-1000">501-1000 employees</option>
                                        <option value="1000+">1000+ employees</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Annual Revenue</label>
                                    <input type="number" class="form-input" id="companyRevenue" step="0.01">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Company Type</label>
                                    <select class="form-select" id="companyType">
                                        <option value="Prospect">Prospect</option>
                                        <option value="Customer">Customer</option>
                                        <option value="Partner">Partner</option>
                                        <option value="Competitor">Competitor</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Priority</label>
                                    <select class="form-select" id="companyPriority">
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Address</label>
                                    <input type="text" class="form-input" id="companyAddress">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">City</label>
                                    <input type="text" class="form-input" id="companyCity">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">State</label>
                                    <input type="text" class="form-input" id="companyState">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">ZIP Code</label>
                                    <input type="text" class="form-input" id="companyZip">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Country</label>
                                    <input type="text" class="form-input" id="companyCountry">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Founded Year</label>
                                    <input type="number" class="form-input" id="companyFounded" min="1800" max="2024">
                                </div>
                                <div class="form-group" style="grid-column: 1 / -1;">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-textarea" id="companyDescription" rows="3"></textarea>
                                </div>
                                <div class="form-group" style="grid-column: 1 / -1;">
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-textarea" id="companyNotes" rows="3"></textarea>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-success">Add Company</button>
                        </form>
                        <div id="companyMessage"></div>
                    </div>

                    <!-- Companies List -->
                    <div class="data-list">
                        <!-- Search and Filters -->
                        <div class="card" style="margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                                    <select class="form-select" style="max-width: 150px;" onchange="filterCompaniesByType(this.value)">
                                        <option value="">All Types</option>
                                        <option value="Prospect">Prospects</option>
                                        <option value="Customer">Customers</option>
                                        <option value="Partner">Partners</option>
                                        <option value="Competitor">Competitors</option>
                                    </select>
                                    <select class="form-select" style="max-width: 150px;" onchange="filterCompaniesByIndustry(this.value)">
                                        <option value="">All Industries</option>
                                        <option value="Technology">Technology</option>
                                        <option value="Healthcare">Healthcare</option>
                                        <option value="Finance">Finance</option>
                                        <option value="Manufacturing">Manufacturing</option>
                                        <option value="Retail">Retail</option>
                                    </select>
                                </div>
                                <div>
                                    <input type="text" class="form-input" id="companySearch" placeholder="🔍 Search companies..." style="max-width: 300px; display: inline-block;">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Bulk Actions (Initially Hidden) -->
                        <div id="companyBulkActionsBar" style="display: none; background: #f8f9fa; padding: 15px; margin-bottom: 20px; border-radius: 6px; border: 2px solid #e9ecef;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                                <span id="companySelectionCount">0 companies selected</span>
                                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                    <button class="btn" style="background: #17a2b8; padding: 8px 16px;" onclick="bulkExportCompanies()">📥 Export Selected</button>
                                    <button class="btn" style="background: #ffc107; color: #212529; padding: 8px 16px;" onclick="bulkUpdateCompanies()">✏️ Bulk Update</button>
                                    <button class="btn" style="background: #dc3545; padding: 8px 16px;" onclick="bulkDeleteCompanies()">🗑️ Delete Selected</button>
                                    <button class="btn" style="background: #6c757d; padding: 8px 16px;" onclick="clearCompanySelection()">❌ Clear Selection</button>
                                </div>
                            </div>
                        </div>

                        <!-- Companies Table -->
                        <div id="companiesTable" style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse; background: white;">
                                <thead>
                                    <tr style="background: #f8f9fa; border-bottom: 2px solid #e9ecef;">
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; width: 40px;">
                                            <input type="checkbox" id="selectAllCompanies" onchange="toggleSelectAllCompanies()">
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortCompanies('name')">
                                            Company Name <span id="companyNameSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortCompanies('industry')">
                                            Industry <span id="companyIndustrySort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortCompanies('company_type')">
                                            Type <span id="companyTypeSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortCompanies('company_size')">
                                            Size <span id="companySizeSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortCompanies('email')">
                                            Contact <span id="companyContactSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortCompanies('priority')">
                                            Priority <span id="companyPrioritySort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="sortCompanies('created_at')">
                                            Added <span id="companyCreatedSort">⇅</span>
                                        </th>
                                        <th style="padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6;">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody id="companiesTableBody">
                                    <!-- Table rows will be populated by JavaScript -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- Approvals Tab -->
                <div id="approvals" class="tab-content">
                    <div class="card">
                        <h3>Pending Approvals</h3>
                        <div class="list-item">
                            <div class="item-name">Deal Approval Required</div>
                            <div class="item-details">Large deal with ABC Corp requires management approval</div>
                            <div class="item-meta">
                                <span class="item-tag">High Priority</span>
                                <span class="item-tag">$150,000</span>
                            </div>
                        </div>
                        <div class="list-item">
                            <div class="item-name">Contract Amendment</div>
                            <div class="item-details">Contract terms modification for XYZ Ltd</div>
                            <div class="item-meta">
                                <span class="item-tag">Medium Priority</span>
                                <span class="item-tag">Legal Review</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Inbox Tab -->
                <div id="inbox" class="tab-content">
                    <div class="card">
                        <h3>CRM Inbox</h3>
                        <div class="list-item">
                            <div class="item-name">📧 New Lead from Website</div>
                            <div class="item-details">Contact form submission from potential client</div>
                            <div class="item-meta">
                                <span class="item-tag">Unread</span>
                                <span class="item-tag">Lead</span>
                            </div>
                        </div>
                        <div class="list-item">
                            <div class="item-name">📧 Follow-up Required</div>
                            <div class="item-details">Client hasn't responded in 3 days</div>
                            <div class="item-meta">
                                <span class="item-tag">Action Required</span>
                                <span class="item-tag">Follow-up</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Mailboxes Tab -->
                <div id="mailboxes" class="tab-content">
                    <div class="form-grid">
                        <div class="card">
                            <h3>Email Accounts</h3>
                            <div class="list-item">
                                <div class="item-name">📫 sales@probyr.com</div>
                                <div class="item-details">15 unread messages</div>
                            </div>
                            <div class="list-item">
                                <div class="item-name">📫 support@probyr.com</div>
                                <div class="item-details">3 unread messages</div>
                            </div>
                        </div>
                        <div class="card">
                            <h3>Add Email Account</h3>
                            <form>
                                <div class="form-group">
                                    <label class="form-label">Email Address</label>
                                    <input type="email" class="form-input" placeholder="email@domain.com">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">IMAP Server</label>
                                    <input type="text" class="form-input" placeholder="imap.domain.com">
                                </div>
                                <button type="submit" class="btn">Add Account</button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Analytics Tab -->
                <div id="analytics" class="tab-content">
                    <div class="analytics-grid">
                        <div class="card">
                            <h3>Sales Performance</h3>
                            <div class="chart-container">
                                📊 Sales Chart Placeholder
                            </div>
                        </div>
                        <div class="card">
                            <h3>Lead Sources</h3>
                            <div class="chart-container">
                                🥧 Pie Chart Placeholder
                            </div>
                        </div>
                        <div class="card">
                            <h3>Conversion Rates</h3>
                            <div class="chart-container">
                                📈 Line Chart Placeholder
                            </div>
                        </div>
                        <div class="card">
                            <h3>Monthly Revenue</h3>
                            <div class="chart-container">
                                📊 Bar Chart Placeholder
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Settings Tab -->
                <div id="settings" class="tab-content">
                    <div class="form-container">
                        <h3>CRM Settings</h3>
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label">Company Name</label>
                                <input type="text" class="form-input" value="ProByr CRM">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Time Zone</label>
                                <select class="form-select">
                                    <option>UTC</option>
                                    <option>EST</option>
                                    <option>PST</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Currency</label>
                                <select class="form-select">
                                    <option>USD</option>
                                    <option>EUR</option>
                                    <option>GBP</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Date Format</label>
                                <select class="form-select">
                                    <option>MM/DD/YYYY</option>
                                    <option>DD/MM/YYYY</option>
                                    <option>YYYY-MM-DD</option>
                                </select>
                            </div>
                        </div>
                        <button class="btn">Save Settings</button>
                    </div>
                </div>

                <!-- Integrations Tab -->
                <div id="integrations" class="tab-content">
                    <div class="form-grid">
                        <div class="card">
                            <h3>Available Integrations</h3>
                            <div class="list-item">
                                <div class="item-name">📧 Gmail Integration</div>
                                <div class="item-details">Sync emails with your CRM</div>
                                <div class="item-meta">
                                    <button class="btn">Connect</button>
                                </div>
                            </div>
                            <div class="list-item">
                                <div class="item-name">📅 Google Calendar</div>
                                <div class="item-details">Sync meetings and appointments</div>
                                <div class="item-meta">
                                    <button class="btn">Connect</button>
                                </div>
                            </div>
                            <div class="list-item">
                                <div class="item-name">💬 Slack</div>
                                <div class="item-details">Get notifications in Slack</div>
                                <div class="item-meta">
                                    <button class="btn">Connect</button>
                                </div>
                            </div>
                        </div>
                        <div class="card">
                            <h3>Connected Services</h3>
                            <div class="list-item">
                                <div class="item-name">✅ Email Service</div>
                                <div class="item-details">Connected and syncing</div>
                                <div class="item-meta">
                                    <button class="btn" style="background: #dc3545;">Disconnect</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- CSV Import Modal -->
    <div id="importModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; padding: 30px; max-width: 500px; width: 90%; max-height: 80%; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Import Contacts from CSV</h3>
                <button onclick="hideImportModal()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="importForm" enctype="multipart/form-data">
                <div class="form-group">
                    <label class="form-label">Select CSV File</label>
                    <input type="file" accept=".csv" id="csvFileInput" class="form-input" required>
                    <small style="color: #6c757d;">Supported columns: Name, Email, Phone, Company, Position, Notes</small>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Duplicate Handling</label>
                    <select class="form-select" id="duplicateHandling">
                        <option value="skip">Skip duplicates (based on email)</option>
                        <option value="merge">Update existing contacts</option>
                        <option value="create">Create duplicates anyway</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="hideImportModal()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn btn-success">Import Contacts</button>
                </div>
            </form>
            
            <div id="importProgress" style="display: none; margin-top: 20px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
                    <div style="margin-bottom: 10px;">Processing import...</div>
                    <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">
                        <div id="importProgressBar" style="height: 100%; background: #3498db; width: 0%; transition: width 0.3s;"></div>
                    </div>
                </div>
            </div>
            
            <div id="importResults" style="display: none; margin-top: 20px;">
                <!-- Import results will be displayed here -->
            </div>
        </div>
    </div>

    <!-- Contact Profile Modal -->
    <div id="contactProfileModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; overflow-y: auto;">
        <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); background: white; border-radius: 8px; padding: 30px; max-width: 1200px; width: 95%; margin-bottom: 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 id="contactProfileName">Contact Profile</h2>
                <button onclick="closeContactProfile()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕ Close</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 300px; gap: 30px;">
                <!-- Main Content -->
                <div>
                    <!-- Contact Information -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h3>Contact Information</h3>
                        <div id="contactProfileInfo"></div>
                        <div style="margin-top: 15px;">
                            <button class="btn" onclick="editContact()" id="editContactBtn">✏️ Edit Contact</button>
                            <button class="btn" style="background: #28a745;" onclick="showSendEmailModal()">📧 Send Email</button>
                            <button class="btn" style="background: #ffc107; color: #212529;" onclick="showCreateTaskModal()">📋 Create Task</button>
                            <button class="btn" style="background: #17a2b8;" onclick="showScheduleMeetingModal()">📅 Schedule Meeting</button>
                        </div>
                    </div>

                    <!-- Activity Timeline -->
                    <div class="card">
                        <h3>Activity Timeline</h3>
                        <div id="activityTimeline" style="max-height: 400px; overflow-y: auto;"></div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div>
                    <!-- Quick Actions -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h4>Quick Actions</h4>
                        <button class="btn" style="width: 100%; margin: 5px 0; text-align: left;" onclick="callContact()">📞 Call Contact</button>
                        <button class="btn" style="width: 100%; margin: 5px 0; text-align: left;" onclick="showSendEmailModal()">📧 Send Email</button>
                        <button class="btn" style="width: 100%; margin: 5px 0; text-align: left;" onclick="showCreateTaskModal()">📋 Create Task</button>
                        <button class="btn" style="width: 100%; margin: 5px 0; text-align: left;" onclick="showScheduleMeetingModal()">📅 Schedule Meeting</button>
                        <button class="btn" style="width: 100%; margin: 5px 0; text-align: left;" onclick="addNote()">📝 Add Note</button>
                    </div>

                    <!-- Recent Tasks -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h4>Recent Tasks</h4>
                        <div id="recentTasks"></div>
                    </div>

                    <!-- Upcoming Meetings -->
                    <div class="card">
                        <h4>Upcoming Meetings</h4>
                        <div id="upcomingMeetings"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Contact Modal -->
    <div id="editContactModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001; overflow-y: auto;">
        <div style="position: absolute; top: 50px; left: 50%; transform: translateX(-50%); background: white; border-radius: 8px; padding: 30px; max-width: 800px; width: 95%; margin-bottom: 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Edit Contact</h3>
                <button onclick="closeEditContact()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="editContactForm">
                <input type="hidden" id="editContactId">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Name *</label>
                        <input type="text" class="form-input" id="editContactName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="editContactEmail">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="text" class="form-input" id="editContactPhone">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Mobile</label>
                        <input type="text" class="form-input" id="editContactMobile">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Company</label>
                        <select class="form-select" id="editContactCompany">
                            <option value="">Select Company</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Position</label>
                        <input type="text" class="form-input" id="editContactPosition">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Department</label>
                        <input type="text" class="form-input" id="editContactDepartment">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Lead Status</label>
                        <select class="form-select" id="editContactLeadStatus">
                            <option value="New Lead">New Lead</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Closed Won">Closed Won</option>
                            <option value="Closed Lost">Closed Lost</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Priority</label>
                        <select class="form-select" id="editContactPriority">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <input type="text" class="form-input" id="editContactAddress">
                    </div>
                    <div class="form-group">
                        <label class="form-label">City</label>
                        <input type="text" class="form-input" id="editContactCity">
                    </div>
                    <div class="form-group">
                        <label class="form-label">State</label>
                        <input type="text" class="form-input" id="editContactState">
                    </div>
                    <div class="form-group">
                        <label class="form-label">ZIP Code</label>
                        <input type="text" class="form-input" id="editContactZip">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Country</label>
                        <input type="text" class="form-input" id="editContactCountry">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Birthday</label>
                        <input type="date" class="form-input" id="editContactBirthday">
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">Notes</label>
                        <textarea class="form-textarea" id="editContactNotes" rows="4"></textarea>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" onclick="closeEditContact()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn btn-success">Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Send Email Modal -->
    <div id="sendEmailModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; padding: 30px; max-width: 600px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Send Email</h3>
                <button onclick="closeSendEmailModal()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="sendEmailForm">
                <input type="hidden" id="emailContactId">
                <div class="form-group">
                    <label class="form-label">To</label>
                    <input type="email" class="form-input" id="emailRecipient" readonly>
                </div>
                <div class="form-group">
                    <label class="form-label">Subject *</label>
                    <input type="text" class="form-input" id="emailSubject" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Message *</label>
                    <textarea class="form-textarea" id="emailBody" rows="10" required></textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="closeSendEmailModal()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn" style="background: #28a745;">📧 Send Email</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Create Task Modal -->
    <div id="createTaskModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; padding: 30px; max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Create Task</h3>
                <button onclick="closeCreateTaskModal()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="createTaskForm">
                <input type="hidden" id="taskContactId">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" class="form-input" id="taskTitle" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" id="taskDescription" rows="4"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Priority</label>
                    <select class="form-select" id="taskPriority">
                        <option value="low">Low</option>
                        <option value="medium" selected>Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Due Date</label>
                    <input type="datetime-local" class="form-input" id="taskDueDate">
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="closeCreateTaskModal()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn" style="background: #ffc107; color: #212529;">📋 Create Task</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Schedule Meeting Modal -->
    <div id="scheduleMeetingModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; padding: 30px; max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Schedule Meeting</h3>
                <button onclick="closeScheduleMeetingModal()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="scheduleMeetingForm">
                <input type="hidden" id="meetingContactId">
                <div class="form-group">
                    <label class="form-label">Title *</label>
                    <input type="text" class="form-input" id="meetingTitle" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Description</label>
                    <textarea class="form-textarea" id="meetingDescription" rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Meeting Date & Time *</label>
                    <input type="datetime-local" class="form-input" id="meetingDateTime" required>
                </div>
                <div class="form-group">
                    <label class="form-label">Duration (minutes)</label>
                    <select class="form-select" id="meetingDuration">
                        <option value="30">30 minutes</option>
                        <option value="60" selected>1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hours</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Location</label>
                    <input type="text" class="form-input" id="meetingLocation">
                </div>
                <div class="form-group">
                    <label class="form-label">Meeting Type</label>
                    <select class="form-select" id="meetingType">
                        <option value="in_person">In Person</option>
                        <option value="phone">Phone Call</option>
                        <option value="video">Video Call</option>
                        <option value="email">Email</option>
                    </select>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="closeScheduleMeetingModal()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn" style="background: #17a2b8;">📅 Schedule Meeting</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Bulk Update Modal -->
    <div id="bulkUpdateModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; padding: 30px; max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Bulk Update Contacts</h3>
                <button onclick="closeBulkUpdateModal()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="bulkUpdateForm">
                <div class="form-group">
                    <label class="form-label">Update Field</label>
                    <select class="form-select" id="bulkUpdateField" onchange="toggleBulkUpdateValue()">
                        <option value="">Select field to update</option>
                        <option value="lead_status">Lead Status</option>
                        <option value="priority">Priority</option>
                        <option value="company_id">Company</option>
                        <option value="department">Department</option>
                    </select>
                </div>
                <div class="form-group" id="bulkUpdateValueGroup" style="display: none;">
                    <label class="form-label">New Value</label>
                    <div id="bulkUpdateValueContainer"></div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="closeBulkUpdateModal()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn" style="background: #ffc107; color: #212529;">✏️ Update Selected</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Company Profile Modal -->
    <div id="companyProfileModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; overflow-y: auto;">
        <div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); background: white; border-radius: 8px; padding: 30px; max-width: 1200px; width: 95%; margin-bottom: 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <h2 id="companyProfileName">Company Profile</h2>
                <button onclick="closeCompanyProfile()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕ Close</button>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 300px; gap: 30px;">
                <!-- Main Content -->
                <div>
                    <!-- Company Information -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h3>Company Information</h3>
                        <div id="companyProfileInfo"></div>
                        <div style="margin-top: 15px;">
                            <button class="btn" onclick="editCompany()" id="editCompanyBtn">✏️ Edit Company</button>
                            <button class="btn" style="background: #28a745;" onclick="showAddDealModal()">💰 Add Deal</button>
                            <button class="btn" style="background: #ffc107; color: #212529;" onclick="showAssociateContactModal()">👥 Add Contact</button>
                            <button class="btn" style="background: #17a2b8;" onclick="showCompanyActivityModal()">📋 Add Activity</button>
                        </div>
                    </div>

                    <!-- Associated Contacts -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h3>Associated Contacts</h3>
                        <div id="companyContacts"></div>
                    </div>

                    <!-- Deals -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h3>Deals</h3>
                        <div id="companyDeals"></div>
                    </div>

                    <!-- Activity Timeline -->
                    <div class="card">
                        <h3>Activity Timeline</h3>
                        <div id="companyActivityTimeline" style="max-height: 400px; overflow-y: auto;"></div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div>
                    <!-- Quick Actions -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h4>Quick Actions</h4>
                        <button class="btn" style="width: 100%; margin: 5px 0; text-align: left;" onclick="visitCompanyWebsite()">🌐 Visit Website</button>
                        <button class="btn" style="width: 100%; margin: 5px 0; text-align: left;" onclick="showAddDealModal()">💰 Create Deal</button>
                        <button class="btn" style="width: 100%; margin: 5px 0; text-align: left;" onclick="showAssociateContactModal()">👥 Associate Contact</button>
                        <button class="btn" style="width: 100%; margin: 5px 0; text-align: left;" onclick="addCompanyNote()">📝 Add Note</button>
                    </div>

                    <!-- Company Stats -->
                    <div class="card" style="margin-bottom: 20px;">
                        <h4>Statistics</h4>
                        <div id="companyStats"></div>
                    </div>

                    <!-- Recent Activities -->
                    <div class="card">
                        <h4>Recent Activities</h4>
                        <div id="companyRecentActivities"></div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Edit Company Modal -->
    <div id="editCompanyModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001; overflow-y: auto;">
        <div style="position: absolute; top: 50px; left: 50%; transform: translateX(-50%); background: white; border-radius: 8px; padding: 30px; max-width: 800px; width: 95%; margin-bottom: 40px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Edit Company</h3>
                <button onclick="closeEditCompany()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="editCompanyForm">
                <input type="hidden" id="editCompanyId">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Company Name *</label>
                        <input type="text" class="form-input" id="editCompanyName" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-input" id="editCompanyEmail">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Phone</label>
                        <input type="text" class="form-input" id="editCompanyPhone">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Website</label>
                        <input type="url" class="form-input" id="editCompanyWebsite">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Industry</label>
                        <select class="form-select" id="editCompanyIndustry">
                            <option value="">Select Industry</option>
                            <option value="Technology">Technology</option>
                            <option value="Healthcare">Healthcare</option>
                            <option value="Finance">Finance</option>
                            <option value="Manufacturing">Manufacturing</option>
                            <option value="Retail">Retail</option>
                            <option value="Education">Education</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Company Size</label>
                        <select class="form-select" id="editCompanySize">
                            <option value="">Select Size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501-1000">501-1000 employees</option>
                            <option value="1000+">1000+ employees</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Annual Revenue</label>
                        <input type="number" class="form-input" id="editCompanyRevenue" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Company Type</label>
                        <select class="form-select" id="editCompanyType">
                            <option value="Prospect">Prospect</option>
                            <option value="Customer">Customer</option>
                            <option value="Partner">Partner</option>
                            <option value="Competitor">Competitor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Priority</label>
                        <select class="form-select" id="editCompanyPriority">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Address</label>
                        <input type="text" class="form-input" id="editCompanyAddress">
                    </div>
                    <div class="form-group">
                        <label class="form-label">City</label>
                        <input type="text" class="form-input" id="editCompanyCity">
                    </div>
                    <div class="form-group">
                        <label class="form-label">State</label>
                        <input type="text" class="form-input" id="editCompanyState">
                    </div>
                    <div class="form-group">
                        <label class="form-label">ZIP Code</label>
                        <input type="text" class="form-input" id="editCompanyZip">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Country</label>
                        <input type="text" class="form-input" id="editCompanyCountry">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Founded Year</label>
                        <input type="number" class="form-input" id="editCompanyFounded" min="1800" max="2024">
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">Description</label>
                        <textarea class="form-textarea" id="editCompanyDescription" rows="3"></textarea>
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">Notes</label>
                        <textarea class="form-textarea" id="editCompanyNotes" rows="4"></textarea>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                    <button type="button" onclick="closeEditCompany()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn btn-success">Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Associate Contact Modal -->
    <div id="associateContactModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; padding: 30px; max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Associate Contact with Company</h3>
                <button onclick="closeAssociateContactModal()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="associateContactForm">
                <input type="hidden" id="associateCompanyId">
                <div class="form-group">
                    <label class="form-label">Select Contact *</label>
                    <select class="form-select" id="associateContactSelect" required>
                        <option value="">Select a contact</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Role/Position</label>
                    <input type="text" class="form-input" id="associateContactRole" placeholder="e.g., CEO, Manager, Developer">
                </div>
                <div class="form-group">
                    <label class="form-label">Is Primary Contact?</label>
                    <input type="checkbox" id="associateContactPrimary"> Yes, this is the primary contact
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="closeAssociateContactModal()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn" style="background: #ffc107; color: #212529;">👥 Associate Contact</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Deal Modal -->
    <div id="addDealModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; padding: 30px; max-width: 600px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Add Deal</h3>
                <button onclick="closeAddDealModal()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="addDealForm">
                <input type="hidden" id="dealCompanyId">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Deal Title *</label>
                        <input type="text" class="form-input" id="dealTitle" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Primary Contact</label>
                        <select class="form-select" id="dealContactId">
                            <option value="">Select contact</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Deal Value</label>
                        <input type="number" class="form-input" id="dealValue" step="0.01">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Currency</label>
                        <select class="form-select" id="dealCurrency">
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="CAD">CAD</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Stage</label>
                        <select class="form-select" id="dealStage">
                            <option value="Prospecting">Prospecting</option>
                            <option value="Qualification">Qualification</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Closed Won">Closed Won</option>
                            <option value="Closed Lost">Closed Lost</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Probability (%)</label>
                        <input type="number" class="form-input" id="dealProbability" min="0" max="100">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Expected Close Date</label>
                        <input type="date" class="form-input" id="dealCloseDate">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Priority</label>
                        <select class="form-select" id="dealPriority">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label class="form-label">Description</label>
                        <textarea class="form-textarea" id="dealDescription" rows="4"></textarea>
                    </div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="closeAddDealModal()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn" style="background: #28a745;">💰 Create Deal</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Company Bulk Update Modal -->
    <div id="companyBulkUpdateModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1001;">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; border-radius: 8px; padding: 30px; max-width: 500px; width: 90%;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3>Bulk Update Companies</h3>
                <button onclick="closeCompanyBulkUpdateModal()" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
            
            <form id="companyBulkUpdateForm">
                <div class="form-group">
                    <label class="form-label">Update Field</label>
                    <select class="form-select" id="companyBulkUpdateField" onchange="toggleCompanyBulkUpdateValue()">
                        <option value="">Select field to update</option>
                        <option value="company_type">Company Type</option>
                        <option value="priority">Priority</option>
                        <option value="industry">Industry</option>
                        <option value="company_size">Company Size</option>
                        <option value="status">Status</option>
                    </select>
                </div>
                <div class="form-group" id="companyBulkUpdateValueGroup" style="display: none;">
                    <label class="form-label">New Value</label>
                    <div id="companyBulkUpdateValueContainer"></div>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" onclick="closeCompanyBulkUpdateModal()" class="btn" style="background: #6c757d;">Cancel</button>
                    <button type="submit" class="btn" style="background: #ffc107; color: #212529;">✏️ Update Selected</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Global variables
        let allContacts = [];
        let filteredContacts = [];
        let currentContactView = 'table';
        let currentSort = { column: 'name', direction: 'asc' };
        let selectedContacts = new Set();
        let currentContact = null;
        let allCompanies = [];
        
        // Company-specific global variables
        let filteredCompanies = [];
        let selectedCompanies = new Set();
        let currentCompany = null;
        let companySort = { column: 'name', direction: 'asc' };

        // Tab Navigation
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize
            loadData();
            setupNavigation();
            setupForms();
            setupContactSearch();
            setupCompanySearch();
            setContactView('table'); // Default to table view
        });

        function setupNavigation() {
            const navLinks = document.querySelectorAll('.nav-link');
            const tabContents = document.querySelectorAll('.tab-content');
            
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const tabName = this.dataset.tab;
                    
                    // Update active nav item
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                    
                    // Update active tab content
                    tabContents.forEach(t => t.classList.remove('active'));
                    document.getElementById(tabName).classList.add('active');
                    
                    // Update header
                    const titles = {
                        dashboard: 'Dashboard',
                        pipeline: 'CRM Pipeline',
                        contacts: 'Contacts',
                        companies: 'Companies',
                        approvals: 'Approvals',
                        inbox: 'CRM Inbox',
                        mailboxes: 'Mailboxes',
                        analytics: 'Analytics',
                        settings: 'Settings',
                        integrations: 'Integrations'
                    };
                    
                    document.getElementById('pageTitle').textContent = titles[tabName];
                    document.getElementById('breadcrumb').textContent = \`Home > \${titles[tabName]}\`;
                });
            });
        }

        function setupContactSearch() {
            const searchInput = document.getElementById('contactSearch');
            searchInput.addEventListener('input', function() {
                const query = this.value.toLowerCase();
                filteredContacts = allContacts.filter(contact => 
                    contact.name.toLowerCase().includes(query) ||
                    (contact.email && contact.email.toLowerCase().includes(query)) ||
                    (contact.phone && contact.phone.toLowerCase().includes(query)) ||
                    (contact.company_name && contact.company_name.toLowerCase().includes(query)) ||
                    (contact.position && contact.position.toLowerCase().includes(query))
                );
                displayContacts();
            });
        }

        function setupForms() {
            // Company form
            document.getElementById('companyForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const data = {
                    name: document.getElementById('companyName').value,
                    email: document.getElementById('companyEmail').value,
                    phone: document.getElementById('companyPhone').value,
                    website: document.getElementById('companyWebsite').value,
                    notes: document.getElementById('companyNotes').value
                };

                try {
                    const response = await fetch('/api/companies', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        showMessage('companyMessage', 'Company added successfully!', 'success');
                        document.getElementById('companyForm').reset();
                        loadData();
                    } else {
                        throw new Error('Failed to add company');
                    }
                } catch (error) {
                    showMessage('companyMessage', 'Error: ' + error.message, 'error');
                }
            });

            // Contact form
            document.getElementById('contactForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const data = {
                    name: document.getElementById('contactName').value,
                    email: document.getElementById('contactEmail').value,
                    phone: document.getElementById('contactPhone').value,
                    company_id: document.getElementById('contactCompany').value || null,
                    position: document.getElementById('contactPosition').value,
                    notes: document.getElementById('contactNotes').value
                };

                try {
                    const response = await fetch('/api/contacts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        showMessage('contactMessage', 'Contact added successfully!', 'success');
                        document.getElementById('contactForm').reset();
                        hideAddContactForm();
                        loadData();
                    } else {
                        throw new Error('Failed to add contact');
                    }
                } catch (error) {
                    showMessage('contactMessage', 'Error: ' + error.message, 'error');
                }
            });

            // Import form
            document.getElementById('importForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const fileInput = document.getElementById('csvFileInput');
                const file = fileInput.files[0];
                
                if (!file) {
                    alert('Please select a CSV file');
                    return;
                }

                const formData = new FormData();
                formData.append('csvFile', file);
                formData.append('duplicateHandling', document.getElementById('duplicateHandling').value);

                // Show progress
                document.getElementById('importProgress').style.display = 'block';
                document.getElementById('importResults').style.display = 'none';

                try {
                    const response = await fetch('/api/contacts/import', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();

                    // Hide progress
                    document.getElementById('importProgress').style.display = 'none';

                    if (response.ok) {
                        // Show results
                        document.getElementById('importResults').innerHTML = \`
                            <div class="alert alert-success">
                                <h4>Import Completed!</h4>
                                <p><strong>Total rows:</strong> \${result.results.totalRows}</p>
                                <p><strong>Successful:</strong> \${result.results.successCount}</p>
                                <p><strong>Errors:</strong> \${result.results.errorCount}</p>
                                <p><strong>Skipped:</strong> \${result.results.skippedCount}</p>
                                \${result.results.errors.length > 0 ? '<p><strong>Sample errors:</strong><br>' + result.results.errors.join('<br>') + '</p>' : ''}
                            </div>
                        \`;
                        document.getElementById('importResults').style.display = 'block';
                        
                        // Reload contacts
                        loadData();
                    } else {
                        throw new Error(result.error || 'Import failed');
                    }
                } catch (error) {
                    document.getElementById('importProgress').style.display = 'none';
                    document.getElementById('importResults').innerHTML = \`
                        <div class="alert alert-error">
                            <h4>Import Failed</h4>
                            <p>\${error.message}</p>
                        </div>
                    \`;
                    document.getElementById('importResults').style.display = 'block';
                }
            });

            // Add Company Form (enhanced)
            document.getElementById('addCompanyForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const data = {
                    name: document.getElementById('addCompanyName').value,
                    industry: document.getElementById('addCompanyIndustry').value,
                    website: document.getElementById('addCompanyWebsite').value,
                    phone: document.getElementById('addCompanyPhone').value,
                    email: document.getElementById('addCompanyEmail').value,
                    company_size: document.getElementById('addCompanySize').value,
                    annual_revenue: document.getElementById('addCompanyRevenue').value || null,
                    company_type: document.getElementById('addCompanyType').value,
                    location: document.getElementById('addCompanyLocation').value,
                    address: document.getElementById('addCompanyAddress').value,
                    city: document.getElementById('addCompanyCity').value,
                    state: document.getElementById('addCompanyState').value,
                    zip_code: document.getElementById('addCompanyZip').value,
                    country: document.getElementById('addCompanyCountry').value,
                    founded_year: document.getElementById('addCompanyFounded').value || null,
                    lead_score: document.getElementById('addCompanyScore').value || null,
                    description: document.getElementById('addCompanyDescription').value
                };

                try {
                    const response = await fetch('/api/companies', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        closeAddCompany();
                        await loadData();
                        alert('Company added successfully!');
                    } else {
                        throw new Error('Failed to add company');
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });

            // Edit Company Form
            document.getElementById('editCompanyForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const companyId = document.getElementById('editCompanyId').value;
                const data = {
                    name: document.getElementById('editCompanyName').value,
                    industry: document.getElementById('editCompanyIndustry').value,
                    website: document.getElementById('editCompanyWebsite').value,
                    phone: document.getElementById('editCompanyPhone').value,
                    email: document.getElementById('editCompanyEmail').value,
                    company_size: document.getElementById('editCompanySize').value,
                    annual_revenue: document.getElementById('editCompanyRevenue').value || null,
                    company_type: document.getElementById('editCompanyType').value,
                    location: document.getElementById('editCompanyLocation').value,
                    address: document.getElementById('editCompanyAddress').value,
                    city: document.getElementById('editCompanyCity').value,
                    state: document.getElementById('editCompanyState').value,
                    zip_code: document.getElementById('editCompanyZip').value,
                    country: document.getElementById('editCompanyCountry').value,
                    founded_year: document.getElementById('editCompanyFounded').value || null,
                    lead_score: document.getElementById('editCompanyScore').value || null,
                    description: document.getElementById('editCompanyDescription').value
                };

                try {
                    const response = await fetch('/api/companies/' + companyId, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        closeEditCompany();
                        await loadData();
                        
                        // If this company profile is open, refresh it
                        if (currentCompany && currentCompany.id == companyId) {
                            openCompanyProfile(companyId);
                        }
                        
                        alert('Company updated successfully!');
                    } else {
                        throw new Error('Failed to update company');
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });

            // Associate Contact with Company Form
            document.getElementById('associateContactForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const data = {
                    company_id: currentCompany.id,
                    contact_id: document.getElementById('associateContactId').value,
                    role: document.getElementById('associateContactRole').value || null,
                    is_primary: document.getElementById('associateContactPrimary').checked
                };

                try {
                    const response = await fetch('/api/company-contacts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        closeAssociateContact();
                        
                        // Refresh company profile if open
                        if (currentCompany) {
                            openCompanyProfile(currentCompany.id);
                        }
                        
                        alert('Contact associated with company successfully!');
                    } else {
                        throw new Error('Failed to associate contact');
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });

            // Create Deal Form
            document.getElementById('createDealForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const data = {
                    title: document.getElementById('createDealTitle').value,
                    company_id: currentCompany.id,
                    contact_id: document.getElementById('createDealContact').value || null,
                    value: document.getElementById('createDealValue').value || null,
                    stage: document.getElementById('createDealStage').value || 'Prospecting',
                    probability: document.getElementById('createDealProbability').value || null,
                    expected_close_date: document.getElementById('createDealCloseDate').value || null,
                    description: document.getElementById('createDealDescription').value
                };

                try {
                    const response = await fetch('/api/deals', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        closeCreateDeal();
                        
                        // Refresh company profile if open
                        if (currentCompany) {
                            openCompanyProfile(currentCompany.id);
                        }
                        
                        alert('Deal created successfully!');
                    } else {
                        throw new Error('Failed to create deal');
                    }
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            });

            // Edit Contact Form
            document.getElementById('editContactForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const contactId = document.getElementById('editContactId').value;
                const data = {
                    name: document.getElementById('editContactName').value,
                    email: document.getElementById('editContactEmail').value,
                    phone: document.getElementById('editContactPhone').value,
                    mobile: document.getElementById('editContactMobile').value,
                    company_id: document.getElementById('editContactCompany').value || null,
                    position: document.getElementById('editContactPosition').value,
                    department: document.getElementById('editContactDepartment').value,
                    lead_status: document.getElementById('editContactLeadStatus').value,
                    priority: document.getElementById('editContactPriority').value,
                    address: document.getElementById('editContactAddress').value,
                    city: document.getElementById('editContactCity').value,
                    state: document.getElementById('editContactState').value,
                    zip_code: document.getElementById('editContactZip').value,
                    country: document.getElementById('editContactCountry').value,
                    birthday: document.getElementById('editContactBirthday').value || null,
                    notes: document.getElementById('editContactNotes').value
                };

                try {
                    const response = await fetch(\`/api/contacts/\${contactId}\`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        closeEditContact();
                        await loadData();
                        
                        // If this contact profile is open, refresh it
                        if (currentContact && currentContact.id == contactId) {
                            openContactProfile(contactId);
                        }
                        
                        alert('Contact updated successfully!');
                    } else {
                        throw new Error('Failed to update contact');
                    }
                } catch (error) {
                    alert('Error updating contact: ' + error.message);
                }
            });

            // Send Email Form
            document.getElementById('sendEmailForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const contactId = document.getElementById('emailContactId').value;
                const data = {
                    subject: document.getElementById('emailSubject').value,
                    body: document.getElementById('emailBody').value
                };

                try {
                    const response = await fetch(\`/api/contacts/\${contactId}/emails\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        closeSendEmailModal();
                        alert('Email sent successfully! (Note: This is a simulated email - integrate with real email service for production)');
                        
                        // Refresh contact profile if open
                        if (currentContact && currentContact.id == contactId) {
                            openContactProfile(contactId);
                        }
                    } else {
                        throw new Error('Failed to send email');
                    }
                } catch (error) {
                    alert('Error sending email: ' + error.message);
                }
            });

            // Create Task Form
            document.getElementById('createTaskForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const contactId = document.getElementById('taskContactId').value;
                const data = {
                    title: document.getElementById('taskTitle').value,
                    description: document.getElementById('taskDescription').value,
                    priority: document.getElementById('taskPriority').value,
                    due_date: document.getElementById('taskDueDate').value || null
                };

                try {
                    const response = await fetch(\`/api/contacts/\${contactId}/tasks\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        closeCreateTaskModal();
                        alert('Task created successfully!');
                        
                        // Refresh contact profile if open
                        if (currentContact && currentContact.id == contactId) {
                            openContactProfile(contactId);
                        }
                    } else {
                        throw new Error('Failed to create task');
                    }
                } catch (error) {
                    alert('Error creating task: ' + error.message);
                }
            });

            // Schedule Meeting Form
            document.getElementById('scheduleMeetingForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const contactId = document.getElementById('meetingContactId').value;
                const data = {
                    title: document.getElementById('meetingTitle').value,
                    description: document.getElementById('meetingDescription').value,
                    meeting_date: document.getElementById('meetingDateTime').value,
                    duration: parseInt(document.getElementById('meetingDuration').value),
                    location: document.getElementById('meetingLocation').value,
                    meeting_type: document.getElementById('meetingType').value
                };

                try {
                    const response = await fetch(\`/api/contacts/\${contactId}/meetings\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });

                    if (response.ok) {
                        closeScheduleMeetingModal();
                        alert('Meeting scheduled successfully!');
                        
                        // Refresh contact profile if open
                        if (currentContact && currentContact.id == contactId) {
                            openContactProfile(contactId);
                        }
                    } else {
                        throw new Error('Failed to schedule meeting');
                    }
                } catch (error) {
                    alert('Error scheduling meeting: ' + error.message);
                }
            });

            // Bulk Update Form
            document.getElementById('bulkUpdateForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const field = document.getElementById('bulkUpdateField').value;
                const value = document.getElementById('bulkUpdateValue').value;
                
                if (!field || selectedContacts.size === 0) return;

                try {
                    const selectedIds = Array.from(selectedContacts);
                    const updatePromises = selectedIds.map(id => {
                        const updateData = { [field]: value };
                        return fetch(\`/api/contacts/\${id}\`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateData)
                        });
                    });

                    await Promise.all(updatePromises);
                    closeBulkUpdateModal();
                    selectedContacts.clear();
                    await loadData();
                    alert(\`Successfully updated \${selectedIds.length} contacts\`);
                } catch (error) {
                    alert('Error updating contacts: ' + error.message);
                }
            });
        }

        // Contact view functions
        function showAddContactForm() {
            document.getElementById('addContactSection').style.display = 'block';
        }

        function hideAddContactForm() {
            document.getElementById('addContactSection').style.display = 'none';
            document.getElementById('contactForm').reset();
        }

        function setContactView(view) {
            currentContactView = view;
            
            // Update button styles
            document.getElementById('tableViewBtn').style.background = view === 'table' ? '#3498db' : '#6c757d';
            document.getElementById('listViewBtn').style.background = view === 'list' ? '#3498db' : '#6c757d';
            
            // Show/hide appropriate views
            document.getElementById('contactsTable').style.display = view === 'table' ? 'block' : 'none';
            document.getElementById('contactsList').style.display = view === 'list' ? 'block' : 'none';
            
            displayContacts();
        }

        function sortContacts(column) {
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            
            // Update sort indicators
            document.querySelectorAll('[id$="Sort"]').forEach(el => el.textContent = '⇅');
            document.getElementById(column.replace('_', '') + 'Sort').textContent = currentSort.direction === 'asc' ? '↑' : '↓';
            
            // Sort the data
            filteredContacts.sort((a, b) => {
                let aVal = a[column] || '';
                let bVal = b[column] || '';
                
                if (column === 'created_at') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                }
                
                if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
                return 0;
            });
            
            displayContacts();
        }

        function displayContacts() {
            if (currentContactView === 'table') {
                displayContactsTable();
            } else {
                displayContactsList();
            }
        }

        function displayContactsTable() {
            const tableBody = document.getElementById('contactsTableBody');
            tableBody.innerHTML = filteredContacts.map(contact => \`
                <tr style="border-bottom: 1px solid #f8f9fa; \${selectedContacts.has(contact.id) ? 'background: #e3f2fd;' : ''}">
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        <input type="checkbox" \${selectedContacts.has(contact.id) ? 'checked' : ''} 
                               onchange="toggleContactSelection(\${contact.id})">
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6; cursor: pointer;" onclick="openContactProfile(\${contact.id})">
                        <strong style="color: #3498db;">\${contact.name || 'N/A'}</strong>
                        \${contact.lead_status ? '<br><small style="color: #6c757d;">' + contact.lead_status + '</small>' : ''}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        \${contact.email ? '<a href="mailto:' + contact.email + '" style="color: #3498db;">' + contact.email + '</a>' : 'N/A'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        \${contact.phone ? '<a href="tel:' + contact.phone + '" style="color: #3498db;">' + contact.phone + '</a>' : 'N/A'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        \${contact.company_name || 'N/A'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        \${contact.position || 'N/A'}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        \${new Date(contact.created_at).toLocaleDateString()}
                    </td>
                    <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button class="btn" style="padding: 4px 8px; font-size: 12px; background: #17a2b8;" onclick="event.stopPropagation(); openContactProfile(\${contact.id})">👁️ View</button>
                            <button class="btn" style="padding: 4px 8px; font-size: 12px; background: #ffc107; color: #212529;" onclick="event.stopPropagation(); openEditContactModal(\${contact.id})">✏️ Edit</button>
                            <button class="btn" style="padding: 4px 8px; font-size: 12px; background: #28a745;" onclick="event.stopPropagation(); openSendEmailModal(\${contact.id})">📧</button>
                            <button class="btn" style="padding: 4px 8px; font-size: 12px; background: #dc3545;" onclick="event.stopPropagation(); deleteContact(\${contact.id})">🗑️</button>
                        </div>
                    </td>
                </tr>
            \`).join('');
            
            // Update title and selection state
            document.getElementById('contactsTitle').textContent = \`All Contacts (\${filteredContacts.length})\`;
            updateSelectionState();
        }

        function displayContactsList() {
            const contactsList = document.getElementById('contactsList');
            contactsList.innerHTML = filteredContacts.map(contact => \`
                <div class="list-item">
                    <div class="item-name">\${contact.name}</div>
                    <div class="item-details">
                        \${contact.email ? 'Email: <a href="mailto:' + contact.email + '" style="color: #3498db;">' + contact.email + '</a><br>' : ''}
                        \${contact.phone ? 'Phone: <a href="tel:' + contact.phone + '" style="color: #3498db;">' + contact.phone + '</a><br>' : ''}
                        \${contact.company_name ? 'Company: ' + contact.company_name + '<br>' : ''}
                        \${contact.position ? 'Position: ' + contact.position + '<br>' : ''}
                        \${contact.notes ? 'Notes: ' + contact.notes : ''}
                    </div>
                    <div class="item-meta">
                        <span class="item-tag">Contact</span>
                        \${contact.company_name ? '<span class="item-tag">' + contact.company_name + '</span>' : ''}
                        <span class="item-tag">\${new Date(contact.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            \`).join('');
            
            // Update title
            document.getElementById('contactsTitle').textContent = \`All Contacts (\${filteredContacts.length})\`;
        }

        // Import modal functions
        function showImportModal() {
            document.getElementById('importModal').style.display = 'block';
            // Reset form
            document.getElementById('importForm').reset();
            document.getElementById('importProgress').style.display = 'none';
            document.getElementById('importResults').style.display = 'none';
        }

        function hideImportModal() {
            document.getElementById('importModal').style.display = 'none';
        }

        function downloadSampleCsv() {
            const sampleData = [
                ['Name', 'Email', 'Phone', 'Company', 'Position', 'Notes'],
                ['John Doe', 'john.doe@example.com', '+1-555-0123', 'Example Corp', 'Sales Manager', 'Important client contact'],
                ['Jane Smith', 'jane.smith@company.com', '+1-555-0124', 'Tech Innovations', 'Marketing Director', 'Lead from trade show'],
                ['Bob Johnson', 'bob.j@startup.com', '+1-555-0125', 'StartupXYZ', 'CEO', 'Potential partnership']
            ];
            
            const csvContent = sampleData.map(row => 
                row.map(field => \`"\${field}"\`).join(',')
            ).join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sample-contacts.csv';
            a.click();
            URL.revokeObjectURL(url);
        }

        function showMessage(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.innerHTML = '<div class="alert alert-' + type + '">' + message + '</div>';
            setTimeout(() => element.innerHTML = '', 3000);
        }

        async function loadData() {
            await Promise.all([loadCompanies(), loadContacts()]);
            updateDashboard();
        }

        async function loadCompanies() {
            try {
                const response = await fetch('/api/companies');
                const companies = await response.json();
                allCompanies = companies; // Store globally
                filteredCompanies = [...allCompanies]; // Initialize filtered companies
                
                // Update companies list
                const companiesList = document.getElementById('companiesList');
                companiesList.innerHTML = companies.map(company => 
                    '<div class="list-item">' +
                        '<div class="item-name">' + company.name + '</div>' +
                        '<div class="item-details">' +
                            (company.email ? 'Email: ' + company.email + '<br>' : '') +
                            (company.phone ? 'Phone: ' + company.phone + '<br>' : '') +
                            (company.website ? 'Website: ' + company.website + '<br>' : '') +
                            (company.notes ? 'Notes: ' + company.notes : '') +
                        '</div>' +
                        '<div class="item-meta">' +
                            '<span class="item-tag">Company</span>' +
                        '</div>' +
                    '</div>'
                ).join('');

                // Update company select dropdown
                const companySelect = document.getElementById('contactCompany');
                if (companySelect) {
                    companySelect.innerHTML = '<option value="">Select Company</option>' + 
                        companies.map(company => \`<option value="\${company.id}">\${company.name}</option>\`).join('');
                }

                // Display companies in the new table
                displayCompanies();
                    
                return companies;
            } catch (error) {
                console.error('Error loading companies:', error);
                return [];
            }
        }

        async function loadContacts() {
            try {
                const response = await fetch('/api/contacts');
                allContacts = await response.json();
                filteredContacts = [...allContacts];
                
                // Apply current sorting
                if (currentSort.column) {
                    sortContacts(currentSort.column);
                } else {
                    displayContacts();
                }
                
                return allContacts;
            } catch (error) {
                console.error('Error loading contacts:', error);
                return [];
            }
        }

        async function updateDashboard() {
            try {
                const [companies, contacts] = await Promise.all([
                    fetch('/api/companies').then(r => r.json()),
                    fetch('/api/contacts').then(r => r.json())
                ]);

                // Update dashboard cards
                document.getElementById('totalCompanies').textContent = companies.length;
                document.getElementById('totalContacts').textContent = contacts.length;

                // Update recent items
                const recentCompanies = companies.slice(0, 3);
                const recentContacts = contacts.slice(0, 3);

                document.getElementById('recentCompanies').innerHTML = recentCompanies.map(company => 
                    '<div class="list-item">' +
                        '<div class="item-name">' + company.name + '</div>' +
                        '<div class="item-details">' + (company.email || 'No email') + '</div>' +
                    '</div>'
                ).join('') || '<p>No companies yet</p>';

                document.getElementById('recentContacts').innerHTML = recentContacts.map(contact => 
                    '<div class="list-item">' +
                        '<div class="item-name">' + contact.name + '</div>' +
                        '<div class="item-details">' + (contact.company_name || 'No company') + '</div>' +
                    '</div>'
                ).join('') || '<p>No contacts yet</p>';

            } catch (error) {
                console.error('Error updating dashboard:', error);
            }
        }

        // ====== CONTACT MANAGEMENT FUNCTIONS ======

        // Selection Functions
        function toggleContactSelection(contactId) {
            if (selectedContacts.has(contactId)) {
                selectedContacts.delete(contactId);
            } else {
                selectedContacts.add(contactId);
            }
            updateSelectionState();
            displayContacts(); // Refresh to show selection state
        }

        function toggleSelectAll() {
            const selectAllCheckbox = document.getElementById('selectAll');
            if (selectAllCheckbox.checked) {
                // Select all visible contacts
                filteredContacts.forEach(contact => selectedContacts.add(contact.id));
            } else {
                // Deselect all
                selectedContacts.clear();
            }
            updateSelectionState();
            displayContacts();
        }

        function updateSelectionState() {
            const selectionCount = selectedContacts.size;
            const bulkActionsBar = document.getElementById('bulkActionsBar');
            const selectionCountSpan = document.getElementById('selectionCount');
            const selectAllCheckbox = document.getElementById('selectAll');
            
            // Show/hide bulk actions bar
            bulkActionsBar.style.display = selectionCount > 0 ? 'block' : 'none';
            
            // Update selection count text
            selectionCountSpan.textContent = \`\${selectionCount} contact\${selectionCount !== 1 ? 's' : ''} selected\`;
            
            // Update select all checkbox state
            const visibleContactIds = filteredContacts.map(c => c.id);
            const visibleSelectedCount = visibleContactIds.filter(id => selectedContacts.has(id)).length;
            
            selectAllCheckbox.checked = visibleSelectedCount === visibleContactIds.length && visibleContactIds.length > 0;
            selectAllCheckbox.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleContactIds.length;
        }

        function clearSelection() {
            selectedContacts.clear();
            updateSelectionState();
            displayContacts();
        }

        // Contact Profile Functions
        async function openContactProfile(contactId) {
            try {
                const response = await fetch(\`/api/contacts/\${contactId}\`);
                if (!response.ok) throw new Error('Contact not found');
                
                const contact = await response.json();
                currentContact = contact;
                
                // Update modal content
                document.getElementById('contactProfileName').textContent = contact.name;
                document.getElementById('contactProfileInfo').innerHTML = \`
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                        <div><strong>Email:</strong> \${contact.email ? '<a href="mailto:' + contact.email + '">' + contact.email + '</a>' : 'N/A'}</div>
                        <div><strong>Phone:</strong> \${contact.phone ? '<a href="tel:' + contact.phone + '">' + contact.phone + '</a>' : 'N/A'}</div>
                        <div><strong>Mobile:</strong> \${contact.mobile ? '<a href="tel:' + contact.mobile + '">' + contact.mobile + '</a>' : 'N/A'}</div>
                        <div><strong>Company:</strong> \${contact.company_name || 'N/A'}</div>
                        <div><strong>Position:</strong> \${contact.position || 'N/A'}</div>
                        <div><strong>Department:</strong> \${contact.department || 'N/A'}</div>
                        <div><strong>Lead Status:</strong> \${contact.lead_status || 'N/A'}</div>
                        <div><strong>Priority:</strong> \${contact.priority || 'N/A'}</div>
                        <div><strong>Address:</strong> \${contact.address || 'N/A'}</div>
                        <div><strong>City:</strong> \${contact.city || 'N/A'}</div>
                        <div><strong>State:</strong> \${contact.state || 'N/A'}</div>
                        <div><strong>Country:</strong> \${contact.country || 'N/A'}</div>
                        <div><strong>Birthday:</strong> \${contact.birthday ? new Date(contact.birthday).toLocaleDateString() : 'N/A'}</div>
                        <div><strong>Last Contacted:</strong> \${contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : 'Never'}</div>
                        <div style="grid-column: 1 / -1;"><strong>Notes:</strong> \${contact.notes || 'No notes'}</div>
                    </div>
                \`;
                
                // Update activity timeline
                displayActivityTimeline(contact.activities || []);
                
                // Update sidebar
                displayRecentTasks(contact.tasks || []);
                displayUpcomingMeetings(contact.meetings || []);
                
                // Show modal
                document.getElementById('contactProfileModal').style.display = 'block';
                
            } catch (error) {
                alert('Error loading contact: ' + error.message);
            }
        }

        function closeContactProfile() {
            document.getElementById('contactProfileModal').style.display = 'none';
            currentContact = null;
        }

        function displayActivityTimeline(activities) {
            const timeline = document.getElementById('activityTimeline');
            if (activities.length === 0) {
                timeline.innerHTML = '<p>No activities yet</p>';
                return;
            }
            
            timeline.innerHTML = activities.map(activity => \`
                <div style="border-left: 4px solid #3498db; padding: 15px; margin-bottom: 15px; background: #f8f9fa;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #2c3e50;">\${activity.subject}</h4>
                        <span style="color: #6c757d; font-size: 0.9em;">\${new Date(activity.created_at).toLocaleDateString()}</span>
                    </div>
                    <div style="margin-bottom: 10px;">
                        <span style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; margin-right: 10px;">
                            \${activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                        </span>
                        <span style="background: \${activity.status === 'completed' ? '#d4edda' : '#fff3cd'}; padding: 4px 8px; border-radius: 4px; font-size: 0.8em;">
                            \${activity.status}
                        </span>
                    </div>
                    <p style="margin: 0; color: #6c757d;">\${activity.description || 'No description'}</p>
                </div>
            \`).join('');
        }

        function displayRecentTasks(tasks) {
            const container = document.getElementById('recentTasks');
            if (tasks.length === 0) {
                container.innerHTML = '<p>No tasks</p>';
                return;
            }
            
            container.innerHTML = tasks.slice(0, 3).map(task => \`
                <div style="padding: 10px; border: 1px solid #e9ecef; border-radius: 4px; margin-bottom: 10px;">
                    <div style="font-weight: 600; margin-bottom: 5px;">\${task.title}</div>
                    <div style="font-size: 0.9em; color: #6c757d;">
                        Due: \${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                    </div>
                    <span style="background: \${task.priority === 'high' ? '#dc3545' : task.priority === 'medium' ? '#ffc107' : '#28a745'}; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em;">
                        \${task.priority}
                    </span>
                </div>
            \`).join('');
        }

        function displayUpcomingMeetings(meetings) {
            const container = document.getElementById('upcomingMeetings');
            if (meetings.length === 0) {
                container.innerHTML = '<p>No meetings</p>';
                return;
            }
            
            container.innerHTML = meetings.slice(0, 3).map(meeting => \`
                <div style="padding: 10px; border: 1px solid #e9ecef; border-radius: 4px; margin-bottom: 10px;">
                    <div style="font-weight: 600; margin-bottom: 5px;">\${meeting.title}</div>
                    <div style="font-size: 0.9em; color: #6c757d;">
                        \${new Date(meeting.meeting_date).toLocaleString()}
                    </div>
                    <div style="font-size: 0.9em; color: #6c757d;">
                        \${meeting.meeting_type} - \${meeting.duration} min
                    </div>
                </div>
            \`).join('');
        }

        // Edit Contact Functions
        async function openEditContactModal(contactId) {
            try {
                const response = await fetch(\`/api/contacts/\${contactId}\`);
                if (!response.ok) throw new Error('Contact not found');
                
                const contact = await response.json();
                
                // Populate form fields
                document.getElementById('editContactId').value = contact.id;
                document.getElementById('editContactName').value = contact.name || '';
                document.getElementById('editContactEmail').value = contact.email || '';
                document.getElementById('editContactPhone').value = contact.phone || '';
                document.getElementById('editContactMobile').value = contact.mobile || '';
                document.getElementById('editContactCompany').value = contact.company_id || '';
                document.getElementById('editContactPosition').value = contact.position || '';
                document.getElementById('editContactDepartment').value = contact.department || '';
                document.getElementById('editContactLeadStatus').value = contact.lead_status || 'New Lead';
                document.getElementById('editContactPriority').value = contact.priority || 'Medium';
                document.getElementById('editContactAddress').value = contact.address || '';
                document.getElementById('editContactCity').value = contact.city || '';
                document.getElementById('editContactState').value = contact.state || '';
                document.getElementById('editContactZip').value = contact.zip_code || '';
                document.getElementById('editContactCountry').value = contact.country || '';
                document.getElementById('editContactBirthday').value = contact.birthday ? contact.birthday.split('T')[0] : '';
                document.getElementById('editContactNotes').value = contact.notes || '';
                
                // Populate company dropdown
                const companySelect = document.getElementById('editContactCompany');
                companySelect.innerHTML = '<option value="">Select Company</option>' + 
                    allCompanies.map(company => \`<option value="\${company.id}" \${company.id === contact.company_id ? 'selected' : ''}>\${company.name}</option>\`).join('');
                
                // Show modal
                document.getElementById('editContactModal').style.display = 'block';
                
            } catch (error) {
                alert('Error loading contact: ' + error.message);
            }
        }

        function closeEditContact() {
            document.getElementById('editContactModal').style.display = 'none';
        }

        function editContact() {
            if (currentContact) {
                openEditContactModal(currentContact.id);
            }
        }

        // Delete Contact Function
        async function deleteContact(contactId) {
            if (!confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
                return;
            }
            
            try {
                const response = await fetch(\`/api/contacts/\${contactId}\`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    // Remove from selected if selected
                    selectedContacts.delete(contactId);
                    
                    // Reload data
                    await loadData();
                    
                    // Close profile modal if this contact was open
                    if (currentContact && currentContact.id === contactId) {
                        closeContactProfile();
                    }
                    
                    alert('Contact deleted successfully');
                } else {
                    throw new Error('Failed to delete contact');
                }
            } catch (error) {
                alert('Error deleting contact: ' + error.message);
            }
        }

        // Bulk Operations
        async function bulkDeleteContacts() {
            if (selectedContacts.size === 0) return;
            
            if (!confirm(\`Are you sure you want to delete \${selectedContacts.size} selected contacts? This action cannot be undone.\`)) {
                return;
            }
            
            try {
                const response = await fetch('/api/contacts', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: Array.from(selectedContacts) })
                });
                
                if (response.ok) {
                    selectedContacts.clear();
                    await loadData();
                    alert('Contacts deleted successfully');
                } else {
                    throw new Error('Failed to delete contacts');
                }
            } catch (error) {
                alert('Error deleting contacts: ' + error.message);
            }
        }

        function bulkUpdateContacts() {
            if (selectedContacts.size === 0) return;
            document.getElementById('bulkUpdateModal').style.display = 'block';
        }

        function closeBulkUpdateModal() {
            document.getElementById('bulkUpdateModal').style.display = 'none';
            document.getElementById('bulkUpdateForm').reset();
            document.getElementById('bulkUpdateValueGroup').style.display = 'none';
        }

        function toggleBulkUpdateValue() {
            const field = document.getElementById('bulkUpdateField').value;
            const valueGroup = document.getElementById('bulkUpdateValueGroup');
            const valueContainer = document.getElementById('bulkUpdateValueContainer');
            
            if (!field) {
                valueGroup.style.display = 'none';
                return;
            }
            
            valueGroup.style.display = 'block';
            
            // Create appropriate input based on field type
            switch (field) {
                case 'lead_status':
                    valueContainer.innerHTML = \`
                        <select class="form-select" id="bulkUpdateValue">
                            <option value="New Lead">New Lead</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Negotiation">Negotiation</option>
                            <option value="Closed Won">Closed Won</option>
                            <option value="Closed Lost">Closed Lost</option>
                        </select>
                    \`;
                    break;
                case 'priority':
                    valueContainer.innerHTML = \`
                        <select class="form-select" id="bulkUpdateValue">
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    \`;
                    break;
                case 'company_id':
                    valueContainer.innerHTML = \`
                        <select class="form-select" id="bulkUpdateValue">
                            <option value="">No Company</option>
                            \${allCompanies.map(company => \`<option value="\${company.id}">\${company.name}</option>\`).join('')}
                        </select>
                    \`;
                    break;
                case 'department':
                    valueContainer.innerHTML = \`<input type="text" class="form-input" id="bulkUpdateValue" placeholder="Enter department">\`;
                    break;
                default:
                    valueContainer.innerHTML = \`<input type="text" class="form-input" id="bulkUpdateValue">\`;
            }
        }

        function bulkExportContacts() {
            if (selectedContacts.size === 0) return;
            
            const selectedContactData = allContacts.filter(contact => selectedContacts.has(contact.id));
            const csvContent = [
                ['Name', 'Email', 'Phone', 'Mobile', 'Company', 'Position', 'Department', 'Lead Status', 'Priority', 'Address', 'City', 'State', 'ZIP', 'Country', 'Birthday', 'Notes'],
                ...selectedContactData.map(contact => [
                    contact.name || '',
                    contact.email || '',
                    contact.phone || '',
                    contact.mobile || '',
                    contact.company_name || '',
                    contact.position || '',
                    contact.department || '',
                    contact.lead_status || '',
                    contact.priority || '',
                    contact.address || '',
                    contact.city || '',
                    contact.state || '',
                    contact.zip_code || '',
                    contact.country || '',
                    contact.birthday ? contact.birthday.split('T')[0] : '',
                    contact.notes || ''
                ])
            ].map(row => row.map(field => \`"\${field}"\`).join(',')).join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`contacts-export-\${new Date().toISOString().split('T')[0]}.csv\`;
            a.click();
            URL.revokeObjectURL(url);
        }

        // Email Functions
        function openSendEmailModal(contactId) {
            const contact = allContacts.find(c => c.id === contactId);
            if (!contact || !contact.email) {
                alert('Contact does not have an email address');
                return;
            }
            
            document.getElementById('emailContactId').value = contactId;
            document.getElementById('emailRecipient').value = contact.email;
            document.getElementById('emailSubject').value = '';
            document.getElementById('emailBody').value = '';
            document.getElementById('sendEmailModal').style.display = 'block';
        }

        function showSendEmailModal() {
            if (currentContact) {
                openSendEmailModal(currentContact.id);
            }
        }

        function closeSendEmailModal() {
            document.getElementById('sendEmailModal').style.display = 'none';
            document.getElementById('sendEmailForm').reset();
        }

        // Task Functions
        function showCreateTaskModal() {
            if (currentContact) {
                document.getElementById('taskContactId').value = currentContact.id;
                document.getElementById('createTaskModal').style.display = 'block';
            }
        }

        function closeCreateTaskModal() {
            document.getElementById('createTaskModal').style.display = 'none';
            document.getElementById('createTaskForm').reset();
        }

        // Meeting Functions
        function showScheduleMeetingModal() {
            if (currentContact) {
                document.getElementById('meetingContactId').value = currentContact.id;
                document.getElementById('scheduleMeetingModal').style.display = 'block';
            }
        }

        function closeScheduleMeetingModal() {
            document.getElementById('scheduleMeetingModal').style.display = 'none';
            document.getElementById('scheduleMeetingForm').reset();
        }

        // Utility Functions
        function callContact() {
            if (currentContact && currentContact.phone) {
                window.location.href = 'tel:' + currentContact.phone;
            } else {
                alert('No phone number available for this contact');
            }
        }

        async function addNote() {
            if (!currentContact) return;
            
            const note = prompt('Enter note for ' + currentContact.name + ':');
            if (!note) return;
            
            try {
                const response = await fetch(\`/api/contacts/\${currentContact.id}/activities\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'note',
                        subject: 'Note',
                        description: note,
                        status: 'completed'
                    })
                });
                
                if (response.ok) {
                    // Refresh the contact profile
                    openContactProfile(currentContact.id);
                    alert('Note added successfully');
                } else {
                    throw new Error('Failed to add note');
                }
            } catch (error) {
                alert('Error adding note: ' + error.message);
            }
        }

        // ========================================
        // COMPANY MANAGEMENT FUNCTIONS
        // ========================================

        function setupCompanySearch() {
            const searchInput = document.getElementById('companySearch');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    const query = this.value.toLowerCase();
                    filteredCompanies = allCompanies.filter(company => 
                        company.name.toLowerCase().includes(query) ||
                        (company.industry && company.industry.toLowerCase().includes(query)) ||
                        (company.website && company.website.toLowerCase().includes(query)) ||
                        (company.phone && company.phone.toLowerCase().includes(query)) ||
                        (company.location && company.location.toLowerCase().includes(query))
                    );
                    displayCompanies();
                });
            }
        }

        // Company Selection Functions
        function toggleCompanySelection(companyId) {
            if (selectedCompanies.has(companyId)) {
                selectedCompanies.delete(companyId);
            } else {
                selectedCompanies.add(companyId);
            }
            updateCompanySelectionState();
            displayCompanies();
        }

        function toggleSelectAllCompanies() {
            const selectAllCheckbox = document.getElementById('selectAllCompanies');
            if (selectAllCheckbox.checked) {
                filteredCompanies.forEach(company => selectedCompanies.add(company.id));
            } else {
                selectedCompanies.clear();
            }
            updateCompanySelectionState();
            displayCompanies();
        }

        function updateCompanySelectionState() {
            const selectionCount = selectedCompanies.size;
            const bulkActionsBar = document.getElementById('companyBulkActionsBar');
            const selectionCountSpan = document.getElementById('companySelectionCount');
            const selectAllCheckbox = document.getElementById('selectAllCompanies');
            
            if (bulkActionsBar) {
                bulkActionsBar.style.display = selectionCount > 0 ? 'block' : 'none';
            }
            
            if (selectionCountSpan) {
                selectionCountSpan.textContent = selectionCount + ' company' + (selectionCount !== 1 ? 'ies' : 'y') + ' selected';
            }
            
            if (selectAllCheckbox) {
                const visibleCompanyIds = filteredCompanies.map(c => c.id);
                const visibleSelectedCount = visibleCompanyIds.filter(id => selectedCompanies.has(id)).length;
                
                selectAllCheckbox.checked = visibleSelectedCount === visibleCompanyIds.length && visibleCompanyIds.length > 0;
                selectAllCheckbox.indeterminate = visibleSelectedCount > 0 && visibleSelectedCount < visibleCompanyIds.length;
            }
        }

        function clearCompanySelection() {
            selectedCompanies.clear();
            updateCompanySelectionState();
            displayCompanies();
        }

        // Company Profile Functions
        async function openCompanyProfile(companyId) {
            try {
                const response = await fetch('/api/companies/' + companyId);
                if (!response.ok) throw new Error('Company not found');
                
                const company = await response.json();
                currentCompany = company;
                
                // Update modal content
                document.getElementById('companyProfileName').textContent = company.name;
                document.getElementById('companyProfileInfo').innerHTML = 
                    '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">' +
                        '<div><strong>Industry:</strong> ' + (company.industry || 'N/A') + '</div>' +
                        '<div><strong>Website:</strong> ' + (company.website ? '<a href="' + company.website + '" target="_blank">' + company.website + '</a>' : 'N/A') + '</div>' +
                        '<div><strong>Phone:</strong> ' + (company.phone ? '<a href="tel:' + company.phone + '">' + company.phone + '</a>' : 'N/A') + '</div>' +
                        '<div><strong>Email:</strong> ' + (company.email ? '<a href="mailto:' + company.email + '">' + company.email + '</a>' : 'N/A') + '</div>' +
                        '<div><strong>Company Size:</strong> ' + (company.company_size || 'N/A') + '</div>' +
                        '<div><strong>Annual Revenue:</strong> ' + (company.annual_revenue ? '$' + parseFloat(company.annual_revenue).toLocaleString() : 'N/A') + '</div>' +
                        '<div><strong>Company Type:</strong> ' + (company.company_type || 'N/A') + '</div>' +
                        '<div><strong>Location:</strong> ' + (company.location || 'N/A') + '</div>' +
                        '<div><strong>Address:</strong> ' + (company.address || 'N/A') + '</div>' +
                        '<div><strong>City:</strong> ' + (company.city || 'N/A') + '</div>' +
                        '<div><strong>State:</strong> ' + (company.state || 'N/A') + '</div>' +
                        '<div><strong>Country:</strong> ' + (company.country || 'N/A') + '</div>' +
                        '<div><strong>Founded:</strong> ' + (company.founded_year || 'N/A') + '</div>' +
                        '<div><strong>Lead Score:</strong> ' + (company.lead_score || 'N/A') + '</div>' +
                        '<div><strong>Last Contacted:</strong> ' + (company.last_contacted ? new Date(company.last_contacted).toLocaleDateString() : 'Never') + '</div>' +
                        '<div style="grid-column: 1 / -1;"><strong>Description:</strong> ' + (company.description || 'No description') + '</div>' +
                    '</div>';
                
                // Show modal
                document.getElementById('companyProfileModal').style.display = 'block';
                
            } catch (error) {
                alert('Error loading company: ' + error.message);
            }
        }

        function closeCompanyProfile() {
            document.getElementById('companyProfileModal').style.display = 'none';
            currentCompany = null;
        }

        // Edit Company Functions
        async function openEditCompanyModal(companyId) {
            try {
                const response = await fetch('/api/companies/' + companyId);
                if (!response.ok) throw new Error('Company not found');
                
                const company = await response.json();
                
                // Populate form fields
                document.getElementById('editCompanyId').value = company.id;
                document.getElementById('editCompanyName').value = company.name || '';
                document.getElementById('editCompanyIndustry').value = company.industry || '';
                document.getElementById('editCompanyWebsite').value = company.website || '';
                document.getElementById('editCompanyPhone').value = company.phone || '';
                document.getElementById('editCompanyEmail').value = company.email || '';
                document.getElementById('editCompanySize').value = company.company_size || '';
                document.getElementById('editCompanyRevenue').value = company.annual_revenue || '';
                document.getElementById('editCompanyType').value = company.company_type || 'Prospect';
                document.getElementById('editCompanyLocation').value = company.location || '';
                document.getElementById('editCompanyAddress').value = company.address || '';
                document.getElementById('editCompanyCity').value = company.city || '';
                document.getElementById('editCompanyState').value = company.state || '';
                document.getElementById('editCompanyZip').value = company.zip_code || '';
                document.getElementById('editCompanyCountry').value = company.country || '';
                document.getElementById('editCompanyFounded').value = company.founded_year || '';
                document.getElementById('editCompanyScore').value = company.lead_score || '';
                document.getElementById('editCompanyDescription').value = company.description || '';
                
                // Show modal
                document.getElementById('editCompanyModal').style.display = 'block';
                
            } catch (error) {
                alert('Error loading company: ' + error.message);
            }
        }

        function closeEditCompany() {
            document.getElementById('editCompanyModal').style.display = 'none';
        }

        function editCompany() {
            if (currentCompany) {
                openEditCompanyModal(currentCompany.id);
            }
        }

        // Delete Company Function
        async function deleteCompany(companyId) {
            if (!confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
                return;
            }
            
            try {
                const response = await fetch('/api/companies/' + companyId, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    selectedCompanies.delete(companyId);
                    await loadData();
                    
                    if (currentCompany && currentCompany.id === companyId) {
                        closeCompanyProfile();
                    }
                    
                    alert('Company deleted successfully');
                } else {
                    throw new Error('Failed to delete company');
                }
            } catch (error) {
                alert('Error deleting company: ' + error.message);
            }
        }

        // Display Companies Function
        function displayCompanies() {
            const container = document.getElementById('companiesTableBody');
            if (!container) return;
            
            if (filteredCompanies.length === 0) {
                container.innerHTML = '<tr><td colspan="10" class="no-data">No companies found</td></tr>';
                return;
            }
            
            container.innerHTML = filteredCompanies.map(company => 
                '<tr class="' + (selectedCompanies.has(company.id) ? 'selected' : '') + '">' +
                    '<td>' +
                        '<input type="checkbox" ' + 
                               (selectedCompanies.has(company.id) ? 'checked' : '') + ' ' +
                               'onchange="toggleCompanySelection(' + company.id + ')">' +
                    '</td>' +
                    '<td><a href="#" onclick="openCompanyProfile(' + company.id + '); return false;" class="contact-link">' + company.name + '</a></td>' +
                    '<td>' + (company.industry || '') + '</td>' +
                    '<td>' + (company.website ? '<a href="' + company.website + '" target="_blank">' + company.website + '</a>' : '') + '</td>' +
                    '<td>' + (company.phone || '') + '</td>' +
                    '<td>' + (company.email || '') + '</td>' +
                    '<td>' + (company.company_size || '') + '</td>' +
                    '<td>' + (company.company_type || '') + '</td>' +
                    '<td>' + (company.location || '') + '</td>' +
                    '<td class="actions">' +
                        '<button onclick="openCompanyProfile(' + company.id + ')" class="btn-sm" title="View Profile">👁️</button>' +
                        '<button onclick="openEditCompanyModal(' + company.id + ')" class="btn-sm" title="Edit">✏️</button>' +
                        '<button onclick="deleteCompany(' + company.id + ')" class="btn-sm btn-danger" title="Delete">🗑️</button>' +
                    '</td>' +
                '</tr>'
            ).join('');
            
            updateCompanySelectionState();
        }

        // Add Company Function
        function openAddCompanyModal() {
            // Reset form
            document.getElementById('addCompanyForm').reset();
            document.getElementById('addCompanyModal').style.display = 'block';
        }

        function closeAddCompany() {
            document.getElementById('addCompanyModal').style.display = 'none';
        }

        // Bulk Company Operations
        async function bulkDeleteCompanies() {
            if (selectedCompanies.size === 0) {
                alert('No companies selected');
                return;
            }
            
            if (!confirm('Are you sure you want to delete ' + selectedCompanies.size + ' companies? This action cannot be undone.')) {
                return;
            }
            
            try {
                const promises = Array.from(selectedCompanies).map(id => 
                    fetch('/api/companies/' + id, { method: 'DELETE' })
                );
                
                await Promise.all(promises);
                selectedCompanies.clear();
                await loadData();
                alert('Companies deleted successfully');
            } catch (error) {
                alert('Error deleting companies: ' + error.message);
            }
        }

        // Export Companies Function
        function exportCompanies() {
            const companies = selectedCompanies.size > 0 ? 
                allCompanies.filter(c => selectedCompanies.has(c.id)) : 
                filteredCompanies;
            
            if (companies.length === 0) {
                alert('No companies to export');
                return;
            }
            
            const csvContent = [
                ['Name', 'Industry', 'Website', 'Phone', 'Email', 'Company Size', 'Company Type', 'Location', 'Description'].join(','),
                ...companies.map(company => [
                    '"' + (company.name || '').replace(/"/g, '""') + '"',
                    '"' + (company.industry || '').replace(/"/g, '""') + '"',
                    '"' + (company.website || '').replace(/"/g, '""') + '"',
                    '"' + (company.phone || '').replace(/"/g, '""') + '"',
                    '"' + (company.email || '').replace(/"/g, '""') + '"',
                    '"' + (company.company_size || '').replace(/"/g, '""') + '"',
                    '"' + (company.company_type || '').replace(/"/g, '""') + '"',
                    '"' + (company.location || '').replace(/"/g, '""') + '"',
                    '"' + (company.description || '').replace(/"/g, '""') + '"'
                ].join(','))
            ].join('\\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'companies-' + new Date().toISOString().split('T')[0] + '.csv';
            a.click();
            URL.revokeObjectURL(url);
        }

        // Company-Contact Association Functions
        function openAssociateContactModal(companyId) {
            currentCompany = { id: companyId };
            
            // Populate available contacts
            const contactSelect = document.getElementById('associateContactId');
            contactSelect.innerHTML = '<option value="">Select Contact</option>' +
                allContacts.map(contact => '<option value="' + contact.id + '">' + contact.name + ' (' + (contact.email || 'No email') + ')</option>').join('');
            
            document.getElementById('associateContactModal').style.display = 'block';
        }

        function closeAssociateContact() {
            document.getElementById('associateContactModal').style.display = 'none';
        }

        // Deal Creation Functions
        function openCreateDealModal(companyId) {
            currentCompany = { id: companyId };
            
            // Reset form
            document.getElementById('createDealForm').reset();
            document.getElementById('createDealModal').style.display = 'block';
        }

        function closeCreateDeal() {
            document.getElementById('createDealModal').style.display = 'none';
        }
    </script>
</body>
</html>
  `;
  res.send(htmlContent);
});

// API Routes

// Companies
app.get('/api/companies', (req, res) => {
  try {
    const companies = db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/companies/:id', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/companies', (req, res) => {
  try {
    const { 
      name, industry, website, phone, email, company_size, annual_revenue, 
      company_type, location, address, city, state, zip_code, country,
      founded_year, lead_score, description 
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO companies (
        name, industry, website, phone, email, company_size, annual_revenue,
        company_type, location, address, city, state, zip_code, country,
        founded_year, lead_score, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      name, industry, website, phone, email, company_size, annual_revenue,
      company_type, location, address, city, state, zip_code, country,
      founded_year, lead_score, description
    );
    
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id', (req, res) => {
  try {
    const { 
      name, industry, website, phone, email, company_size, annual_revenue, 
      company_type, location, address, city, state, zip_code, country,
      founded_year, lead_score, description 
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const stmt = db.prepare(`
      UPDATE companies SET 
        name = ?, industry = ?, website = ?, phone = ?, email = ?, 
        company_size = ?, annual_revenue = ?, company_type = ?, location = ?,
        address = ?, city = ?, state = ?, zip_code = ?, country = ?,
        founded_year = ?, lead_score = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(
      name, industry, website, phone, email, company_size, annual_revenue,
      company_type, location, address, city, state, zip_code, country,
      founded_year, lead_score, description, req.params.id
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM companies WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contacts
app.get('/api/contacts', (req, res) => {
  try {
    const contacts = db.prepare(`
      SELECT c.*, co.name as company_name 
      FROM contacts c 
      LEFT JOIN companies co ON c.company_id = co.id 
      ORDER BY c.created_at DESC
    `).all();
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contacts', (req, res) => {
  try {
    const { name, email, phone, company_id, position, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, phone, company_id, position, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, email, phone, company_id || null, position, notes);
    
    const contact = db.prepare(`
      SELECT c.*, co.name as company_name 
      FROM contacts c 
      LEFT JOIN companies co ON c.company_id = co.id 
      WHERE c.id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CSV Import endpoint
app.post('/api/contacts/import', upload.single('csvFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const csvData = req.file.buffer.toString('utf8');
    const duplicateHandling = req.body.duplicateHandling || 'skip'; // skip, merge, create

    // Parse CSV
    const parseResult = Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors.length > 0) {
      return res.status(400).json({ 
        error: 'CSV parsing error', 
        details: parseResult.errors 
      });
    }

    const rows = parseResult.data;
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No data found in CSV' });
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each row
    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, phone, company_id, position, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const updateStmt = db.prepare(`
      UPDATE contacts 
      SET name = ?, phone = ?, company_id = ?, position = ?, notes = ?
      WHERE email = ?
    `);

    const checkExisting = db.prepare('SELECT id FROM contacts WHERE email = ? AND email IS NOT NULL AND email != \'\'');

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      try {
        // Map common field variations
        const name = row['Name'] || row['name'] || row['Full Name'] || row['Contact Name'] || 
                    `${row['First Name'] || row['first_name'] || ''} ${row['Last Name'] || row['last_name'] || ''}`.trim();
        const email = row['Email'] || row['email'] || row['Email Address'] || '';
        const phone = row['Phone'] || row['phone'] || row['Phone Number'] || '';
        const position = row['Position'] || row['position'] || row['Job Title'] || row['Title'] || '';
        const notes = row['Notes'] || row['notes'] || row['Description'] || '';
        
        // Handle company - try to find existing company by name or create reference
        let companyId = null;
        const companyName = row['Company'] || row['company'] || row['Company Name'] || '';
        if (companyName) {
          const existingCompany = db.prepare('SELECT id FROM companies WHERE name = ?').get(companyName);
          if (existingCompany) {
            companyId = existingCompany.id;
          } else {
            // Create company if it doesn't exist
            const companyStmt = db.prepare('INSERT INTO companies (name) VALUES (?)');
            const result = companyStmt.run(companyName);
            companyId = result.lastInsertRowid;
          }
        }

        if (!name && !email) {
          errors.push(`Row ${i + 2}: Missing required fields (name or email)`);
          errorCount++;
          continue;
        }

        // Check for existing contact by email
        const existingContact = email ? checkExisting.get(email) : null;

        if (existingContact) {
          if (duplicateHandling === 'skip') {
            skippedCount++;
            continue;
          } else if (duplicateHandling === 'merge') {
            updateStmt.run(name, phone || null, companyId, position || null, notes || null, email);
            successCount++;
            continue;
          }
          // For 'create', we proceed to insert a new record
        }

        // Insert new contact
        stmt.run(name, email || null, phone || null, companyId, position || null, notes || null);
        successCount++;

      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: 'CSV import completed',
      results: {
        totalRows: rows.length,
        successCount,
        errorCount,
        skippedCount,
        errors: errors.slice(0, 10) // Limit error messages
      }
    });

  } catch (error) {
    console.error('CSV import error:', error);
    res.status(500).json({ error: 'Import failed: ' + error.message });
  }
});

// Get single contact
app.get('/api/contacts/:id', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const contact = db.prepare(`
      SELECT c.*, co.name as company_name,
             co.email as company_email, co.phone as company_phone, co.website as company_website
      FROM contacts c 
      LEFT JOIN companies co ON c.company_id = co.id 
      WHERE c.id = ?
    `).get(contactId);

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get contact activities
    const activities = db.prepare(`
      SELECT * FROM activities 
      WHERE contact_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all(contactId);

    // Get contact tasks
    const tasks = db.prepare(`
      SELECT * FROM tasks 
      WHERE contact_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `).all(contactId);

    // Get contact meetings
    const meetings = db.prepare(`
      SELECT * FROM meetings 
      WHERE contact_id = ? 
      ORDER BY meeting_date DESC 
      LIMIT 5
    `).all(contactId);

    contact.activities = activities;
    contact.tasks = tasks;
    contact.meetings = meetings;

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update contact
app.put('/api/contacts/:id', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const {
      name, email, phone, mobile, company_id, position, department,
      address, city, state, zip_code, country, birthday, notes,
      lead_source, lead_status, priority
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Contact name is required' });
    }

    const stmt = db.prepare(`
      UPDATE contacts SET
        name = ?, email = ?, phone = ?, mobile = ?, company_id = ?, position = ?, department = ?,
        address = ?, city = ?, state = ?, zip_code = ?, country = ?, birthday = ?, notes = ?,
        lead_source = ?, lead_status = ?, priority = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      name, email || null, phone || null, mobile || null, company_id || null,
      position || null, department || null, address || null, city || null,
      state || null, zip_code || null, country || null, birthday || null,
      notes || null, lead_source || null, lead_status || 'New Lead',
      priority || 'Medium', contactId
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    // Get updated contact
    const updatedContact = db.prepare(`
      SELECT c.*, co.name as company_name 
      FROM contacts c 
      LEFT JOIN companies co ON c.company_id = co.id 
      WHERE c.id = ?
    `).get(contactId);

    res.json(updatedContact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete contact
app.delete('/api/contacts/:id', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);

    // Delete related activities, tasks, meetings first
    db.prepare('DELETE FROM activities WHERE contact_id = ?').run(contactId);
    db.prepare('DELETE FROM tasks WHERE contact_id = ?').run(contactId);
    db.prepare('DELETE FROM meetings WHERE contact_id = ?').run(contactId);
    db.prepare('DELETE FROM emails WHERE contact_id = ?').run(contactId);

    // Delete the contact
    const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(contactId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete contacts
app.delete('/api/contacts', (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Contact IDs are required' });
    }

    const placeholders = ids.map(() => '?').join(',');
    
    // Delete related data first
    db.prepare(`DELETE FROM activities WHERE contact_id IN (${placeholders})`).run(...ids);
    db.prepare(`DELETE FROM tasks WHERE contact_id IN (${placeholders})`).run(...ids);
    db.prepare(`DELETE FROM meetings WHERE contact_id IN (${placeholders})`).run(...ids);
    db.prepare(`DELETE FROM emails WHERE contact_id IN (${placeholders})`).run(...ids);

    // Delete contacts
    const result = db.prepare(`DELETE FROM contacts WHERE id IN (${placeholders})`).run(...ids);

    res.json({ message: `${result.changes} contacts deleted successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User preferences endpoints
app.get('/api/preferences/:key', (req, res) => {
  try {
    const { key } = req.params;
    const preference = db.prepare('SELECT preference_value FROM user_preferences WHERE preference_key = ? AND user_id = ?')
      .get(key, 'default');

    res.json({ value: preference ? preference.preference_value : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/preferences', (req, res) => {
  try {
    const { key, value } = req.body;
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_preferences (user_id, preference_key, preference_value)
      VALUES ('default', ?, ?)
    `);

    stmt.run(key, JSON.stringify(value));
    res.json({ message: 'Preference saved' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activity endpoints
app.post('/api/contacts/:id/activities', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const { type, subject, description, status, priority, due_date } = req.body;

    const stmt = db.prepare(`
      INSERT INTO activities (contact_id, type, subject, description, status, priority, due_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(contactId, type, subject, description || null, status || 'pending', priority || 'medium', due_date || null);

    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
    
    // Update last_contacted for contact
    if (type === 'call' || type === 'email' || type === 'meeting') {
      db.prepare('UPDATE contacts SET last_contacted = CURRENT_TIMESTAMP WHERE id = ?').run(contactId);
    }

    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Task endpoints
app.post('/api/contacts/:id/tasks', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const { title, description, status, priority, due_date } = req.body;

    const stmt = db.prepare(`
      INSERT INTO tasks (contact_id, title, description, status, priority, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(contactId, title, description || null, status || 'pending', priority || 'medium', due_date || null);
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Meeting endpoints
app.post('/api/contacts/:id/meetings', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const { title, description, meeting_date, duration, location, meeting_type } = req.body;

    const stmt = db.prepare(`
      INSERT INTO meetings (contact_id, title, description, meeting_date, duration, location, meeting_type)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(contactId, title, description || null, meeting_date, duration || 60, location || null, meeting_type || 'in_person');
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email endpoints
app.post('/api/contacts/:id/emails', (req, res) => {
  try {
    const contactId = parseInt(req.params.id);
    const { subject, body } = req.body;

    const stmt = db.prepare(`
      INSERT INTO emails (contact_id, subject, body, sent_at, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(contactId, subject, body, new Date().toISOString(), 'sent');
    const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(result.lastInsertRowid);

    // Add activity record
    db.prepare(`
      INSERT INTO activities (contact_id, type, subject, description, status)
      VALUES (?, 'email', ?, ?, 'completed')
    `).run(contactId, subject, 'Email sent', 'completed');

    // Update last_contacted
    db.prepare('UPDATE contacts SET last_contacted = CURRENT_TIMESTAMP WHERE id = ?').run(contactId);

    res.status(201).json(email);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Simple CRM running with SQLite',
    timestamp: new Date().toISOString()
  });
});

// Company-Contact Associations
app.post('/api/company-contacts', (req, res) => {
  try {
    const { company_id, contact_id, role, is_primary } = req.body;
    
    if (!company_id || !contact_id) {
      return res.status(400).json({ error: 'Company ID and Contact ID are required' });
    }

    // Check if association already exists
    const existing = db.prepare('SELECT * FROM company_contacts WHERE company_id = ? AND contact_id = ?').get(company_id, contact_id);
    if (existing) {
      return res.status(400).json({ error: 'Contact is already associated with this company' });
    }

    const stmt = db.prepare(`
      INSERT INTO company_contacts (company_id, contact_id, role, is_primary)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(company_id, contact_id, role, is_primary || false);
    
    const association = db.prepare('SELECT * FROM company_contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(association);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/company-contacts/:company_id', (req, res) => {
  try {
    const associations = db.prepare(`
      SELECT cc.*, c.name as contact_name, c.email as contact_email, c.phone as contact_phone
      FROM company_contacts cc
      LEFT JOIN contacts c ON cc.contact_id = c.id
      WHERE cc.company_id = ?
    `).all(req.params.company_id);
    
    res.json(associations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/company-contacts/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM company_contacts WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Association not found' });
    }
    
    res.json({ message: 'Association deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deals
app.get('/api/deals', (req, res) => {
  try {
    const deals = db.prepare(`
      SELECT d.*, c.name as company_name, co.name as contact_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN contacts co ON d.contact_id = co.id
      ORDER BY d.created_at DESC
    `).all();
    res.json(deals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/deals/:id', (req, res) => {
  try {
    const deal = db.prepare(`
      SELECT d.*, c.name as company_name, co.name as contact_name
      FROM deals d
      LEFT JOIN companies c ON d.company_id = c.id
      LEFT JOIN contacts co ON d.contact_id = co.id
      WHERE d.id = ?
    `).get(req.params.id);
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/deals', (req, res) => {
  try {
    const { title, company_id, contact_id, value, stage, probability, expected_close_date, description } = req.body;
    
    if (!title || !company_id) {
      return res.status(400).json({ error: 'Deal title and company are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO deals (title, company_id, contact_id, value, stage, probability, expected_close_date, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(title, company_id, contact_id, value, stage || 'Prospecting', probability, expected_close_date, description);
    
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deals/:id', (req, res) => {
  try {
    const { title, company_id, contact_id, value, stage, probability, expected_close_date, description } = req.body;
    
    if (!title || !company_id) {
      return res.status(400).json({ error: 'Deal title and company are required' });
    }

    const stmt = db.prepare(`
      UPDATE deals SET 
        title = ?, company_id = ?, contact_id = ?, value = ?, stage = ?, 
        probability = ?, expected_close_date = ?, description = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    
    const result = stmt.run(title, company_id, contact_id, value, stage, probability, expected_close_date, description, req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    const deal = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
    res.json(deal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/deals/:id', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM deals WHERE id = ?');
    const result = stmt.run(req.params.id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple CRM running on http://0.0.0.0:${PORT}`);
  console.log(`SQLite database: simple-crm.db`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  db.close();
  process.exit(0);
});