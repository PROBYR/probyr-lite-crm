import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8516;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'backend/frontend/dist')));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running with live code reflection on port 8516',
    timestamp: new Date().toISOString()
  });
});

// In-memory storage for demo purposes
let companies = [];
let people = [];
let deals = [];
let activities = [];
let pipelines = [];

// Helper to generate IDs
const generateId = () => Date.now().toString();

// Companies CRUD endpoints
app.get('/api/companies', (req, res) => {
  res.json({ data: companies, total: companies.length });
});

app.post('/api/companies', (req, res) => {
  const company = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  companies.push(company);
  res.status(201).json(company);
});

app.put('/api/companies/:id', (req, res) => {
  const id = req.params.id;
  const index = companies.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Company not found' });
  }
  companies[index] = {
    ...companies[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(companies[index]);
});

app.delete('/api/companies/:id', (req, res) => {
  const id = req.params.id;
  const index = companies.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Company not found' });
  }
  companies.splice(index, 1);
  res.status(204).send();
});

// People CRUD endpoints
app.get('/api/people', (req, res) => {
  res.json({ data: people, total: people.length });
});

app.post('/api/people', (req, res) => {
  const person = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  people.push(person);
  res.status(201).json(person);
});

app.put('/api/people/:id', (req, res) => {
  const id = req.params.id;
  const index = people.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Person not found' });
  }
  people[index] = {
    ...people[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(people[index]);
});

app.delete('/api/people/:id', (req, res) => {
  const id = req.params.id;
  const index = people.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Person not found' });
  }
  people.splice(index, 1);
  res.status(204).send();
});

// Deals CRUD endpoints
app.get('/api/deals', (req, res) => {
  res.json({ data: deals, total: deals.length });
});

app.post('/api/deals', (req, res) => {
  const deal = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  deals.push(deal);
  res.status(201).json(deal);
});

app.put('/api/deals/:id', (req, res) => {
  const id = req.params.id;
  const index = deals.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Deal not found' });
  }
  deals[index] = {
    ...deals[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(deals[index]);
});

app.delete('/api/deals/:id', (req, res) => {
  const id = req.params.id;
  const index = deals.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Deal not found' });
  }
  deals.splice(index, 1);
  res.status(204).send();
});

// Activities CRUD endpoints
app.get('/api/activities', (req, res) => {
  res.json({ data: activities, total: activities.length });
});

app.post('/api/activities', (req, res) => {
  const activity = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  activities.push(activity);
  res.status(201).json(activity);
});

app.put('/api/activities/:id', (req, res) => {
  const id = req.params.id;
  const index = activities.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  activities[index] = {
    ...activities[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(activities[index]);
});

app.delete('/api/activities/:id', (req, res) => {
  const id = req.params.id;
  const index = activities.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  activities.splice(index, 1);
  res.status(204).send();
});

// Pipelines CRUD endpoints
app.get('/api/pipelines', (req, res) => {
  res.json({ data: pipelines, total: pipelines.length });
});

app.post('/api/pipelines', (req, res) => {
  const pipeline = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  pipelines.push(pipeline);
  res.status(201).json(pipeline);
});

app.put('/api/pipelines/:id', (req, res) => {
  const id = req.params.id;
  const index = pipelines.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pipeline not found' });
  }
  pipelines[index] = {
    ...pipelines[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(pipelines[index]);
});

app.delete('/api/pipelines/:id', (req, res) => {
  const id = req.params.id;
  const index = pipelines.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pipeline not found' });
  }
  pipelines.splice(index, 1);
  res.status(204).send();
});

// Add direct routes without /api prefix for Encore client compatibility
// Companies routes
app.get('/companies', (req, res) => {
  res.json({ data: companies, total: companies.length });
});

app.post('/companies', (req, res) => {
  const company = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  companies.push(company);
  res.status(201).json(company);
});

app.put('/companies/:id', (req, res) => {
  const id = req.params.id;
  const index = companies.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Company not found' });
  }
  companies[index] = {
    ...companies[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(companies[index]);
});

app.delete('/companies/:id', (req, res) => {
  const id = req.params.id;
  const index = companies.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Company not found' });
  }
  companies.splice(index, 1);
  res.status(204).send();
});

// People routes
app.get('/people', (req, res) => {
  res.json({ data: people, total: people.length });
});

app.post('/people', (req, res) => {
  const person = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  people.push(person);
  res.status(201).json(person);
});

app.put('/people/:id', (req, res) => {
  const id = req.params.id;
  const index = people.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Person not found' });
  }
  people[index] = {
    ...people[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(people[index]);
});

app.delete('/people/:id', (req, res) => {
  const id = req.params.id;
  const index = people.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Person not found' });
  }
  people.splice(index, 1);
  res.status(204).send();
});

// Deals routes
app.get('/deals', (req, res) => {
  res.json({ data: deals, total: deals.length });
});

app.post('/deals', (req, res) => {
  const deal = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  deals.push(deal);
  res.status(201).json(deal);
});

app.put('/deals/:id', (req, res) => {
  const id = req.params.id;
  const index = deals.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Deal not found' });
  }
  deals[index] = {
    ...deals[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(deals[index]);
});

app.delete('/deals/:id', (req, res) => {
  const id = req.params.id;
  const index = deals.findIndex(d => d.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Deal not found' });
  }
  deals.splice(index, 1);
  res.status(204).send();
});

// Activities routes
app.get('/activities', (req, res) => {
  res.json({ data: activities, total: activities.length });
});

app.post('/activities', (req, res) => {
  const activity = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  activities.push(activity);
  res.status(201).json(activity);
});

app.put('/activities/:id', (req, res) => {
  const id = req.params.id;
  const index = activities.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  activities[index] = {
    ...activities[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(activities[index]);
});

app.delete('/activities/:id', (req, res) => {
  const id = req.params.id;
  const index = activities.findIndex(a => a.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  activities.splice(index, 1);
  res.status(204).send();
});

// Pipelines routes
app.get('/pipelines', (req, res) => {
  res.json({ data: pipelines, total: pipelines.length });
});

app.post('/pipelines', (req, res) => {
  const pipeline = {
    id: generateId(),
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  pipelines.push(pipeline);
  res.status(201).json(pipeline);
});

app.put('/pipelines/:id', (req, res) => {
  const id = req.params.id;
  const index = pipelines.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pipeline not found' });
  }
  pipelines[index] = {
    ...pipelines[index],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  res.json(pipelines[index]);
});

app.delete('/pipelines/:id', (req, res) => {
  const id = req.params.id;
  const index = pipelines.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Pipeline not found' });
  }
  pipelines.splice(index, 1);
  res.status(204).send();
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
      
      // Echo back a response
      ws.send(JSON.stringify({
        type: 'response',
        data: { status: 'ok', message: 'WebSocket connection working' }
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
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
  console.log(`Live code reflection enabled - changes will be reflected automatically`);
});