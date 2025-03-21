const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || 'https://your-app-name.onrender.com'
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || 'https://your-app-name.onrender.com'
    : "http://localhost:3000"
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Database setup
const db = new sqlite3.Database(process.env.NODE_ENV === 'production' 
  ? '/tmp/sms.db'  // Use /tmp directory in production
  : 'sms.db', 
(err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    // Create messages table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
});

// API Routes
app.post('/api/sms', (req, res) => {
  const { sender, content } = req.body;
  
  if (!sender || !content) {
    return res.status(400).json({ error: 'Sender and content are required' });
  }

  const query = 'INSERT INTO messages (sender, content) VALUES (?, ?)';
  db.run(query, [sender, content], function(err) {
    if (err) {
      console.error('Error saving message:', err);
      return res.status(500).json({ error: 'Failed to save message' });
    }
    
    // Emit new message to all connected clients
    io.emit('newMessage', { id: this.lastID, sender, content });
    
    res.status(201).json({ message: 'Message saved successfully' });
  });
});

app.get('/api/messages', (req, res) => {
  const query = 'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50';
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }
    res.json(rows);
  });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Serve React app in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 