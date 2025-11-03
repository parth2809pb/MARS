# Spotify Integration Troubleshooting

## "Invalid Client" Error

This error occurs when Spotify can't validate your application. Here's how to fix it:

### Step 1: Verify Environment Variables

Check your `.env` file has these variables:

```bash
VITE_SPOTIFY_CLIENT_ID=your_actual_client_id_here
SPOTIFY_CLIENT_SECRET=your_actual_client_secret_here
```

**Important Notes:**
- `VITE_SPOTIFY_CLIENT_ID` must start with `VITE_` (Vite requirement)
- No quotes around the values
- No spaces around the `=` sign
- Restart your dev server after adding these

### Step 2: Check Spotify Developer Dashboard

1. Go to https://developer.spotify.com/dashboard
2. Click on your app
3. Click "Settings" or "Edit Settings"
4. Under "Redirect URIs", make sure you have:
   - For development: `http://localhost:5173/settings`
   - For production: `https://yourdomain.com/settings`
5. Click "Add" if not present
6. Click "Save" at the bottom

### Step 3: Verify Client ID Matches

1. In Spotify Dashboard, copy your Client ID
2. Make sure it exactly matches what's in your `.env` file
3. No extra spaces or characters

### Step 4: Restart Everything

```bash
# Stop your dev server (Ctrl+C)
# Stop your backend server (Ctrl+C)

# Restart backend
cd server
node index.js

# Restart frontend (in new terminal)
npm run dev
```

### Step 5: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Connect Spotify"
4. Look for the log message showing:
   - clientId
   - redirectUri
   - scopes

The `redirectUri` should match exactly what's in Spotify Dashboard.

## Common Issues

### Issue: "VITE_SPOTIFY_CLIENT_ID is undefined"

**Solution:** 
- Make sure `.env` file is in the root directory (same level as `package.json`)
- Variable must start with `VITE_`
- Restart dev server

### Issue: "Redirect URI mismatch" or "This redirect URI is not secure"

**Solution:**
- Spotify requires loopback IP addresses: `http://127.0.0.1:PORT` or `http://[::1]:PORT`
- **`localhost` is NOT allowed** (Spotify policy as of April 2025)
- Check the exact port in your browser URL
- Add `http://127.0.0.1:PORT/settings` to Spotify Dashboard (replace PORT with your actual port)
- Common examples:
  - `http://127.0.0.1:8080/settings` (common dev server)
  - `http://127.0.0.1:5173/settings` (Vite default)
  - `http://127.0.0.1:3000/settings` (alternative)
- For production, you MUST use HTTPS: `https://yourdomain.com/settings`

### Issue: "Client secret is invalid"

**Solution:**
- This error happens on the backend
- Check `SPOTIFY_CLIENT_SECRET` in `.env`
- Make sure it's the secret, not the client ID
- Regenerate secret in Spotify Dashboard if needed

### Issue: CORS error - "Access-Control-Allow-Origin" mismatch

**Error Message:**
```
Access to fetch at 'http://localhost:3000/api/spotify/auth' from origin 'http://127.0.0.1:8080' 
has been blocked by CORS policy
```

**Solution:**
- The server CORS is configured for both `localhost` and `127.0.0.1`
- Restart your backend server after the CORS fix
- The server now accepts requests from both origins
- No `.env` changes needed - it's automatic

### Issue: Connection works but "No active device"

**Solution:**
- Open Spotify app on your computer/phone
- Start playing any song (can pause it after)
- Try voice command again

### Issue: "Premium required"

**Solution:**
- Spotify Premium is required for playback control
- Free accounts can only view what's playing
- Upgrade to Premium or use a Premium account

## Debugging Steps

### 1. Test Environment Variables

Add this to your Settings page temporarily:

```typescript
console.log('Client ID:', import.meta.env.VITE_SPOTIFY_CLIENT_ID);
console.log('Has Client ID:', !!import.meta.env.VITE_SPOTIFY_CLIENT_ID);
```

### 2. Test Backend

```bash
curl -X POST http://localhost:3000/api/spotify/auth \
  -H "Content-Type: application/json" \
  -d '{"code":"test","redirectUri":"http://localhost:5173/settings"}'
```

Should return an error about invalid code (that's expected), but not "credentials not configured".

### 3. Check Redirect URI Format

The redirect URI must:
- Use loopback IP: `http://127.0.0.1:PORT` (NOT `localhost`)
- Match exactly (including protocol, port, path)
- Not have trailing slash
- Be added in Spotify Dashboard
- Be URL-encoded in the OAuth request (handled automatically)

**Important**: As of April 2025, Spotify does NOT allow `localhost` - you must use `127.0.0.1` or `[::1]`

## Example Working Configuration

### .env file:
```bash
VITE_SPOTIFY_CLIENT_ID=abc123def456
SPOTIFY_CLIENT_SECRET=xyz789uvw012
VITE_SERVER_URL=http://localhost:3000
```

### Spotify Dashboard Settings:
- App Name: MARS AI Assistant
- Redirect URIs: 
  - `http://127.0.0.1:8080/settings` (or whatever port your dev server uses)
  - Must use loopback IP `127.0.0.1` or `[::1]` - **`localhost` is NOT allowed**

### Browser URL when clicking Connect:
```
https://accounts.spotify.com/authorize?
  client_id=abc123def456&
  response_type=code&
  redirect_uri=http%3A%2F%2F127.0.0.1%3A8080%2Fsettings&
  scope=user-read-playback-state%20user-modify-playback-state%20user-read-currently-playing%20streaming
```

Note: The redirect_uri is URL-encoded, so `127.0.0.1` becomes `127.0.0.1` in the encoded form.

## Still Having Issues?

1. **Check browser console** for error messages
2. **Check server logs** for backend errors
3. **Verify Spotify app status** in Developer Dashboard (should be "Development Mode")
4. **Try incognito/private window** to rule out cache issues
5. **Regenerate credentials** in Spotify Dashboard if all else fails

## Quick Fix Checklist

- [ ] `.env` file exists in root directory
- [ ] `VITE_SPOTIFY_CLIENT_ID` is set (with VITE_ prefix)
- [ ] `SPOTIFY_CLIENT_SECRET` is set
- [ ] Both values copied correctly from Spotify Dashboard
- [ ] Redirect URI added in Spotify Dashboard
- [ ] Redirect URI matches exactly (check port number)
- [ ] Dev server restarted after adding env variables
- [ ] Backend server restarted
- [ ] Browser cache cleared (or using incognito)
- [ ] Spotify app is in Development Mode (not restricted)

## Getting Help

If you're still stuck:
1. Check the browser console for the exact error
2. Check the server logs for backend errors
3. Copy the OAuth URL from console and check if client_id is present
4. Verify the redirect_uri in the URL matches Spotify Dashboard
