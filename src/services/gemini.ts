/**
 * Gemini Live API Service
 * Manages bidirectional audio streaming with Google's Gemini Multimodal Live API
 */

/**
 * Function definitions for Gemini function calling
 */
export const FUNCTION_DEFINITIONS = [
  {
    name: 'web_search',
    description: 'Search the web for current information. Use this when the user asks about recent events, news, or information that requires up-to-date data.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to look up on the web',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_weather',
    description: 'Get current weather information. ALWAYS use this function when the user asks about: weather, temperature, how hot/cold it is, if it\'s raining, forecast, or any weather-related question. Location is automatically detected.',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'City name (optional - will auto-detect if not provided)',
        },
        lat: {
          type: 'number',
          description: 'Latitude coordinate (optional)',
        },
        lon: {
          type: 'number',
          description: 'Longitude coordinate (optional)',
        },
      },
    },
  },
  {
    name: 'send_email',
    description: 'Send an email on behalf of the user. Always confirm with the user before sending. Use this when the user explicitly asks to send an email.',
    parameters: {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          description: 'Recipient email address',
        },
        subject: {
          type: 'string',
          description: 'Email subject line',
        },
        html: {
          type: 'string',
          description: 'Email body in HTML format',
        },
      },
      required: ['to', 'subject', 'html'],
    },
  },
  {
    name: 'spotify_control',
    description: 'Control music playback on Spotify. Use this when the user mentions music, songs, or playback controls like play, pause, skip, next, previous, volume, or asks what is playing.',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['play', 'pause', 'next', 'previous', 'volume', 'current', 'search'],
          description: 'The playback action to perform',
        },
        query: {
          type: 'string',
          description: 'Search query for tracks, artists, or albums (only for search action)',
        },
        uri: {
          type: 'string',
          description: 'Spotify URI to play (only for play action)',
        },
        volume: {
          type: 'number',
          description: 'Volume level from 0 to 100 (only for volume action)',
        },
      },
      required: ['action'],
    },
  },
];

export interface GeminiConfig {
  apiKey: string;
  systemPrompt: string;
}

export interface FunctionCall {
  name: string;
  args: Record<string, any>;
  id: string;
}

export type FunctionHandler = (call: FunctionCall) => Promise<any>;

export class GeminiService {
  private ws: WebSocket | null = null;
  private apiKey: string = '';
  private onAudioResponseHandler: ((audio: ArrayBuffer) => void) | null = null;
  private onTextResponseHandler: ((text: string) => void) | null = null;
  private onErrorHandler: ((error: Error) => void) | null = null;
  private functionHandler: FunctionHandler | null = null;

  /**
   * Connect to Gemini Multimodal Live API via WebSocket
   * @param config - Gemini configuration with API key and system prompt
   */
  async connect(config: GeminiConfig): Promise<void> {
    try {
      this.apiKey = config.apiKey;
      
      // Connect to Gemini Multimodal Live API
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${config.apiKey}`;
      
      this.ws = new WebSocket(url);
      
      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('WebSocket not initialized'));
          return;
        }

        this.ws.onopen = () => {
          // Send setup message
          const setupMessage = {
            setup: {
              model: 'models/gemini-2.0-flash-exp',
              generation_config: {
                response_modalities: ['AUDIO'],
                speech_config: {
                  voice_config: {
                    prebuilt_voice_config: {
                      voice_name: 'Puck'
                    }
                  }
                }
              },
              system_instruction: {
                parts: [{ text: config.systemPrompt }]
              },
              tools: [
                { function_declarations: FUNCTION_DEFINITIONS }
              ]
            }
          };
          
          console.log('🔌 Connected to Gemini');
          console.log('📋 Registered functions:', FUNCTION_DEFINITIONS.map(f => f.name));
          
          this.ws?.send(JSON.stringify(setupMessage));
          
          resolve();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(new Error('Failed to connect to Gemini Live API'));
        };

        this.ws.onmessage = async (event) => {
          await this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          // Disconnected
        };
      });
    } catch (error) {
      throw new Error(`Failed to connect to Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Handle incoming WebSocket messages
   */
  private async handleMessage(data: string | Blob): Promise<void> {
    try {
      // If data is a Blob, convert to text first
      let messageText: string;
      if (data instanceof Blob) {
        messageText = await data.text();
      } else {
        messageText = data;
      }

      const message = JSON.parse(messageText);
      
      // Log all messages for debugging (except audio to avoid spam)
      if (!message.serverContent?.modelTurn?.parts?.some((p: any) => p.inlineData?.mimeType?.startsWith('audio'))) {
        console.log('📨 Gemini message:', JSON.stringify(message, null, 2));
      }
      
      // Handle setup complete
      if (message.setupComplete) {
        console.log('✅ Gemini setup complete');
        return;
      }

      // Handle tool calls (new format)
      if (message.toolCall?.functionCalls) {
        console.log('📞 Gemini toolCall received');
        for (const functionCall of message.toolCall.functionCalls) {
          console.log('📞 Function:', functionCall.name);
          console.log('📋 Args:', functionCall.args);
          console.log('🆔 ID:', functionCall.id);
          await this.handleFunctionCall({
            name: functionCall.name,
            args: functionCall.args || {},
            id: functionCall.id
          });
        }
      }

      // Handle server content
      if (message.serverContent) {
        const parts = message.serverContent.modelTurn?.parts || [];
        
        for (const part of parts) {
          // Handle audio response
          if (part.inlineData?.mimeType?.startsWith('audio/pcm')) {
            const audioData = this.base64ToArrayBuffer(part.inlineData.data);
            if (this.onAudioResponseHandler) {
              this.onAudioResponseHandler(audioData);
            }
          }
          
          // Handle text response
          if (part.text) {
            console.log('💬 Gemini text response:', part.text);
            if (this.onTextResponseHandler) {
              this.onTextResponseHandler(part.text);
            }
          }
          
          // Handle function calls (old format - keeping for compatibility)
          if (part.functionCall) {
            console.log('📞 Gemini calling function (old format):', part.functionCall.name);
            console.log('📋 Function args:', part.functionCall.args);
            console.log('🆔 Function ID:', part.functionCall.id);
            await this.handleFunctionCall({
              name: part.functionCall.name,
              args: part.functionCall.args,
              id: part.functionCall.id || Date.now().toString()
            });
          }
        }
      }

      // Handle errors in server content
      if (message.serverContent?.modelTurn?.parts) {
        for (const part of message.serverContent.modelTurn.parts) {
          if (part.executableCode || part.codeExecutionResult) {
            console.error('⚠️ Gemini tried to execute code:', part);
            console.error('This should not happen - functions should be called, not executed');
          }
        }
      }

      // Handle tool call cancellation
      if (message.toolCallCancellation) {
        console.log('🚫 Tool call cancelled');
      }

    } catch (error) {
      console.error('❌ Error handling message:', error);
      if (this.onErrorHandler) {
        this.onErrorHandler(error instanceof Error ? error : new Error('Unknown error'));
      }
    }
  }

  /**
   * Convert base64 to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Send audio data to Gemini
   * @param audioData - Audio data as ArrayBuffer (PCM16 format)
   */
  async sendAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Gemini');
    }

    try {
      const base64Audio = this.arrayBufferToBase64(audioData);
      
      this.ws.send(JSON.stringify({
        realtimeInput: {
          mediaChunks: [{
            mimeType: 'audio/pcm',
            data: base64Audio
          }]
        }
      }));
    } catch (error) {
      if (this.onErrorHandler) {
        this.onErrorHandler(error instanceof Error ? error : new Error('Unknown error'));
      }
      throw error;
    }
  }

