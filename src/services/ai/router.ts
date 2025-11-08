import { LMStudioProvider, OllamaProvider, type LLMProvider } from './providers/localLLM';
import { GeminiProvider, NotebookLMProvider } from './providers/cloudLLM';
import { OpenRouterProvider } from './providers/openRouter';
import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';

export type { LLMProvider };

type ProviderStrategy = 'local-only' | 'local-first' | 'cloud-fallback' | 'hybrid';

export class LLMRouter {
  private providers: Map<string, LLMProvider> = new Map();
  private preferredProvider: 'lmstudio' | 'ollama' | 'gemini' | 'notebooklm' | 'openrouter' | null = null;
  private strategy: ProviderStrategy = 'cloud-fallback'; // Default to cloud fallback for reliability
  private openRouterProvider: OpenRouterProvider;

  constructor() {
    // Local providers
    this.providers.set('lmstudio', new LMStudioProvider());
    this.providers.set('ollama', new OllamaProvider());
    
    // Cloud providers
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('notebooklm', new NotebookLMProvider());
    
    // OpenRouter (unified cloud fallback)
    this.openRouterProvider = new OpenRouterProvider();
    this.providers.set('openrouter', this.openRouterProvider);
  }

  setOpenRouterKey(key: string) {
    this.openRouterProvider.setApiKey(key);
  }

  setStrategy(strategy: ProviderStrategy) {
    this.strategy = strategy;
  }

  getStrategy(): ProviderStrategy {
    return this.strategy;
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

    // Local-first strategy (default)
    if (this.strategy === 'local-first') {
      // Try local providers first
      const lmStudio = this.providers.get('lmstudio');
      if (lmStudio && (await lmStudio.healthCheck())) {
        this.preferredProvider = 'lmstudio';
        return lmStudio;
      }

      const ollama = this.providers.get('ollama');
      if (ollama && (await ollama.healthCheck())) {
        this.preferredProvider = 'ollama';
        return ollama;
      }

      // Fallback to cloud
      const gemini = this.providers.get('gemini');
      if (gemini && (await gemini.healthCheck())) {
        this.preferredProvider = 'gemini';
        return gemini;
      }
    }

    // Cloud-first strategy
    if (this.strategy === 'cloud-first') {
      const gemini = this.providers.get('gemini');
      if (gemini && (await gemini.healthCheck())) {
        this.preferredProvider = 'gemini';
        return gemini;
      }

      // Fallback to local
      const lmStudio = this.providers.get('lmstudio');
      if (lmStudio && (await lmStudio.healthCheck())) {
        this.preferredProvider = 'lmstudio';
        return lmStudio;
      }

      const ollama = this.providers.get('ollama');
      if (ollama && (await ollama.healthCheck())) {
        this.preferredProvider = 'ollama';
        return ollama;
      }
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
    const provider = await this.selectProvider(options);
    
    if (!provider) {
      throw new Error('No LLM providers available. Please configure Ollama, LM Studio, or OpenRouter.');
    }

    try {
      return await provider.generate(prompt, options);
    } catch (error) {
      console.error(`Provider ${provider.name} failed:`, error);
      
      // Try fallback if enabled
      if (this.strategy === 'cloud-fallback' || this.strategy === 'hybrid') {
        const fallback = await this.getFallbackProvider(provider);
        if (fallback) {
          console.log(`Falling back to ${fallback.name}`);
          return await fallback.generate(prompt, options);
        }
      }
      
      throw error;
    }
  }

  private async selectProvider(options?: GenerateOptions): Promise<LLMProvider | null> {
    // Strategy 1: local-only - Only try Ollama/LM Studio
    if (this.strategy === 'local-only') {
      return await this.getLocalProvider();
    }

    // Strategy 2: local-first - Try local, no fallback
    if (this.strategy === 'local-first') {
      return await this.getLocalProvider();
    }

    // Strategy 3: cloud-fallback - Try local, fallback to OpenRouter
    if (this.strategy === 'cloud-fallback') {
      const local = await this.getLocalProvider();
      if (local) return local;
      return this.providers.get('openrouter') || null;
    }

    // Strategy 4: hybrid - Use best provider for task (future enhancement)
    if (this.strategy === 'hybrid') {
      // For now, same as cloud-fallback
      const local = await this.getLocalProvider();
      if (local) return local;
      return this.providers.get('openrouter') || null;
    }

    return null;
  }

  private async getLocalProvider(): Promise<LLMProvider | null> {
    // Try Ollama first (faster, better)
    const ollama = this.providers.get('ollama');
    if (ollama && await ollama.healthCheck()) {
      return ollama;
    }

    // Fallback to LM Studio
    const lmstudio = this.providers.get('lmstudio');
    if (lmstudio && await lmstudio.healthCheck()) {
      return lmstudio;
    }

    return null;
  }

  private async getFallbackProvider(failedProvider: LLMProvider): Promise<LLMProvider | null> {
    // If local provider failed, try OpenRouter
    if (failedProvider.type === 'local') {
      const openrouter = this.providers.get('openrouter');
      if (openrouter && await openrouter.healthCheck()) {
        return openrouter;
      }
    }

    // If cloud provider failed, try local
    if (failedProvider.type === 'cloud') {
      return await this.getLocalProvider();
    }

    return null;
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    const provider = await this.getAvailableProvider();
    if (!provider) {
      throw new Error('No LLM provider available. Please check your local LLM servers or configure cloud API keys.');
    }

    yield* provider.streamGenerate(prompt, options);
  }

  setPreferredProvider(provider: 'lmstudio' | 'ollama' | 'gemini' | 'notebooklm'): void {
    this.preferredProvider = provider;
  }

  setStrategy(strategy: 'local-first' | 'cloud-first' | 'cost-based'): void {
    this.strategy = strategy;
  }

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }
}

export const llmRouter = new LLMRouter();

