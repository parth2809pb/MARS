# Design Document: LiveKit + Gemini Integration

## Overview

This design document outlines the architecture for integrating LiveKit real-time audio streaming with Google's Gemini Live API to create MARS, a voice-enabled AI assistant. The system will be built as a React/TypeScript single-page application using Vite, with shadcn/ui components for the interface.

The architecture follows a layered approach:
- **Presentation Layer**: React components with shadcn/ui
- **State Management Layer**: React Context + localStorage for settings
- **Service Layer**: LiveKit client, Gemini Live API client, tool implementations
- **Server Layer**: Minimal Express/Node server for LiveKit tokens and SMTP proxy

## Architecture

### High-Level Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Client)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React Application (Vite + TypeScript)                 │ │
│  │                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │ │
│  │  │  Onboarding  │  │     Main     │  │  Settings   │ │ │
│  │  │     Page     │  │     Page     │  │    Page     │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────┘ │ │
│  │         │                  │                  │        │ │
│  │         └──────────────────┴──────────────────┘        │ │
│  │                          │                              │ │
│  │                ┌─────────▼─────────┐                   │ │
│  │                │  Settings Context │                   │ │
│  │                │   (localStorage)  │                   │ │
│  │                └─────────┬─────────┘                   │ │
│  │                          │                              │ │
│  │         ┌────────────────┼────────────────┐            │ │
│  │         │                │                │            │ │
│  │    ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐      │ │
│  │    │ LiveKit  │    │  Gemini  │    │   Tools  │      │ │
│  │    │ Service  │◄───┤  Service │───►│ (Search, │      │ │
│  │    │          │    │          │    │ Weather) │      │ │
│  │    └────┬─────┘    └────┬─────┘    └──────────┘      │ │
│  │         │               │                              │ │
│  │    ┌────▼─────┐    ┌────▼─────┐                       │ │
│  │    │   Orb    │    │   UI     │                       │ │
│  │    │Visualizer│    │Components│                       │ │
│  │    └──────────┘    └──────────┘                       │ │
│  └─────────────────────────────────────────────────────────┘ │
│                          │                                   │
│                          │ WebSocket/WebRTC                  │
└──────────────────────────┼───────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼─────┐      ┌─────▼────┐      ┌─────▼────┐
   │ LiveKit  │      │  Gemini  │      │  Server  │
   │  Cloud   │      │ Live API │      │  (Node)  │
   └──────────┘      └──────────┘      └─────┬────┘
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                              ┌─────▼────┐      ┌──────▼─────┐
                              │  SMTP    │      │  External  │
                              │  Server  │      │    APIs    │
                              └──────────┘      └────────────┘
```

### Data Flow

1. **Initialization Flow**:
   - App loads → Check localStorage for settings
   - If no settings → Show Onboarding
   - If settings exist → Initialize services → Show Main page

2. **Audio Conversation Flow**:
   - User clicks "Start" → Connect LiveKit room → Enable microphone
   - Create Gemini Live session → Register function tools
   - User speaks → Audio streams to Gemini via WebSocket
   - Gemini processes → Invokes functions if needed → Generates response
   - Response audio → Plays through LiveKit or Web Audio API
   - Orb visualizer reacts to audio frequency data

3. **Function Calling Flow**:
   - Gemini determines function needed → Sends function call request
   - Client receives request → Routes to appropriate tool service
   - Tool executes (API call) → Returns result to Gemini
   - Gemini synthesizes result → Generates spoken response

## Components and Interfaces

### 1. Settings Management

**SettingsContext** (`src/state/SettingsContext.tsx`)
```typescript
interface Settings {
  // Required
  name: string;
  geminiApiKey: string;
  
  // Optional API keys
  webSearchApiKey?: string;
  weatherApiKey?: string;
  
  // Optional SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  
  // Location
  locationOverride?: {
    city?: string;
    lat?: number;
    lon?: number;
  };
  preferIPGeo?: boolean;
}

interface SettingsContextValue {
  settings: Settings | null;
  isLoading: boolean;
  updateSettings: (settings: Settings) => Promise<void>;
  clearSettings: () => void;
}
```

**Storage Layer** (`src/state/settings.ts`)
```typescript
const STORAGE_KEY = 'mars.settings.v1';

export const loadSettings = (): Settings | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return settingsSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
};
```

### 2. LiveKit Service

**LiveKitService** (`src/services/livekit.ts`)
```typescript
interface LiveKitConfig {
  url: string;
  token: string;
}

class LiveKitService {
  private room: Room | null = null;
  private audioElement: HTMLAudioElement | null = null;
  
