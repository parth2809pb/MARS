import { useEffect, useState } from "react";
import weatherBg from "@/assets/weather-bg.svg";
import { getCurrentWeather, WeatherData } from "@/tools/weather";
import { geolocateIP } from "@/tools/geo";
import { useSettings } from "@/state/SettingsContext";

export const HudWeather = () => {
  const { settings } = useSettings();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!settings?.weatherApiKey) {
        setError("No API key");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Determine location - prioritize manual override, then IP geo
        let weatherParams: { city?: string; lat?: number; lon?: number } = {};

        // Check for manual location override
        const hasManualCity = settings.locationOverride?.city && settings.locationOverride.city.trim() !== '';
        const hasManualCoords = settings.locationOverride?.lat !== undefined && 
                                settings.locationOverride?.lon !== undefined &&
                                !isNaN(settings.locationOverride.lat) &&
                                !isNaN(settings.locationOverride.lon);

        if (hasManualCity) {
          weatherParams = { city: settings.locationOverride.city };
        } else if (hasManualCoords) {
          weatherParams = {
            lat: settings.locationOverride.lat,
            lon: settings.locationOverride.lon,
          };
        } else {
          // Fall back to IP geolocation (default behavior)
          const location = await geolocateIP();
          weatherParams = { lat: location.lat, lon: location.lon };
        }

        const weatherData = await getCurrentWeather(weatherParams, settings.weatherApiKey);
        setWeather(weatherData);
      } catch (err) {
        console.error("Weather fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeather();

    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [settings]);

  const displayLocation = weather?.city || "Unknown";
  const displayTemp = weather?.temp ?? "--";

  return (
    <div className="relative animate-fade-in" style={{ width: "424px", height: "110px" }}>
      {/* SVG Background */}
      <img 
        src={weatherBg} 
        alt="" 
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Content overlay */}
      <div className="relative h-full flex items-center justify-start gap-6" style={{ paddingLeft: '126px' }}>
        <div className="flex flex-col max-w-[80px]">
          <span className="text-lg font-medium text-white tracking-wide leading-tight">
            {isLoading ? "Loading..." : error || displayLocation}
          </span>
        </div>
        <div className="w-px h-12 bg-white" />
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white tracking-wide">{displayTemp}°</span>
          <span className="text-sm font-normal text-white tracking-wide">Celsius</span>
        </div>
      </div>
    </div>
  );
};
