# Spotify Integration - Quick Reference

## ✅ Correct Redirect URI Format

### Development (Local)
```
http://127.0.0.1:8080/settings
```
- ✅ Use `127.0.0.1` (loopback IPv4)
- ✅ Or use `[::1]` (loopback IPv6)
- ❌ Do NOT use `localhost` (not allowed by Spotify)
- ✅ HTTP is allowed for loopback addresses
- ✅ Port can be dynamic

### Production
```
https://yourdomain.com/settings
```
- ✅ Must use HTTPS
- ❌ HTTP not allowed (except loopback)

## 🔧 Setup Steps

1. **Get your port number**: Check browser URL (e.g., `http://localhost:8080`)

2. **Add to Spotify Dashboard**:
   - Go to https://developer.spotify.com/dashboard
   - Your App → Edit Settings → Redirect URIs
   - Add: `http://127.0.0.1:8080/settings` (use YOUR port)
   - Click "Add" then "Save"

3. **Environment Variables** (`.env` file):
   ```bash
   VITE_SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```

4. **Restart servers** and try connecting

## 📋 Spotify Requirements (as of April 2025)

From Spotify Documentation:

> **Requirements:**
> - Use HTTPS for your redirect URI, unless you are using a loopback address, when HTTP is permitted
> - If you are using a loopback address, use the explicit IPv4 or IPv6, like `http://127.0.0.1:PORT` or `http://[::1]:PORT`
> - **`localhost` is not allowed as redirect URI**

## 🎯 Common Ports

| Server | Default Port | Redirect URI |
|--------|-------------|--------------|
| Vite | 5173 | `http://127.0.0.1:5173/settings` |
| Webpack Dev | 8080 | `http://127.0.0.1:8080/settings` |
| Create React App | 3000 | `http://127.0.0.1:3000/settings` |
| Next.js | 3000 | `http://127.0.0.1:3000/settings` |

## 🐛 Troubleshooting

### Error: "Invalid client"
- Check `VITE_SPOTIFY_CLIENT_ID` in `.env`
- Verify it matches Spotify Dashboard
- Restart dev server

### Error: "Redirect URI is not secure"
- Change `localhost` to `127.0.0.1`
- Verify port number matches
- Add exact URI to Spotify Dashboard

### Error: "Redirect URI mismatch"
- URI in code must match Spotify Dashboard exactly
- Check port number
- No trailing slashes
- Use `127.0.0.1` not `localhost`

## 📱 Testing

1. Click "Connect Spotify" in Settings
2. Check browser console for OAuth URL
3. Verify `redirect_uri` parameter uses `127.0.0.1`
4. Authorize in Spotify popup
5. Should redirect back to settings with success message

## 🔐 Security Notes

- Client Secret stays on server (never in frontend)
- Tokens stored in browser localStorage
- Automatic token refresh before expiry
- HTTPS required for production

## 📚 Documentation Links

- [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
- [Spotify OAuth Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
- [Redirect URI Requirements](https://developer.spotify.com/documentation/web-api/concepts/redirect-uris)
