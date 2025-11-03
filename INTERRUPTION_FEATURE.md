# Voice Interruption Feature

## Overview
Added natural conversation flow by allowing users to interrupt MARS while it's speaking.

## Implementation

### Voice Activity Detection (VAD)
- **RMS Calculation**: Monitors audio input level in real-time
- **Threshold**: 0.02 (adjustable based on environment)
- **Callback System**: Triggers when voice activity starts/stops

### Audio Interruption
- **Immediate Stop**: Halts all currently playing audio
- **Queue Clearing**: Cancels all scheduled audio chunks
- **Smooth Recovery**: Resets timing for next audio playback

## How It Works

1. **User starts speaking** → VAD detects voice activity
2. **Interrupt triggered** → All AI audio stops immediately
3. **Audio sent to Gemini** → User's speech is processed
4. **AI responds** → New response plays normally

## Technical Details

### LiveKit Service Updates
```typescript
// New methods:
- interruptAudio(): Stops all audio playback
- startAudioCapture(callback, onVoiceActivity): Added VAD callback

// New properties:
- scheduledSources: Tracks all audio sources for interruption
- voiceActivityThreshold: Configurable sensitivity
- onVoiceActivityCallback: Handles voice detection events
```

### Index Page Integration
- Voice activity callback automatically interrupts audio
- Works seamlessly with existing audio pipeline
- No user action required - fully automatic

## Benefits

1. **Natural Conversation**: Users can interrupt like in real conversations
2. **Responsive**: Immediate feedback when user speaks
3. **Efficient**: Saves bandwidth by stopping unnecessary audio
4. **User-Friendly**: No special commands needed

## Configuration

Adjust sensitivity in `src/services/livekit.ts`:
```typescript
private voiceActivityThreshold: number = 0.02; // Lower = more sensitive
```

## Testing

Test scenarios:
- Interrupt during long AI responses
- Multiple rapid interruptions
- Background noise handling
- Different microphone sensitivities

## Future Enhancements

- Adaptive threshold based on ambient noise
- Visual indicator when interruption occurs
- Configurable sensitivity in settings UI
- Interrupt gesture (button press) as alternative