  async connect(config: LiveKitConfig): Promise<void>;
  async enableMicrophone(): Promise<void>;
  async attachAssistantAudio(track: RemoteAudioTrack): void;
  disconnect(): void;
  getAudioElement(): HTMLAudioElement | null;
}
```

**Token Generation** (Server endpoint)
```typescript
// server/routes/livekit.ts
POST /api/livekit/token
Body: { roomName: string, participantName: string }
Response: { token: string, url: string }
```

### 3. Gemini Live Service

**GeminiService** (`src/services/gemini.ts`)
```typescript
interface GeminiConfig {
  apiKey: string;
  systemPrompt: string;
}

interface FunctionCall {
  name: string;
  args: Record<string, any>;
}

class GeminiService {
  private session: WebSocket | null = null;
  private onFunctionCall: (call: FunctionCall) => Promise<any>;
  
  async connect(config: GeminiConfig): Promise<void>;
  async sendAudio(audioData: ArrayBuffer): Promise<void>;
  async sendFunctionResult(callId: string, result: any): Promise<void>;
  disconnect(): void;
  
  // Event handlers
  onAudioResponse(handler: (audio: ArrayBuffer) => void): void;
  onTextResponse(handler: (text: string) => void): void;
  onError(handler: (error: Error) => void): void;
}
```

**Function Definitions**
```typescript
const FUNCTION_DEFINITIONS = [
  {
    name: 'web_search',
    description: 'Search the web for current information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' }
      },
      required: ['query']
    }
  },
  {
    name: 'get_weather',
    description: 'Get current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        lat: { type: 'number' },
        lon: { type: 'number' }
      }
    }
  },
  {
    name: 'geolocate_ip',
    description: 'Get user location from IP address',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'send_email',
    description: 'Send an email',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string' },
        subject: { type: 'string' },
        html: { type: 'string' }
      },
      required: ['to', 'subject', 'html']
    }
  }
];
```

**System Prompt**
```
You are MARS, a helpful AI assistant with access to real-time information and tools.

Available tools:
- web_search: Search the web for current information
- get_weather: Get weather for any location
- geolocate_ip: Determine user's location
- send_email: Send emails on behalf of the user

Guidelines:
- Keep responses concise and conversational for voice delivery
- Only invoke tools when necessary to answer the user's question
- Confirm before sending emails or performing actions
- Speak naturally as if in a conversation
```

### 4. Tool Services

**Web Search** (`src/tools/websearch.ts`)
```typescript
interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function webSearch(
  query: string,
  apiKey: string
): Promise<SearchResult[]> {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      query,
      include_answer: false,
      max_results: 5
    })
  });
  
  const data = await response.json();
  return data.results;
}
```

**Weather** (`src/tools/weather.ts`)
```typescript
interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  icon: string;
}

