import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';
import type { LLMProvider } from './localLLM';
import { logger } from '@/services/logging/loggerService';

interface OpenRouterModel {
  id: string;
  name: string;
  context_length: number;
  description: string;
}

export class OpenRouterProvider implements LLMProvider {
  name = 'OpenRouter';
  type: 'cloud' = 'cloud';
  private baseUrl = 'https://openrouter.ai/api/v1';
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getModels(): Promise<LLMModel[]> {
    if (!this.apiKey) return [];

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      const models = Array.isArray(data.data) ? data.data : [];

      // Return a curated list of popular models
      const curatedModels = models.filter((model: OpenRouterModel) => 
        model.id.includes('gpt-4') ||
        model.id.includes('claude') ||
        model.id.includes('llama') ||
        model.id.includes('mistral') ||
        model.id.includes('qwen')
      ).slice(0, 20); // Limit to 20 most relevant

      return curatedModels.map((model: OpenRouterModel) => ({
        id: model.id,
        name: model.name || model.id,
        provider: this.determineProvider(model.id),
        contextWindow: model.context_length,
        description: model.description,
        isAvailable: true,
      }));
    } catch (error) {
      logger.error('Failed to fetch OpenRouter models:', { error });
      return [];
    }
  }

  private determineProvider(modelId: string): 'openai' | 'anthropic' | 'ollama' | 'lmstudio' | 'gemini' | 'notebooklm' {
    if (modelId.includes('gpt') || modelId.includes('openai')) return 'openai';
    if (modelId.includes('claude') || modelId.includes('anthropic')) return 'anthropic';
    if (modelId.includes('gemini') || modelId.includes('google')) return 'gemini';
    return 'openai'; // Default
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const model = options?.model || 'openai/gpt-3.5-turbo';
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vibed-ed.app',
        'X-Title': 'Vibed Ed',
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(options?.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []),
          { role: 'user', content: prompt },
        ],
        temperature: options?.temperature ?? 0.91,
        max_tokens: options?.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.statusText} - ${error}`);
    }

    const data = await response.json();
    
    return {
      text: data.choices[0]?.message?.content || '',
      tokensUsed: data.usage?.total_tokens,
      finishReason: data.choices[0]?.finish_reason,
    };
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const model = options?.model || 'openai/gpt-3.5-turbo';
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://vibed-ed.app',
        'X-Title': 'Vibed Ed',
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
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.statusText} - ${error}`);
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

