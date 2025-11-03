/**
 * LiveKit Service
 * Manages WebRTC connection for real-time audio streaming
 */

import { Room, RoomEvent, RemoteAudioTrack, LocalAudioTrack, Track } from 'livekit-client';

export interface LiveKitConfig {
  url: string;
  token: string;
}

export class LiveKitService {
  private room: Room | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private localAudioTrack: LocalAudioTrack | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
  private processor: ScriptProcessorNode | null = null;
  private onAudioDataCallback: ((data: ArrayBuffer) => void) | null = null;
  private playbackAnalyser: AnalyserNode | null = null;

  /**
   * Connect to a LiveKit room
   * @param config - LiveKit configuration with URL and token
   */
  async connect(config: LiveKitConfig): Promise<void> {
    if (this.room) {
      throw new Error('Already connected to a room');
    }

    try {
      this.room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          autoGainControl: true,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Set up event listeners before connecting
      this.setupEventListeners();

      // Connect to the room
      await this.room.connect(config.url, config.token);
    } catch (error) {
      this.room = null;
      throw new Error(`Failed to connect to LiveKit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enable microphone and start publishing audio
   */
  async enableMicrophone(): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to a room');
    }

    try {
      await this.room.localParticipant.setMicrophoneEnabled(true);
      
      // Get the local audio track
      this.localAudioTrack = this.room.localParticipant.getTrackPublication(Track.Source.Microphone)?.track as LocalAudioTrack;
    } catch (error) {
      throw new Error(`Failed to enable microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disable microphone
   */
  async disableMicrophone(): Promise<void> {
    if (!this.room) {
      throw new Error('Not connected to a room');
    }

    try {
      await this.room.localParticipant.setMicrophoneEnabled(false);
      this.localAudioTrack = null;
    } catch (error) {
      throw new Error(`Failed to disable microphone: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Attach assistant audio track to an audio element for playback
   * @param track - Remote audio track from assistant
   */
  attachAssistantAudio(track: RemoteAudioTrack): void {
    if (!this.audioElement) {
      this.audioElement = document.createElement('audio');
      this.audioElement.autoplay = true;
    }

    track.attach(this.audioElement);
  }

  /**
   * Get the audio element for visualization
   */
  getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }

  /**
   * Get the audio analyser for visualization
   */
  getAudioAnalyser(): AnalyserNode | null {
    return this.playbackAnalyser;
  }

  /**
   * Get the local audio track for processing
   */
  getLocalAudioTrack(): LocalAudioTrack | null {
    return this.localAudioTrack;
  }

  private voiceActivityThreshold: number = 0.02; // Threshold for voice detection
  private onVoiceActivityCallback: ((isActive: boolean) => void) | null = null;

  /**
   * Start capturing audio and sending to callback
   * @param callback - Function to receive audio data chunks
   * @param onVoiceActivity - Optional callback for voice activity detection
   */
  async startAudioCapture(
    callback: (data: ArrayBuffer) => void,
    onVoiceActivity?: (isActive: boolean) => void
  ): Promise<void> {
    if (!this.localAudioTrack) {
      throw new Error('Microphone not enabled');
    }

    this.onAudioDataCallback = callback;
    this.onVoiceActivityCallback = onVoiceActivity || null;

    // Get the MediaStream from the track
    const mediaStream = this.localAudioTrack.mediaStream;
    if (!mediaStream) {
      throw new Error('No media stream available');
    }

    // Create audio context
    this.audioContext = new AudioContext({ sampleRate: 16000 });
    this.mediaStreamSource = this.audioContext.createMediaStreamSource(mediaStream);

    // Create processor for capturing audio data
    this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

    let wasActive = false;

    this.processor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);
      
      // Calculate RMS (Root Mean Square) for voice activity detection
      let sum = 0;
      for (let i = 0; i < inputData.length; i++) {
        sum += inputData[i] * inputData[i];
      }
      const rms = Math.sqrt(sum / inputData.length);
      const isActive = rms > this.voiceActivityThreshold;

      // Trigger callback on voice activity change
      if (this.onVoiceActivityCallback && isActive !== wasActive) {
        this.onVoiceActivityCallback(isActive);
        wasActive = isActive;
      }
      
      // Convert Float32Array to Int16Array (PCM16)
      const pcm16 = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }

      if (this.onAudioDataCallback) {
        this.onAudioDataCallback(pcm16.buffer);
      }
    };

    this.mediaStreamSource.connect(this.processor);
    this.processor.connect(this.audioContext.destination);
  }

  /**
   * Stop capturing audio
   */
  stopAudioCapture(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.mediaStreamSource) {
      this.mediaStreamSource.disconnect();
      this.mediaStreamSource = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.onAudioDataCallback = null;
  }

  private playbackAudioContext: AudioContext | null = null;
  private audioQueue: ArrayBuffer[] = [];
  private isPlaying: boolean = false;
  private nextStartTime: number = 0;
  private currentSource: AudioBufferSourceNode | null = null;
  private scheduledSources: AudioBufferSourceNode[] = [];

  /**
   * Play audio data from Gemini
   * @param audioData - PCM16 audio data
   */
  async playAudio(audioData: ArrayBuffer): Promise<void> {
    // Initialize audio context if needed
    if (!this.playbackAudioContext) {
      this.playbackAudioContext = new AudioContext({ sampleRate: 24000 });
      this.nextStartTime = this.playbackAudioContext.currentTime;
      
      // Create analyser for visualization
      this.playbackAnalyser = this.playbackAudioContext.createAnalyser();
      this.playbackAnalyser.fftSize = 512;
      this.playbackAnalyser.connect(this.playbackAudioContext.destination);
      console.log('🎵 Created audio analyser for visualization');
    }

    // Convert PCM16 to Float32
    const pcm16 = new Int16Array(audioData);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
    }

    // Create audio buffer
    const audioBuffer = this.playbackAudioContext.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    // Schedule the audio to play
    const source = this.playbackAudioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect through analyser for visualization
    if (this.playbackAnalyser) {
      source.connect(this.playbackAnalyser);
      console.log('🔊 Audio source connected through analyser');
    } else {
      source.connect(this.playbackAudioContext.destination);
      console.log('⚠️ No analyser, connecting directly');
    }

    // Schedule playback at the next available time
    const startTime = Math.max(this.nextStartTime, this.playbackAudioContext.currentTime);
    source.start(startTime);
    
    // Track this source for interruption
    this.scheduledSources.push(source);
    source.onended = () => {
      const index = this.scheduledSources.indexOf(source);
      if (index > -1) {
        this.scheduledSources.splice(index, 1);
      }
    };
    
    // Update next start time
    this.nextStartTime = startTime + audioBuffer.duration;
  }

  /**
   * Interrupt current audio playback
   * Stops all currently playing and scheduled audio
   */
  interruptAudio(): void {
    // Stop all scheduled audio sources
    this.scheduledSources.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source may have already stopped
      }
    });
    this.scheduledSources = [];

    // Reset timing
    if (this.playbackAudioContext) {
      this.nextStartTime = this.playbackAudioContext.currentTime;
    }
  }

  /**
   * Check if connected to a room
   */
  isConnected(): boolean {
    return this.room !== null && this.room.state === 'connected';
  }

  /**
   * Disconnect from the room and clean up resources
   */
  disconnect(): void {
    this.stopAudioCapture();
    this.interruptAudio();

    if (this.playbackAudioContext) {
      this.playbackAudioContext.close();
      this.playbackAudioContext = null;
    }

    if (this.room) {
      this.room.disconnect();
      this.room = null;
    }

    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.srcObject = null;
      this.audioElement = null;
    }

    this.localAudioTrack = null;
    this.nextStartTime = 0;
    this.audioQueue = [];
    this.isPlaying = false;
  }

  /**
   * Set up event listeners for room events
   */
  private setupEventListeners(): void {
    if (!this.room) return;

    this.room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === Track.Kind.Audio && track instanceof RemoteAudioTrack) {
        this.attachAssistantAudio(track);
      }
    });
  }
}

/**
 * Fetch LiveKit token from server
 * @param roomName - Name of the room to join
 * @param participantName - Name of the participant
 * @returns LiveKit configuration with URL and token
 */
export async function fetchLiveKitToken(
  roomName: string,
  participantName: string
): Promise<LiveKitConfig> {
  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${serverUrl}/api/livekit/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        roomName,
        participantName,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch token: ${response.status}`);
    }

    const data = await response.json();
    return {
      url: data.url,
      token: data.token,
    };
  } catch (error) {
    throw new Error(`Failed to fetch LiveKit token: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
