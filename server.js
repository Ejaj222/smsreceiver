const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL || 'https://your-app-name.netlify.app'
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL || 'https://your-app-name.netlify.app'
    : "http://localhost:3000"
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// API Routes
app.post('/api/sms', async (req, res) => {
  const { sender, content } = req.body;
  
  if (!sender || !content) {
    return res.status(400).json({ error: 'Sender and content are required' });
  }

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender, content }])
      .select()
      .single();

    if (error) throw error;
    
    // Emit new message to all connected clients
    io.emit('newMessage', data);
    
    res.status(201).json({ message: 'Message saved successfully', data });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
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