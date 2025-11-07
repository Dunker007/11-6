import { LMStudioProvider, OllamaProvider, type LLMProvider } from './providers/localLLM';
import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';

export type { LLMProvider };

export class LLMRouter {
  private providers: Map<string, LLMProvider> = new Map();
  private preferredProvider: 'lmstudio' | 'ollama' | null = null;

  constructor() {
    this.providers.set('lmstudio', new LMStudioProvider());
    this.providers.set('ollama', new OllamaProvider());
  }

  async discoverProviders(): Promise<{ provider: string; available: boolean; models: LLMModel[] }[]> {
    const results = [];

    for (const [name, provider] of this.providers.entries()) {
      try {
        const isHealthy = await provider.healthCheck();
        const models = isHealthy ? await provider.getModels() : [];
        results.push({
          provider: name,
          available: isHealthy,
          models,
        });
      } catch (error) {
        console.error(`Failed to discover ${name}:`, error);
        results.push({
          provider: name,
          available: false,
          models: [],
        });
      }
    }

    return results;
  }

  async getAvailableProvider(): Promise<LLMProvider | null> {
    // Check preferred provider first
    if (this.preferredProvider) {
      const provider = this.providers.get(this.preferredProvider);
      if (provider && (await provider.healthCheck())) {
        return provider;
      }
    }

    // Try LM Studio first
    const lmStudio = this.providers.get('lmstudio');
    if (lmStudio && (await lmStudio.healthCheck())) {
      this.preferredProvider = 'lmstudio';
      return lmStudio;
    }

    // Fallback to Ollama
    const ollama = this.providers.get('ollama');
    if (ollama && (await ollama.healthCheck())) {
      this.preferredProvider = 'ollama';
      return ollama;
    }

    return null;
  }

  async getAllModels(): Promise<LLMModel[]> {
    const allModels: LLMModel[] = [];

    for (const provider of this.providers.values()) {
      try {
        if (await provider.healthCheck()) {
          const models = await provider.getModels();
          allModels.push(...models);
        }
      } catch {
        // Skip unavailable providers
      }
    }

    return allModels;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse> {
    const provider = await this.getAvailableProvider();
    if (!provider) {
      throw new Error('No local LLM provider available');
    }

    return provider.generate(prompt, options);
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    const provider = await this.getAvailableProvider();
    if (!provider) {
      throw new Error('No local LLM provider available');
    }

    yield* provider.streamGenerate(prompt, options);
  }

  setPreferredProvider(provider: 'lmstudio' | 'ollama'): void {
    this.preferredProvider = provider;
  }

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }
}

export const llmRouter = new LLMRouter();

