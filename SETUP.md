# MARS Setup Guide

## Prerequisites

- Node.js 18+ and npm
- A LiveKit account (Cloud or self-hosted)
- Google Gemini API key
- Optional: OpenWeatherMap API key, Tavily Search API key, SMTP credentials

## Installation

### 1. Install Dependencies

```bash
# Install client dependencies
npm install

# Server dependencies will be installed automatically via postinstall
# Or manually:
npm run server:install
```

### 2. Configure Environment Variables

#### Client Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and configure:

```env
# Required: Your LiveKit WebSocket URL
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud

# Optional: Development defaults (users can override in app settings)
VITE_GEMINI_KEY=your-gemini-api-key
VITE_WEATHER_KEY=your-openweathermap-key
VITE_SEARCH_KEY=your-tavily-key

# Server URL (default for local development)
VITE_SERVER_URL=http://localhost:3000
```

#### Server Configuration

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` and configure:

```env
# Required: LiveKit API credentials
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
VITE_LIVEKIT_URL=wss://your-project.livekit.cloud

# Server configuration
PORT=3000
CLIENT_URL=http://localhost:8080
```

## Getting API Keys

### LiveKit

1. Sign up at [LiveKit Cloud](https://cloud.livekit.io/)
2. Create a new project
3. Copy your WebSocket URL (wss://your-project.livekit.cloud)
4. Generate API Key and Secret from the project settings

### Google Gemini

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Click "Get API Key"
3. Create a new API key
4. Copy the key for use in the app

### OpenWeatherMap (Optional)

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Subscribe to the free tier
3. Copy your API key from the dashboard

### Tavily Search (Optional)

1. Sign up at [Tavily](https://tavily.com/)
2. Get your API key from the dashboard

## Running the Application

### Development Mode

Run both client and server concurrently:

```bash
npm run dev:all
```

Or run them separately:

```bash
# Terminal 1: Client
npm run dev

# Terminal 2: Server
npm run dev:server
```

The client will be available at `http://localhost:8080`
The server will be available at `http://localhost:3000`

### Production Build

```bash
# Build the client
npm run build

# Start the server
cd server
npm start
```

## First-Time Setup

1. Open the application in your browser
2. Complete the onboarding wizard:
   - Enter your name
   - Enter your Gemini API key
   - (Optional) Configure SMTP for email functionality
   - (Optional) Set up location preferences
3. Start using MARS!

## Troubleshooting

### LiveKit Connection Issues

- Verify your LiveKit URL is correct (must start with `wss://`)
- Check that your API key and secret are valid
- Ensure the server is running and accessible

### Microphone Not Working

- Grant microphone permissions in your browser
- Check browser console for permission errors
- Try using HTTPS (required for some browsers)

### Gemini API Errors

- Verify your API key is valid
- Check you haven't exceeded rate limits
- Ensure you have the Gemini API enabled in your Google Cloud project

### Email Not Sending

- Verify all SMTP settings are correct
- Check that your SMTP server allows connections from your IP
- For Gmail, you may need to use an App Password instead of your regular password

## Architecture

- **Client**: Vite + React + TypeScript + shadcn/ui
- **Server**: Express.js (Node.js)
- **Real-time Audio**: LiveKit WebRTC
- **AI**: Google Gemini Live API
- **Storage**: Browser localStorage

## Support

For issues and questions, please check the main README.md or create an issue in the repository.
