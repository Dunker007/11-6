/**
 * localLLM.ts
 * 
 * PURPOSE:
 * Local LLM provider implementations for LM Studio and Ollama. Provides privacy-focused,
 * offline-capable LLM access running on the user's machine. Implements the LLMProvider
 * interface for seamless integration with the router.
 * 
 * ARCHITECTURE:
 * Two provider implementations:
 * - LMStudioProvider: Connects to LM Studio server (default port 1234)
 * - OllamaProvider: Connects to Ollama server (default port 11434)
 * 
 * Both providers:
 * - Use HTTP fetch API for communication
 * - Support health checks, model discovery, generation, and streaming
 * - Handle timeouts and errors gracefully
 * - Detect model metadata (context window, quantization)
 * 
 * CURRENT STATUS:
 * ✅ LM Studio provider fully implemented
 * ✅ Ollama provider fully implemented
 * ✅ Health checks with timeouts
 * ✅ Model discovery and metadata extraction
 * ✅ Streaming generation support
 * ✅ Error handling and fallbacks
 * ✅ Context window detection
 * ✅ Quantization detection
 * 
 * DEPENDENCIES:
 * - @/types/llm: LLM type definitions
 * 
 * STATE MANAGEMENT:
 * - Stateless providers (no internal state)
 * - Configuration via constructor/baseUrl
 * - Does not use Zustand
 * 
 * PERFORMANCE:
 * - Request timeouts prevent hanging
 * - Efficient model metadata parsing
 * - Streaming for real-time responses
 * - Health check caching (via router)
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { LMStudioProvider, OllamaProvider } from '@/services/ai/providers/localLLM';
 * 
 * const lmStudio = new LMStudioProvider();
 * const isHealthy = await lmStudio.healthCheck();
 * 
 * if (isHealthy) {
 *   const models = await lmStudio.getModels();
 *   const response = await lmStudio.generate('Hello!');
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/router.ts: Uses these providers
 * - src/services/ai/providers/cloudLLM.ts: Cloud provider implementations
 * - src/services/ai/llmStore.ts: Integrates providers via router
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Support for more local LLM servers
 * - Model performance metrics
 * - Automatic port detection
 * - Connection pooling
 */
import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';
import { logger } from '@/services/logging/loggerService';
import type {
  LMStudioModel,
  OllamaModel,
  LMStudioCompletionResponse,
  OllamaCompletionResponse,
  LMStudioStreamResponse,
  OllamaStreamResponse,
} from '@/types/localLLM';
import type { LLMProvider } from './types';

export type { LLMProvider };

export class LMStudioProvider implements LLMProvider {
  name = 'LM Studio';
  type: 'local' = 'local';
  private baseUrl = 'http://localhost:1234/v1';
  private requestTimeout = 30000; // 30 seconds
  private healthCheckTimeout = 5000; // 5 seconds

  async healthCheck(): Promise<boolean> {
    const url = `${this.baseUrl}/models`;
    console.log(`[LM Studio] Health check starting: ${url}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);
      
      logger.info(`Checking LM Studio at ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      console.log(`[LM Studio] Health check result: ${isHealthy ? 'ONLINE' : 'OFFLINE'} (status: ${response.status})`);
      logger.info(`LM Studio health check: ${isHealthy ? 'online' : 'offline'} (status: ${response.status})`);
      return isHealthy;
    } catch (error) {
      console.error(`[LM Studio] Health check FAILED:`, error);
      logger.warn('LM Studio health check failed:', { error, url });
      return false;
    }
  }