export async function getCurrentWeather(
  params: { city?: string; lat?: number; lon?: number },
  apiKey: string
): Promise<WeatherData> {
  let url = 'https://api.openweathermap.org/data/2.5/weather?';
  
  if (params.lat && params.lon) {
    url += `lat=${params.lat}&lon=${params.lon}`;
  } else if (params.city) {
    url += `q=${encodeURIComponent(params.city)}`;
  }
  
  url += `&units=metric&appid=${apiKey}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    city: data.name,
    temp: Math.round(data.main.temp),
    condition: data.weather[0].description,
    icon: data.weather[0].icon
  };
}
```

**Geolocation** (`src/tools/geo.ts`)
```typescript
interface LocationData {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
}

export async function geolocateIP(): Promise<LocationData> {
  const response = await fetch('https://ipapi.co/json/');
  const data = await response.json();
  
  return {
    city: data.city,
    region: data.region,
    country: data.country_name,
    lat: data.latitude,
    lon: data.longitude
  };
}
```

**Email** (Server endpoint)
```typescript
// server/routes/email.ts
POST /api/email/send
Body: {
  to: string;
  subject: string;
  html: string;
  smtpConfig: {
    host: string;
    port: number;
    user: string;
    pass: string;
    from: string;
  }
}
Response: { messageId: string }
```

### 5. UI Components

**Greeting Component** (`src/components/Greeting.tsx`)
```typescript
interface GreetingProps {
  name: string;
}

// Displays: "Good Morning, {name}" with current time
// Updates every 60 seconds
// Time-of-day logic:
//   0-11: Morning
//   12-17: Afternoon
//   18-23: Evening
```

**DateDisplay Component** (`src/components/DateDisplay.tsx`)
```typescript
// Displays: "Monday, November 2, 2025"
// Uses Intl.DateTimeFormat with user locale
// Updates at midnight
```

**WeatherPill Component** (`src/components/WeatherPill.tsx`)
```typescript
interface WeatherPillProps {
  weatherApiKey?: string;
  location?: { city?: string; lat?: number; lon?: number };
  preferIPGeo?: boolean;
}

// Displays: "{City} • {temp}°C" with weather icon
// Fetches on mount and every 30 minutes
// Shows loading state and error handling
```

**MemoryReserve Component** (`src/components/MemoryReserve.tsx`)
```typescript
interface MemoryReserveProps {
  tokensUsed: number;
  tokenBudget: number;
}

// Displays: "Memory Reserve: {percentage}%"
// Visual progress bar
// Updates as conversation progresses
```

**AudioOrb Component** (`src/components/AudioOrb.tsx`)
```typescript
interface AudioOrbProps {
  audioElement: HTMLAudioElement | null;
  isActive: boolean;
}

// Central ferrofluid-style orb
// Connects Web Audio API AnalyserNode to audio stream
// Maps frequency data to blob deformation
// Animates at 60fps using requestAnimationFrame
```

### 6. Pages

**OnboardingPage** (`src/pages/Onboarding.tsx`)

Step 1: Basic Information
- Name (required, text input)
- Gemini API key (required, password input with visibility toggle)
- SMTP Configuration (optional, collapsible section)
  - Host, Port, Username, Password, From Address
- "Next" button (disabled until required fields valid)

Step 2: Location Setup
- Auto-detect button (triggers IP geolocation)
- Manual override fields (City, Lat, Lon)
- "Skip" button
- "Finish" button

**MainPage** (`src/pages/Index.tsx`)

Layout:
```
┌─────────────────────────────────────────┐
│ Greeting          │          Date       │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│              Audio Orb                  │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│ Weather Pill      │    Memory Reserve   │
└─────────────────────────────────────────┘
```

Controls:
- Start/Stop conversation button
- Settings icon (top-right)
- Connection status indicator

**SettingsPage** (`src/pages/Settings.tsx`)

Sections:
1. Personal Information
   - Name (editable)
   
2. API Keys
   - Gemini API Key (required, password field)
   - Web Search API Key (optional)
   - Weather API Key (optional)
   - Test buttons for each API
   
3. Email Configuration
   - SMTP settings (collapsible)
   - Test email button
   
4. Location Preferences
   - Toggle: "Prefer IP geolocation"
   - Manual override fields
   - Current location display
   
5. Actions
   - Save button
   - Reset to defaults button
   - Clear all data button (with confirmation)

## Data Models

### Settings Schema (Zod)

```typescript
import { z } from 'zod';

export const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  geminiApiKey: z.string().min(1, 'Gemini API key is required'),
  
  webSearchApiKey: z.string().optional(),
  weatherApiKey: z.string().optional(),
  
  smtpHost: z.string().optional(),
  smtpPort: z.number().int().min(1).max(65535).optional(),
  smtpUser: z.string().optional(),
  smtpPass: z.string().optional(),
  smtpFrom: z.string().email().optional(),
  
  locationOverride: z.object({
    city: z.string().optional(),
    lat: z.number().min(-90).max(90).optional(),
    lon: z.number().min(-180).max(180).optional(),
  }).optional(),
  
  preferIPGeo: z.boolean().default(true),
});

export type Settings = z.infer<typeof settingsSchema>;
```

### Conversation State

```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface ConversationState {
  messages: Message[];
  tokensUsed: number;
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
}
```

## Error Handling

### Error Categories

1. **Configuration Errors**
   - Missing required settings
   - Invalid API keys
   - SMTP configuration errors
   - Display: Toast notification with actionable message

2. **Connection Errors**
   - LiveKit connection failure
   - Gemini API connection failure
   - Network timeout
   - Display: Status indicator + retry button

3. **API Errors**
   - Rate limiting
   - Invalid requests
   - Service unavailable
   - Display: Toast notification + graceful degradation

4. **Audio Errors**
   - Microphone permission denied
   - Audio playback failure
   - Display: Modal with instructions

### Error Recovery Strategies

- **Automatic Retry**: Network errors with exponential backoff (max 3 attempts)
- **Graceful Degradation**: Disable unavailable tools, continue with available features
- **User Notification**: Clear error messages with suggested actions
- **Fallback**: If LiveKit fails, attempt direct Web Audio API connection

### Error Logging

```typescript
interface ErrorLog {
  timestamp: Date;
  category: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

// Log to console in development
// Send to error tracking service in production (optional)
```

## Testing Strategy

### Unit Tests

**Settings Management**
- Load/save from localStorage
- Schema validation
- Default values
- Migration from old versions

**Tool Services**
- Mock API responses
- Error handling
- Response parsing
- Rate limiting

**Utility Functions**
- Time-of-day greeting logic
- Date formatting
- Temperature conversion
- Token counting

### Integration Tests

**LiveKit Integration**
- Room connection
- Microphone enable/disable
- Audio track handling
- Disconnect cleanup

**Gemini Integration**
- Session creation
- Function call routing
- Audio streaming
- Error recovery

**End-to-End Flows**
- Onboarding completion
- Settings update
- Full conversation cycle
- Tool invocation

### Manual Testing Checklist

- [ ] Onboarding flow with all field combinations
- [ ] Settings page validation and persistence
- [ ] Audio conversation with various queries
- [ ] Each tool function (search, weather, email, geo)
- [ ] Error scenarios (network loss, invalid keys)
- [ ] Audio visualization responsiveness
- [ ] UI component updates (weather, memory, time)
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness

## Performance Considerations

### Optimization Strategies

1. **Audio Streaming**
   - Use adaptive bitrate for LiveKit
   - Buffer management for smooth playback
   - Minimize latency with WebRTC

2. **API Calls**
   - Cache weather data (30-minute TTL)
   - Debounce search queries
   - Batch function results when possible

3. **UI Rendering**
   - Memoize expensive components
   - Throttle orb animation to 60fps
   - Lazy load settings page

4. **Memory Management**
   - Limit conversation history (last 50 messages)
   - Clean up audio blobs after playback
   - Disconnect services on unmount

### Performance Metrics

- Time to first audio response: < 2 seconds
- Audio latency: < 500ms
- Orb animation: 60fps
- Settings save: < 100ms
- API tool response: < 3 seconds

## Security Considerations

### API Key Protection

- Store in localStorage (client-side only)
- Never log or expose in network requests
- Use HTTPS for all API calls
- Proxy sensitive operations through server

### SMTP Security

- Never send SMTP credentials to client
- Server-side email sending only
- Validate recipient addresses
- Rate limit email sending

### Input Validation

- Sanitize all user inputs
- Validate API responses
- Escape HTML in email content
- Prevent XSS in conversation display

### CORS and CSP

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; connect-src 'self' https://api.openai.com https://api.tavily.com https://api.openweathermap.org https://ipapi.co wss://*.livekit.cloud",
    }
  }
});
```

## Deployment

### Environment Variables

```bash
# .env.example
VITE_LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
VITE_GEMINI_KEY=  # Optional dev default
VITE_WEATHER_KEY= # Optional dev default
VITE_SEARCH_KEY=  # Optional dev default

