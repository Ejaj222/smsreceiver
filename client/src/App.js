import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

// Initialize socket connection with error handling
const getSocket = () => {
  const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
  console.log('Connecting to server:', serverUrl);
  return io(serverUrl, {
    transports: ['polling', 'websocket'], // Try polling first, then upgrade to websocket
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 45000,
    autoConnect: true,
    withCredentials: true,
    forceNew: true,
    path: '/socket.io/',
    upgrade: true,
    rememberUpgrade: true
  });
};

const socket = getSocket();

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Socket connection event handlers
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnected(true);
      setError(null);
    });

    socket.on('welcome', (data) => {
      console.log('Welcome message:', data);
    });

    socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      setConnected(false);
    });

    // Fetch initial messages
    fetchMessages();

    // Listen for new messages
    socket.on('newMessage', (message) => {
      console.log('Received new message:', message);
      setMessages(prevMessages => [message, ...prevMessages]);
    });

    // Cleanup on unmount
    return () => {
      socket.off('connect');
      socket.off('welcome');
      socket.off('connect_error');
      socket.off('disconnect');
      socket.off('newMessage');
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:5000';
      console.log('Fetching messages from:', serverUrl);
      
      // First check if server is healthy
      const healthCheck = await fetch(`${serverUrl}/health`);
      if (!healthCheck.ok) {
        throw new Error('Server is not responding');
      }

      const response = await fetch(`${serverUrl}/api/messages`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched messages:', data);
      setMessages(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(`Failed to fetch messages: ${err.message}`);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>SMS Receiver</h1>
          <p>Loading messages...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <header className="App-header">
          <h1>SMS Receiver</h1>
          <p className="error">{error}</p>
          <button onClick={fetchMessages} className="retry-button">
            Retry
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>SMS Receiver</h1>
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          {connected ? 'Connected' : 'Disconnected'}
        </div>
      </header>
      <main className="messages-container">
        {messages.length === 0 ? (
          <p className="no-messages">No messages received yet</p>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div key={message.id} className="message-card">
                <div className="message-header">
                  <span className="sender">{message.sender}</span>
                  <span className="timestamp">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="message-content">{message.content}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
