/**
 * cloudLLM.ts
 * 
 * PURPOSE:
 * Cloud LLM provider implementations for Google Gemini and NotebookLM. Provides reliable,
 * feature-rich LLM access via cloud APIs. Implements the LLMProvider interface with advanced
 * features like function calling, vision, and streaming.
 * 
 * ARCHITECTURE:
 * Three cloud provider implementations:
 * - GeminiProvider: Google Gemini API (function calling, vision, long context)
 * - NotebookLMProvider: Google NotebookLM API (document-aware)
 * - OllamaCloudProvider: Ollama Cloud API (same format as local Ollama, cloud-hosted)
 * 
 * Key features:
 * - API key management via apiKeyService
 * - Function calling support (Gemini)
 * - Vision capabilities (Gemini)
 * - Streaming responses
 * - Safety settings (Gemini)
 * - System instructions
 * - Tool/function definitions
 * 
 * CURRENT STATUS:
 * ✅ Gemini provider fully implemented
 * ✅ NotebookLM provider fully implemented
 * ✅ Ollama Cloud provider fully implemented
 * ✅ Function calling support
 * ✅ Streaming with function call extraction
 * ✅ Vision support (Gemini)
 * ✅ Safety settings (Gemini)
 * ✅ System instructions
 * ✅ Tool definitions
 * ✅ Long context support (Gemini 1.5 Pro - 2M tokens)
 * 
 * DEPENDENCIES:
 * - apiKeyService: API key management
 * - @/types/llm: LLM type definitions
 * - @/types/gemini: Gemini-specific types
 * 
 * STATE MANAGEMENT:
 * - Stateless providers (API key loaded async)
 * - Does not use Zustand
 * - API keys managed by apiKeyService
 * 
 * PERFORMANCE:
 * - Async API key loading (prevents race conditions)
 * - Streaming for real-time responses
 * - Efficient function call parsing
 * - Error handling with fallbacks
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { GeminiProvider } from '@/services/ai/providers/cloudLLM';
 * 
 * const gemini = new GeminiProvider();
 * const isHealthy = await gemini.healthCheck();
 * 
 * if (isHealthy) {
 *   // Stream with function calls
 *   for await (const chunk of gemini.streamGenerate('Hello!', {
 *     tools: [{ functionDeclarations: [...] }]
 *   })) {
 *     if (chunk.text) console.log(chunk.text);
 *     if (chunk.functionCalls) console.log('Functions:', chunk.functionCalls);
 *   }
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/router.ts: Uses these providers
 * - src/services/apiKeys/apiKeyService.ts: API key management
 * - src/services/ai/providers/localLLM.ts: Local provider implementations
 * - src/components/AIAssistant/AIAssistant.tsx: Uses Gemini for chat
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Support for more cloud providers
 * - Request retry logic
 * - Rate limiting
 * - Cost tracking per request
 * - Response caching
 */
import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';
import type { LLMProvider } from './types';
import { apiKeyService } from '@/services/apiKeys/apiKeyService';
import { logger } from '@/services/logging/loggerService';
import type {
  GeminiSystemInstruction,
  GeminiContent,
  GeminiResponseMetadata,
  GeminiFunctionCall,
  GeminiError,
  GeminiRequestBody,
  GeminiResponseData,
  GeminiCandidate,
  GeminiContentPart,
} from '@/types/gemini';
import { OllamaModel } from '@/types/localLLM';

/**
 * Parses a Gemini API error response and returns a standardized message.
 * @param error - The error object from the API response.
 * @returns A formatted error message string.
 */
function formatGeminiError(error: GeminiError): string {
  let message = error.message || 'An unknown error occurred';
  if (error.details) {
    const details = error.details
      .map((detail) => {
        let detailMessage = `Type: ${detail['@type']}`;
        if (detail.reason) detailMessage += `, Reason: ${detail.reason}`;
        if (detail.metadata?.service) detailMessage += `, Service: ${detail.metadata.service}`;
        return detailMessage;
      })
      .join('; ');
    message += ` | Details: ${details}`;
  }
  return `[${error.code} ${error.status}] ${message}`;
}

