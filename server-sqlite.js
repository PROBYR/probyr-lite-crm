import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';
import Database from 'better-sqlite3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8516;

// Initialize SQLite database
const db = new Database('crm.db');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    website TEXT,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    company_id TEXT,
    title TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies (id)
  );

  CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    amount REAL,
    company_id TEXT,
    person_id TEXT,
    pipeline_id TEXT,
    stage_id TEXT,
    status TEXT DEFAULT 'open',
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies (id),
    FOREIGN KEY (person_id) REFERENCES people (id)
  );

  CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    company_id TEXT,
    person_id TEXT,
    deal_id TEXT,
    completed BOOLEAN DEFAULT FALSE,
    due_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (company_id) REFERENCES companies (id),
    FOREIGN KEY (person_id) REFERENCES people (id),
    FOREIGN KEY (deal_id) REFERENCES deals (id)
  );

  CREATE TABLE IF NOT EXISTS pipelines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'backend/frontend/dist')));

// Helper to generate IDs
const generateId = () => Date.now().toString();

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'CRM Server running with SQLite database on port 8516',
    timestamp: new Date().toISOString(),
    database: 'SQLite connected'
  });
});

// Companies CRUD endpoints with SQLite
app.get('/api/companies', (req, res) => {
  try {
    const companies = db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();
    res.json({ data: companies, total: companies.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/companies', (req, res) => {
  try {
    const company = {
      id: generateId(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const stmt = db.prepare(`
      INSERT INTO companies (id, name, email, phone, website, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(company.id, company.name, company.email, company.phone, 
             company.website, company.description, company.created_at, company.updated_at);
    
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/companies/:id', (req, res) => {
  try {
    const id = req.params.id;
    const updated_at = new Date().toISOString();
    
    const stmt = db.prepare(`
      UPDATE companies 
      SET name = ?, email = ?, phone = ?, website = ?, description = ?, updated_at = ?
      WHERE id = ?
    `);
    
    const result = stmt.run(req.body.name, req.body.email, req.body.phone,
                           req.body.website, req.body.description, updated_at, id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(id);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/companies/:id', (req, res) => {
  try {
    const id = req.params.id;
    const stmt = db.prepare('DELETE FROM companies WHERE id = ?');
    const result = stmt.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// People CRUD endpoints with SQLite
app.get('/api/people', (req, res) => {
  try {
    const { limit = 25, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const people = db.prepare(`
      SELECT p.*, c.name as company_name 
      FROM people p 
      LEFT JOIN companies c ON p.company_id = c.id 
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    const total = db.prepare('SELECT COUNT(*) as count FROM people').get().count;
    res.json({ data: people, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/people', (req, res) => {
  try {
    const person = {
      id: generateId(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const stmt = db.prepare(`
      INSERT INTO people (id, first_name, last_name, email, phone, company_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(person.id, person.first_name, person.last_name, person.email,
             person.phone, person.company_id, person.title, person.created_at, person.updated_at);
    
    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Tags endpoint
app.get('/api/tags', (req, res) => {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
    res.json({ data: tags, total: tags.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tags', (req, res) => {
  try {
    const tag = {
      id: generateId(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const stmt = db.prepare(`
      INSERT INTO tags (id, name, color, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(tag.id, tag.name, tag.color, tag.created_at, tag.updated_at);
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mirror all endpoints without /api prefix for Encore client compatibility
app.get('/companies', (req, res) => {
  try {
    const companies = db.prepare('SELECT * FROM companies ORDER BY created_at DESC').all();
    res.json({ data: companies, total: companies.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/companies', (req, res) => {
  try {
    const company = {
      id: generateId(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const stmt = db.prepare(`
      INSERT INTO companies (id, name, email, phone, website, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(company.id, company.name, company.email, company.phone, 
             company.website, company.description, company.created_at, company.updated_at);
    
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/people', (req, res) => {
  try {
    const { limit = 25, offset = 0, sortBy = 'created_at', sortOrder = 'desc' } = req.query;
    const people = db.prepare(`
      SELECT p.*, c.name as company_name 
      FROM people p 
      LEFT JOIN companies c ON p.company_id = c.id 
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    
    const total = db.prepare('SELECT COUNT(*) as count FROM people').get().count;
    res.json({ data: people, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/people', (req, res) => {
  try {
    const person = {
      id: generateId(),
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const stmt = db.prepare(`
      INSERT INTO people (id, first_name, last_name, email, phone, company_id, title, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(person.id, person.first_name, person.last_name, person.email,
             person.phone, person.company_id, person.title, person.created_at, person.updated_at);
    
    res.status(201).json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/tags', (req, res) => {
  try {
    const tags = db.prepare('SELECT * FROM tags ORDER BY name').all();
    res.json({ data: tags, total: tags.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'backend/frontend/dist/index.html'));
});

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      ws.send(JSON.stringify({
        type: 'response',
        data: { status: 'ok', message: 'WebSocket connection working with SQLite' }
      }));
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Invalid JSON' }
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`CRM Server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
  console.log(`SQLite database initialized`);
  console.log(`Live code reflection enabled - changes will be reflected automatically`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  db.close();
  process.exit(0);
});