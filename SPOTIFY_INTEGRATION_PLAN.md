# Spotify Integration Plan for MARS AI Assistant

## Overview
Integrate Spotify playback control into MARS, allowing users to control music playback through voice commands.

## Architecture

### 1. Authentication Flow
- **Spotify OAuth 2.0**: Use Authorization Code Flow with PKCE
- **Token Storage**: Store access/refresh tokens in settings (encrypted in localStorage)
- **Token Refresh**: Automatic refresh when tokens expire

### 2. Backend Requirements (server/index.js)

#### New Endpoints:
```javascript
// Spotify OAuth callback
POST /api/spotify/auth
- Exchanges authorization code for tokens
- Returns access_token, refresh_token, expires_in

// Refresh token
POST /api/spotify/refresh
- Takes refresh_token
- Returns new access_token

// Proxy for Spotify API (optional, for CORS)
POST /api/spotify/proxy
- Forwards requests to Spotify API
- Adds authentication headers
```

### 3. Frontend Components

#### Settings Page Updates
- Add "Connect Spotify" button
- Display connection status
- Show currently connected account
- Disconnect option

#### New Tool: `src/tools/spotify.ts`
```typescript
interface SpotifyConfig {
  accessToken: string;
  refreshToken: string;
}

// Functions to implement:
- getCurrentPlayback(): Get current playing track
- play(uri?: string): Resume or play specific track/playlist
- pause(): Pause playback
- skipNext(): Skip to next track
- skipPrevious(): Skip to previous track
- setVolume(volume: number): Set volume (0-100)
- search(query: string, type: 'track' | 'album' | 'playlist'): Search Spotify
- getPlaylists(): Get user's playlists
- addToQueue(uri: string): Add track to queue
```

### 4. Function Definitions for Gemini

Add to `src/services/gemini.ts`:

```typescript
{
  name: 'spotify_control',
  description: 'Control Spotify playback. Use this when user asks to play, pause, skip music, or control volume.',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['play', 'pause', 'next', 'previous', 'volume', 'current', 'search', 'queue'],
        description: 'The action to perform'
      },
      query: {
        type: 'string',
        description: 'Search query for tracks/artists (required for search action)'
      },
      uri: {
        type: 'string',
        description: 'Spotify URI to play (optional for play action)'
      },
      volume: {
        type: 'number',
        description: 'Volume level 0-100 (required for volume action)'
      }
    },
    required: ['action']
  }
}
```

### 5. State Management Updates

#### `src/state/settings.ts`
```typescript
// Add to Settings interface:
spotifyAccessToken?: string;
spotifyRefreshToken?: string;
spotifyTokenExpiry?: number;
spotifyConnected?: boolean;
```

### 6. Implementation Steps

#### Phase 1: Authentication (Week 1)
1. Register app on Spotify Developer Dashboard
2. Implement OAuth flow in server
3. Add "Connect Spotify" UI in settings
4. Store tokens securely
5. Implement token refresh logic

#### Phase 2: Basic Playback Control (Week 2)
1. Create `spotify.ts` tool
2. Implement basic controls: play, pause, next, previous
3. Add function definition to Gemini
4. Update function router
5. Test voice commands

#### Phase 3: Advanced Features (Week 3)
1. Implement search functionality
2. Add queue management
3. Volume control
4. Get current playback info
5. Display now playing in HUD (optional)

#### Phase 4: Polish & Testing (Week 4)
1. Error handling for offline/no device scenarios
2. Handle premium vs free account limitations
3. Add visual feedback for playback state
4. Comprehensive testing
5. Documentation

## Voice Command Examples

Users will be able to say:
- "Play some music"
- "Pause the music"
- "Skip this song"
- "Play [song name] by [artist]"
- "What's playing?"
- "Turn up the volume"
- "Play my Discover Weekly playlist"
- "Add this to my queue"

## Technical Considerations

### Spotify API Limitations
- **Free Users**: Can only control playback on active devices
- **Premium Required**: Full playback control requires Spotify Premium
- **Rate Limits**: 180 requests per minute per user
- **Device Requirement**: User must have Spotify open on a device

### Error Handling
- No active device: Prompt user to open Spotify
- Token expired: Auto-refresh and retry
- Premium required: Inform user of limitation
- Network errors: Graceful fallback with user notification

### Security
- Never expose tokens in client-side code
- Use HTTPS for all API calls
- Implement PKCE for OAuth flow
- Encrypt tokens in localStorage

## UI/UX Enhancements

### Optional HUD Component: `HudNowPlaying.tsx`
Display current track info:
- Album art (small thumbnail)
- Track name
- Artist name
- Playback progress bar
- Play/pause indicator

Position: Bottom center or bottom right

## Testing Strategy

1. **Unit Tests**: Test each Spotify function independently
2. **Integration Tests**: Test OAuth flow and token refresh
3. **Voice Command Tests**: Test various natural language inputs
4. **Edge Cases**: 
   - No internet connection
   - Spotify not open
   - Free account limitations
   - Multiple devices active

## Dependencies to Add

```json
{
  "dependencies": {
    "@spotify/web-api-ts-sdk": "^1.1.2"
  }
}
```

Or use direct fetch API calls (no additional dependencies needed).

## Environment Variables

Add to `.env`:
```
VITE_SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret (server-side only)
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/settings
```

## Rollout Plan

1. **Beta Testing**: Enable for select users first
2. **Feedback Collection**: Gather user feedback on voice commands
3. **Iteration**: Refine based on usage patterns
4. **Full Release**: Deploy to all users

## Future Enhancements

- Playlist creation via voice
- Lyrics display
- Music recommendations based on mood
- Integration with other music services (Apple Music, YouTube Music)
- Smart home integration (play music on specific speakers)
- Context-aware music (workout playlists, focus music, etc.)

## Success Metrics

- % of users who connect Spotify
- Average daily voice commands for music control
- User satisfaction ratings
- Error rate for music commands
- Token refresh success rate

---

## Quick Start Implementation

To get started immediately:

1. **Register Spotify App**:
   - Go to https://developer.spotify.com/dashboard
   - Create new app
   - Add redirect URI: `http://localhost:5173/settings`
   - Note Client ID and Secret

2. **Add Environment Variables**:
   ```bash
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_secret
   ```

3. **Install Dependencies** (if using SDK):
   ```bash
   npm install @spotify/web-api-ts-sdk
   ```

4. **Implement in Order**:
   - Server OAuth endpoints
   - Settings page connection UI
   - Spotify tool functions
   - Gemini function definition
   - Function router handler
   - Voice command testing
