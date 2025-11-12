import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';
import type { LLMProvider } from '../router';
import { apiKeyService } from '@/services/apiKeys/apiKeyService';
import type {
  GeminiSystemInstruction,
  GeminiContent,
  GeminiResponseMetadata,
  GeminiFunctionCall,
} from '@/types/gemini';

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
    // If contents are provided, use them (multi-modal support)
    if (options?.contents && options.contents.length > 0) {
      return options.contents;
    }

    // Otherwise, build from prompt
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
    const requestBody: any = {
      contents: this.buildContents(prompt, options),
      generationConfig: {
        temperature: options?.temperature ?? 0.91,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    // Add advanced generation config
    if (options?.topP !== undefined) {
      requestBody.generationConfig.topP = options.topP;
    }
    if (options?.topK !== undefined) {
      requestBody.generationConfig.topK = options.topK;
    }
    if (options?.candidateCount !== undefined) {
      requestBody.generationConfig.candidateCount = options.candidateCount;
    }
    if (options?.stopSequences && options.stopSequences.length > 0) {
      requestBody.generationConfig.stopSequences = options.stopSequences;
    }
    if (options?.responseMimeType) {
      requestBody.generationConfig.responseMimeType = options.responseMimeType;
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
      const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    // Extract text from all candidates
    const candidates = data.candidates || [];
    const primaryCandidate = candidates[0];
    const text = primaryCandidate?.content?.parts
      ?.map((part: any) => part.text || '')
      .join('') || '';

    // Extract function calls
    const functionCalls: GeminiFunctionCall[] = [];
    primaryCandidate?.content?.parts?.forEach((part: any) => {
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
      safetyRatings: primaryCandidate?.safetyRatings?.map((rating: any) => ({
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
      candidates: candidates.map((candidate: any) => ({
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
    const requestBody: any = {
      contents: this.buildContents(prompt, options),
      generationConfig: {
        temperature: options?.temperature ?? 0.91,
        maxOutputTokens: options?.maxTokens ?? 2048,
      },
    };

    // Add advanced generation config
    if (options?.topP !== undefined) {
      requestBody.generationConfig.topP = options.topP;
    }
    if (options?.topK !== undefined) {
      requestBody.generationConfig.topK = options.topK;
    }
    if (options?.stopSequences && options.stopSequences.length > 0) {
      requestBody.generationConfig.stopSequences = options.stopSequences;
    }
    if (options?.responseMimeType) {
      requestBody.generationConfig.responseMimeType = options.responseMimeType;
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
              // Extract text from all parts
              const parts = parsed.candidates?.[0]?.content?.parts || [];
              const text = parts
                .map((part: any) => part.text || '')
                .join('');
              
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