  /**
   * Send text message to Gemini
   * @param text - Text message to send
   */
  async sendText(text: string): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to Gemini');
    }

    try {
      this.ws.send(JSON.stringify({
        clientContent: {
          turns: [{
            role: 'user',
            parts: [{ text }]
          }],
          turnComplete: true
        }
      }));
    } catch (error) {
      if (this.onErrorHandler) {
        this.onErrorHandler(error instanceof Error ? error : new Error('Unknown error'));
      }
      throw error;
    }
  }

  /**
   * Send function result back to Gemini
   * @param callId - Function call ID
   * @param result - Function execution result
   */
  async sendFunctionResult(callId: string, result: any): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Cannot send function result - WebSocket not open');
      throw new Error('Not connected to Gemini');
    }

    try {
      const message = {
        toolResponse: {
          functionResponses: [{
            id: callId,
            response: result
          }]
        }
      };
      
      console.log('📤 Sending function result message:', JSON.stringify(message, null, 2));
      this.ws.send(JSON.stringify(message));
      console.log('✅ Function result sent successfully');
    } catch (error) {
      console.error('❌ Error sending function result:', error);
      if (this.onErrorHandler) {
        this.onErrorHandler(error instanceof Error ? error : new Error('Unknown error'));
      }
      throw error;
    }
  }

  /**
   * Handle function call from Gemini
   * @param call - Function call details
   */
  private async handleFunctionCall(call: FunctionCall): Promise<void> {
    console.log('🔧 handleFunctionCall started for:', call.name);
    
    if (!this.functionHandler) {
      console.error('❌ No function handler registered!');
      await this.sendFunctionResult(call.id, {
        error: 'No function handler registered',
      });
      return;
    }

    try {
      console.log('⚙️ Executing function handler...');
      const result = await this.functionHandler(call);
      console.log('✅ Function executed successfully, result:', result);
      console.log('📤 Sending result back to Gemini...');
      await this.sendFunctionResult(call.id, result);
      console.log('✅ Result sent to Gemini');
    } catch (error) {
      console.error('❌ Function call error:', error);
      const errorResult = {
        error: error instanceof Error ? error.message : 'Function execution failed',
      };
      console.log('📤 Sending error result to Gemini:', errorResult);
      await this.sendFunctionResult(call.id, errorResult);
    }
  }

  /**
   * Register function call handler
   * @param handler - Function to handle function calls
   */
  onFunctionCall(handler: FunctionHandler): void {
    this.functionHandler = handler;
  }

  /**
   * Register audio response handler
   * @param handler - Function to handle audio responses
   */
  onAudioResponse(handler: (audio: ArrayBuffer) => void): void {
    this.onAudioResponseHandler = handler;
  }

  /**
   * Register text response handler
   * @param handler - Function to handle text responses
   */
  onTextResponse(handler: (text: string) => void): void {
    this.onTextResponseHandler = handler;
  }

  /**
   * Register error handler
   * @param handler - Function to handle errors
   */
  onError(handler: (error: Error) => void): void {
    this.onErrorHandler = handler;
  }

  /**
   * Get message count for memory tracking
   */
  getMessageCount(): number {
    return 0; // Not tracked in streaming mode
  }

  /**
   * Disconnect from Gemini
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
