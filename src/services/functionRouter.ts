/**
 * Function Router
 * Routes Gemini function calls to appropriate tool services
 */

import { FunctionCall } from './gemini';
import { Settings } from '@/state/settings';
import { webSearch } from '@/tools/websearch';
import { getCurrentWeather } from '@/tools/weather';
import { geolocateIP } from '@/tools/geo';
import { sendEmail, isSMTPConfigured } from '@/tools/email';
import { 
  getCurrentPlayback, 
  play, 
  pause, 
  skipNext, 
  skipPrevious, 
  setVolume, 
  search,
  refreshAccessToken 
} from '@/tools/spotify';

/**
 * Route function calls from Gemini to appropriate tools
 * @param call - Function call from Gemini
 * @param settings - User settings with API keys and configuration
 * @returns Function execution result
 */
export async function routeFunctionCall(
  call: FunctionCall,
  settings: Settings
): Promise<any> {
  console.log('🔧 Function Call:', call.name);
  console.log('📋 Arguments:', call.args);

  try {
    switch (call.name) {
      case 'web_search':
        return await handleWebSearch(call, settings);

      case 'get_weather':
        return await handleGetWeather(call, settings);

      case 'send_email':
        return await handleSendEmail(call, settings);

      case 'spotify_control':
        return await handleSpotifyControl(call, settings);

      default:
        throw new Error(`Unknown function: ${call.name}`);
    }
  } catch (error) {
    console.error(`Error executing ${call.name}:`, error);
    return {
      error: error instanceof Error ? error.message : 'Function execution failed',
    };
  }
}

/**
 * Handle web search function call
 */
async function handleWebSearch(call: FunctionCall, settings: Settings): Promise<any> {
  const { query } = call.args;

  try {
    const results = await webSearch(query);
    return {
      results: results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.snippet,
      })),
      query,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Web search failed',
    };
  }
}

/**
 * Handle get weather function call
 */
async function handleGetWeather(call: FunctionCall, settings: Settings): Promise<any> {
  const { city, lat, lon } = call.args;

  if (!settings.weatherApiKey) {
    return {
      error: 'Weather service is not configured. Please add a weather API key in settings.',
    };
  }

  try {
    // Determine location
    let weatherParams: { city?: string; lat?: number; lon?: number } = {};

    console.log('🌤️ Weather request - params from Gemini:', { city, lat, lon });
    console.log('📍 Settings location:', settings.locationOverride);

    // Use provided parameters first
    if (lat !== undefined && lon !== undefined) {
      weatherParams = { lat, lon };
      console.log('Using coordinates from request');
    } else if (city) {
      weatherParams = { city };
      console.log('Using city from request');
    } else {
      // Try to use location from settings
      const hasManualCity = settings.locationOverride?.city && settings.locationOverride.city.trim() !== '';
      const hasManualCoords = settings.locationOverride?.lat !== undefined && 
                              settings.locationOverride?.lon !== undefined &&
                              !isNaN(settings.locationOverride.lat) &&
                              !isNaN(settings.locationOverride.lon);

      if (hasManualCity) {
        weatherParams = { city: settings.locationOverride.city };
        console.log('Using city from settings:', settings.locationOverride.city);
      } else if (hasManualCoords) {
        weatherParams = {
          lat: settings.locationOverride.lat,
          lon: settings.locationOverride.lon,
        };
        console.log('Using coordinates from settings');
      } else {
        // Fall back to IP geolocation (default behavior)
        console.log('No location in settings, using IP geolocation');
        const location = await geolocateIP();
        weatherParams = { lat: location.lat, lon: location.lon };
        console.log('Detected location:', location.city);
      }
    }

    const weather = await getCurrentWeather(weatherParams, settings.weatherApiKey);
    return {
      city: weather.city,
      temperature: weather.temp,
      condition: weather.condition,
      humidity: weather.humidity,
      windSpeed: weather.windSpeed,
      units: 'metric',
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Weather lookup failed',
    };
  }
}



/**
 * Handle send email function call
 */
