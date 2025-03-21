# SMS Receiver

A real-time SMS receiver application that displays incoming SMS messages in a modern web interface.

## Features

- Real-time message updates using Supabase
- PostgreSQL database for message storage
- Modern Material-UI interface
- Serverless API endpoints

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Netlify account
- Supabase account

## Local Development Setup

1. Install dependencies for the server:
```bash
npm install
```

2. Install dependencies for the client:
```bash
cd client
npm install
cd ..
```

3. Create a `.env` file in the root directory:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Create a `.env` file in the client directory:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running Locally

1. Start the development server:
```bash
npm run dev:full
```

The application will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:8888/.netlify/functions/sms

## Deployment to Netlify

1. Create a new account on [Netlify](https://netlify.com)

2. Set up Supabase:
   - Create a new project on [Supabase](https://supabase.com)
   - Create a new table called `messages` with the following columns:
     ```sql
     id: uuid (primary key)
     sender: text (not null)
     content: text (not null)
     timestamp: timestamp with time zone (default: now())
     ```
   - Enable real-time subscriptions for the `messages` table

3. Deploy to Netlify:
   - Connect your GitHub repository to Netlify
   - Set the following environment variables in Netlify:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_supabase_anon_key
     REACT_APP_SUPABASE_URL=your_supabase_url
     REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Deploy the site

4. Configure the build settings:
   - Build command: `cd client && npm install && npm run build`
   - Publish directory: `client/build`
   - Functions directory: `netlify/functions`

## API Endpoints

- `POST /.netlify/functions/sms` - Receive new SMS messages
  ```json
  {
    "sender": "phone_number",
    "content": "message_content"
  }
  ```

- `GET /.netlify/functions/sms` - Retrieve stored messages

## SMS Forwarder Setup

1. Install an SMS forwarding app on your Android device (e.g., "SMS Forwarder - Auto Forward")
2. Configure the app to forward SMS to your Netlify function URL:
   ```
   https://your-site-name.netlify.app/.netlify/functions/sms
   ```
3. Set the forwarding format to JSON with the following structure:
   ```json
   {
     "sender": "${sender}",
     "content": "${content}"
   }
   ```

## Development

- The frontend is built with React and Material-UI
- The backend uses Netlify Functions and Supabase
- Real-time updates are handled using Supabase's real-time subscriptions 