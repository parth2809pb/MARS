# M.A.R.S. - Multi Agent Reasoning System

A voice-powered AI assistant built with Gemini 2.0, featuring real-time voice conversations, function calling, and integrations with Spotify, weather, web search, and email.

## Features

- 🎤 **Voice Conversations** - Real-time audio chat with Gemini 2.0
- 🎵 **Spotify Control** - Play, pause, skip tracks with voice commands
- 🌤️ **Weather Updates** - Get current weather information
- 🔍 **Web Search** - Search the web through voice
- 📧 **Email Sending** - Send emails via voice commands
- 🎨 **Animated UI** - Ferro fluid visualization that reacts to audio

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **AI**: Google Gemini 2.0 Flash (Multimodal Live API)
- **Audio**: LiveKit for WebRTC
- **Integrations**: Spotify Web API, OpenWeather API, Brave Search API

## Prerequisites

- Node.js 18+
- Gemini API key ([Get it here](https://aistudio.google.com/app/apikey))
- LiveKit account ([Sign up](https://livekit.io))
- Spotify Developer account (optional)
- OpenWeather API key (optional)
- Brave Search API key (optional)

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/parth2809pb/MARS.git
cd MARS
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create `.env` in the root directory:

```env
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_LIVEKIT_URL=your_livekit_url
VITE_SERVER_URL=http://localhost:3000
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
```

Create `server/.env`:

```env
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
PORT=3000
```

### 4. Start the backend server

```bash
cd server
node index.js
```

### 5. Start the frontend (in a new terminal)

```bash
npm run dev
```

### 6. Open the app

Visit `http://localhost:5173` and complete the onboarding to add your API keys.

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **"Add New Project"**
3. Import your repository
4. Add environment variables:
   - `VITE_GEMINI_API_KEY`
   - `VITE_LIVEKIT_URL`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `VITE_SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`
   - `VITE_SERVER_URL` (use your Vercel URL: `https://your-app.vercel.app`)
5. Click **"Deploy"**

### 3. Update Spotify Redirect URI

If using Spotify integration:
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Edit your app
3. Add redirect URI: `https://your-app.vercel.app/settings`

## Configuration

After deployment, visit the Settings page to configure:

- **Gemini API Key** - Required for AI conversations
- **LiveKit Credentials** - Required for voice chat
- **Weather API Key** - Optional, for weather features
- **Spotify** - Optional, connect for music control
- **SMTP Settings** - Optional, for email sending

## Usage

1. Click **"Start Conversation"**
2. Allow microphone access
3. Speak naturally to M.A.R.S.

### Example Commands

- "What's the weather like?"
- "Play some music on Spotify"
- "Search for the latest news"
- "What's playing right now?"
- "Pause the music"

## Project Structure

```
MARS/
├── src/
│   ├── components/     # UI components
│   ├── pages/          # App pages
│   ├── services/       # API services (Gemini, LiveKit)
│   ├── tools/          # Function calling tools
│   └── state/          # State management
├── server/             # Backend Express server
└── public/             # Static assets
```

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