# Server-side only
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

### Build Process

```bash
# Install dependencies
npm install

# Add LiveKit and additional dependencies
npm install livekit-client @google/generative-ai

# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Server Deployment

**Node.js Server** (`server/index.js`)
```javascript
import express from 'express';
import { AccessToken } from 'livekit-server-sdk';
import nodemailer from 'nodemailer';

const app = express();
app.use(express.json());

// LiveKit token endpoint
app.post('/api/livekit/token', async (req, res) => {
  const { roomName, participantName } = req.body;
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    { identity: participantName }
  );
  token.addGrant({ roomJoin: true, room: roomName });
  res.json({ token: await token.toJwt(), url: process.env.VITE_LIVEKIT_URL });
});

// Email endpoint
app.post('/api/email/send', async (req, res) => {
  const { to, subject, html, smtpConfig } = req.body;
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.port === 465,
    auth: { user: smtpConfig.user, pass: smtpConfig.pass }
  });
  const info = await transporter.sendMail({
    from: smtpConfig.from,
    to,
    subject,
    html
  });
  res.json({ messageId: info.messageId });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

### Hosting Options

- **Client**: Vercel, Netlify, or any static host
- **Server**: Railway, Render, or any Node.js host
- **LiveKit**: LiveKit Cloud or self-hosted

## Dependencies to Add

```json
{
  "dependencies": {
    "livekit-client": "^2.0.0",
    "@google/generative-ai": "^0.1.0"
  },
  "devDependencies": {
    "livekit-server-sdk": "^2.0.0",
    "nodemailer": "^6.9.0",
    "express": "^4.18.0"
  }
}
```

## Implementation Phases

### Phase 1: Foundation (Settings & Onboarding)
- Settings schema and storage
- Onboarding flow
- Settings page
- Basic UI layout

### Phase 2: Audio Infrastructure (LiveKit)
- LiveKit service
- Room connection
- Microphone handling
- Audio playback

### Phase 3: AI Integration (Gemini)
- Gemini Live API client
- Function calling framework
- System prompt configuration
- Audio streaming

### Phase 4: Tools Implementation
- Web search
- Weather
- IP geolocation
- Email (server endpoint)

### Phase 5: UI Polish
- Audio-reactive orb
- Greeting and date components
- Weather pill
- Memory reserve indicator

### Phase 6: Testing & Optimization
- Error handling
- Performance optimization
- Cross-browser testing
- Documentation
