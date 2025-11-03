import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings, loadSettings, saveSettings as saveSettingsToStorage, clearSettings as clearSettingsFromStorage } from './settings';

interface SettingsContextValue {
  settings: Settings | null;
  isLoading: boolean;
  updateSettings: (settings: Settings) => Promise<void>;
  clearSettings: () => void;
  hasSettings: boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    const loadInitialSettings = () => {
      try {
        const loaded = loadSettings();
        setSettings(loaded);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialSettings();
  }, []);

  const updateSettings = async (newSettings: Settings): Promise<void> => {
    try {
      saveSettingsToStorage(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  const clearSettings = (): void => {
    clearSettingsFromStorage();
    setSettings(null);
  };

  const value: SettingsContextValue = {
    settings,
    isLoading,
    updateSettings,
    clearSettings,
    hasSettings: settings !== null,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to access settings context
 * Must be used within a SettingsProvider
 */
export const useSettings = (): SettingsContextValue => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
