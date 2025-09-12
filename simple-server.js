import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8229;

// Serve static files
app.use(express.static(__dirname));

// Route to serve the CRM application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'crm-app.html'));
});

// Catch all other routes and redirect to main app
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'crm-app.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Probyr Lite CRM running at http://0.0.0.0:${PORT}`);
    console.log(`📱 Single-page application - no backend APIs needed!`);
    console.log(`💾 Data stored locally in browser using localStorage`);
});