import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/components/ui/use-toast';
import { useSettings } from '@/state/SettingsContext';
import { Settings } from '@/state/settings';
import { ChevronDown, Eye, EyeOff, Loader2 } from 'lucide-react';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl">Welcome to MARS</CardTitle>
          <CardDescription>
            Let's get you set up. Step {currentStep} of 2
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentStep === 1 ? (
            <Step1 onNext={() => setCurrentStep(2)} />
          ) : (
            <Step2 onBack={() => setCurrentStep(1)} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Step 1: Basic Information
const step1Schema = z.object({
  name: z.string().min(1, 'Name is required'),
  geminiApiKey: z.string().min(1, 'Gemini API key is required'),
  smtpHost: z.string().optional().or(z.literal('')),
  smtpPort: z.union([z.string(), z.number()]).optional().transform(val => {
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
});

type Step1Data = z.infer<typeof step1Schema>;

interface Step1Props {
  onNext: () => void;
}

const Step1 = ({ onNext }: Step1Props) => {
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);
  const [smtpOpen, setSmtpOpen] = useState(false);
  const { updateSettings } = useSettings();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      geminiApiKey: '',
      smtpHost: '',
      smtpPort: undefined,
      smtpUser: '',
      smtpPass: '',
      smtpFrom: '',
    },
  });

  const onSubmit = async (data: Step1Data) => {
    // Store step 1 data in sessionStorage for step 2
    sessionStorage.setItem('onboarding-step1', JSON.stringify(data));
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
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

      {/* Gemini API Key */}
      <div className="space-y-2">
        <Label htmlFor="geminiApiKey">Gemini API Key *</Label>
        <div className="relative">
          <Input
            id="geminiApiKey"
            type={showApiKey ? 'text' : 'password'}
            placeholder="Enter your Gemini API key"
            {...register('geminiApiKey')}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3"
            onClick={() => setShowApiKey(!showApiKey)}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        {errors.geminiApiKey && (
          <p className="text-sm text-destructive">{errors.geminiApiKey.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Get your API key from{' '}
          <a
            href="https://aistudio.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Google AI Studio
          </a>
        </p>
      </div>

      {/* Optional SMTP Configuration */}
      <Collapsible open={smtpOpen} onOpenChange={setSmtpOpen}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-between">
            <span>Email Configuration (Optional)</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${smtpOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 mt-4">
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
        </CollapsibleContent>
      </Collapsible>

      <Button 
        type="submit" 
        className="w-full" 
        disabled={!isValid || !watch('name') || !watch('geminiApiKey')}
      >
        Next
      </Button>
    </form>
  );
};

// Step 2: Location Setup
interface Step2Props {
  onBack: () => void;
}

const Step2 = ({ onBack }: Step2Props) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<{
    city: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  } | null>(null);
  const [manualCity, setManualCity] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const { updateSettings } = useSettings();
  const { toast } = useToast();
  const navigate = useNavigate();

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      const response = await fetch('https://ipapi.co/json/');
      if (!response.ok) throw new Error('Failed to detect location');
      
      const data = await response.json();
      setDetectedLocation({
        city: data.city,
        region: data.region,
        country: data.country_name,
        lat: data.latitude,
        lon: data.longitude,
      });
      
      toast({
        title: 'Location detected',
        description: `${data.city}, ${data.region}, ${data.country_name}`,
      });
    } catch (error) {
      toast({
        title: 'Detection failed',
        description: 'Could not detect your location. You can enter it manually.',
        variant: 'destructive',
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFinish = async () => {
    try {
      // Get step 1 data from sessionStorage
      const step1Data = JSON.parse(sessionStorage.getItem('onboarding-step1') || '{}');
      
      // Build settings object
      const settings: Settings = {
        name: step1Data.name,
        geminiApiKey: step1Data.geminiApiKey,
        preferIPGeo: true,
      };

      // Add optional SMTP fields if provided
      if (step1Data.smtpHost) settings.smtpHost = step1Data.smtpHost;
      if (step1Data.smtpPort) settings.smtpPort = step1Data.smtpPort;
      if (step1Data.smtpUser) settings.smtpUser = step1Data.smtpUser;
      if (step1Data.smtpPass) settings.smtpPass = step1Data.smtpPass;
      if (step1Data.smtpFrom) settings.smtpFrom = step1Data.smtpFrom;

      // Add location override if manual entry provided
      if (manualCity || manualLat || manualLon) {
        settings.locationOverride = {
          city: manualCity || undefined,
          lat: manualLat ? parseFloat(manualLat) : undefined,
          lon: manualLon ? parseFloat(manualLon) : undefined,
        };
      }

      await updateSettings(settings);
      
      // Clear sessionStorage
      sessionStorage.removeItem('onboarding-step1');
      
      toast({
        title: 'Setup complete!',
        description: 'Welcome to MARS',
      });
      
      navigate('/');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Location Setup</h3>
        <p className="text-sm text-muted-foreground">
          MARS can use your location for weather and time-based features.
        </p>

        {/* Auto-detect */}
        <Button
          onClick={detectLocation}
          disabled={isDetecting}
          variant="outline"
          className="w-full"
        >
          {isDetecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Detecting...
            </>
          ) : (
            'Auto-detect Location'
          )}
        </Button>

        {detectedLocation && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium">Detected Location:</p>
            <p className="text-sm text-muted-foreground">
              {detectedLocation.city}, {detectedLocation.region}, {detectedLocation.country}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {detectedLocation.lat.toFixed(4)}, {detectedLocation.lon.toFixed(4)}
            </p>
          </div>
        )}

        {/* Manual Override */}
        <div className="space-y-4">
          <p className="text-sm font-medium">Or enter manually:</p>
          
          <div className="space-y-2">
            <Label htmlFor="manualCity">City</Label>
            <Input
              id="manualCity"
              placeholder="New York"
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manualLat">Latitude</Label>
              <Input
                id="manualLat"
                type="number"
                step="any"
                placeholder="40.7128"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manualLon">Longitude</Label>
              <Input
                id="manualLon"
                type="number"
                step="any"
                placeholder="-74.0060"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="button" variant="outline" onClick={handleSkip} className="flex-1">
          Skip
        </Button>
        <Button type="button" onClick={handleFinish} className="flex-1">
          Finish
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;
