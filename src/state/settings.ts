import { z } from 'zod';

// Settings schema with validation
export const settingsSchema = z.object({
  // Required fields
  name: z.string().min(1, 'Name is required'),
  geminiApiKey: z.string().min(1, 'Gemini API key is required'),
  
  // Optional API keys - allow empty strings
  weatherApiKey: z.string().optional().or(z.literal('')),
  
  // Optional SMTP configuration - allow empty strings
  smtpHost: z.string().optional().or(z.literal('')),
  smtpPort: z.union([z.string(), z.number()]).optional().nullable().transform(val => {
    if (!val || val === '') return undefined;
    const num = typeof val === 'string' ? parseInt(val, 10) : val;
    return isNaN(num) ? undefined : num;
  }),
  smtpUser: z.string().optional().or(z.literal('')),
  smtpPass: z.string().optional().or(z.literal('')),
  smtpFrom: z.string().optional().or(z.literal('')).refine(
    (val) => !val || val === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    { message: 'Invalid email address' }
  ),
  
  // Location preferences
  locationOverride: z.object({
    city: z.string().optional().or(z.literal('')),
    lat: z.union([z.string(), z.number()]).optional().nullable().transform(val => {
      if (!val || val === '' || val === null) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    }),
    lon: z.union([z.string(), z.number()]).optional().nullable().transform(val => {
      if (!val || val === '' || val === null) return undefined;
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? undefined : num;
    }),
  }).optional(),
  
  preferIPGeo: z.boolean().default(true),
  
  // Spotify integration
  spotifyAccessToken: z.string().optional().or(z.literal('')),
  spotifyRefreshToken: z.string().optional().or(z.literal('')),
  spotifyTokenExpiry: z.number().optional(),
  spotifyConnected: z.boolean().optional().default(false),
});

export type Settings = z.infer<typeof settingsSchema>;

// Storage key for localStorage
const STORAGE_KEY = 'mars.settings.v1';

/**
 * Load settings from localStorage
 * Returns null if no settings exist or if parsing fails
 */
export const loadSettings = (): Settings | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    
    if (!raw) {
      return null;
    }
    
    const parsed = JSON.parse(raw);
    const validated = settingsSchema.parse(parsed);
    return validated;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
};

/**
 * Save settings to localStorage
 * Validates settings before saving
 */
export const saveSettings = (settings: Settings): void => {
  try {
    const validated = settingsSchema.parse(settings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Invalid settings data');
  }
};

/**
 * Clear all settings from localStorage
 */
export const clearSettings = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

/**
 * Check if settings exist in localStorage
 */
export const hasSettings = (): boolean => {
  return localStorage.getItem(STORAGE_KEY) !== null;
};

/**
 * Get environment variable defaults for development
 */
export const getEnvDefaults = (): Partial<Settings> => {
  return {
    geminiApiKey: import.meta.env.VITE_GEMINI_KEY || '',
    weatherApiKey: import.meta.env.VITE_WEATHER_KEY || '',
  };
};
