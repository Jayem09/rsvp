const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'boss_rsvp.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files (index.html, style.css, etc.)

// Initialize SQLite Database
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS rsvps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            guests TEXT NOT NULL,
            status TEXT NOT NULL,
            message TEXT,
            timestamp TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.message);
            }
        });
    }
});

// --- API ENDPOINTS ---

// 1. Submit RSVP
app.post('/api/rsvp', (req, res) => {
    const { name, guests, status, message, timestamp } = req.body;
    
    if (!name || !guests || !status) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const sql = `INSERT INTO rsvps (name, guests, status, message, timestamp) VALUES (?, ?, ?, ?, ?)`;
    const params = [name, guests, status, message, timestamp];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, message: 'RSVP sealed!' });
    });
});

// 2. Get All RSVPs (for Admin)
app.get('/api/rsvps', (req, res) => {
    const sql = `SELECT * FROM rsvps ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Serve frontend on root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Boss RSVP Server is running at http://localhost:${PORT}`);
    console.log(`RSVP efficiently with SQLite persistence.`);
});

module.exports = app;
