import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import './App.css';

const socket = io(process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_SERVER_URL || 'https://your-app-name.netlify.app'
  : 'http://localhost:5000'
);

function App() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch initial messages
    fetchMessages();

    // Listen for new messages
    socket.on('newMessage', (message) => {
      setMessages(prevMessages => [message, ...prevMessages]);
    });

    // Cleanup on unmount
    return () => {
      socket.off('newMessage');
    };
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        process.env.NODE_ENV === 'production'
          ? `${process.env.REACT_APP_SERVER_URL || 'https://your-app-name.netlify.app'}/api/messages`
          : 'http://localhost:5000/api/messages'
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data);
      setLoading(false);
    } catch (err) {
      setError(err.message);
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
          <p className="error">Error: {error}</p>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>SMS Receiver</h1>
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
