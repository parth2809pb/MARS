# Implementation Plan

- [x] 1. Install dependencies and configure project



  - Add livekit-client and @google/generative-ai packages to package.json
  - Create server directory with Express setup for LiveKit tokens and SMTP proxy
  - Add livekit-server-sdk, nodemailer, and express to server dependencies
  - Configure environment variables in .env.example for LiveKit URL and API keys

  - _Requirements: 11.1, 11.2_

- [x] 2. Implement settings management foundation


  - [x] 2.1 Create settings schema and storage utilities


    - Define Settings type with all required and optional fields in src/state/settings.ts
    - Implement Zod schema for validation with proper constraints
    - Write loadSettings() and saveSettings() functions using localStorage with key 'mars.settings.v1'
    - Add error handling for JSON parse failures and schema validation
    - _Requirements: 2.1, 2.7, 2.8, 11.3_
  
  - [x] 2.2 Create SettingsContext for global state


    - Build React Context with SettingsProvider in src/state/SettingsContext.tsx
    - Implement updateSettings, clearSettings, and isLoading state
    - Load settings from localStorage on mount and hydrate context
    - Export useSettings hook for component access
    - _Requirements: 2.8, 11.2_

- [x] 3. Build onboarding flow



  - [x] 3.1 Create onboarding page structure


    - Create src/pages/Onboarding.tsx with multi-step wizard layout
    - Implement step navigation state (currentStep, canProceed)
    - Add route for /onboarding in App.tsx
    - Style with shadcn/ui Card and Button components
    - _Requirements: 1.1_
  
  - [x] 3.2 Implement Step 1: Basic information form

    - Add form fields for name (required) and Gemini API key (required) using react-hook-form
    - Create collapsible section for optional SMTP configuration (host, port, user, pass, from)
    - Implement validation with Zod resolver
    - Add password visibility toggle for API key field
    - Disable "Next" button until required fields are valid
    - _Requirements: 1.2, 1.3, 1.4_
  
  - [x] 3.3 Implement Step 2: Location setup

    - Add "Auto-detect location" button that calls IP geolocation
    - Display detected city, region, country after successful geolocation
    - Provide manual override fields for city, latitude, longitude
    - Add "Skip" and "Finish" buttons
    - On finish, save all settings to localStorage and redirect to main page
    - _Requirements: 1.5, 1.6, 1.7_

- [x] 4. Create settings page



  - [x] 4.1 Build settings page layout


    - Create src/pages/Settings.tsx with tabbed or sectioned layout
    - Add sections: Personal Info, API Keys, Email Config, Location Preferences
    - Include route for /settings in App.tsx
    - Add navigation link from main page (settings icon)
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.2 Implement settings form with validation

    - Load current settings from context into form fields
    - Add editable fields for all settings properties
    - Implement "Prefer IP geolocation" toggle switch
    - Add test buttons for each API (Gemini, Weather, Search)
    - Create save handler that validates and persists to context
    - Add confirmation dialog for "Clear all data" action
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 5. Implement tool services



  - [x] 5.1 Create web search tool


    - Implement webSearch function in src/tools/websearch.ts
    - Call Tavily API with POST request including Authorization header
    - Parse response and return array of SearchResult objects (title, url, snippet)
    - Handle errors and return empty array on failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 5.2 Create weather tool


    - Implement getCurrentWeather function in src/tools/weather.ts
    - Support both coordinate-based and city-based queries
    - Call OpenWeatherMap API with units=metric parameter
    - Parse response and return WeatherData object (city, temp, condition, icon)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 5.3 Create IP geolocation tool


    - Implement geolocateIP function in src/tools/geo.ts
    - Call ipapi.co/json endpoint
    - Parse response and return LocationData (city, region, country, lat, lon)
    - Handle network errors gracefully
    - _Requirements: 7.1, 7.2, 7.4_
  
  - [x] 5.4 Create server endpoint for email sending


    - Implement POST /api/email/send route in server/routes/email.ts
    - Accept to, subject, html, and smtpConfig in request body
    - Create Nodemailer transport with user's SMTP credentials
    - Send email and return messageId on success
    - Handle SMTP errors and return appropriate status codes
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 6. Build LiveKit integration



  - [x] 6.1 Create LiveKit service class


    - Implement LiveKitService in src/services/livekit.ts
    - Add connect method that creates Room and connects with URL and token
    - Implement enableMicrophone to set local participant mic enabled
    - Add attachAssistantAudio to handle remote audio tracks
    - Implement disconnect method with cleanup
    - Store room and audioElement as private properties
    - _Requirements: 3.1, 3.2, 3.5_
  
  - [x] 6.2 Create server endpoint for LiveKit tokens

    - Implement POST /api/livekit/token route in server/routes/livekit.ts
    - Accept roomName and participantName in request body
    - Generate AccessToken using livekit-server-sdk with API key and secret
    - Add roomJoin grant for specified room
    - Return JWT token and LiveKit URL
    - _Requirements: 3.1, 3.6_
  
  - [x] 6.3 Integrate LiveKit into main page


    - Add connection state management (isConnected, isConnecting)
    - Implement connect handler that fetches token and calls LiveKitService.connect
    - Enable microphone after successful connection
    - Handle remote audio tracks and attach to audio element
    - Add disconnect handler with cleanup
    - Display connection status indicator in UI
    - _Requirements: 3.3, 3.4, 3.7_

