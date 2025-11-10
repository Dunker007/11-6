import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';
import type { LLMProvider } from '../router';
import { apiKeyService } from '@/services/apiKeys/apiKeyService';

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
    // Gemini models
      return [
        {
          id: 'gemini-2.0-flash-exp',
          name: 'Gemini Flash 2.5',
          provider: 'gemini' as const,
          contextWindow: 32768,
          isAvailable: await this.healthCheck(),
          description: 'Fast and cost-effective model (recommended)',
        },
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
    await this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

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
    await this.loadAPIKey();
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

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

