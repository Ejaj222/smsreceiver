# SMS Receiver Application

A real-time SMS receiver application built with Node.js, Express, Socket.IO, and Supabase.

## Features

- Real-time message updates using Socket.IO
- Persistent storage using Supabase
- Modern React frontend
- CORS enabled for secure cross-origin requests

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account and project

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd sms-receiver
```

2. Install dependencies:
```bash
npm install
cd client && npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=development
PORT=5000
```

4. Set up your Supabase database:
   - Create a new table called `messages` with the following columns:
     - `id` (uuid, primary key)
     - `sender` (text)
     - `content` (text)
     - `timestamp` (timestamp with timezone, default: now())

## Running the Application

### Development Mode

Run both the server and client in development mode:
```bash
npm run dev:full
```

This will start:
- Server on http://localhost:5000
- Client on http://localhost:3000

### Production Mode

1. Build the client:
```bash
npm run build
```

2. Start the server:
```bash
npm start
```

## API Endpoints

- `POST /api/sms`: Create a new message
  ```json
  {
    "sender": "string",
    "content": "string"
  }
  ```

- `GET /api/messages`: Get the last 50 messages

## WebSocket Events

- `newMessage`: Emitted when a new message is received
  ```json
  {
    "id": "uuid",
    "sender": "string",
    "content": "string",
    "timestamp": "ISO date string"
  }
  ```

## License

MIT 