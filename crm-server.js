import express from 'express';
import { dbOps } from './database.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8229;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Function to generate the complete HTML with embedded data
function generateHTML(currentTab = 'dashboard') {
    // Get data from database
    const contacts = dbOps.contact.getAll();
    const companies = dbOps.company.getAll();
    const deals = dbOps.deal.getAll();
    const activities = dbOps.activity.getAll();
    const stats = dbOps.getStats();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Probyr Lite CRM - SQLite Database</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 1rem;
            text-align: center;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .main-container {
            display: flex;
            height: calc(100vh - 120px);
            max-width: 1600px;
            margin: 0 auto;
            padding: 1rem;
            gap: 1rem;
        }

        .sidebar {
            width: 280px;
            background: white;
            border-radius: 10px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            height: fit-content;
            min-height: 500px;
            position: sticky;
            top: 1rem;
        }

        .sidebar h3 {
            margin-bottom: 1.5rem;
            color: #333;
            font-size: 1.2rem;
            border-bottom: 2px solid #f1f3f4;
            padding-bottom: 0.5rem;
        }

        .nav-tabs {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .nav-tab {
            padding: 1rem 1.2rem;
            background: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
            text-align: left;
            font-size: 0.95rem;
            color: #666;
            border-left: 3px solid transparent;
            text-decoration: none;
            display: block;
        }

        .nav-tab.active {
            background: #667eea15;
            color: #667eea;
            border-left: 3px solid #667eea;
            font-weight: 600;
        }

        .nav-tab:hover {
            background: #f8f9fa;
            color: #333;
            transform: translateX(3px);
        }

        .nav-tab.active:hover {
            background: #667eea20;
            color: #667eea;
        }

        .content-area {
            flex: 1;
            background: white;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow-y: auto;
        }

        .tab-pane {
            display: none;
        }

        .tab-pane.active {
            display: block;
        }

        .form-group {
            margin-bottom: 1.5rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #555;
        }

        .form-control {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.3s ease;
        }

        .form-control:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }

        .btn-primary {
            background: #667eea;
            color: white;
        }

        .btn-primary:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }

        .btn-danger {
            background: #dc3545;
            color: white;
        }

        .btn-danger:hover {
            background: #c82333;
            transform: translateY(-2px);
        }

        .btn-secondary {
            background: #6c757d;
            color: white;
        }

        .btn-secondary:hover {
            background: #5a6268;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 1rem;
        }

        .table th,
        .table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid #e9ecef;
        }

        .table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #555;
        }

        .table tr:hover {
            background: #f8f9fa;
        }

        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }

        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #667eea;
            display: block;
        }

        .stat-label {
            color: #666;
            margin-top: 0.5rem;
        }

        .empty-state {
            text-align: center;
            padding: 3rem;
            color: #666;
        }

        .empty-state h3 {
            margin-bottom: 1rem;
            color: #333;
        }

        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
        }

        .modal-content {
            background: white;
            margin: 5% auto;
            padding: 2rem;
            border-radius: 10px;
            width: 90%;
            max-width: 600px;
            max-height: 80%;
            overflow-y: auto;
        }

        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid #e9ecef;
        }

        .close {
            font-size: 2rem;
            cursor: pointer;
            color: #666;
        }

        .close:hover {
            color: #333;
        }

        .form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
                height: auto;
                padding: 0.5rem;
            }
            
            .sidebar {
                width: 100%;
                min-height: auto;
                margin-bottom: 1rem;
            }
            
            .nav-tabs {
                flex-direction: row;
                gap: 0.5rem;
                overflow-x: auto;
                padding-bottom: 0.5rem;
            }
            
            .nav-tab {
                min-width: 120px;
                text-align: center;
                border-left: none;
                border-bottom: 3px solid transparent;
            }
            
            .nav-tab.active {
                border-left: none;
                border-bottom: 3px solid #667eea;
            }
            
            .nav-tab:hover {
                transform: translateY(-2px);
            }
            
            .form-row {
                grid-template-columns: 1fr;
            }
            
            .stats {
                grid-template-columns: 1fr;
            }
            
            .content-area {
                padding: 1rem;
            }
        }

        .alert {
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }

        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }

        .add-form {
            background: #f8f9fa;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
        }

        .add-form h3 {
            margin-bottom: 1.5rem;
            color: #333;
        }

        .deal-board {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1.5rem;
            margin: 2rem 0;
        }

        .board-column {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 1rem;
            min-height: 400px;
        }

        .board-column h4 {
            text-align: center;
            margin-bottom: 1rem;
            padding: 0.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
        }

        .board-column.pipeline h4 {
            background: #6c757d;
        }

        .board-column.upside h4 {
            background: #ffc107;
        }

        .board-column.commit h4 {
            background: #fd7e14;
        }

        .board-column.won h4 {
            background: #28a745;
        }

        .deal-card {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .deal-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .deal-card h5 {
            margin: 0 0 0.5rem 0;
            color: #333;
            font-size: 0.9rem;
        }

        .deal-value {
            font-weight: bold;
            color: #667eea;
            font-size: 1.1rem;
            margin-bottom: 0.5rem;
        }

        .deal-meta {
            font-size: 0.8rem;
            color: #666;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }

        .deal-contact {
            font-weight: 500;
        }

        .empty-column {
            text-align: center;
            color: #999;
            font-style: italic;
            margin-top: 2rem;
        }


        @media (max-width: 1200px) {
            .deal-board {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 768px) {
            .deal-board {
                grid-template-columns: 1fr;
            }
        }

        /* Modal styles */
        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
        }

        .modal-content {
            background-color: #fefefe;
            margin: 5% auto;
            padding: 20px;
            border: 1px solid #888;
            border-radius: 8px;
            width: 80%;
            max-width: 600px;
            position: relative;
        }

        .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }

        .close:hover,
        .close:focus {
            color: black;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Probyr Lite CRM</h1>
        <p>SQLite Database - Complete Customer Relationship Management</p>
    </div>

    <div class="main-container">
        <div class="sidebar">
            <h3>🗄️ Navigation</h3>
            <div class="nav-tabs">
                <a href="/?tab=dashboard" class="nav-tab ${currentTab === 'dashboard' ? 'active' : ''}">📊 Dashboard</a>
                <a href="/?tab=deals" class="nav-tab ${currentTab === 'deals' ? 'active' : ''}">💰 Deals</a>
                <a href="/?tab=companies" class="nav-tab ${currentTab === 'companies' ? 'active' : ''}">🏢 Companies</a>
                <a href="/?tab=contacts" class="nav-tab ${currentTab === 'contacts' ? 'active' : ''}">👥 Contacts</a>
            </div>
        </div>

        <div class="content-area">
            <!-- Dashboard Tab -->
            <div id="dashboard" class="tab-pane ${currentTab === 'dashboard' ? 'active' : ''}">
                <h2>Dashboard Overview</h2>
                <div class="stats">
                    <div class="stat-card">
                        <span class="stat-number">${stats.total_contacts || 0}</span>
                        <div class="stat-label">Total Contacts</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${stats.total_companies || 0}</span>
                        <div class="stat-label">Companies</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">${stats.total_deals || 0}</span>
                        <div class="stat-label">Active Deals</div>
                    </div>
                    <div class="stat-card">
                        <span class="stat-number">$${(stats.total_revenue || 0).toLocaleString()}</span>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                </div>

                <!-- Deal Board -->
                <div style="margin-top: 2rem;">
                    <h3>Deal Pipeline Board</h3>
                    <div class="deal-board">
                        <div class="board-column pipeline">
                            <h4>Pipeline</h4>
                            ${deals.filter(deal => deal.stage === 'Pipeline').map(deal => `
                                <div class="deal-card">
                                    <h5>${deal.name}</h5>
                                    <div class="deal-value">$${(deal.value || 0).toLocaleString()}</div>
                                    <div class="deal-meta">
                                        ${deal.contact_name ? `<span class="deal-contact">👤 ${deal.contact_name}</span>` : ''}
                                        ${deal.company_name ? `<span>🏢 ${deal.company_name}</span>` : ''}
                                        ${deal.expected_close_date ? `<span>📅 ${new Date(deal.expected_close_date).toLocaleDateString()}</span>` : ''}
                                    </div>
                                </div>
                            `).join('') || '<div class="empty-column">No deals in pipeline</div>'}
                        </div>

                        <div class="board-column upside">
                            <h4>Upside</h4>
                            ${deals.filter(deal => deal.stage === 'Upside').map(deal => `
                                <div class="deal-card">
                                    <h5>${deal.name}</h5>
                                    <div class="deal-value">$${(deal.value || 0).toLocaleString()}</div>
                                    <div class="deal-meta">
                                        ${deal.contact_name ? `<span class="deal-contact">👤 ${deal.contact_name}</span>` : ''}
                                        ${deal.company_name ? `<span>🏢 ${deal.company_name}</span>` : ''}
                                        ${deal.expected_close_date ? `<span>📅 ${new Date(deal.expected_close_date).toLocaleDateString()}</span>` : ''}
                                    </div>
                                </div>
                            `).join('') || '<div class="empty-column">No upside deals</div>'}
                        </div>

                        <div class="board-column commit">
                            <h4>Commit</h4>
                            ${deals.filter(deal => deal.stage === 'Commit').map(deal => `
                                <div class="deal-card">
                                    <h5>${deal.name}</h5>
                                    <div class="deal-value">$${(deal.value || 0).toLocaleString()}</div>
                                    <div class="deal-meta">
                                        ${deal.contact_name ? `<span class="deal-contact">👤 ${deal.contact_name}</span>` : ''}
                                        ${deal.company_name ? `<span>🏢 ${deal.company_name}</span>` : ''}
                                        ${deal.expected_close_date ? `<span>📅 ${new Date(deal.expected_close_date).toLocaleDateString()}</span>` : ''}
                                    </div>
                                </div>
                            `).join('') || '<div class="empty-column">No commit deals</div>'}
                        </div>

                        <div class="board-column won">
                            <h4>Won</h4>
                            ${deals.filter(deal => deal.stage === 'Won').map(deal => `
                                <div class="deal-card">
                                    <h5>${deal.name}</h5>
                                    <div class="deal-value">$${(deal.value || 0).toLocaleString()}</div>
                                    <div class="deal-meta">
                                        ${deal.contact_name ? `<span class="deal-contact">👤 ${deal.contact_name}</span>` : ''}
                                        ${deal.company_name ? `<span>🏢 ${deal.company_name}</span>` : ''}
                                        ${deal.actual_close_date ? `<span>🎉 ${new Date(deal.actual_close_date).toLocaleDateString()}</span>` : ''}
                                    </div>
                                </div>
                            `).join('') || '<div class="empty-column">No won deals yet</div>'}
                        </div>
                    </div>
                </div>
                
                <div style="margin-top: 2rem;">
                    <h3>Recent Activity</h3>
                    <div>
                        ${activities.slice(0, 5).map(activity => `
                            <div style="padding: 0.5rem; border-left: 3px solid #667eea; margin-bottom: 0.5rem; background: #f8f9fa;">
                                <strong>${activity.type}:</strong> ${activity.subject}
                                ${activity.contact_name ? ` - ${activity.contact_name}` : ''}
                                <div style="font-size: 0.8rem; color: #666; margin-top: 0.25rem;">
                                    ${new Date(activity.created_at).toLocaleString()}
                                </div>
                            </div>
                        `).join('') || '<p>No recent activities</p>'}
                    </div>
                </div>
            </div>

            <!-- Contacts Tab -->
            <div id="contacts" class="tab-pane ${currentTab === 'contacts' ? 'active' : ''}">
                <h2>Contacts Management</h2>
                
                <div class="add-form">
                    <h3>Add New Contact</h3>
                    <form method="POST" action="/add-contact">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Name *</label>
                                <input type="text" name="name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" name="email" class="form-control">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" name="phone" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Company</label>
                                <select name="company_id" class="form-control">
                                    <option value="">Select Company</option>
                                    ${companies.map(company => `<option value="${company.id}">${company.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Position</label>
                                <input type="text" name="position" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Status</label>
                                <select name="lead_status" class="form-control">
                                    <option value="New Lead">New Lead</option>
                                    <option value="Qualified">Qualified</option>
                                    <option value="Proposal">Proposal</option>
                                    <option value="Customer">Customer</option>
                                    <option value="Lost">Lost</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea name="notes" class="form-control" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Add Contact</button>
                    </form>
                </div>

                ${contacts.length === 0 ? `
                    <div class="empty-state">
                        <h3>No contacts yet</h3>
                        <p>Start by adding your first contact above.</p>
                    </div>
                ` : `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 2rem 0 1rem 0;">
                        <h3 style="color: #333; margin: 0;">All Contacts</h3>
                        <div class="export-import-buttons">
                            <a href="/export/contacts" class="btn btn-secondary" style="margin-right: 0.5rem; text-decoration: none;">📊 Export</a>
                            <label class="btn btn-secondary" style="cursor: pointer; margin: 0;">
                                📁 Import
                                <input type="file" id="importContacts" accept=".json,.csv" style="display: none;" onchange="importData('contacts', this)">
                            </label>
                        </div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Company</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${contacts.map(contact => `
                                <tr>
                                    <td><strong>${contact.name}</strong></td>
                                    <td>${contact.email || '-'}</td>
                                    <td>${contact.phone || '-'}</td>
                                    <td>${contact.company_name || '-'}</td>
                                    <td><span style="padding: 0.25rem 0.5rem; border-radius: 4px; background: #e3f2fd; color: #1976d2; font-size: 0.8rem;">${contact.lead_status}</span></td>
                                    <td>
                                        <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-right: 0.5rem;" onclick="openEditContactModal(${contact.id}, '${contact.name.replace(/'/g, "\\'")}', '${contact.email || ''}', '${contact.phone || ''}', ${contact.company_id || 'null'}, '${contact.position || ''}', '${contact.lead_status}', '${contact.notes ? contact.notes.replace(/'/g, "\\'") : ''}')">Edit</button>
                                        <form method="POST" action="/delete-contact" style="display: inline;">
                                            <input type="hidden" name="id" value="${contact.id}">
                                            <button type="submit" class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="return confirm('Are you sure?')">Delete</button>
                                        </form>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>

            <!-- Companies Tab -->
            <div id="companies" class="tab-pane ${currentTab === 'companies' ? 'active' : ''}">
                <h2>Companies Management</h2>
                
                <div class="add-form">
                    <h3>Add New Company</h3>
                    <form method="POST" action="/add-company">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Company Name *</label>
                                <input type="text" name="name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" name="email" class="form-control">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="tel" name="phone" class="form-control">
                            </div>
                            <div class="form-group">
                                <label>Website</label>
                                <input type="url" name="website" class="form-control">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea name="notes" class="form-control" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Add Company</button>
                    </form>
                </div>

                ${companies.length === 0 ? `
                    <div class="empty-state">
                        <h3>No companies yet</h3>
                        <p>Add companies to organize your contacts better.</p>
                    </div>
                ` : `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 2rem 0 1rem 0;">
                        <h3 style="color: #333; margin: 0;">All Companies</h3>
                        <div class="export-import-buttons">
                            <a href="/export/companies" class="btn btn-secondary" style="margin-right: 0.5rem; text-decoration: none;">📊 Export</a>
                            <label class="btn btn-secondary" style="cursor: pointer; margin: 0;">
                                📁 Import
                                <input type="file" id="importCompanies" accept=".json,.csv" style="display: none;" onchange="importData('companies', this)">
                            </label>
                        </div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Company Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Website</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${companies.map(company => `
                                <tr>
                                    <td><strong>${company.name}</strong></td>
                                    <td>${company.email || '-'}</td>
                                    <td>${company.phone || '-'}</td>
                                    <td>${company.website ? `<a href="${company.website}" target="_blank">${company.website}</a>` : '-'}</td>
                                    <td>
                                        <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-right: 0.5rem;" onclick="openEditCompanyModal(${company.id}, '${company.name.replace(/'/g, "\\'")}', '${company.email || ''}', '${company.phone || ''}', '${company.website || ''}', '${company.notes ? company.notes.replace(/'/g, "\\'") : ''}')">Edit</button>
                                        <form method="POST" action="/delete-company" style="display: inline;">
                                            <input type="hidden" name="id" value="${company.id}">
                                            <button type="submit" class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="return confirm('Are you sure?')">Delete</button>
                                        </form>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `}
            </div>

            <!-- Deals Tab -->
            <div id="deals" class="tab-pane ${currentTab === 'deals' ? 'active' : ''}">
                <h2>Deals Pipeline</h2>
                
                <div class="add-form">
                    <h3>Add New Deal</h3>
                    <form method="POST" action="/add-deal">
                        <div class="form-row">
                            <div class="form-group">
                                <label>Deal Name *</label>
                                <input type="text" name="name" class="form-control" required>
                            </div>
                            <div class="form-group">
                                <label>Value</label>
                                <input type="number" name="value" class="form-control" min="0" step="0.01">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Contact</label>
                                <select name="contact_id" class="form-control">
                                    <option value="">Select Contact</option>
                                    ${contacts.map(contact => `<option value="${contact.id}">${contact.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Company</label>
                                <select name="company_id" class="form-control">
                                    <option value="">Select Company</option>
                                    ${companies.map(company => `<option value="${company.id}">${company.name}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Stage</label>
                                <select name="stage" class="form-control">
                                    <option value="Pipeline">Pipeline</option>
                                    <option value="Upside">Upside</option>
                                    <option value="Commit">Commit</option>
                                    <option value="Won">Won</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Expected Close Date</label>
                                <input type="date" name="expected_close_date" class="form-control">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Notes</label>
                            <textarea name="notes" class="form-control" rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Add Deal</button>
                    </form>
                </div>

                ${deals.length === 0 ? `
                    <div class="empty-state">
                        <h3>No deals yet</h3>
                        <p>Start tracking your sales opportunities by adding deals.</p>
                    </div>
                ` : `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin: 2rem 0 1rem 0;">
                        <h3 style="color: #333; margin: 0;">All Deals</h3>
                        <div class="export-import-buttons">
                            <a href="/export/deals" class="btn btn-secondary" style="margin-right: 0.5rem; text-decoration: none;">📊 Export</a>
                            <label class="btn btn-secondary" style="cursor: pointer; margin: 0;">
                                📁 Import
                                <input type="file" id="importDeals" accept=".json,.csv" style="display: none;" onchange="importData('deals', this)">
                            </label>
                        </div>
                    </div>
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Deal Name</th>
                                <th>Value</th>
                                <th>Contact</th>
                                <th>Company</th>
                                <th>Stage</th>
                                <th>Expected Close</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${deals.map(deal => {
                                const stageColors = {
                                    'Pipeline': '#6c757d',
                                    'Upside': '#ffc107',
                                    'Commit': '#fd7e14',
                                    'Won': '#28a745'
                                };
                                return `
                                    <tr>
                                        <td><strong>${deal.name}</strong></td>
                                        <td>$${(deal.value || 0).toLocaleString()}</td>
                                        <td>${deal.contact_name || '-'}</td>
                                        <td>${deal.company_name || '-'}</td>
                                        <td><span style="padding: 0.25rem 0.5rem; border-radius: 4px; background: ${stageColors[deal.stage]}20; color: ${stageColors[deal.stage]}; font-size: 0.8rem;">${deal.stage}</span></td>
                                        <td>${deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <button class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; margin-right: 0.5rem;" onclick="openEditDealModal(${deal.id}, '${deal.name.replace(/'/g, "\\'")}', '${deal.description ? deal.description.replace(/'/g, "\\'") : ''}', ${deal.value || 0}, ${deal.contact_id || 'null'}, ${deal.company_id || 'null'}, '${deal.stage}', '${deal.expected_close_date || ''}', '${deal.notes ? deal.notes.replace(/'/g, "\\'") : ''}')">Edit</button>
                                            <form method="POST" action="/delete-deal" style="display: inline;">
                                                <input type="hidden" name="id" value="${deal.id}">
                                                <button type="submit" class="btn btn-danger" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick="return confirm('Are you sure?')">Delete</button>
                                            </form>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                `}
            </div>

        </div>
    </div>

    <!-- Edit Contact Modal -->
    <div id="editContactModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeEditContactModal()">&times;</span>
            <h3>Edit Contact</h3>
            <form method="POST" action="/update-contact" id="editContactForm">
                <input type="hidden" name="id" id="editContactId">
                <div class="form-row">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" id="editContactName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" id="editContactEmail" class="form-control">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" name="phone" id="editContactPhone" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Company</label>
                        <select name="company_id" id="editContactCompany" class="form-control">
                            <option value="">Select Company</option>
                            ${companies.map(company => `<option value="${company.id}">${company.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Position</label>
                        <input type="text" name="position" id="editContactPosition" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select name="lead_status" id="editContactStatus" class="form-control">
                            <option value="New Lead">New Lead</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Customer">Customer</option>
                            <option value="Lost">Lost</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" id="editContactNotes" class="form-control" rows="3"></textarea>
                </div>
                <div style="margin-top: 20px;">
                    <button type="submit" class="btn btn-primary">Update Contact</button>
                    <button type="button" class="btn btn-secondary" onclick="closeEditContactModal()" style="margin-left: 10px;">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Company Modal -->
    <div id="editCompanyModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeEditCompanyModal()">&times;</span>
            <h3>Edit Company</h3>
            <form method="POST" action="/update-company" id="editCompanyForm">
                <input type="hidden" name="id" id="editCompanyId">
                <div class="form-row">
                    <div class="form-group">
                        <label>Company Name *</label>
                        <input type="text" name="name" id="editCompanyName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" name="email" id="editCompanyEmail" class="form-control">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Phone</label>
                        <input type="tel" name="phone" id="editCompanyPhone" class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Website</label>
                        <input type="url" name="website" id="editCompanyWebsite" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" id="editCompanyNotes" class="form-control" rows="3"></textarea>
                </div>
                <div style="margin-top: 20px;">
                    <button type="submit" class="btn btn-primary">Update Company</button>
                    <button type="button" class="btn btn-secondary" onclick="closeEditCompanyModal()" style="margin-left: 10px;">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Deal Modal -->
    <div id="editDealModal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeEditDealModal()">&times;</span>
            <h3>Edit Deal</h3>
            <form method="POST" action="/update-deal" id="editDealForm">
                <input type="hidden" name="id" id="editDealId">
                <div class="form-row">
                    <div class="form-group">
                        <label>Deal Name *</label>
                        <input type="text" name="name" id="editDealName" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Value</label>
                        <input type="number" name="value" id="editDealValue" class="form-control" step="0.01" min="0">
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" id="editDealDescription" class="form-control" rows="3"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Contact</label>
                        <select name="contact_id" id="editDealContact" class="form-control">
                            <option value="">Select Contact</option>
                            ${contacts.map(contact => `<option value="${contact.id}">${contact.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Company</label>
                        <select name="company_id" id="editDealCompany" class="form-control">
                            <option value="">Select Company</option>
                            ${companies.map(company => `<option value="${company.id}">${company.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Stage</label>
                        <select name="stage" id="editDealStage" class="form-control">
                            <option value="Pipeline">Pipeline</option>
                            <option value="Upside">Upside</option>
                            <option value="Commit">Commit</option>
                            <option value="Won">Won</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Expected Close Date</label>
                        <input type="date" name="expected_close_date" id="editDealCloseDate" class="form-control">
                    </div>
                </div>
                <div class="form-group">
                    <label>Notes</label>
                    <textarea name="notes" id="editDealNotes" class="form-control" rows="3"></textarea>
                </div>
                <div style="margin-top: 20px;">
                    <button type="submit" class="btn btn-primary">Update Deal</button>
                    <button type="button" class="btn btn-secondary" onclick="closeEditDealModal()" style="margin-left: 10px;">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <script>
        // Contact modal functions
        function openEditContactModal(id, name, email, phone, companyId, position, status, notes) {
            document.getElementById('editContactId').value = id;
            document.getElementById('editContactName').value = name;
            document.getElementById('editContactEmail').value = email || '';
            document.getElementById('editContactPhone').value = phone || '';
            document.getElementById('editContactCompany').value = companyId || '';
            document.getElementById('editContactPosition').value = position || '';
            document.getElementById('editContactStatus').value = status;
            document.getElementById('editContactNotes').value = notes || '';
            document.getElementById('editContactModal').style.display = 'block';
        }

        function closeEditContactModal() {
            document.getElementById('editContactModal').style.display = 'none';
        }

        // Company modal functions
        function openEditCompanyModal(id, name, email, phone, website, notes) {
            document.getElementById('editCompanyId').value = id;
            document.getElementById('editCompanyName').value = name;
            document.getElementById('editCompanyEmail').value = email || '';
            document.getElementById('editCompanyPhone').value = phone || '';
            document.getElementById('editCompanyWebsite').value = website || '';
            document.getElementById('editCompanyNotes').value = notes || '';
            document.getElementById('editCompanyModal').style.display = 'block';
        }

        function closeEditCompanyModal() {
            document.getElementById('editCompanyModal').style.display = 'none';
        }

        // Deal modal functions
        function openEditDealModal(id, name, description, value, contactId, companyId, stage, closeDate, notes) {
            document.getElementById('editDealId').value = id;
            document.getElementById('editDealName').value = name;
            document.getElementById('editDealDescription').value = description || '';
            document.getElementById('editDealValue').value = value || '';
            document.getElementById('editDealContact').value = contactId || '';
            document.getElementById('editDealCompany').value = companyId || '';
            document.getElementById('editDealStage').value = stage;
            document.getElementById('editDealCloseDate').value = closeDate || '';
            document.getElementById('editDealNotes').value = notes || '';
            document.getElementById('editDealModal').style.display = 'block';
        }

        function closeEditDealModal() {
            document.getElementById('editDealModal').style.display = 'none';
        }

        // Import data function
        function importData(type, fileInput) {
            const file = fileInput.files[0];
            if (!file) return;
            
            const formData = new FormData();
            formData.append('file', file);
            
            fetch('/import/' + type, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert('Successfully imported ' + data.count + ' ' + type + '!');
                    location.reload();
                } else {
                    alert('Import failed: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Import error:', error);
                alert('Import failed. Please try again.');
            });
        }

        // Close modal when clicking outside of it
        window.onclick = function(event) {
            const contactModal = document.getElementById('editContactModal');
            const companyModal = document.getElementById('editCompanyModal');
            const dealModal = document.getElementById('editDealModal');
            
            if (event.target === contactModal) {
                closeEditContactModal();
            } else if (event.target === companyModal) {
                closeEditCompanyModal();
            } else if (event.target === dealModal) {
                closeEditDealModal();
            }
        }
    </script>
</body>
</html>`;
}

// Routes
app.get('/', (req, res) => {
    const tab = req.query.tab || 'dashboard';
    res.send(generateHTML(tab));
});

// Form submission handlers
app.post('/add-contact', (req, res) => {
    try {
        dbOps.contact.create(req.body);
        res.redirect('/?tab=contacts');
    } catch (error) {
        console.error('Error adding contact:', error);
        res.redirect('/?tab=contacts');
    }
});

app.post('/add-company', (req, res) => {
    try {
        dbOps.company.create(req.body);
        res.redirect('/?tab=companies');
    } catch (error) {
        console.error('Error adding company:', error);
        res.redirect('/?tab=companies');
    }
});

app.post('/add-deal', (req, res) => {
    try {
        dbOps.deal.create(req.body);
        res.redirect('/?tab=deals');
    } catch (error) {
        console.error('Error adding deal:', error);
        res.redirect('/?tab=deals');
    }
});

app.post('/update-contact', (req, res) => {
    try {
        const { id, ...updateData } = req.body;
        dbOps.contact.update(id, updateData);
        res.redirect('/?tab=contacts');
    } catch (error) {
        console.error('Error updating contact:', error);
        res.redirect('/?tab=contacts');
    }
});

app.post('/update-company', (req, res) => {
    try {
        const { id, ...updateData } = req.body;
        dbOps.company.update(id, updateData);
        res.redirect('/?tab=companies');
    } catch (error) {
        console.error('Error updating company:', error);
        res.redirect('/?tab=companies');
    }
});

app.post('/update-deal', (req, res) => {
    try {
        const { id, ...updateData } = req.body;
        dbOps.deal.update(id, updateData);
        res.redirect('/?tab=deals');
    } catch (error) {
        console.error('Error updating deal:', error);
        res.redirect('/?tab=deals');
    }
});

app.post('/add-activity', (req, res) => {
    try {
        dbOps.activity.create(req.body);
        res.redirect('/?tab=activities');
    } catch (error) {
        console.error('Error adding activity:', error);
        res.redirect('/?tab=activities');
    }
});

// Delete handlers
app.post('/delete-contact', (req, res) => {
    try {
        dbOps.contact.delete(req.body.id);
        res.redirect('/?tab=contacts');
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.redirect('/?tab=contacts');
    }
});

app.post('/delete-company', (req, res) => {
    try {
        dbOps.company.delete(req.body.id);
        res.redirect('/?tab=companies');
    } catch (error) {
        console.error('Error deleting company:', error);
        res.redirect('/?tab=companies');
    }
});

app.post('/delete-deal', (req, res) => {
    try {
        dbOps.deal.delete(req.body.id);
        res.redirect('/?tab=deals');
    } catch (error) {
        console.error('Error deleting deal:', error);
        res.redirect('/?tab=deals');
    }
});

app.post('/delete-activity', (req, res) => {
    try {
        dbOps.activity.delete(req.body.id);
        res.redirect('/?tab=activities');
    } catch (error) {
        console.error('Error deleting activity:', error);
        res.redirect('/?tab=activities');
    }
});

// Export routes
app.get('/export/:type', (req, res) => {
    const type = req.params.type;
    let data, filename;
    
    try {
        switch(type) {
            case 'contacts':
                data = dbOps.contact.getAll();
                filename = 'contacts_export.json';
                break;
            case 'companies':
                data = dbOps.company.getAll();
                filename = 'companies_export.json';
                break;
            case 'deals':
                data = dbOps.deal.getAll();
                filename = 'deals_export.json';
                break;
            default:
                return res.status(400).json({ error: 'Invalid export type' });
        }
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.json(data);
        
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Export failed' });
    }
});

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Import routes
app.post('/import/:type', upload.single('file'), (req, res) => {
    const type = req.params.type;
    const file = req.file;
    
    if (!file) {
        return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    try {
        const fs = require('fs');
        const fileContent = fs.readFileSync(file.path, 'utf8');
        let importData;
        
        // Parse JSON file
        try {
            importData = JSON.parse(fileContent);
        } catch (parseError) {
            fs.unlinkSync(file.path); // Clean up uploaded file
            return res.status(400).json({ success: false, error: 'Invalid JSON file' });
        }
        
        if (!Array.isArray(importData)) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ success: false, error: 'File must contain an array of records' });
        }
        
        let count = 0;
        const errors = [];
        
        // Import each record
        importData.forEach((record, index) => {
            try {
                switch(type) {
                    case 'contacts':
                        dbOps.contact.create(record);
                        break;
                    case 'companies':
                        dbOps.company.create(record);
                        break;
                    case 'deals':
                        dbOps.deal.create(record);
                        break;
                    default:
                        throw new Error('Invalid import type');
                }
                count++;
            } catch (error) {
                errors.push(`Row ${index + 1}: ${error.message}`);
            }
        });
        
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        
        if (errors.length > 0 && count === 0) {
            return res.json({ success: false, error: `Import failed: ${errors.join(', ')}` });
        }
        
        res.json({ 
            success: true, 
            count, 
            errors: errors.length > 0 ? errors : undefined 
        });
        
    } catch (error) {
        console.error('Import error:', error);
        // Clean up uploaded file
        if (file && file.path) {
            const fs = require('fs');
            try { fs.unlinkSync(file.path); } catch {}
        }
        res.status(500).json({ success: false, error: 'Import failed' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Probyr Lite CRM with SQLite running at http://0.0.0.0:${PORT}`);
    console.log(`🗄️ Using SQLite database - no APIs, server-side rendering only`);
    console.log(`📝 Data persisted in crm.db file`);
});