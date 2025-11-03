import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HudGreeting } from "@/components/HudGreeting";
import { HudDateTime } from "@/components/HudDateTime";
import { HudWeather } from "@/components/HudWeather";
import { HudSpotify } from "@/components/HudSpotify";
import { FerroFluidBall } from "@/components/FerroFluidBall";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useSettings } from "@/state/SettingsContext";
import { LiveKitService, fetchLiveKitToken } from "@/services/livekit";
import { GeminiService, FUNCTION_DEFINITIONS } from "@/services/gemini";
import { getPersonalizedSystemPrompt } from "@/services/systemPrompt";
import { routeFunctionCall } from "@/services/functionRouter";
import { Settings, Mic, MicOff, Loader2 } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { settings, isLoading: settingsLoading, updateSettings } = useSettings();
  const { toast } = useToast();
  
  const [liveKitService] = useState(() => new LiveKitService());
  const [geminiService] = useState(() => new GeminiService());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [audioAnalyser, setAudioAnalyser] = useState<AnalyserNode | null>(null);
  const [messageCount, setMessageCount] = useState(0);
  const [recognition, setRecognition] = useState<any>(null);

  // Redirect to onboarding if no settings
  useEffect(() => {
    if (!settingsLoading && !settings) {
      navigate('/onboarding');
    }
  }, [settings, settingsLoading, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveKitService.isConnected()) {
        liveKitService.disconnect();
      }
      if (geminiService.isConnected()) {
        geminiService.disconnect();
      }
      if (recognition) {
        recognition.stop();
      }
    };
  }, [liveKitService, geminiService, recognition]);

  // Set up Gemini event handlers
  useEffect(() => {
    if (!settings) return;

    // Handle audio responses from Gemini
    geminiService.onAudioResponse(async (audioData) => {
      try {
        await liveKitService.playAudio(audioData);
      } catch (error) {
        // Audio playback failed
      }
    });

    // Handle text responses from Gemini (for debugging)
    geminiService.onTextResponse((text) => {
      toast({
        title: 'MARS',
        description: text,
      });
      setMessageCount(geminiService.getMessageCount());
    });

    // Handle errors
    geminiService.onError((error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    });

    // Handle function calls
    geminiService.onFunctionCall(async (call) => {
      console.log('🎯 Function call received in UI:', call);
      
      toast({
        title: 'Tool Invoked',
        description: `Using ${call.name}...`,
      });
      
      try {
        const result = await routeFunctionCall(call, settings);
        console.log('✅ Function result:', result);
        
        // Check if Spotify token was refreshed
        if (result._tokenRefreshed && result._newAccessToken && result._newTokenExpiry) {
          console.log('🔄 Updating Spotify token in settings...');
          const newSettings = {
            ...settings,
            spotifyAccessToken: result._newAccessToken,
            spotifyTokenExpiry: result._newTokenExpiry,
          };
          await updateSettings(newSettings);
          console.log('✅ Spotify token updated in settings');
          
          // Remove internal fields before returning to Gemini
          delete result._tokenRefreshed;
          delete result._newAccessToken;
          delete result._newTokenExpiry;
        }
        
        toast({
          title: 'Tool Complete',
          description: `${call.name} finished`,
        });
        
        return result;
      } catch (error) {
        console.error('❌ Function execution error:', error);
        toast({
          title: 'Tool Error',
          description: error instanceof Error ? error.message : 'Function failed',
          variant: 'destructive',
        });
        throw error;
      }
    });
  }, [settings, geminiService, toast]);

  const handleConnect = async () => {
    if (!settings) return;

    setIsConnecting(true);
    try {
      // Connect to Gemini first
      const systemPrompt = getPersonalizedSystemPrompt(settings.name);
      await geminiService.connect({
        apiKey: settings.geminiApiKey,
        systemPrompt,
      });
      
      // Fetch LiveKit token from server
      const config = await fetchLiveKitToken('mars-room', settings.name);
      
      // Connect to LiveKit room
      await liveKitService.connect(config);
      setIsConnected(true);
      
      // Enable microphone
      await liveKitService.enableMicrophone();
      setIsMicEnabled(true);
      
      // Start capturing audio and sending to Gemini with voice activity detection
      await liveKitService.startAudioCapture(
        async (audioData) => {
          try {
            await geminiService.sendAudio(audioData);
          } catch (error) {
            console.error('Failed to send audio to Gemini:', error);
          }
        },
        (isActive) => {
          // When user starts speaking, interrupt AI's audio
          if (isActive) {
            liveKitService.interruptAudio();
          }
        }
      );
      
      // Get audio element for visualization
      const audio = liveKitService.getAudioElement();
      setAudioElement(audio);
      
      // Poll for analyser (it's created when first audio plays)
      const checkAnalyser = setInterval(() => {
        const analyser = liveKitService.getAudioAnalyser();
        if (analyser) {
          console.log('🎵 Got audio analyser!');
          setAudioAnalyser(analyser);
          clearInterval(checkAnalyser);
        }
      }, 100);
      
      toast({
        title: 'Connected',
        description: 'MARS is listening - speak naturally',
      });

      // Send initial greeting via text to start conversation
      await geminiService.sendText('Hello! I just connected. Please greet me briefly.');
    } catch (error) {
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to connect',
        variant: 'destructive',
      });
      setIsConnected(false);
      setIsMicEnabled(false);
      
      // Cleanup on error
      if (geminiService.isConnected()) {
        geminiService.disconnect();
      }
      if (liveKitService.isConnected()) {
        liveKitService.disconnect();
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (recognition) {
      if (recognition.cleanup) {
        recognition.cleanup();
      } else {
        try {
          recognition.stop();
        } catch (e) {
          // Ignore
        }
      }
      setRecognition(null);
    }
    liveKitService.disconnect();
    geminiService.disconnect();
    setIsConnected(false);
    setIsMicEnabled(false);
    setAudioElement(null);
    setAudioAnalyser(null);
    setMessageCount(0);
    
    toast({
      title: 'Disconnected',
      description: 'Conversation ended',
    });
  };

  const toggleMicrophone = async () => {
    try {
      if (isMicEnabled) {
        liveKitService.stopAudioCapture();
        await liveKitService.disableMicrophone();
        setIsMicEnabled(false);
      } else {
        await liveKitService.enableMicrophone();
        await liveKitService.startAudioCapture(
          async (audioData) => {
            try {
              await geminiService.sendAudio(audioData);
            } catch (error) {
              console.error('Failed to send audio to Gemini:', error);
            }
          },
          (isActive) => {
            // When user starts speaking, interrupt AI's audio
            if (isActive) {
              liveKitService.interruptAudio();
            }
          }
        );
        setIsMicEnabled(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to toggle microphone',
        variant: 'destructive',
      });
    }
  };

  // Show loading while checking settings
  if (settingsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Don't render if no settings (will redirect)
  if (!settings) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background font-hud p-12 flex flex-col justify-between relative">
      {/* Settings Button - Top Right */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 z-50"
        onClick={() => navigate('/settings')}
      >
        <Settings className="h-5 w-5" />
      </Button>

      {/* Ferro Fluid Ball - Center of screen */}
      <FerroFluidBall audioElement={audioElement} audioAnalyser={audioAnalyser} isActive={isConnected && isMicEnabled} />
      
      {/* Top Section */}
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-6">
          {/* MARS Title */}
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold text-black tracking-wider">M.A.R.S.</h1>
            <p className="text-sm text-black/70 tracking-wide">Multi Agent Reasoning System</p>
          </div>
          <HudGreeting name={settings.name} />
        </div>
        <HudDateTime />
      </div>

      {/* Center Controls */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-64 z-10 flex gap-4">
        {!isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="lg"
            className="px-8"
          >
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              'Start Conversation'
            )}
          </Button>
        ) : (
          <>
            <Button
              onClick={toggleMicrophone}
              variant={isMicEnabled ? 'default' : 'outline'}
              size="lg"
            >
              {isMicEnabled ? (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Mute
                </>
              ) : (
                <>
                  <MicOff className="mr-2 h-5 w-5" />
                  Unmute
                </>
              )}
            </Button>
            <Button
              onClick={handleDisconnect}
              variant="destructive"
              size="lg"
            >
              End Conversation
            </Button>
          </>
        )}
      </div>

      {/* Connection Status Indicator */}
      {isConnected && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 bg-green-500/20 text-green-500 px-4 py-2 rounded-full border border-green-500/50">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Connected</span>
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className="flex justify-between items-end">
        <HudWeather />
        <HudSpotify />
      </div>
    </div>
  );
};

export default Index;
