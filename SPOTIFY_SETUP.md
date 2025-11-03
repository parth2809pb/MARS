# Spotify Integration Setup Guide

## Prerequisites
- Spotify Premium account (required for playback control)
- Spotify Developer account

## Step 1: Register Your Application

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click "Create app"
4. Fill in the details:
   - **App name**: MARS AI Assistant
   - **App description**: Voice-controlled AI assistant with Spotify integration
   - **Redirect URI**: `http://127.0.0.1:8080/settings` (use your actual port - check browser URL)
   - **API/SDKs**: Web API
5. Accept the terms and click "Save"
6. Note your **Client ID** and **Client Secret**

**Important**: 
- Use `http://127.0.0.1:PORT/settings` (NOT `localhost`) - Spotify requires loopback IP
- Replace PORT with your dev server port (usually 8080, 5173, or 3000)
- Check your browser URL to confirm the port number

## Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**Important**: 
- `VITE_SPOTIFY_CLIENT_ID` is used in the frontend (must have `VITE_` prefix)
- `SPOTIFY_CLIENT_SECRET` is used in the backend only (never expose this!)

## Step 3: Update Redirect URI for Production

When deploying to production, add your production URL to Spotify:

1. Go back to your app in Spotify Developer Dashboard
2. Click "Edit Settings"
3. Add your production redirect URI: `https://yourdomain.com/settings` (must be HTTPS)
4. Click "Save"

**Note**: 
- Production URLs must use HTTPS
- Development must use loopback IP: `http://127.0.0.1:PORT` or `http://[::1]:PORT`
- `localhost` is NOT allowed by Spotify (as of April 2025)

## Step 4: Connect Spotify in MARS

1. Start your MARS application
2. Go to Settings page
3. Scroll to "Spotify Integration" section
4. Click "Connect Spotify"
5. Authorize the application in the Spotify popup
6. You'll be redirected back to settings with Spotify connected

## Step 5: Test Voice Commands

Try these commands:
- "Play some music"
- "Pause the music"
- "Skip this song"
- "Play [song name] by [artist name]"
- "What's playing?"
- "Turn the volume to 50"
- "Next song"
- "Previous song"

## Troubleshooting

### "No active device" error
- Open Spotify on your computer, phone, or web player
- Start playing something (can pause it after)
- Try the voice command again

### "Premium required" error
- Spotify Premium is required for playback control
- Free accounts can only see what's playing

### Token expired
- Tokens automatically refresh
- If issues persist, disconnect and reconnect Spotify in settings

### No music playing in HUD
- Make sure Spotify is open on a device
- Check that something is playing or was recently played
- The widget updates every 5 seconds

## API Rate Limits

- Spotify allows 180 requests per minute per user
- MARS polls playback state every 5 seconds (12 requests/minute)
- Voice commands count as additional requests
- You're unlikely to hit the limit with normal usage

## Security Notes

- Never commit `.env` file to version control
- Client Secret should only be in server-side code
- Tokens are stored in browser localStorage (encrypted by browser)
- Tokens automatically refresh before expiry

## Features Implemented

✅ Play/Pause control
✅ Skip next/previous
✅ Volume control
✅ Search and play songs
✅ Current playback display
✅ Album art display
✅ Progress bar
✅ Manual controls in HUD widget
✅ Voice command integration

## Future Enhancements

- Playlist management
- Queue viewing
- Lyrics display
- Mood-based recommendations
- Multi-device selection
- Collaborative playlists
