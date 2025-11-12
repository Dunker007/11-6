import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';

export interface LLMProvider {
  name: string;
  type: 'local' | 'cloud';
  healthCheck(): Promise<boolean>;
  getModels(): Promise<LLMModel[]>;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse>;
  streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk>;
}

export class LMStudioProvider implements LLMProvider {
  name = 'LM Studio';
  type: 'local' = 'local';
  private baseUrl = 'http://localhost:1234/v1';
  private requestTimeout = 30000; // 30 seconds
  private healthCheckTimeout = 5000; // 5 seconds

  async healthCheck(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);
      
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
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

      const data = await response.json();
      const models = Array.isArray(data.data) ? data.data : [];

      return models.map((model: any) => ({
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
      console.error('Failed to fetch LM Studio models:', error);
      return [];
    }
  }

  private detectContextWindow(model: any): number {
    // Try to get from model metadata first
    if (model.context_length) return model.context_length;
    if (model.contextLength) return model.contextLength;
    
    // Fallback to name-based detection
    const name = (model.name || model.id || '').toLowerCase();
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

      const data = await response.json();
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
                const parsed = JSON.parse(data);
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
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.healthCheckTimeout);
      
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn('Ollama health check failed:', error);
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

      const data = await response.json();
      const models = Array.isArray(data.models) ? data.models : [];

      return models.map((model: any) => ({
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
      console.error('Failed to fetch Ollama models:', error);
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

  private detectContextWindow(model: any): number {
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
        throw new Error('Ollama stream timed out');
      }
      throw error;
    }
  }
}