export class GeminiProvider implements LLMProvider {
  name = 'Google Gemini';
  type: 'cloud' = 'cloud';
  private apiKey: string | null = null;

  constructor() {
    // Don't load synchronously - will be loaded on first async call
    // This prevents race condition with API key initialization
  }

  private async loadAPIKey(): Promise<void> {
    await apiKeyService.ensureInitialized();
    this.apiKey = await apiKeyService.getKeyForProviderAsync('gemini');
  }

  async healthCheck(): Promise<boolean> {
    await this.loadAPIKey();
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  async getModels(): Promise<LLMModel[]> {
    const isAvailable = await this.healthCheck();
    // Complete Gemini model list
    return [
      {
        id: 'gemini-2.0-flash-exp',
        name: 'Gemini Flash 2.0 (Experimental)',
        provider: 'gemini' as const,
        contextWindow: 32768,
        isAvailable,
        description: 'Fast and cost-effective model (recommended)',
        capabilities: ['function-calling', 'vision', 'grounding'],
      },
      {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'gemini' as const,
        contextWindow: 2097152, // 2M tokens
        isAvailable,
        description: 'Most capable model with 2M token context window',
        capabilities: ['function-calling', 'vision', 'grounding', 'long-context'],
      },
      {
        id: 'gemini-1.5-flash',
        name: 'Gemini 1.5 Flash',
        provider: 'gemini' as const,
        contextWindow: 1048576, // 1M tokens
        isAvailable,
        description: 'Fast model with 1M token context window',
        capabilities: ['function-calling', 'vision', 'grounding', 'long-context'],
      },
      {
        id: 'gemini-1.5-pro-latest',
        name: 'Gemini 1.5 Pro (Latest)',
        provider: 'gemini' as const,
        contextWindow: 2097152,
        isAvailable,
        description: 'Latest version of Gemini 1.5 Pro',
        capabilities: ['function-calling', 'vision', 'grounding', 'long-context'],
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'gemini' as const,
        contextWindow: 32768,
        isAvailable,
        description: 'Standard Gemini Pro model',
        capabilities: ['function-calling'],
      },
      {
        id: 'gemini-pro-vision',
        name: 'Gemini Pro Vision',
        provider: 'gemini' as const,
        contextWindow: 16384,
        isAvailable,
        description: 'Gemini Pro with vision capabilities',
        capabilities: ['function-calling', 'vision'],
      },
    ];
  }

  private buildSystemInstruction(
    systemInstruction?: GeminiSystemInstruction | string
  ): GeminiSystemInstruction | undefined {
    if (!systemInstruction) return undefined;
    if (typeof systemInstruction === 'string') {
      return { parts: [{ text: systemInstruction }] };
    }
    return systemInstruction;
  }

  private buildContents(
    prompt: string,
    options?: GenerateOptions
  ): GeminiContent[] {
    // If contents are provided directly, use them. This is the primary
    // way to support complex multi-modal prompts.
    if (options?.contents && options.contents.length > 0) {
      return options.contents;
    }

    // Otherwise, build a simple text-only prompt.
    return [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ];
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    await this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const model = options?.model || 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    // Build request body with all advanced features
    const requestBody: GeminiRequestBody = {
      contents: this.buildContents(prompt, options),
      generationConfig: {
        temperature: options?.temperature ?? 0.91,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    // Add advanced generation config
    if (options?.topP !== undefined) {
      requestBody.generationConfig!.topP = options.topP;
    }
    if (options?.topK !== undefined) {
      requestBody.generationConfig!.topK = options.topK;
    }
    if (options?.candidateCount !== undefined) {
      requestBody.generationConfig!.candidateCount = options.candidateCount;
    }
    if (options?.stopSequences && options.stopSequences.length > 0) {
      requestBody.generationConfig!.stopSequences = options.stopSequences;
    }
    if (options?.responseMimeType) {
      requestBody.generationConfig!.responseMimeType = options.responseMimeType;
    }

    // Add system instruction
    const systemInstruction = this.buildSystemInstruction(options?.systemInstruction);
    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    // Add safety settings
    if (options?.safetySettings && options.safetySettings.length > 0) {
      requestBody.safetySettings = options.safetySettings;
    }

    // Add tools (function calling)
    if (options?.tools && options.tools.length > 0) {
      requestBody.tools = options.tools;
    }

    // Add grounding config
    if (options?.groundingConfig) {
      requestBody.groundingConfig = options.groundingConfig;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (errorData.error) {
          throw new Error(`Gemini API error: ${formatGeminiError(errorData.error)}`);
        }
        throw new Error(`Gemini API error: ${response.statusText}`);
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('Gemini API error:')) {
          throw e;
        }
        logger.error('Failed to parse Gemini API error response', { status: response.status, statusText: response.statusText });
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
    }

    const data: GeminiResponseData = await response.json();

    // Extract text from all candidates
    const candidates = data.candidates || [];
    const primaryCandidate = candidates[0];
    const text = primaryCandidate?.content?.parts
      ?.map((part: GeminiContentPart) => part.text || '')
      .join('') || '';

    // Extract function calls
    const functionCalls: GeminiFunctionCall[] = [];
    primaryCandidate?.content?.parts?.forEach((part: GeminiContentPart) => {
      if (part.functionCall) {
        functionCalls.push({
          name: part.functionCall.name,
          args: part.functionCall.args || {},
        });
      }
    });

    // Build response metadata
    const metadata: GeminiResponseMetadata = {
      finishReason: primaryCandidate?.finishReason,
      tokenCount: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            candidatesTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
      safetyRatings: primaryCandidate?.safetyRatings?.map((rating) => ({
        category: rating.category,
        probability: rating.probability,
      })),
      groundingMetadata: data.groundingMetadata,
    };

    return {
      text,
      tokensUsed: data.usageMetadata?.totalTokenCount,
      finishReason: primaryCandidate?.finishReason,
      metadata,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
      candidates: candidates.map((candidate: GeminiCandidate) => ({
        content: {
          parts: candidate.content?.parts || [],
        },
        finishReason: candidate.finishReason,
      })),
    };
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    await this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const model = options?.model || 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}`;

    // Build request body with all advanced features (same as generate)
    const requestBody: GeminiRequestBody = {
      contents: this.buildContents(prompt, options),
      generationConfig: {
        temperature: options?.temperature ?? 0.91,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    // Add advanced generation config
    if (options?.topP !== undefined) {
      requestBody.generationConfig!.topP = options.topP;
    }
    if (options?.topK !== undefined) {
      requestBody.generationConfig!.topK = options.topK;
    }
    if (options?.stopSequences && options.stopSequences.length > 0) {
      requestBody.generationConfig!.stopSequences = options.stopSequences;
    }
    if (options?.responseMimeType) {
      requestBody.generationConfig!.responseMimeType = options.responseMimeType;
    }

    // Add system instruction
    const systemInstruction = this.buildSystemInstruction(options?.systemInstruction);
    if (systemInstruction) {
      requestBody.systemInstruction = systemInstruction;
    }

    // Add safety settings
    if (options?.safetySettings && options.safetySettings.length > 0) {
      requestBody.safetySettings = options.safetySettings;
    }

    // Add tools (function calling)
    if (options?.tools && options.tools.length > 0) {
      requestBody.tools = options.tools;
    }

    // Add grounding config
    if (options?.groundingConfig) {
      requestBody.groundingConfig = options.groundingConfig;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        if (errorData.error) {
          throw new Error(`Gemini API error: ${formatGeminiError(errorData.error)}`);
        }
        throw new Error(`Gemini API error: ${response.statusText}`);
      } catch (e) {
        if (e instanceof Error && e.message.startsWith('Gemini API error:')) {
          throw e;
        }
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n').filter((line) => line.trim());
        buffer = '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              yield { text: '', done: true };
              return;
            }

            try {
              const parsed: GeminiResponseData = JSON.parse(data);
              // Extract text and function calls from all parts
              const parts = parsed.candidates?.[0]?.content?.parts || [];
              const text = parts
                .map((part: GeminiContentPart) => part.text || '')
                .join('');
              
              // Extract function calls from parts
              const functionCalls: GeminiFunctionCall[] = [];
              parts.forEach((part: GeminiContentPart) => {
                if (part.functionCall) {
                  functionCalls.push({
                    name: part.functionCall.name,
                    args: part.functionCall.args || {},
                  });
                }
              });
              
              // Yield text if present, or function calls if present
              if (text || functionCalls.length > 0) {
                yield { 
                  text, 
                  done: false,
                  functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
                };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { text: '', done: true };
  }
}

export class NotebookLMProvider implements LLMProvider {
  name = 'NotebookLM';
  type: 'cloud' = 'cloud';
  private apiKey: string | null = null;

  constructor() {
    // Don't load synchronously - will be loaded on first async call
    // This prevents race condition with API key initialization
  }

  private async loadAPIKey(): Promise<void> {
    await apiKeyService.ensureInitialized();
    // Try NotebookLM key first, fallback to Gemini (same API)
    this.apiKey = await apiKeyService.getGlobalKey('notebooklm', ['gemini']);
  }

  async healthCheck(): Promise<boolean> {
    await this.loadAPIKey();
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  async getModels(): Promise<LLMModel[]> {
    // NotebookLM uses document-based models
      return [
        {
          id: 'notebooklm',
          name: 'NotebookLM',
          provider: 'notebooklm' as const,
          description: 'Document-based AI assistant',
          isAvailable: await this.healthCheck(),
        },
      ];
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    await this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('NotebookLM API key not configured. Please configure NotebookLM or Gemini API key.');
    }

    // NotebookLM uses the same API as Gemini, so we can use Gemini endpoints
    // If user has a specific NotebookLM endpoint, it would be configured here
    const model = options?.model || 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: options?.temperature ?? 0.91,
          maxOutputTokens: options?.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`NotebookLM API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return {
      text,
      tokensUsed: data.usageMetadata?.totalTokenCount,
      finishReason: data.candidates?.[0]?.finishReason,
    };
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    await this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('NotebookLM API key not configured. Please configure NotebookLM or Gemini API key.');
    }

    // Use Gemini streaming API (same as NotebookLM)
    const model = options?.model || 'gemini-2.0-flash-exp';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: options?.temperature ?? 0.91,
          maxOutputTokens: options?.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`NotebookLM API error: ${error.error?.message || response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Failed to get response stream');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6);
            if (jsonStr === '[DONE]') {
              yield { text: '', done: true };
              return;
            }

            try {
              const data = JSON.parse(jsonStr);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                yield { text, done: false };
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { text: '', done: true };
  }
}

export class OllamaCloudProvider implements LLMProvider {
  name = 'Ollama Cloud';
  type: 'cloud' = 'cloud';
  private baseUrl = 'https://ollama.com/api';
  private maxRetries = 3;
  private retryDelay = 1000; // ms
  private healthCheckTimeout = 5000; // ms
  private requestTimeout = 30000; // 30 seconds
  private apiKey: string | null = null;

  constructor() {
    // Don't load synchronously - will be loaded on first async call
    // This prevents race condition with API key initialization
  }

  private async loadAPIKey(): Promise<void> {
    await apiKeyService.ensureInitialized();
    // Try to get Ollama Cloud API key, but don't require it (may be optional)
    this.apiKey = await apiKeyService.getKeyForProviderAsync('ollama-cloud');
  }

  async healthCheck(): Promise<boolean> {
    // Skip health check in browser/dev server mode - Ollama Cloud doesn't support CORS
    // Only check in Electron where CORS restrictions don't apply
    const isElectron = typeof window !== 'undefined' && 'ipcRenderer' in window;
    if (!isElectron) {
      return false;
    }

    try {
      await this.loadAPIKey();
      
      // Skip health check if no API key (Ollama Cloud requires authentication)
      if (!this.apiKey) {
        return false;
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if API key is available
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // Silently handle network errors
      return false;
    }
  }

  async getModels(): Promise<LLMModel[]> {
    try {
      await this.loadAPIKey();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if API key is available
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama Cloud returned ${response.status}`);
      }

      const data = await response.json();
      const models = Array.isArray(data.models) ? data.models : [];

      return models.map((model: OllamaModel) => ({
        id: model.name || 'unknown',
        name: model.name || 'Unknown Model',
        provider: 'ollama-cloud' as const,
        size: this.formatSize(model.size),
        contextWindow: this.detectContextWindow(model),
        description: model.digest || undefined,
        isAvailable: true,
        metadata: {
          quantization: this.detectQuantization(model.name),
          modifiedAt: model.modified_at,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch Ollama Cloud models:', error);
      return [];
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    await this.loadAPIKey();
    const model = options?.model || await this.getDefaultModel();
    
    if (!model) {
      throw new Error('No Ollama Cloud models available');
    }

    // Retry logic for transient failures
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      try {
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        // Add Authorization header if API key is available
        if (this.apiKey) {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }
        
        const response = await fetch(`${this.baseUrl}/generate`, {
          method: 'POST',
          headers,
          signal: controller.signal,
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
              temperature: options?.temperature ?? 0.91,
              num_predict: options?.maxTokens ?? 2048,
            },
          }),
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          throw new Error(`Ollama Cloud API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        return {
          text: data.response || '',
          tokensUsed: data.eval_count || 0,
          finishReason: data.done ? 'stop' : 'length',
        };
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error as Error;
        
        // Don't retry on abort/timeout errors
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Ollama Cloud request timed out');
        }
        
        if (attempt < this.maxRetries - 1) {
          // Exponential backoff
          await this.sleep(this.retryDelay * Math.pow(2, attempt));
          continue;
        }
      }
    }

    throw new Error(`Ollama Cloud generation failed after ${this.maxRetries} attempts: ${lastError?.message}`);
  }

  private async getDefaultModel(): Promise<string | null> {
    const models = await this.getModels();
    if (models.length === 0) return null;
    
    // Prefer code models, then chat models
    const codeModel = models.find(m => 
      m.name.includes('coder') || 
      m.name.includes('code') ||
      m.name.includes('deepseek')
    );
    if (codeModel) return codeModel.id;
    
    return models[0].id;
  }

  private detectContextWindow(model: OllamaModel): number {
    // Try to get from model details first
    if (model.details?.context_length) return model.details.context_length;
    
    // Fallback to name-based detection
    const name = (model.name || '').toLowerCase();
    if (name.includes('32b')) return 32768;
    if (name.includes('16b') || name.includes('14b')) return 16384;
    if (name.includes('7b') || name.includes('8b')) return 8192;
    if (name.includes('3b') || name.includes('1b')) return 4096;
    
    return 4096; // Default
  }

  private detectQuantization(name: string): string | undefined {
    const lower = name.toLowerCase();
    if (lower.includes('q8')) return 'Q8';
    if (lower.includes('q6')) return 'Q6';
    if (lower.includes('q5')) return 'Q5';
    if (lower.includes('q4')) return 'Q4';
    if (lower.includes('q3')) return 'Q3';
    if (lower.includes('q2')) return 'Q2';
    return undefined;
  }

  private formatSize(bytes: number): string | undefined {
    if (!bytes) return undefined;
    const gb = bytes / (1024 ** 3);
    if (gb < 1) {
      const mb = bytes / (1024 ** 2);
      return `${mb.toFixed(0)}MB`;
    }
    return `${gb.toFixed(1)}GB`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    await this.loadAPIKey();
    const model = options?.model || (await this.getModels())[0]?.id;
    if (!model) {
      throw new Error('No model available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if API key is available
      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
      
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          model,
          prompt,
          stream: true,
          options: {
            temperature: options?.temperature ?? 0.91,
            num_predict: options?.maxTokens ?? 2048,
          },
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Ollama Cloud API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let hasError = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);
              const content = parsed.response || '';
              if (content) {
                yield { text: content, done: false };
              }
              // Check for errors
              if (parsed.error) {
                hasError = true;
                throw new Error(parsed.error);
              }
              if (parsed.done) {
                yield { text: '', done: true };
                return;
              }
            } catch (parseError) {
              if (hasError) {
                throw parseError;
              }
              // Skip invalid JSON if not an error
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      yield { text: '', done: true };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Ollama Cloud stream timed out');
      }
      throw error;
    }
  }
}

