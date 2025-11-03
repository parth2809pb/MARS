# Requirements Document

## Introduction

This document specifies the requirements for integrating LiveKit real-time audio streaming with Google's Gemini Live API to create a voice-enabled AI assistant (MARS) in a React/TypeScript web application. The system shall provide bidirectional audio communication, function calling for external services (web search, weather, email, geolocation), user settings management, and an onboarding flow.

## Glossary

- **MARS**: The AI assistant system being built
- **LiveKit Client**: The browser-based WebRTC client library (@livekit/client) for real-time audio streaming
- **Gemini Live API**: Google's low-latency bidirectional text/audio API with function calling support
- **Settings Store**: Browser localStorage-based persistence layer for user configuration
- **Onboarding Flow**: Multi-step initial setup wizard for collecting required user information
- **Audio-Reactive Orb**: Visual component that responds to assistant audio frequency data
- **IP Geolocation**: Automatic location detection using the client's IP address
- **Function Calling**: Gemini's capability to invoke external tools during conversation
- **SMTP Transport**: Email delivery mechanism using Nodemailer with user-provided credentials

## Requirements

### Requirement 1: User Onboarding

**User Story:** As a new user, I want to complete an initial setup process so that the system has my required information to function.

#### Acceptance Criteria

1. WHEN the User accesses the Application for the first time, THE MARS System SHALL display an onboarding wizard
2. THE MARS System SHALL require the User to provide a name before proceeding
3. THE MARS System SHALL require the User to provide a valid Gemini API key before proceeding
4. WHERE the User chooses to enable email functionality, THE MARS System SHALL collect SMTP host, port, username, password, and from-address
5. WHEN the User completes Step 1 of onboarding, THE MARS System SHALL attempt IP-based geolocation to determine the User's city and coordinates
6. THE MARS System SHALL allow the User to skip automatic geolocation and proceed without location data
7. WHEN the User completes the onboarding flow, THE MARS System SHALL persist all collected data to the Settings Store
8. THE MARS System SHALL validate that the Gemini API key format is non-empty before allowing progression

### Requirement 2: Settings Management

**User Story:** As a user, I want to view and modify my configuration at any time so that I can update API keys, location preferences, and email settings.

#### Acceptance Criteria

1. THE MARS System SHALL provide a Settings page accessible from the main interface
2. THE MARS System SHALL display all current settings values including name, API keys, SMTP configuration, and location override
3. WHEN the User modifies the name field, THE MARS System SHALL update the greeting display immediately upon save
4. WHEN the User modifies the Gemini API key, THE MARS System SHALL validate the format before persisting
5. WHERE the User provides a location override with city name or coordinates, THE MARS System SHALL use that location instead of IP geolocation for weather queries
6. THE MARS System SHALL provide a toggle labeled "Prefer IP geolocation unless overridden" to control location resolution behavior
7. WHEN the User saves settings changes, THE MARS System SHALL persist the updated configuration to localStorage
8. THE MARS System SHALL load settings from localStorage on application initialization and hydrate the application state

### Requirement 3: LiveKit Audio Streaming

**User Story:** As a user, I want to speak to the assistant and hear its responses in real-time so that I can have natural voice conversations.

#### Acceptance Criteria

1. WHEN the User initiates a conversation, THE MARS System SHALL connect to a LiveKit room using the provided URL and token
2. THE MARS System SHALL enable the User's microphone and stream audio to the LiveKit room
3. WHEN the assistant generates audio output, THE MARS System SHALL receive the audio track from LiveKit
4. THE MARS System SHALL play the assistant audio track through the User's default audio output device
5. THE MARS System SHALL configure adaptive streaming and dynacast for optimal audio quality
6. IF the LiveKit connection fails, THEN THE MARS System SHALL display an error message with connection details
7. THE MARS System SHALL maintain the audio connection until the User explicitly disconnects or closes the application

### Requirement 4: Gemini Live API Integration

**User Story:** As a user, I want the assistant to understand my speech and respond intelligently so that I can get helpful information and complete tasks.

#### Acceptance Criteria

1. WHEN the LiveKit connection is established, THE MARS System SHALL create a Gemini Live API session using the User's API key
2. THE MARS System SHALL configure the Gemini session with audio input and output modalities
3. THE MARS System SHALL provide a system prompt that introduces MARS and describes available tools
4. WHEN the User speaks, THE MARS System SHALL stream audio to the Gemini Live API for processing
5. WHEN Gemini generates a response, THE MARS System SHALL stream the audio output to LiveKit or play it locally
6. THE MARS System SHALL register function definitions for web_search, get_weather, geolocate_ip, and send_email
7. WHEN Gemini invokes a function, THE MARS System SHALL execute the corresponding tool and return results to Gemini
8. THE MARS System SHALL require responses from Gemini to be concise and optimized for spoken delivery

### Requirement 5: Web Search Tool

**User Story:** As a user, I want the assistant to search the web for current information so that I can get answers to questions requiring up-to-date data.

#### Acceptance Criteria

1. WHERE the User has provided a web search API key, THE MARS System SHALL enable the web_search function
2. WHEN Gemini invokes web_search with a query parameter, THE MARS System SHALL call the Tavily Search API endpoint
3. THE MARS System SHALL include the User's API key in the Authorization header as a Bearer token
4. THE MARS System SHALL request a maximum of 5 search results with titles, URLs, and snippets
5. WHEN the Tavily API returns results, THE MARS System SHALL format and return them to Gemini for synthesis
6. IF the web search API key is not configured, THEN THE MARS System SHALL inform Gemini that web search is unavailable