- [x] 7. Implement Gemini Live API integration



  - [x] 7.1 Create Gemini service class


    - Implement GeminiService in src/services/gemini.ts
    - Add connect method that establishes WebSocket connection to Gemini Live API
    - Configure session with audio input/output modalities
    - Implement sendAudio method for streaming user audio
    - Add event handlers for onAudioResponse, onTextResponse, onError
    - Store session WebSocket as private property
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [x] 7.2 Define function calling schema


    - Create FUNCTION_DEFINITIONS array with all four tools
    - Define web_search with query parameter
    - Define get_weather with optional city, lat, lon parameters
    - Define geolocate_ip with no parameters
    - Define send_email with to, subject, html parameters
    - Include descriptions for each function
    - _Requirements: 4.6_
  
  - [x] 7.3 Implement function call routing


    - Add onFunctionCall handler to GeminiService
    - Route function calls to appropriate tool services
    - Handle web_search by calling webSearch with user's API key
    - Handle get_weather by calling getCurrentWeather with location resolution
    - Handle geolocate_ip by calling geolocateIP or using settings override
    - Handle send_email by calling server endpoint with SMTP config
    - Return function results to Gemini via sendFunctionResult
    - _Requirements: 4.7, 5.6, 6.1, 7.3, 8.7_
  
  - [x] 7.4 Create system prompt


    - Write system prompt that introduces MARS assistant
    - List available tools with brief descriptions
    - Add guidelines for concise, conversational responses
    - Instruct to invoke tools only when necessary
    - Include confirmation requirement for actions like sending email
    - _Requirements: 4.3, 4.8_
  
  - [x] 7.5 Integrate Gemini into main page


    - Initialize GeminiService after LiveKit connection
    - Stream microphone audio to Gemini
    - Handle audio responses and play through LiveKit or Web Audio API
    - Update conversation state with messages
    - Track token usage for memory reserve calculation
    - Handle errors and display to user
    - _Requirements: 4.4, 4.5_

- [x] 8. Build UI components


  - [x] 8.1 Create Greeting component


    - Implement Greeting component in src/components/Greeting.tsx
    - Compute time-of-day greeting based on current hour (Morning 0-11, Afternoon 12-17, Evening 18-23)
    - Display "Good {timeOfDay}, {name}" with current time
    - Format time using Intl.DateTimeFormat
    - Update every 60 seconds with setInterval
    - _Requirements: 9.1, 9.2, 9.3_
  
  - [x] 8.2 Create DateDisplay component

    - Implement DateDisplay component in src/components/DateDisplay.tsx
    - Format current date as "Weekday, Month Day, Year"
    - Use Intl.DateTimeFormat with user's locale
    - Update at midnight or on mount
    - _Requirements: 9.4_
  
  - [x] 8.3 Create WeatherPill component


    - Implement WeatherPill component in src/components/WeatherPill.tsx
    - Accept weatherApiKey, location, and preferIPGeo as props
    - On mount, resolve location via IP geolocation or settings override
    - Fetch current weather using getCurrentWeather tool
    - Display "{City} • {temp}°C" with weather icon
    - Refresh every 30 minutes
    - Show loading state and handle errors gracefully
    - _Requirements: 9.5, 9.6_
  
  - [x] 8.4 Create MemoryReserve component

    - Implement MemoryReserve component in src/components/MemoryReserve.tsx
    - Accept tokensUsed and tokenBudget as props
    - Calculate percentage as min(100, round(tokensUsed / tokenBudget * 100))
    - Display "Memory Reserve: {percentage}%" with progress bar
    - Update when conversation state changes
    - _Requirements: 9.7, 9.8, 9.9_
  
  - [x] 8.5 Create AudioOrb component with visualization

    - Implement AudioOrb component in src/components/AudioOrb.tsx
    - Accept audioElement and isActive as props
    - Create Web Audio API context and AnalyserNode
    - Configure AnalyserNode with FFT size of 512
    - Connect audio source to analyser
    - Extract frequency data on each animation frame using requestAnimationFrame
    - Map frequency and volume data to orb visual properties (radius, deformation)
    - Animate blob shape based on audio intensity
    - Return to idle state when audio stops
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [x] 9. Integrate components into main page


  - [x] 9.1 Build main page layout

    - Update src/pages/Index.tsx with grid layout
    - Position Greeting in top-left, DateDisplay in top-right
    - Center AudioOrb in middle
    - Position WeatherPill in bottom-left, MemoryReserve in bottom-right
    - Add Start/Stop conversation button
    - Add settings icon link to /settings
    - _Requirements: 9.1, 9.4, 9.5, 9.7, 10.1_
  
  - [x] 9.2 Wire up component data flow


    - Pass user name from settings to Greeting component
    - Pass weather API key and location preferences to WeatherPill
    - Pass conversation token count to MemoryReserve
    - Pass audio element and active state to AudioOrb
    - Update components when settings or conversation state changes
    - _Requirements: 2.3, 9.3, 9.6, 9.8, 9.9, 10.6_

