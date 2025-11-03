import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/state/SettingsContext';
import { Settings as SettingsType, settingsSchema } from '@/state/settings';
import { ArrowLeft, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, clearSettings, isLoading } = useSettings();
  const { toast } = useToast();
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showWeatherKey, setShowWeatherKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testingApi, setTestingApi] = useState<string | null>(null);
  const hasProcessedCallback = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset,
  } = useForm<SettingsType>({
    mode: 'onSubmit',
    defaultValues: settings || undefined,
  });

  // Reset form when settings change
  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  // Removed unused saveSection function

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    try {
      // Validate required fields
      if (!data.name || data.name.trim() === '') {
        throw new Error('Name is required');
      }
      if (!data.geminiApiKey || data.geminiApiKey.trim() === '') {
        throw new Error('Gemini API key is required');
      }

      // Build cleaned data object, preserving all fields from current settings
      const cleanedData: any = { ...settings };

      // Update required fields
      cleanedData.name = data.name.trim();
      cleanedData.geminiApiKey = data.geminiApiKey.trim();
      cleanedData.preferIPGeo = data.preferIPGeo ?? true;

      // Update optional API keys (preserve empty strings as undefined)
      cleanedData.weatherApiKey = data.weatherApiKey?.trim() || undefined;

      // Update SMTP fields individually (preserve empty strings as undefined)
      cleanedData.smtpHost = data.smtpHost?.trim() || undefined;
      cleanedData.smtpPort = data.smtpPort ? parseInt(data.smtpPort, 10) : undefined;
      cleanedData.smtpUser = data.smtpUser?.trim() || undefined;
      cleanedData.smtpPass = data.smtpPass?.trim() || undefined;
      cleanedData.smtpFrom = data.smtpFrom?.trim() || undefined;

      // Update location override fields individually
      if (data.locationOverride) {
        const city = data.locationOverride.city?.trim() || undefined;
        const lat = data.locationOverride.lat ? parseFloat(data.locationOverride.lat) : undefined;
        const lon = data.locationOverride.lon ? parseFloat(data.locationOverride.lon) : undefined;
        
        cleanedData.locationOverride = {
          city,
          lat: !isNaN(lat as any) ? lat : undefined,
          lon: !isNaN(lon as any) ? lon : undefined,
        };
      } else {
        cleanedData.locationOverride = undefined;
      }

      // Validate with Zod schema
      const validated = settingsSchema.parse(cleanedData);
      
      await updateSettings(validated);
      reset(validated);
      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = () => {
    clearSettings();
    toast({
      title: 'Data cleared',
      description: 'All settings have been removed.',
    });
    navigate('/onboarding');
  };

  const testGeminiKey = async () => {
    const apiKey = watch('geminiApiKey');
    if (!apiKey) {
      toast({
        title: 'No API key',
        description: 'Please enter a Gemini API key first.',
        variant: 'destructive',
      });
      return;
    }

    setTestingApi('gemini');
    try {
      // Simple test: try to import and initialize the SDK
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
      
      // Try a simple generation
      const result = await model.generateContent('Hello');
      const response = await result.response;
      
      if (response) {
        toast({
          title: 'Success',
          description: 'Gemini API key is valid!',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Invalid API key',
        description: error.message || 'Failed to validate Gemini API key.',
        variant: 'destructive',
      });
    } finally {
      setTestingApi(null);
    }
  };

  const testWeatherKey = async () => {
    const apiKey = watch('weatherApiKey');
    if (!apiKey) {
      toast({
        title: 'No API key',
        description: 'Please enter a Weather API key first.',
        variant: 'destructive',
      });
      return;
    }

    setTestingApi('weather');
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=London&units=metric&appid=${apiKey}`
      );
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Weather API key is valid!',
        });
      } else {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      toast({
        title: 'Invalid API key',
        description: 'Failed to validate Weather API key.',
        variant: 'destructive',
      });
    } finally {
      setTestingApi(null);
    }
  };



  const preferIPGeo = watch('preferIPGeo');

  const handleConnectSpotify = () => {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    
    if (!clientId) {
      toast({
        title: 'Configuration Error',
        description: 'Spotify Client ID is not configured. Please add VITE_SPOTIFY_CLIENT_ID to your .env file.',
        variant: 'destructive',
      });
      console.error('Missing VITE_SPOTIFY_CLIENT_ID in environment variables');
      return;
    }

    // Use loopback IP (127.0.0.1) as per Spotify requirements - localhost is not allowed
    const port = window.location.port;
    const redirectUri = `http://127.0.0.1:${port}/settings`;
    
    const scopes = [
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming'
    ].join(' ');

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}`;

    window.location.href = authUrl;
  };

  const handleDisconnectSpotify = async () => {
    try {
      await updateSettings({
        ...settings!,
        spotifyAccessToken: undefined,
        spotifyRefreshToken: undefined,
        spotifyTokenExpiry: undefined,
        spotifyConnected: false,
      });
      toast({
        title: 'Spotify Disconnected',
        description: 'Your Spotify account has been disconnected.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to disconnect Spotify.',
        variant: 'destructive',
      });
    }
  };

  // Handle Spotify OAuth callback
  useEffect(() => {
    const handleSpotifyCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      // Wait for settings to load before processing
      if (isLoading) {
        return;
      }

      // Only process if we have a code, haven't processed it yet, and haven't connected yet
      if (!code || hasProcessedCallback.current || settings?.spotifyConnected) {
        return;
      }

      // Mark as processed immediately to prevent duplicate calls
      hasProcessedCallback.current = true;

      // Check if user has completed onboarding first
      if (!settings || !settings.name || !settings.geminiApiKey) {
        toast({
          title: 'Setup Required',
          description: 'Please complete onboarding before connecting Spotify.',
          variant: 'destructive',
        });
        // Clean up URL and redirect to onboarding
        window.history.replaceState({}, document.title, '/onboarding');
        navigate('/onboarding');
        return;
      }

      try {
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
        const port = window.location.port;
        const redirectUri = `http://127.0.0.1:${port}/settings`;

        const response = await fetch(`${serverUrl}/api/spotify/auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to authenticate');
        }

        const data = await response.json();
        const expiryTime = Date.now() + (data.expiresIn * 1000);

        await updateSettings({
          ...settings,
          spotifyAccessToken: data.accessToken,
          spotifyRefreshToken: data.refreshToken,
          spotifyTokenExpiry: expiryTime,
          spotifyConnected: true,
        });

        toast({
          title: 'Spotify Connected',
          description: 'You can now control music with voice commands!',
        });

        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Spotify connection error:', error);
        toast({
          title: 'Connection Failed',
          description: error instanceof Error ? error.message : 'Failed to connect Spotify',
          variant: 'destructive',
        });
        // Clean up URL on error
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    handleSpotifyCallback();
  }, [settings, updateSettings, toast, navigate, isLoading]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your MARS configuration</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API Keys */}
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Configure your API credentials</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gemini API Key */}
              <div className="space-y-2">
                <Label htmlFor="geminiApiKey">Gemini API Key *</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="geminiApiKey"
                      type={showGeminiKey ? 'text' : 'password'}
                      placeholder="Enter your Gemini API key"
                      {...register('geminiApiKey')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                    >
                      {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testGeminiKey}
                    disabled={testingApi === 'gemini'}
                  >
                    {testingApi === 'gemini' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                {errors.geminiApiKey && (
                  <p className="text-sm text-destructive">{errors.geminiApiKey.message}</p>
                )}
              </div>

              <Separator />

              {/* Weather API Key */}
              <div className="space-y-2">
                <Label htmlFor="weatherApiKey">Weather API Key (Optional)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="weatherApiKey"
                      type={showWeatherKey ? 'text' : 'password'}
                      placeholder="OpenWeatherMap API key"
                      {...register('weatherApiKey')}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowWeatherKey(!showWeatherKey)}
                    >
                      {showWeatherKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={testWeatherKey}
                    disabled={testingApi === 'weather' || !watch('weatherApiKey')}
                  >
                    {testingApi === 'weather' ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Test'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Get your key from{' '}
                  <a
                    href="https://openweathermap.org/api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    OpenWeatherMap
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>SMTP settings for sending emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    placeholder="smtp.gmail.com"
                    {...register('smtpHost')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    type="number"
                    placeholder="587"
                    {...register('smtpPort')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input
                  id="smtpUser"
                  placeholder="your-email@gmail.com"
                  {...register('smtpUser')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPass">SMTP Password</Label>
                <div className="relative">
                  <Input
                    id="smtpPass"
                    type={showSmtpPass ? 'text' : 'password'}
                    placeholder="Your SMTP password"
                    {...register('smtpPass')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowSmtpPass(!showSmtpPass)}
                  >
                    {showSmtpPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpFrom">From Email Address</Label>
                <Input
                  id="smtpFrom"
                  type="email"
                  placeholder="your-email@gmail.com"
                  {...register('smtpFrom')}
                />
                {errors.smtpFrom && (
                  <p className="text-sm text-destructive">{errors.smtpFrom.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Spotify Integration */}
          <Card>
            <CardHeader>
              <CardTitle>Spotify Integration</CardTitle>
              <CardDescription>Connect your Spotify account for music control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings?.spotifyConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-green-500">Spotify Connected</p>
                        <p className="text-xs text-muted-foreground">You can control music with voice commands</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDisconnectSpotify}
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect Spotify to control music playback with voice commands. Requires Spotify Premium.
                  </p>
                  
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs font-medium mb-2">Setup Instructions:</p>
                    <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline text-primary">Spotify Developer Dashboard</a></li>
                      <li>Create an app or edit existing one</li>
                      <li>Add this Redirect URI: <code className="bg-background px-1 py-0.5 rounded text-xs">http://127.0.0.1:{window.location.port}/settings</code></li>
                      <li>Note: Use 127.0.0.1 (not localhost) - Spotify requirement</li>
                      <li>Add VITE_SPOTIFY_CLIENT_ID to your .env file</li>
                      <li>Add SPOTIFY_CLIENT_SECRET to your .env file</li>
                      <li>Restart the server</li>
                    </ol>
                  </div>

                  <Button
                    type="button"
                    onClick={handleConnectSpotify}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    Connect Spotify
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Location Preferences</CardTitle>
              <CardDescription>Configure location detection and overrides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Prefer IP Geolocation</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically detect location from your IP address
                  </p>
                </div>
                <Switch
                  checked={preferIPGeo}
                  onCheckedChange={(checked) => setValue('preferIPGeo', checked, { shouldDirty: true })}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <p className="text-sm font-medium">Manual Location Override</p>
                
                <div className="space-y-2">
                  <Label htmlFor="locationCity">City</Label>
                  <Input
                    id="locationCity"
                    placeholder="New York"
                    {...register('locationOverride.city')}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="locationLat">Latitude</Label>
                    <Input
                      id="locationLat"
                      type="number"
                      step="any"
                      placeholder="40.7128"
                      {...register('locationOverride.lat')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="locationLon">Longitude</Label>
                    <Input
                      id="locationLon"
                      type="number"
                      step="any"
                      placeholder="-74.0060"
                      {...register('locationOverride.lon')}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Manage your settings and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={!isDirty || isSaving}
                  className="flex-1"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => reset()}
                  disabled={!isDirty}
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>

              <Separator />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" className="w-full">
                    Clear All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your settings and data. You will need to complete the onboarding process again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearData}>
                      Clear Data
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
};

export default Settings;
