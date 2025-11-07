import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';
import type { LLMProvider } from '../router';
import { apiKeyService } from '@/services/apiKeys/apiKeyService';

export class GeminiProvider implements LLMProvider {
  name = 'Google Gemini';
  type: 'cloud' = 'cloud';
  private apiKey: string | null = null;

  constructor() {
    this.loadAPIKey();
  }

  private loadAPIKey(): void {
    this.apiKey = apiKeyService.getKeyForProvider('gemini');
  }

  async healthCheck(): Promise<boolean> {
    this.loadAPIKey();
    return this.apiKey !== null && this.apiKey.length > 0;
  }

  async getModels(): Promise<LLMModel[]> {
    // Gemini models
      return [
        {
          id: 'gemini-pro',
          name: 'Gemini Pro',
          provider: 'gemini' as const,
          contextWindow: 32768,
          isAvailable: await this.healthCheck(),
        },
        {
          id: 'gemini-pro-vision',
          name: 'Gemini Pro Vision',
          provider: 'gemini' as const,
          contextWindow: 16384,
          isAvailable: await this.healthCheck(),
        },
      ];
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const model = options?.model || 'gemini-pro';
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
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
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
    this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const model = options?.model || 'gemini-pro';
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
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 2048,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
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
              const parsed = JSON.parse(data);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

export class NotebookLMProvider implements LLMProvider {
  name = 'NotebookLM';
  type: 'cloud' = 'cloud';
  private apiKey: string | null = null;

  constructor() {
    this.loadAPIKey();
  }

  private loadAPIKey(): void {
    this.apiKey = apiKeyService.getKeyForProvider('notebooklm');
  }

  async healthCheck(): Promise<boolean> {
    this.loadAPIKey();
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
    this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('NotebookLM API key not configured');
    }

    // Note: NotebookLM API endpoints may vary - this is a placeholder structure
    // Adjust based on actual NotebookLM API documentation
    const url = 'https://notebooklm.googleapis.com/v1/generate';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        temperature: options?.temperature ?? 0.7,
        maxTokens: options?.maxTokens ?? 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`NotebookLM API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      text: data.text || '',
      tokensUsed: data.tokensUsed,
    };
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('NotebookLM API key not configured');
    }

    // Placeholder - adjust based on actual NotebookLM streaming API
    const response = await this.generate(prompt, options);
    yield { text: response.text, done: true };
  }
}

