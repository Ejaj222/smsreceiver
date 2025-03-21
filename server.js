const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: true, // Allow all origins
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"]
};

// Initialize Socket.IO with CORS
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
  allowEIO3: true,
  path: '/socket.io/',
  connectTimeout: 45000,
  maxHttpBufferSize: 1e8,
  allowUpgrades: true
});

// Initialize SQLite database
let db;
try {
  db = new sqlite3.Database('sms.db', (err) => {
    if (err) {
      console.error('Error opening database:', err);
      process.exit(1); // Exit if database connection fails
    }
    console.log('Connected to SQLite database');
    
    // Create messages table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating messages table:', err);
        process.exit(1); // Exit if table creation fails
      }
      console.log('Messages table created or already exists');
    });
  });
} catch (error) {
  console.error('Error initializing database:', error);
  process.exit(1);
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API Routes
app.post('/api/sms', (req, res) => {
  console.log('Received SMS:', req.body);
  const { sender, content } = req.body;
  
  if (!sender || !content) {
    console.error('Missing required fields:', { sender, content });
    return res.status(400).json({ error: 'Sender and content are required' });
  }

  const query = 'INSERT INTO messages (sender, content) VALUES (?, ?)';
  db.run(query, [sender, content], function(err) {
    if (err) {
      console.error('Error saving message:', err);
      return res.status(500).json({ error: 'Failed to save message' });
    }

    const message = {
      id: this.lastID,
      sender,
      content,
      timestamp: new Date().toISOString()
    };

    console.log('Message saved successfully:', message);
    // Emit new message to all connected clients
    io.emit('newMessage', message);
    
    res.status(201).json({ message: 'Message saved successfully', data: message });
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
  console.log('Client connected:', socket.id);
  
  // Send a welcome message to the connected client
  socket.emit('welcome', { message: 'Connected to server successfully' });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Serve React app in production
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('CORS enabled for all origins');
});

// Handle process termination
process.on('SIGINT', () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}); 