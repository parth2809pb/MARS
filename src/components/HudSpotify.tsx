import { useEffect, useState, useCallback } from "react";
import { useSettings } from "@/state/SettingsContext";
import { getCurrentPlayback, SpotifyPlaybackState, play, pause, skipNext, skipPrevious, refreshAccessToken } from "@/tools/spotify";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";

export const HudSpotify = () => {
  const { settings, updateSettings } = useSettings();
  const [playback, setPlayback] = useState<SpotifyPlaybackState | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTokenRefresh = useCallback(async () => {
    if (!settings?.spotifyRefreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing Spotify token...');
    const { accessToken, expiresIn } = await refreshAccessToken(settings.spotifyRefreshToken);
    
    // Update settings with new token
    const newSettings = {
      ...settings,
      spotifyAccessToken: accessToken,
      spotifyTokenExpiry: Date.now() + (expiresIn * 1000)
    };
    
    await updateSettings(newSettings);
    console.log('✅ Token refreshed successfully');
    
    return accessToken;
  }, [settings, updateSettings]);

  useEffect(() => {
    const fetchPlayback = async () => {
      if (!settings?.spotifyConnected || !settings?.spotifyAccessToken) {
        setError("Not connected");
        setIsInitialLoad(false);
        return;
      }

      try {
        setError(null);
        
        let accessToken = settings.spotifyAccessToken;
        
        // Check if token is expired or about to expire (within 5 minutes)
        if (settings.spotifyTokenExpiry && Date.now() >= settings.spotifyTokenExpiry - 300000) {
          try {
            accessToken = await handleTokenRefresh();
          } catch (refreshErr) {
            console.error('Token refresh failed:', refreshErr);
            setError("Session expired");
            setIsInitialLoad(false);
            return;
          }
        }
        
        const state = await getCurrentPlayback(accessToken);
        setPlayback(state);
        setIsInitialLoad(false);
      } catch (err) {
        console.error("Spotify fetch error:", err);
        
        // Check if it's a 401 and we have a refresh token
        const errorMsg = err instanceof Error ? err.message : '';
        if (errorMsg.includes('401') && settings.spotifyRefreshToken) {
          console.log('Got 401, attempting token refresh...');
          try {
            const newToken = await handleTokenRefresh();
            // Retry the request with new token
            const state = await getCurrentPlayback(newToken);
            setPlayback(state);
            setIsInitialLoad(false);
          } catch (refreshErr) {
            console.error('Token refresh failed:', refreshErr);
            setError("Session expired");
            setIsInitialLoad(false);
          }
        } else {
          setError("Failed to load");
          setIsInitialLoad(false);
        }
      }
    };

    fetchPlayback();

    // Refresh every 3 seconds
    const interval = setInterval(fetchPlayback, 3000);
    return () => clearInterval(interval);
  }, [settings, handleTokenRefresh]);

  const handlePlayPause = async () => {
    if (!settings?.spotifyAccessToken || !playback) return;
    
    try {
      if (playback.isPlaying) {
        await pause(settings.spotifyAccessToken);
      } else {
        await play(settings.spotifyAccessToken);
      }
      // Refresh immediately
      const state = await getCurrentPlayback(settings.spotifyAccessToken);
      setPlayback(state);
    } catch (err) {
      console.error("Play/pause error:", err);
    }
  };

  const handleNext = async () => {
    if (!settings?.spotifyAccessToken) return;
    
    try {
      await skipNext(settings.spotifyAccessToken);
      // Wait a bit for Spotify to update
      setTimeout(async () => {
        const state = await getCurrentPlayback(settings.spotifyAccessToken!);
        setPlayback(state);
      }, 500);
    } catch (err) {
      console.error("Skip next error:", err);
    }
  };

  const handlePrevious = async () => {
    if (!settings?.spotifyAccessToken) return;
    
    try {
      await skipPrevious(settings.spotifyAccessToken);
      // Wait a bit for Spotify to update
      setTimeout(async () => {
        const state = await getCurrentPlayback(settings.spotifyAccessToken!);
        setPlayback(state);
      }, 500);
    } catch (err) {
      console.error("Skip previous error:", err);
    }
  };

  // Only show loading on initial load
  if (isInitialLoad) {
    return (
      <div className="relative animate-fade-in overflow-hidden" style={{ width: "424px", height: "110px", borderRadius: "55px" }}>
        <div className="absolute inset-0 bg-black" />
        <div className="relative h-full flex items-center justify-center">
          <span className="text-sm text-white/70 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!settings?.spotifyConnected) {
    return (
      <div className="relative animate-fade-in overflow-hidden" style={{ width: "424px", height: "110px", borderRadius: "55px" }}>
        <div className="absolute inset-0 bg-black" />
        <div className="relative h-full flex items-center justify-center">
          <span className="text-sm text-white/70 font-medium">Spotify Not Connected</span>
        </div>
      </div>
    );
  }

  if (error || !playback || !playback.track) {
    return (
      <div className="relative animate-fade-in overflow-hidden" style={{ width: "424px", height: "110px", borderRadius: "55px" }}>
        <div className="absolute inset-0 bg-black" />
        <div className="relative h-full flex items-center justify-center">
          <span className="text-sm text-white/70 font-medium">No Music Playing</span>
        </div>
      </div>
    );
  }

  const { track, isPlaying } = playback;

  return (
    <div className="relative animate-fade-in overflow-hidden" style={{ width: "424px", height: "110px", borderRadius: "55px" }}>
      {/* Album Art Background */}
      {track.albumArt && (
        <img 
          src={track.albumArt} 
          alt={track.album}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Content overlay */}
      <div className="relative h-full flex items-center justify-between gap-4 px-8">
        {/* Track Info */}
        <div className="flex-1 min-w-0 flex flex-col">
          <span className="text-base font-medium text-white tracking-wide truncate">
            {track.name}
          </span>
          <span className="text-sm text-white/70 tracking-wide truncate">
            {track.artist}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-white/30" />

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevious}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Previous"
          >
            <SkipBack className="h-4 w-4 text-white" />
          </button>
          
          <button
            onClick={handlePlayPause}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-5 w-5 text-white fill-white" />
            ) : (
              <Play className="h-5 w-5 text-white fill-white" />
            )}
          </button>
          
          <button
            onClick={handleNext}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Next"
          >
            <SkipForward className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
