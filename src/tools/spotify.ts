/**
 * Spotify Tool
 * Controls Spotify playback via Web API
 */

export interface SpotifyConfig {
  accessToken: string;
  refreshToken: string;
}

export interface SpotifyTrack {
  name: string;
  artist: string;
  album: string;
  uri: string;
  albumArt?: string;
  duration: number;
  progress: number;
}

export interface SpotifyPlaybackState {
  isPlaying: boolean;
  track: SpotifyTrack | null;
  volume: number;
  device: string | null;
}

/**
 * Get current playback state
 */
export async function getCurrentPlayback(accessToken: string): Promise<SpotifyPlaybackState | null> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.status === 204 || response.status === 404) {
      return null; // No active device
    }

    if (!response.ok) {
      throw new Error(`Failed to get playback state: ${response.status}`);
    }

    const data = await response.json();

    if (!data.item) {
      return null;
    }

    return {
      isPlaying: data.is_playing,
      track: {
        name: data.item.name,
        artist: data.item.artists.map((a: any) => a.name).join(', '),
        album: data.item.album.name,
        uri: data.item.uri,
        albumArt: data.item.album.images[0]?.url,
        duration: data.item.duration_ms,
        progress: data.progress_ms
      },
      volume: data.device.volume_percent,
      device: data.device.name
    };
  } catch (error) {
    throw new Error(`Failed to get playback: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Play or resume playback
 */
export async function play(accessToken: string, uri?: string): Promise<void> {
  try {
    const body: any = {};
    if (uri) {
      if (uri.includes('track')) {
        body.uris = [uri];
      } else {
        body.context_uri = uri;
      }
    }

    const response = await fetch('https://api.spotify.com/v1/me/player/play', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to play');
    }
  } catch (error) {
    throw new Error(`Failed to play: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Pause playback
 */
export async function pause(accessToken: string): Promise<void> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/pause', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to pause');
    }
  } catch (error) {
    throw new Error(`Failed to pause: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Skip to next track
 */
export async function skipNext(accessToken: string): Promise<void> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to skip');
    }
  } catch (error) {
    throw new Error(`Failed to skip: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Skip to previous track
 */
export async function skipPrevious(accessToken: string): Promise<void> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me/player/previous', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to go back');
    }
  } catch (error) {
    throw new Error(`Failed to go back: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Set volume
 */
export async function setVolume(accessToken: string, volume: number): Promise<void> {
  try {
    const volumePercent = Math.max(0, Math.min(100, Math.round(volume)));
    
    const response = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volumePercent}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to set volume');
    }
  } catch (error) {
    throw new Error(`Failed to set volume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Search for tracks, albums, or playlists
 */
export async function search(
  accessToken: string,
  query: string,
  type: 'track' | 'album' | 'playlist' = 'track'
): Promise<any[]> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`);
    }

    const data = await response.json();
    const items = data[`${type}s`]?.items || [];

    return items.map((item: any) => ({
      name: item.name,
      uri: item.uri,
      artist: item.artists ? item.artists.map((a: any) => a.name).join(', ') : undefined,
      album: item.album?.name
    }));
  } catch (error) {
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Add track to queue
 */
export async function addToQueue(accessToken: string, uri: string): Promise<void> {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (!response.ok && response.status !== 204) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || 'Failed to add to queue');
    }
  } catch (error) {
    throw new Error(`Failed to add to queue: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${serverUrl}/api/spotify/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const data = await response.json();
    return {
      accessToken: data.accessToken,
      expiresIn: data.expiresIn
    };
  } catch (error) {
    throw new Error(`Token refresh failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
