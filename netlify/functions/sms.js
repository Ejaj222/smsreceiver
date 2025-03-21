const axios = require('axios');

// Get the server URL from environment variables
const SERVER_URL = process.env.SERVER_URL || 'https://sms-receiver-server.onrender.com';

exports.handler = async function(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      }
    };
  }

  // Handle POST request for new SMS
  if (event.httpMethod === 'POST') {
    try {
      const { sender, content } = JSON.parse(event.body);
      
      if (!sender || !content) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ error: 'Sender and content are required' })
        };
      }

      // Forward request to Express server
      const response = await axios.post(`${SERVER_URL}/api/sms`, {
        sender,
        content
      });

      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(response.data)
      };
    } catch (error) {
      console.error('Error forwarding request:', error);
      return {
        statusCode: error.response?.status || 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to save message',
          details: error.message
        })
      };
    }
  }

  // Handle GET request for messages
  if (event.httpMethod === 'GET') {
    try {
      // Forward request to Express server
      const response = await axios.get(`${SERVER_URL}/api/messages`);

      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(response.data)
      };
    } catch (error) {
      console.error('Error forwarding request:', error);
      return {
        statusCode: error.response?.status || 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Failed to fetch messages',
          details: error.message
        })
      };
    }
  }

  return {
    statusCode: 405,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ error: 'Method not allowed' })
  };
}; 