- [x] 10. Implement routing and navigation

  - Add conditional routing based on settings existence
  - Redirect to /onboarding if no settings found
  - Redirect to / (main page) after onboarding completion
  - Allow navigation to /settings from main page
  - Persist current route on page refresh
  - _Requirements: 1.1, 1.7, 2.1_

- [x] 11. Add error handling and validation

  - [x] 11.1 Implement connection error handling

    - Add try-catch blocks around LiveKit and Gemini connections
    - Display toast notifications for connection failures
    - Provide retry button for failed connections
    - Show clear error messages with troubleshooting hints
    - _Requirements: 3.6, 11.6_
  
  - [x] 11.2 Implement API error handling

    - Handle rate limiting errors from external APIs
    - Catch and display errors from tool services
    - Gracefully disable unavailable tools
    - Show user-friendly error messages in toast notifications
    - _Requirements: 5.6, 6.1, 7.5, 8.7_
  
  - [x] 11.3 Implement settings validation

    - Validate all settings fields before saving
    - Show inline error messages for invalid inputs
    - Prevent saving incomplete required fields
    - Validate API key formats (non-empty strings)
    - _Requirements: 1.8, 2.4, 11.7_

- [x] 12. Setup server and deployment configuration

  - [x] 12.1 Create Express server

    - Initialize Express app in server/index.js
    - Add JSON body parser middleware
    - Import and mount LiveKit token route
    - Import and mount email sending route
    - Add error handling middleware
    - Configure CORS for client origin
    - Start server on port 3000
    - _Requirements: 11.5_
  
  - [x] 12.2 Configure environment variables

    - Create .env.example with all required variables
    - Document VITE_LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET
    - Add instructions for obtaining LiveKit credentials
    - Document optional dev defaults for API keys
    - Add .env to .gitignore
    - _Requirements: 11.1, 11.2, 11.4_
  
  - [x] 12.3 Update build scripts

    - Add server build script if using TypeScript
    - Update package.json with server start script
    - Configure concurrent dev script for client and server
    - Add production build instructions to README
    - _Requirements: 11.1_

- [x] 13. Polish and optimization


  - [x] 13.1 Optimize audio streaming

    - Configure LiveKit adaptive streaming and dynacast
    - Implement audio buffer management
    - Minimize latency with WebRTC optimizations
    - _Requirements: 3.5_
  
  - [x] 13.2 Implement caching and performance optimizations

    - Cache weather data with 30-minute TTL
    - Memoize expensive UI components
    - Throttle orb animation to 60fps
    - Limit conversation history to last 50 messages
    - _Requirements: 9.6, 10.5_
  
  - [x] 13.3 Add loading states and transitions

    - Show loading spinner during onboarding geolocation
    - Display connection status during LiveKit/Gemini setup
    - Add smooth transitions for component updates
    - Show skeleton loaders for weather and date components
    - _Requirements: 9.6_

- [ ]* 14. Testing and documentation
  - [ ]* 14.1 Write unit tests for core functionality
    - Test settings load/save with various inputs
    - Test tool services with mocked API responses
    - Test time-of-day greeting logic
    - Test memory reserve percentage calculation
  
  - [ ]* 14.2 Perform integration testing
    - Test complete onboarding flow
    - Test settings update and persistence
    - Test LiveKit connection and audio streaming
    - Test Gemini function calling with each tool
    - Test error scenarios (network loss, invalid keys)
  
  - [ ]* 14.3 Create user documentation
    - Write README with setup instructions
    - Document environment variable configuration
    - Add troubleshooting guide for common issues
    - Include screenshots of onboarding and main interface
    - Document API key acquisition process
