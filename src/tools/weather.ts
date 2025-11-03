/**
 * Weather Tool
 * Uses OpenWeatherMap API to get current weather data
 */

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  icon: string;
  humidity?: number;
  windSpeed?: number;
}

export interface WeatherParams {
  city?: string;
  lat?: number;
  lon?: number;
}

/**
 * Get current weather for a location
 * @param params - Location parameters (city name or coordinates)
 * @param apiKey - OpenWeatherMap API key
 * @returns Weather data
 */
export async function getCurrentWeather(
  params: WeatherParams,
  apiKey: string
): Promise<WeatherData> {
  if (!apiKey) {
    throw new Error('Weather API key is not configured');
  }

  // Validate that we have either city or coordinates
  if (!params.city && (!params.lat || !params.lon)) {
    throw new Error('Either city name or coordinates (lat, lon) must be provided');
  }

  try {
    let url = 'https://api.openweathermap.org/data/2.5/weather?';

    // Use coordinates if provided, otherwise use city name
    if (params.lat !== undefined && params.lon !== undefined) {
      url += `lat=${params.lat}&lon=${params.lon}`;
    } else if (params.city) {
      url += `q=${encodeURIComponent(params.city)}`;
    }

    url += `&units=metric&appid=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API key');
      }
      if (response.status === 404) {
        throw new Error('Location not found');
      }
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }
      throw new Error(`Weather request failed with status ${response.status}`);
    }

    const data = await response.json();

    return {
      city: data.name,
      temp: Math.round(data.main.temp),
      condition: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch weather data');
  }
}

/**
 * Get weather icon URL from OpenWeatherMap
 * @param iconCode - Icon code from weather data
 * @returns URL to weather icon
 */
export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
