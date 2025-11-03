# Environment Variables Setup

## Two .env Files Required

This project uses **two separate `.env` files**:

### 1. Root `.env` (Frontend)
**Location**: `/.env` (project root)

**Purpose**: Frontend environment variables (Vite)

**Required Variables**:
```bash
# LiveKit
VITE_LIVEKIT_URL=wss://your-livekit-server.com

# Server URL
VITE_SERVER_URL=http://localhost:3000

# Spotify Client ID (frontend needs this for OAuth)
VITE_SPOTIFY_CLIENT_ID=your_client_id

# Optional: Default API keys
VITE_GEMINI_KEY=
VITE_WEATHER_KEY=
```

**Note**: Variables must have `VITE_` prefix to be accessible in frontend code.

### 2. Server `.env` (Backend)
**Location**: `/server/.env`

**Purpose**: Backend server environment variables

**Required Variables**:
```bash
# Server Config
PORT=3000
CLIENT_URL=http://127.0.0.1:8080

# LiveKit (for token generation)
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
VITE_LIVEKIT_URL=wss://your-livekit-server.com

# Spotify (for OAuth token exchange)
VITE_SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
```

**Note**: `SPOTIFY_CLIENT_SECRET` should ONLY be in server `.env`, never in frontend!

## Why Two Files?

1. **Security**: Client secret stays on server, never exposed to frontend
2. **Separation**: Frontend and backend have different environment needs
3. **Vite Requirement**: Frontend variables need `VITE_` prefix

## Setup Checklist

- [ ] Create `/.env` in project root
- [ ] Add `VITE_SPOTIFY_CLIENT_ID` to root `.env`
- [ ] Create `/server/.env` in server directory
- [ ] Add `SPOTIFY_CLIENT_SECRET` to server `.env`
- [ ] Add `VITE_SPOTIFY_CLIENT_ID` to server `.env` (yes, both need it)
- [ ] Restart both frontend and backend servers

## Common Issues

### "Spotify credentials not configured" (500 error)
- Check `/server/.env` has both `VITE_SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
- Restart backend server

### "Client ID is undefined" (frontend)
- Check `/.env` has `VITE_SPOTIFY_CLIENT_ID`
- Restart frontend dev server

### CORS errors
- Check `CLIENT_URL` in `/server/.env` matches your frontend URL
- Use `http://127.0.0.1:PORT` format

## Quick Copy-Paste

If you have credentials in root `.env`, copy them to server:

```bash
# From root .env, copy these to server/.env:
VITE_SPOTIFY_CLIENT_ID=your_value_here
SPOTIFY_CLIENT_SECRET=your_value_here
```

Then restart the server!
