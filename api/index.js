const express = require('express');
const { neon } = require('@neondatabase/serverless');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Initialize Neon SQL client only if URL is available
const getSql = () => {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is missing! Please connect Neon in Vercel Storage.');
    }
    return neon(process.env.DATABASE_URL);
};

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Specifically serve static files from the parent directory (the root)
app.use(express.static(path.join(__dirname, '../'))); 

// --- API ENDPOINTS ---

// 1. Submit RSVP
app.post('/api/rsvp', async (req, res) => {
    const { name, guests, status, message, timestamp } = req.body;
    
    if (!name || !guests || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const sql = getSql();
        await sql`
            INSERT INTO rsvps (name, guests, status, message, timestamp)
            VALUES (${name}, ${guests}, ${status}, ${message}, ${timestamp})
        `;
        
        res.status(201).json({ success: true, message: 'RSVP sealed!' });
    } catch (err) {
        console.error('Database Storage Error:', err);
        res.status(500).json({ error: err.message || 'Database failure.' });
    }
});

// 2. Get All RSVPs (for Admin)
app.get('/api/rsvps', async (req, res) => {
    try {
        const sql = getSql();
        const rows = await sql`SELECT * FROM rsvps ORDER BY id DESC`;
        res.json(rows);
    } catch (err) {
        console.error('Database Fetch Error:', err);
        res.status(500).json({ error: err.message || 'Fetch failure.' });
    }
});

// Serve frontend on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Export the app for Vercel's serverless function environment
module.exports = app;
