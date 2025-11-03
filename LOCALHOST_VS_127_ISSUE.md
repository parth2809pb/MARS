# localhost vs 127.0.0.1 - Important!

## The Problem

`localhost` and `127.0.0.1` are treated as **different origins** by browsers, which means:
- ❌ They have **separate localStorage**
- ❌ They have **separate cookies**
- ❌ They have **separate session storage**

## What This Means for MARS

If you:
1. Complete onboarding on `http://localhost:8080`
2. Connect Spotify (which redirects to `http://127.0.0.1:8080`)
3. Your settings are NOT available on `127.0.0.1`!

## The Solution

**Always use `127.0.0.1` instead of `localhost`**

### ✅ Correct URL:
```
http://127.0.0.1:8080
```

### ❌ Wrong URL:
```
http://localhost:8080
```

## How to Fix

### Option 1: Start Fresh on 127.0.0.1 (Recommended)

1. Open your browser
2. Go to `http://127.0.0.1:8080` (NOT localhost)
3. Complete onboarding
4. Connect Spotify
5. Everything will work! ✅

### Option 2: Copy Settings Manually

If you've already set everything up on localhost:

1. Open DevTools (F12) on `http://localhost:8080`
2. Go to Console tab
3. Run:
   ```javascript
   localStorage.getItem('mars.settings.v1')
   ```
4. Copy the output
5. Go to `http://127.0.0.1:8080`
6. Open DevTools (F12)
7. Go to Console tab
8. Run:
   ```javascript
   localStorage.setItem('mars.settings.v1', 'PASTE_YOUR_COPIED_VALUE_HERE')
   ```
9. Refresh the page

### Option 3: Clear and Start Over

1. Go to `http://localhost:8080/settings`
2. Click "Clear All Data"
3. Go to `http://127.0.0.1:8080`
4. Complete onboarding again

## Why This Happens

Spotify requires `127.0.0.1` in the redirect URI (not `localhost`), so when you authorize, Spotify redirects you to `127.0.0.1`, which is a different origin from `localhost`.

## Best Practice

**Always bookmark and use:**
```
http://127.0.0.1:8080
```

This ensures:
- ✅ Settings persist across Spotify OAuth
- ✅ No confusion between origins
- ✅ Consistent experience

## Quick Check

To see which origin you're on:
1. Look at your browser's address bar
2. If it says `localhost` → Switch to `127.0.0.1`
3. If it says `127.0.0.1` → You're good! ✅

## For Development

Update your browser bookmarks:
- ❌ Remove: `http://localhost:8080`
- ✅ Add: `http://127.0.0.1:8080`

## Technical Details

From the browser's perspective:
- `http://localhost:8080` = Origin A
- `http://127.0.0.1:8080` = Origin B

Even though they point to the same server, they're treated as completely separate for security reasons (Same-Origin Policy).
