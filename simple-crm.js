import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';

const app = express();
const PORT = 8516;

// Initialize SQLite database
const db = new Database('simple-crm.db');

// Create simple tables
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company_id INTEGER,
    position TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies (id)
  );
`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// CRM Dashboard Interface
app.get('/', (req, res) => {
  res.send(`
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
                    <div class="form-container">
                        <h3>Add New Contact</h3>
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
                    
                    <div class="data-list" style="margin-top: 30px;">
                        <div class="list-header">
                            <h3>All Contacts</h3>
                        </div>
                        <div id="contactsList"></div>
                    </div>
                </div>

                <!-- Companies Tab -->
                <div id="companies" class="tab-content">
                    <div class="form-container">
                        <h3>Add New Company</h3>
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
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-textarea" id="companyNotes" rows="3"></textarea>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-success">Add Company</button>
                        </form>
                        <div id="companyMessage"></div>
                    </div>
                    
                    <div class="data-list" style="margin-top: 30px;">
                        <div class="list-header">
                            <h3>All Companies</h3>
                        </div>
                        <div id="companiesList"></div>
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

    <script>
        // Tab Navigation
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize
            loadData();
            setupNavigation();
            setupForms();
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
                        loadData();
                    } else {
                        throw new Error('Failed to add contact');
                    }
                } catch (error) {
                    showMessage('contactMessage', 'Error: ' + error.message, 'error');
                }
            });
        }

        function showMessage(elementId, message, type) {
            const element = document.getElementById(elementId);
            element.innerHTML = \`<div class="alert alert-\${type}">\${message}</div>\`;
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
                
                // Update companies list
                const companiesList = document.getElementById('companiesList');
                companiesList.innerHTML = companies.map(company => \`
                    <div class="list-item">
                        <div class="item-name">\${company.name}</div>
                        <div class="item-details">
                            \${company.email ? 'Email: ' + company.email + '<br>' : ''}
                            \${company.phone ? 'Phone: ' + company.phone + '<br>' : ''}
                            \${company.website ? 'Website: ' + company.website + '<br>' : ''}
                            \${company.notes ? 'Notes: ' + company.notes : ''}
                        </div>
                        <div class="item-meta">
                            <span class="item-tag">Company</span>
                        </div>
                    </div>
                \`).join('');

                // Update company select dropdown
                const companySelect = document.getElementById('contactCompany');
                companySelect.innerHTML = '<option value="">Select Company</option>' + 
                    companies.map(company => \`<option value="\${company.id}">\${company.name}</option>\`).join('');
                    
                return companies;
            } catch (error) {
                console.error('Error loading companies:', error);
                return [];
            }
        }

        async function loadContacts() {
            try {
                const response = await fetch('/api/contacts');
                const contacts = await response.json();
                
                // Update contacts list
                const contactsList = document.getElementById('contactsList');
                contactsList.innerHTML = contacts.map(contact => \`
                    <div class="list-item">
                        <div class="item-name">\${contact.name}</div>
                        <div class="item-details">
                            \${contact.email ? 'Email: ' + contact.email + '<br>' : ''}
                            \${contact.phone ? 'Phone: ' + contact.phone + '<br>' : ''}
                            \${contact.company_name ? 'Company: ' + contact.company_name + '<br>' : ''}
                            \${contact.position ? 'Position: ' + contact.position + '<br>' : ''}
                            \${contact.notes ? 'Notes: ' + contact.notes : ''}
                        </div>
                        <div class="item-meta">
                            <span class="item-tag">Contact</span>
                            \${contact.company_name ? '<span class="item-tag">' + contact.company_name + '</span>' : ''}
                        </div>
                    </div>
                \`).join('');
                
                return contacts;
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

                document.getElementById('recentCompanies').innerHTML = recentCompanies.map(company => \`
                    <div class="list-item">
                        <div class="item-name">\${company.name}</div>
                        <div class="item-details">\${company.email || 'No email'}</div>
                    </div>
                \`).join('') || '<p>No companies yet</p>';

                document.getElementById('recentContacts').innerHTML = recentContacts.map(contact => \`
                    <div class="list-item">
                        <div class="item-name">\${contact.name}</div>
                        <div class="item-details">\${contact.company_name || 'No company'}</div>
                    </div>
                \`).join('') || '<p>No contacts yet</p>';

            } catch (error) {
                console.error('Error updating dashboard:', error);
            }
        }
    </script>
</body>
</html>
  `);
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

app.post('/api/companies', (req, res) => {
  try {
    const { name, email, phone, website, notes } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Company name is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO companies (name, email, phone, website, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, email, phone, website, notes);
    
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(company);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Simple CRM running with SQLite',
    timestamp: new Date().toISOString()
  });
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