### Requirement 6: Weather Information Tool

**User Story:** As a user, I want the assistant to provide current weather information for my location so that I can plan my activities.

#### Acceptance Criteria

1. WHERE the User has provided a weather API key, THE MARS System SHALL enable the get_weather function
2. WHEN Gemini invokes get_weather, THE MARS System SHALL determine the target location from parameters or User settings
3. WHERE latitude and longitude are provided, THE MARS System SHALL query OpenWeatherMap using coordinate-based lookup
4. WHERE only a city name is provided, THE MARS System SHALL query OpenWeatherMap using city-based lookup
5. THE MARS System SHALL request weather data in metric units (Celsius)
6. WHEN OpenWeatherMap returns data, THE MARS System SHALL extract temperature, condition description, and icon code
7. THE MARS System SHALL return formatted weather information to Gemini including city name and temperature in Celsius

### Requirement 7: IP Geolocation Tool

**User Story:** As a user, I want the system to automatically detect my location so that I receive relevant local information without manual configuration.

#### Acceptance Criteria

1. WHEN Gemini invokes geolocate_ip, THE MARS System SHALL call the ipapi.co JSON endpoint
2. THE MARS System SHALL extract city, region, country, latitude, and longitude from the ipapi response
3. WHERE the User has disabled IP geolocation preference in settings, THE MARS System SHALL use the location override instead
4. WHEN ipapi returns location data, THE MARS System SHALL return the formatted location information to Gemini
5. IF the ipapi request fails, THEN THE MARS System SHALL return an error message indicating geolocation is unavailable

### Requirement 8: Email Sending Tool

**User Story:** As a user, I want the assistant to send emails on my behalf so that I can communicate without leaving the conversation.

#### Acceptance Criteria

1. WHERE the User has configured SMTP settings, THE MARS System SHALL enable the send_email function
2. WHEN Gemini invokes send_email with to, subject, and html parameters, THE MARS System SHALL create an SMTP transport using the User's credentials
3. THE MARS System SHALL configure the transport with the User's SMTP host, port, username, and password
4. WHERE the SMTP port is 465, THE MARS System SHALL enable secure connection mode
5. THE MARS System SHALL send the email with the User's configured from-address
6. WHEN the email is sent successfully, THE MARS System SHALL return the messageId to Gemini
7. IF the SMTP configuration is incomplete, THEN THE MARS System SHALL inform Gemini that email functionality is unavailable

### Requirement 9: User Interface Components

**User Story:** As a user, I want to see relevant information displayed on screen so that I have context about my session and environment.

#### Acceptance Criteria

1. THE MARS System SHALL display a greeting in the top-left showing "Hello, {name}" with a time-of-day greeting (Morning/Afternoon/Evening)
2. THE MARS System SHALL compute the time-of-day greeting based on the User's local hour (0-11: Morning, 12-17: Afternoon, 18-23: Evening)
3. THE MARS System SHALL update the time display every 60 seconds using Intl.DateTimeFormat
4. THE MARS System SHALL display the current weekday and full date in the top-right formatted with Intl.DateTimeFormat
5. THE MARS System SHALL display a weather pill in the bottom-left showing city name and temperature in Celsius
6. WHEN the application loads, THE MARS System SHALL resolve location via IP or settings override and fetch current weather
7. THE MARS System SHALL display a Memory Reserve card in the bottom-right showing context usage as a percentage
8. THE MARS System SHALL compute memory usage based on token count or message count from the Gemini session
9. THE MARS System SHALL update the Memory Reserve percentage as new messages are added to the conversation

### Requirement 10: Audio-Reactive Visualization

**User Story:** As a user, I want to see a visual representation of the assistant speaking so that I have feedback that the system is responding.

#### Acceptance Criteria

1. THE MARS System SHALL display a central orb component that reacts to assistant audio
2. WHEN assistant audio is playing, THE MARS System SHALL create a Web Audio API AnalyserNode connected to the audio stream
3. THE MARS System SHALL configure the AnalyserNode with an FFT size of 512 for frequency analysis
4. THE MARS System SHALL extract frequency data from the AnalyserNode on each animation frame
5. THE MARS System SHALL map frequency and volume data to the orb's visual properties (radius, deformation, color)
6. WHILE the assistant is speaking, THE MARS System SHALL animate the orb to reflect audio intensity
7. WHEN the assistant stops speaking, THE MARS System SHALL return the orb to its idle state

### Requirement 11: Configuration Security

**User Story:** As a developer, I want to support both development and production configuration patterns so that the application is secure and flexible.

#### Acceptance Criteria

1. THE MARS System SHALL support build-time environment variables prefixed with VITE_ for development defaults
2. THE MARS System SHALL prioritize runtime user-provided settings over build-time environment variables
3. THE MARS System SHALL store all user settings in browser localStorage with a versioned key
4. THE MARS System SHALL NOT expose API keys or SMTP credentials in client-side code or network requests visible to other users
5. WHERE SMTP functionality is required, THE MARS System SHALL proxy email requests through a server-side endpoint
6. THE MARS System SHALL validate that required settings (name, Gemini API key) are present before allowing core functionality
7. THE MARS System SHALL provide clear error messages when required configuration is missing