  async getModels(): Promise<LLMModel[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);
      
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return [];
      }

      const data: { data: LMStudioModel[] } = await response.json();
      const models = Array.isArray(data.data) ? data.data : [];

      return models.map((model: LMStudioModel) => ({
        id: model.id || model.name || 'unknown',
        name: model.name || model.id || 'Unknown Model',
        provider: 'lmstudio' as const,
        size: model.size,
        contextWindow: this.detectContextWindow(model),
        isAvailable: true,
        metadata: {
          quantization: this.detectQuantization(model.name || model.id),
          loaded: model.loaded || false,
        },
      }));
    } catch (error) {
      logger.error('Failed to fetch LM Studio models:', { error });
      return [];
    }
  }

  private detectContextWindow(model: LMStudioModel | OllamaModel): number {
    // Try to get from model metadata first
    if ('context_length' in model && model.context_length) return model.context_length;
    if ('contextLength' in model && model.contextLength) return model.contextLength;
    if ('details' in model && model.details?.context_length) return model.details.context_length;
    
    // Fallback to name-based detection
    const name = ('id' in model ? (model.name || model.id) : model.name || '').toLowerCase();
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

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    const model = options?.model || (await this.getModels())[0]?.id;
    if (!model) {
      throw new Error('No model available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: options?.temperature ?? 0.91,
          max_tokens: options?.maxTokens ?? 2048,
          stream: false,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
      }

      const data: LMStudioCompletionResponse = await response.json();
      return {
        text: data.choices[0]?.message?.content || '',
        tokensUsed: data.usage?.total_tokens,
        finishReason: data.choices[0]?.finish_reason,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('LM Studio request timed out');
      }
      throw error;
    }
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    const model = options?.model || (await this.getModels())[0]?.id;
    if (!model) {
      throw new Error('No model available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          temperature: options?.temperature ?? 0.91,
          max_tokens: options?.maxTokens ?? 2048,
          stream: true,
        }),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`LM Studio API error: ${response.status} - ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      let hasError = false;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                yield { text: '', done: true };
                return;
              }

              try {
                const parsed: LMStudioStreamResponse = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  yield { text: content, done: false };
                }
                // Check for errors in the stream
                if (parsed.error) {
                  hasError = true;
                  throw new Error(parsed.error.message || 'Stream error');
                }
              } catch (parseError) {
                if (hasError) {
                  throw parseError;
                }
                // Skip invalid JSON if not an error
              }
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
        throw new Error('LM Studio stream timed out');
      }
      throw error;
    }
  }
}

export class OllamaProvider implements LLMProvider {
  name = 'Ollama';
  type: 'local' = 'local';
  private baseUrl = 'http://localhost:11434/api';
  private maxRetries = 3;
  private retryDelay = 1000; // ms
  private healthCheckTimeout = 5000; // ms
  private requestTimeout = 30000; // 30 seconds

  async healthCheck(): Promise<boolean> {
    const url = `${this.baseUrl}/tags`;
    console.log(`[Ollama] Health check starting: ${url}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);
      
      logger.info(`Checking Ollama at ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const isHealthy = response.ok;
      console.log(`[Ollama] Health check result: ${isHealthy ? 'ONLINE' : 'OFFLINE'} (status: ${response.status})`);
      logger.info(`Ollama health check: ${isHealthy ? 'online' : 'offline'} (status: ${response.status})`);
      return isHealthy;
    } catch (error) {
      console.error(`[Ollama] Health check FAILED:`, error);
      logger.warn('Ollama health check failed:', { error, url });
      return false;
    }
  }

  async getModels(): Promise<LLMModel[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);
      
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama returned ${response.status}`);
      }

      const data: { models: OllamaModel[] } = await response.json();
      const models = Array.isArray(data.models) ? data.models : [];

      return models.map((model: OllamaModel) => ({
        id: model.name || 'unknown',
        name: model.name || 'Unknown Model',
        provider: 'ollama' as const,
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
      logger.error('Failed to fetch Ollama models:', { error });
      return [];
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    const model = options?.model || await this.getDefaultModel();
    
    if (!model) {
      throw new Error('No Ollama models available. Run "ollama pull <model>" first.');
    }

    // Retry logic for transient failures
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      try {
        const response = await fetch(`${this.baseUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
          throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
        }

        const data: OllamaCompletionResponse = await response.json();
        
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
          throw new Error('Ollama request timed out');
        }
        
        if (attempt < this.maxRetries - 1) {
          // Exponential backoff
          await this.sleep(this.retryDelay * Math.pow(2, attempt));
          continue;
        }
      }
    }

    throw new Error(`Ollama generation failed after ${this.maxRetries} attempts: ${lastError?.message}`);
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

  private detectContextWindow(model: OllamaModel | LMStudioModel): number {
    // Try to get from model details first
    if ('details' in model && model.details?.context_length) return model.details.context_length;
    if ('context_length' in model && model.context_length) return model.context_length;
    if ('contextLength' in model && model.contextLength) return model.contextLength;
    
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
    const model = options?.model || (await this.getModels())[0]?.id;
    if (!model) {
      throw new Error('No model available');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

    try {
      const response = await fetch(`${this.baseUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
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
              const parsed: OllamaStreamResponse = JSON.parse(line);
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
        throw new Error('Ollama stream timed out');
      }
      throw error;
    }
  }

  /**
   * Pull/download a model from Ollama registry
   * @param modelName - Name of the model to pull (e.g., 'llama2', 'mistral')
   * @param onProgress - Optional callback for progress updates
   * @returns Promise that resolves when pull is complete
   */
  async pullModel(
    modelName: string, 
    onProgress?: (progress: { status: string; completed?: number; total?: number }) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`Ollama pull failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim());

          for (const line of lines) {
            try {
              const progress = JSON.parse(line);
              if (onProgress) {
                onProgress({
                  status: progress.status || 'pulling',
                  completed: progress.completed,
                  total: progress.total,
                });
              }
              logger.info(`Ollama pull progress for ${modelName}:`, { 
                status: progress.status,
                percent: progress.total ? Math.round((progress.completed / progress.total) * 100) : undefined 
              });
            } catch {
              // Skip invalid JSON
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      logger.info(`Successfully pulled model: ${modelName}`);
    } catch (error) {
      logger.error(`Failed to pull model ${modelName}:`, { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
}

export const lmStudioProvider = new LMStudioProvider();
export const ollamaProvider = new OllamaProvider();

