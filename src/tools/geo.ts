/**
 * Geolocation Tool
 * Uses ipapi.co to get location from IP address
 */

export interface LocationData {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  timezone?: string;
  ip?: string;
}

/**
 * Get location data from IP address
 * Uses ipapi.co free tier (no API key required)
 * @returns Location data including city, region, country, and coordinates
 */
export async function geolocateIP(): Promise<LocationData> {
  try {
    const response = await fetch('https://ipapi.co/json/');

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(`Geolocation request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Check if we got an error response
    if (data.error) {
      throw new Error(data.reason || 'Failed to geolocate IP');
    }

    return {
      city: data.city,
      region: data.region,
      country: data.country_name,
      lat: data.latitude,
      lon: data.longitude,
      timezone: data.timezone,
      ip: data.ip,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to geolocate IP address');
  }
}

/**
 * Format location data as a readable string
 * @param location - Location data
 * @returns Formatted location string
 */
export function formatLocation(location: LocationData): string {
  return `${location.city}, ${location.region}, ${location.country}`;
}
