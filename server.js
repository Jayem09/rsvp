const express = require('express');
const { kv } = require('@vercel/kv');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); 

// --- API ENDPOINTS ---

// 1. Submit RSVP
app.post('/api/rsvp', async (req, res) => {
    const { name, guests, status, message, timestamp } = req.body;
    
    if (!name || !guests || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const entry = {
            id: Date.now(),
            name,
            guests,
            status,
            message,
            timestamp
        };

        // Push to a Redis list named 'rsvps'
        await kv.lpush('rsvps', JSON.stringify(entry));
        
        res.status(201).json({ success: true, message: 'RSVP sealed in the vault!' });
    } catch (err) {
        console.error('KV Storage Error:', err);
        res.status(500).json({ error: 'Executive storage failure. Please try again.' });
    }
});

// 2. Get All RSVPs (for Admin)
app.get('/api/rsvps', async (req, res) => {
    try {
        // Fetch all items from the 'rsvps' list
        const rows = await kv.lrange('rsvps', 0, -1);
        
        // Rows come back as strings or JSON objects depending on the client; 
        // @vercel/kv usually handles JSON parsing if stored as objects, 
        // but we'll map just in case.
        const rsvps = rows.map(row => typeof row === 'string' ? JSON.parse(row) : row);
        
        res.json(rsvps);
    } catch (err) {
        console.error('KV Fetch Error:', err);
        res.status(500).json({ error: 'Failed to retrieve guest list.' });
    }
});

// Serve frontend on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Boss RSVP Server (Local) running at http://localhost:${PORT}`);
        console.log(`Note: Connect Vercel KV for cloud persistence.`);
    });
}

module.exports = app;
