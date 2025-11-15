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

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<LLMModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

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
        contextWindow: model.context_length,
        isAvailable: true,
      }));
    } catch (error) {
      console.error('Failed to fetch LM Studio models:', error);
      return [];
    }
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    const model = options?.model || (await this.getModels())[0]?.id;
    if (!model) {
      throw new Error('No model available');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens,
      finishReason: data.choices[0]?.finish_reason,
    };
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    const model = options?.model || (await this.getModels())[0]?.id;
    if (!model) {
      throw new Error('No model available');
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    if (!response.ok) {
      throw new Error(`LM Studio API error: ${response.statusText}`);
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

export class OllamaProvider implements LLMProvider {
  name = 'Ollama';
  type: 'local' = 'local';
  private baseUrl = 'http://localhost:11434/api';
  private maxRetries = 3;
  private retryDelay = 1000; // ms
  private healthCheckTimeout = 5000; // ms

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
      const response = await fetch(`${this.baseUrl}/tags`, {
        method: 'GET',
      });

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
        contextWindow: this.detectContextWindow(model.name),
        description: model.digest || undefined,
        isAvailable: true,
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
      try {
        const response = await fetch(`${this.baseUrl}/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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

        if (!response.ok) {
          throw new Error(`Ollama API error: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
          text: data.response || '',
          tokensUsed: data.eval_count || 0,
          finishReason: data.done ? 'stop' : 'length',
        };
      } catch (error) {
        lastError = error as Error;
        
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

  private detectContextWindow(modelName: string): number {
    if (modelName.includes('32b')) return 32768;
    if (modelName.includes('16b') || modelName.includes('14b')) return 16384;
    if (modelName.includes('7b') || modelName.includes('8b')) return 8192;
    if (modelName.includes('3b') || modelName.includes('1b')) return 4096;
    return 4096; // Default
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

    const response = await fetch(`${this.baseUrl}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
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
            const parsed = JSON.parse(line);
            const content = parsed.response || '';
            if (content) {
              yield { text: content, done: false };
            }
            if (parsed.done) {
              yield { text: '', done: true };
              return;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    yield { text: '', done: true };
  }
}