async function handleSendEmail(call: FunctionCall, settings: Settings): Promise<any> {
  const { to, subject, html } = call.args;

  // Check if SMTP is configured
  const smtpConfig = {
    host: settings.smtpHost,
    port: settings.smtpPort,
    user: settings.smtpUser,
    pass: settings.smtpPass,
    from: settings.smtpFrom,
  };

  if (!isSMTPConfigured(smtpConfig)) {
    return {
      error: 'Email is not configured. Please add SMTP settings in the settings page.',
    };
  }

  try {
    const result = await sendEmail({ to, subject, html }, smtpConfig);
    return {
      success: true,
      messageId: result.messageId,
      to,
      subject,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Email sending failed',
    };
  }
}

/**
 * Handle Spotify control function call
 */
async function handleSpotifyControl(call: FunctionCall, settings: Settings): Promise<any> {
  const { action, query, uri, volume } = call.args;

  console.log('🎵 Spotify Control:', action);

  if (!settings.spotifyConnected || !settings.spotifyAccessToken) {
    console.error('❌ Spotify not connected');
    return {
      error: 'Spotify is not connected. Please connect Spotify in settings.',
    };
  }

  // Check if token needs refresh (within 5 minutes of expiry)
  let accessToken = settings.spotifyAccessToken;
  let tokenRefreshed = false;
  let newTokenExpiry: number | undefined;
  
  if (settings.spotifyTokenExpiry && Date.now() >= settings.spotifyTokenExpiry - 300000) {
    if (!settings.spotifyRefreshToken) {
      return {
        error: 'Spotify session expired. Please reconnect in settings.',
      };
    }
    
    try {
      console.log('🔄 Refreshing Spotify token...');
      const refreshed = await refreshAccessToken(settings.spotifyRefreshToken);
      accessToken = refreshed.accessToken;
      newTokenExpiry = Date.now() + (refreshed.expiresIn * 1000);
      tokenRefreshed = true;
      console.log('✅ Token refreshed, expires in', refreshed.expiresIn, 'seconds');
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      return {
        error: 'Spotify session expired. Please reconnect in settings.',
      };
    }
  }

  // Helper to add token info to response
  const addTokenInfo = (response: any) => {
    if (tokenRefreshed) {
      return {
        ...response,
        _tokenRefreshed: true,
        _newAccessToken: accessToken,
        _newTokenExpiry: newTokenExpiry,
      };
    }
    return response;
  };

  try {
    switch (action) {
      case 'current': {
        const playback = await getCurrentPlayback(accessToken);
        if (!playback || !playback.track) {
          return addTokenInfo({
            message: 'No music is currently playing.',
          });
        }
        return addTokenInfo({
          isPlaying: playback.isPlaying,
          track: playback.track.name,
          artist: playback.track.artist,
          album: playback.track.album,
        });
      }

      case 'play': {
        await play(accessToken, uri);
        return addTokenInfo({
          success: true,
          message: uri ? 'Playing requested music' : 'Playback resumed',
        });
      }

      case 'pause': {
        await pause(accessToken);
        return addTokenInfo({
          success: true,
          message: 'Playback paused',
        });
      }

      case 'next': {
        await skipNext(accessToken);
        return addTokenInfo({
          success: true,
          message: 'Skipped to next track',
        });
      }

      case 'previous': {
        await skipPrevious(accessToken);
        return addTokenInfo({
          success: true,
          message: 'Went back to previous track',
        });
      }

      case 'volume': {
        if (volume === undefined) {
          return { error: 'Volume level is required' };
        }
        await setVolume(accessToken, volume);
        return addTokenInfo({
          success: true,
          message: `Volume set to ${volume}%`,
        });
      }

      case 'search': {
        if (!query) {
          return { error: 'Search query is required' };
        }
        const results = await search(accessToken, query, 'track');
        if (results.length === 0) {
          return addTokenInfo({
            message: `No results found for "${query}"`,
          });
        }
        // Play the first result
        await play(accessToken, results[0].uri);
        return addTokenInfo({
          success: true,
          track: results[0].name,
          artist: results[0].artist,
          message: `Playing "${results[0].name}" by ${results[0].artist}`,
        });
      }

      default:
        return { error: `Unknown action: ${action}` };
    }
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Spotify control failed',
    };
  }
}
