const express = require('express');
const { neon } = require('@neondatabase/serverless');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL);

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
        // Insert into Neon Postgres
        await sql`
            INSERT INTO rsvps (name, guests, status, message, timestamp)
            VALUES (${name}, ${guests}, ${status}, ${message}, ${timestamp})
        `;
        
        res.status(201).json({ success: true, message: 'RSVP sealed in the Neon vault!' });
    } catch (err) {
        console.error('Database Storage Error:', err);
        res.status(500).json({ error: 'Executive storage failure. Please try again.' });
    }
});

// 2. Get All RSVPs (for Admin)
app.get('/api/rsvps', async (req, res) => {
    try {
        // Fetch all RSVPs ordered by ID descending
        const rows = await sql`SELECT * FROM rsvps ORDER BY id DESC`;
        res.json(rows);
    } catch (err) {
        console.error('Database Fetch Error:', err);
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
        console.log(`Note: Connect Neon Postgres for cloud persistence.`);
    });
}

module.exports = app;
