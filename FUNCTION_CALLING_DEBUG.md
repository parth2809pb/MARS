# Function Calling Debug Guide

## What You're Using

You're **NOT using LiveKit's function calling** - you're using **Gemini's native function calling** via WebSocket API. This is actually fine and works well, but it's different from LiveKit's agent framework.

### Your Architecture:
1. **Gemini WebSocket API** - Direct connection to Gemini 2.0 Flash
2. **Function Definitions** - Registered in `src/services/gemini.ts`
3. **Function Router** - Routes calls to tools in `src/services/functionRouter.ts`
4. **LiveKit** - Only used for audio transport (microphone input, speaker output)

## Why It Goes Blank

When Gemini calls a function, here's what should happen:

1. Gemini sends a `functionCall` in the WebSocket message
2. Your `handleFunctionCall` executes the function
3. You send back the result via `sendFunctionResult`
4. Gemini processes the result and responds with audio/text

If it "goes blank", it means:
- The function is being called but failing silently
- The result isn't being sent back properly
- Gemini is waiting for a response that never comes

## Debug Changes Made

I've added extensive logging throughout the function calling pipeline:

### In `src/services/gemini.ts`:
- ✅ Logs when function call is received
- ✅ Logs function name, args, and ID
- ✅ Logs when executing handler
- ✅ Logs the result before sending
- ✅ Logs the exact message being sent to Gemini
- ✅ Logs all non-audio messages from Gemini

### In `src/pages/Index.tsx`:
- ✅ Logs when function call reaches UI layer
- ✅ Shows toast when function starts
- ✅ Shows toast when function completes
- ✅ Shows toast on errors
- ✅ Logs the result

## How to Debug

1. **Open Browser Console** (F12)
2. **Start a conversation**
3. **Ask for weather**: "What's the weather?"
4. **Watch for these logs**:

```
📨 Gemini message: { ... functionCall ... }
📞 Gemini calling function: get_weather
📋 Function args: { ... }
🆔 Function ID: abc123
🔧 handleFunctionCall started for: get_weather
⚙️ Executing function handler...
🎯 Function call received in UI: { ... }
🔧 Function Call: get_weather
📋 Arguments: { ... }
🌤️ Weather request - params from Gemini: { ... }
✅ Function executed successfully, result: { ... }
📤 Sending function result message: { ... }
✅ Function result sent successfully
✅ Function result: { ... }
```

## Common Issues

### 1. No Function Handler Registered
**Symptom**: `❌ No function handler registered!`
**Fix**: Make sure `geminiService.onFunctionCall()` is called before connecting

### 2. WebSocket Not Open
**Symptom**: `❌ Cannot send function result - WebSocket not open`
**Fix**: Check Gemini connection status

### 3. Function Execution Error
**Symptom**: Error in function router
**Fix**: Check API keys in settings (weather, Spotify, etc.)

### 4. Wrong Response Format
**Symptom**: Gemini doesn't respond after function call
**Fix**: Check the `toolResponse` message format matches Gemini's API

## Testing Each Function

### Weather
```
"What's the weather?"
"How hot is it?"
"Is it raining?"
```

### Web Search
```
"Search for latest news"
"What's happening in the world?"
```

### Spotify
```
"Play some music"
"What's playing?"
"Skip this song"
```

### Email
```
"Send an email to test@example.com"
```

## Next Steps

1. **Test with console open** - You'll see exactly where it fails
2. **Check API keys** - Make sure all services are configured
3. **Test one function at a time** - Start with weather (simplest)
4. **Look for error toasts** - They'll show if functions fail

## LiveKit vs Gemini Function Calling

If you want to use **LiveKit's function calling** instead:
- You'd need to use LiveKit Agents (Python backend)
- Functions would be defined server-side
- LiveKit would handle the routing
- More complex setup but more integrated

Your current approach (Gemini direct) is simpler and works great for your use case!
