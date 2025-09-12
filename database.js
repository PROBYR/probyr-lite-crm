import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite database
const db = new Database(path.join(__dirname, 'crm.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables with proper relationships
db.exec(`
  -- Companies table
  CREATE TABLE IF NOT EXISTS companies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    country TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Contacts table with foreign key to companies
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
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
  );

  -- Deals table with foreign keys to both contacts and companies
  CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    value DECIMAL(12,2) DEFAULT 0,
    contact_id INTEGER,
    company_id INTEGER,
    stage TEXT DEFAULT 'Pipeline',
    probability INTEGER DEFAULT 0,
    expected_close_date DATE,
    actual_close_date DATE,
    lead_source TEXT,
    pipeline TEXT DEFAULT 'Sales Pipeline',
    owner TEXT DEFAULT 'system',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
  );

  -- Activities table for tracking interactions
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER,
    company_id INTEGER,
    deal_id INTEGER,
    type TEXT NOT NULL, -- 'email', 'call', 'meeting', 'task', 'note'
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
    due_date DATETIME,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by TEXT DEFAULT 'system',
    FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE,
    FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE,
    FOREIGN KEY (deal_id) REFERENCES deals (id) ON DELETE CASCADE
  );

  -- Create indexes for better performance
  CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON contacts (company_id);
  CREATE INDEX IF NOT EXISTS idx_contacts_lead_status ON contacts (lead_status);
  CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals (contact_id);
  CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals (company_id);
  CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals (stage);
  CREATE INDEX IF NOT EXISTS idx_activities_contact_id ON activities (contact_id);
  CREATE INDEX IF NOT EXISTS idx_activities_company_id ON activities (company_id);
  CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON activities (deal_id);

  -- Create trigger to update updated_at timestamp
  CREATE TRIGGER IF NOT EXISTS update_companies_timestamp 
    AFTER UPDATE ON companies
    FOR EACH ROW
  BEGIN
    UPDATE companies SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS update_contacts_timestamp 
    AFTER UPDATE ON contacts
    FOR EACH ROW
  BEGIN
    UPDATE contacts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;

  CREATE TRIGGER IF NOT EXISTS update_deals_timestamp 
    AFTER UPDATE ON deals
    FOR EACH ROW
  BEGIN
    UPDATE deals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
  END;
`);

// Prepared statements for better performance
const statements = {
  // Companies
  insertCompany: db.prepare(`
    INSERT INTO companies (name, email, phone, website, address, city, state, zip_code, country, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getAllCompanies: db.prepare('SELECT * FROM companies ORDER BY name ASC'),
  
  getCompanyById: db.prepare('SELECT * FROM companies WHERE id = ?'),
  
  updateCompany: db.prepare(`
    UPDATE companies 
    SET name = ?, email = ?, phone = ?, website = ?, address = ?, city = ?, state = ?, zip_code = ?, country = ?, notes = ?
    WHERE id = ?
  `),
  
  deleteCompany: db.prepare('DELETE FROM companies WHERE id = ?'),

  // Contacts
  insertContact: db.prepare(`
    INSERT INTO contacts (name, email, phone, mobile, company_id, position, department, address, city, state, zip_code, country, birthday, notes, lead_source, lead_status, priority)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getAllContacts: db.prepare(`
    SELECT c.*, comp.name as company_name 
    FROM contacts c 
    LEFT JOIN companies comp ON c.company_id = comp.id 
    ORDER BY c.name ASC
  `),
  
  getContactById: db.prepare(`
    SELECT c.*, comp.name as company_name 
    FROM contacts c 
    LEFT JOIN companies comp ON c.company_id = comp.id 
    WHERE c.id = ?
  `),
  
  updateContact: db.prepare(`
    UPDATE contacts 
    SET name = ?, email = ?, phone = ?, mobile = ?, company_id = ?, position = ?, department = ?, address = ?, city = ?, state = ?, zip_code = ?, country = ?, birthday = ?, notes = ?, lead_source = ?, lead_status = ?, priority = ?
    WHERE id = ?
  `),
  
  deleteContact: db.prepare('DELETE FROM contacts WHERE id = ?'),

  // Deals
  insertDeal: db.prepare(`
    INSERT INTO deals (name, description, value, contact_id, company_id, stage, probability, expected_close_date, lead_source, pipeline, owner, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getAllDeals: db.prepare(`
    SELECT d.*, c.name as contact_name, comp.name as company_name 
    FROM deals d 
    LEFT JOIN contacts c ON d.contact_id = c.id 
    LEFT JOIN companies comp ON d.company_id = comp.id 
    ORDER BY d.created_at DESC
  `),
  
  getDealById: db.prepare(`
    SELECT d.*, c.name as contact_name, comp.name as company_name 
    FROM deals d 
    LEFT JOIN contacts c ON d.contact_id = c.id 
    LEFT JOIN companies comp ON d.company_id = comp.id 
    WHERE d.id = ?
  `),
  
  updateDeal: db.prepare(`
    UPDATE deals 
    SET name = ?, description = ?, value = ?, contact_id = ?, company_id = ?, stage = ?, probability = ?, expected_close_date = ?, actual_close_date = ?, lead_source = ?, pipeline = ?, owner = ?, notes = ?
    WHERE id = ?
  `),
  
  deleteDeal: db.prepare('DELETE FROM deals WHERE id = ?'),

  // Activities
  insertActivity: db.prepare(`
    INSERT INTO activities (contact_id, company_id, deal_id, type, subject, description, status, priority, due_date, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  
  getAllActivities: db.prepare(`
    SELECT a.*, c.name as contact_name, comp.name as company_name, d.name as deal_name 
    FROM activities a 
    LEFT JOIN contacts c ON a.contact_id = c.id 
    LEFT JOIN companies comp ON a.company_id = comp.id 
    LEFT JOIN deals d ON a.deal_id = d.id 
    ORDER BY a.created_at DESC
  `),
  
  getActivityById: db.prepare(`
    SELECT a.*, c.name as contact_name, comp.name as company_name, d.name as deal_name 
    FROM activities a 
    LEFT JOIN contacts c ON a.contact_id = c.id 
    LEFT JOIN companies comp ON a.company_id = comp.id 
    LEFT JOIN deals d ON a.deal_id = d.id 
    WHERE a.id = ?
  `),
  
  updateActivity: db.prepare(`
    UPDATE activities 
    SET contact_id = ?, company_id = ?, deal_id = ?, type = ?, subject = ?, description = ?, status = ?, priority = ?, due_date = ?, completed_at = ?
    WHERE id = ?
  `),
  
  deleteActivity: db.prepare('DELETE FROM activities WHERE id = ?'),

  // Analytics queries
  getStats: db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM contacts) as total_contacts,
      (SELECT COUNT(*) FROM companies) as total_companies,
      (SELECT COUNT(*) FROM deals) as total_deals,
      (SELECT COALESCE(SUM(value), 0) FROM deals WHERE stage = 'Closed Won') as total_revenue,
      (SELECT COUNT(*) FROM deals WHERE stage NOT IN ('Closed Won', 'Closed Lost')) as active_deals
  `)
};

// Database operations object
export const dbOps = {
  // Company operations
  company: {
    create: (data) => {
      const result = statements.insertCompany.run(
        data.name, data.email || null, data.phone || null, data.website || null,
        data.address || null, data.city || null, data.state || null, data.zip_code || null,
        data.country || null, data.notes || null
      );
      return { id: result.lastInsertRowid, ...data };
    },
    
    getAll: () => statements.getAllCompanies.all(),
    
    getById: (id) => statements.getCompanyById.get(id),
    
    update: (id, data) => {
      statements.updateCompany.run(
        data.name, data.email || null, data.phone || null, data.website || null,
        data.address || null, data.city || null, data.state || null, data.zip_code || null,
        data.country || null, data.notes || null, id
      );
      return statements.getCompanyById.get(id);
    },
    
    delete: (id) => statements.deleteCompany.run(id).changes > 0
  },

  // Contact operations
  contact: {
    create: (data) => {
      const result = statements.insertContact.run(
        data.name, data.email || null, data.phone || null, data.mobile || null,
        data.company_id || null, data.position || null, data.department || null,
        data.address || null, data.city || null, data.state || null, data.zip_code || null,
        data.country || null, data.birthday || null, data.notes || null,
        data.lead_source || null, data.lead_status || 'New Lead', data.priority || 'Medium'
      );
      return statements.getContactById.get(result.lastInsertRowid);
    },
    
    getAll: () => statements.getAllContacts.all(),
    
    getById: (id) => statements.getContactById.get(id),
    
    update: (id, data) => {
      statements.updateContact.run(
        data.name, data.email || null, data.phone || null, data.mobile || null,
        data.company_id || null, data.position || null, data.department || null,
        data.address || null, data.city || null, data.state || null, data.zip_code || null,
        data.country || null, data.birthday || null, data.notes || null,
        data.lead_source || null, data.lead_status || 'New Lead', data.priority || 'Medium', id
      );
      return statements.getContactById.get(id);
    },
    
    delete: (id) => statements.deleteContact.run(id).changes > 0
  },

  // Deal operations
  deal: {
    create: (data) => {
      const result = statements.insertDeal.run(
        data.name, data.description || null, data.value || 0, data.contact_id || null,
        data.company_id || null, data.stage || 'Pipeline', data.probability || 0,
        data.expected_close_date || null, data.lead_source || null,
        data.pipeline || 'Sales Pipeline', data.owner || 'system', data.notes || null
      );
      return statements.getDealById.get(result.lastInsertRowid);
    },
    
    getAll: () => statements.getAllDeals.all(),
    
    getById: (id) => statements.getDealById.get(id),
    
    update: (id, data) => {
      statements.updateDeal.run(
        data.name, data.description || null, data.value || 0, data.contact_id || null,
        data.company_id || null, data.stage || 'Pipeline', data.probability || 0,
        data.expected_close_date || null, data.actual_close_date || null,
        data.lead_source || null, data.pipeline || 'Sales Pipeline',
        data.owner || 'system', data.notes || null, id
      );
      return statements.getDealById.get(id);
    },
    
    delete: (id) => statements.deleteDeal.run(id).changes > 0
  },

  // Activity operations
  activity: {
    create: (data) => {
      const result = statements.insertActivity.run(
        data.contact_id || null, data.company_id || null, data.deal_id || null,
        data.type, data.subject, data.description || null, data.status || 'pending',
        data.priority || 'medium', data.due_date || null, data.created_by || 'system'
      );
      return statements.getActivityById.get(result.lastInsertRowid);
    },
    
    getAll: () => statements.getAllActivities.all(),
    
    getById: (id) => statements.getActivityById.get(id),
    
    update: (id, data) => {
      statements.updateActivity.run(
        data.contact_id || null, data.company_id || null, data.deal_id || null,
        data.type, data.subject, data.description || null, data.status || 'pending',
        data.priority || 'medium', data.due_date || null, data.completed_at || null, id
      );
      return statements.getActivityById.get(id);
    },
    
    delete: (id) => statements.deleteActivity.run(id).changes > 0
  },

  // Analytics
  getStats: () => statements.getStats.get()
};

export default db;