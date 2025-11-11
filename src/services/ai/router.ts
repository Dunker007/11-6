import { LMStudioProvider, OllamaProvider, type LLMProvider } from './providers/localLLM';
import { GeminiProvider, NotebookLMProvider } from './providers/cloudLLM';
import { OpenRouterProvider } from './providers/openRouter';
import { tokenTrackingService } from './tokenTrackingService';
import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';

export type { LLMProvider };

type ProviderStrategy = 'local-only' | 'local-first' | 'cloud-fallback' | 'hybrid';

export class LLMRouter {
  private providers: Map<string, LLMProvider> = new Map();
  private preferredProvider: 'lmstudio' | 'ollama' | 'gemini' | 'notebooklm' | 'openrouter' | null = null;
  private strategy: ProviderStrategy = 'cloud-fallback'; // Default to cloud fallback for reliability
  private openRouterProvider: OpenRouterProvider;
  private studioContext: boolean = false; // Track if Studio is active

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
    
    // Load saved strategy from localStorage
    try {
      const savedStrategy = localStorage.getItem('llm-strategy');
      if (savedStrategy && ['local-only', 'local-first', 'cloud-fallback', 'hybrid'].includes(savedStrategy)) {
        this.strategy = savedStrategy as ProviderStrategy;
      }
    } catch (error) {
      console.warn('Failed to load strategy from localStorage:', error);
      // Continue with default strategy
    }
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
    // If Studio context is active, prioritize Gemini Flash 2.5
    if (this.studioContext) {
      const gemini = this.providers.get('gemini');
      if (gemini && (await gemini.healthCheck())) {
        this.preferredProvider = 'gemini';
        return gemini;
      }
    }

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

    // Cloud-fallback strategy (try local first, then cloud)
    if (this.strategy === 'cloud-fallback') {
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
      const response = await provider.generate(prompt, options);
      
      // Track token usage
      if (response.tokensUsed) {
        const providerName = provider.name.toLowerCase().replace(/\s+/g, '-');
        tokenTrackingService.recordUsage(
          providerName,
          response.tokensUsed,
          undefined, // Cost calculation would need provider-specific pricing
          options?.model
        );
      }
      
      return response;
    } catch (error) {
      console.error(`Provider ${provider.name} failed:`, error);
      
      // Try fallback if enabled
      if (this.strategy === 'cloud-fallback' || this.strategy === 'hybrid') {
        const fallback = await this.getFallbackProvider(provider);
        if (fallback) {
          console.log(`Falling back to ${fallback.name}`);
          const response = await fallback.generate(prompt, options);
          
          // Track token usage for fallback
          if (response.tokensUsed) {
            const providerName = fallback.name.toLowerCase().replace(/\s+/g, '-');
            tokenTrackingService.recordUsage(
              providerName,
              response.tokensUsed,
              undefined,
              options?.model
            );
          }
          
          return response;
        }
      }
      
      throw error;
    }
  }

  private async selectProvider(_options?: GenerateOptions): Promise<LLMProvider | null> {
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
    let provider = await this.selectProvider(options);

    if (!provider) {
      throw new Error('No LLM providers available. Please configure Ollama, LM Studio, or OpenRouter.');
    }

    while (provider) {
      try {
        for await (const chunk of provider.streamGenerate(prompt, options)) {
          yield chunk;
        }
        return;
      } catch (error) {
        console.error(`Streaming with provider ${provider.name} failed:`, error);

        if (this.strategy === 'cloud-fallback' || this.strategy === 'hybrid') {
          const fallback = await this.getFallbackProvider(provider);
          if (fallback && fallback !== provider) {
            console.log(`Streaming falling back to ${fallback.name}`);
            provider = fallback;
            continue;
          }
        }

        throw error;
      }
    }
  }

  setPreferredProvider(provider: 'lmstudio' | 'ollama' | 'gemini' | 'notebooklm' | 'openrouter'): void {
    this.preferredProvider = provider;
  }

  getPreferredProvider(): 'lmstudio' | 'ollama' | 'gemini' | 'notebooklm' | 'openrouter' | null {
    return this.preferredProvider;
  }

  setStudioContext(enabled: boolean): void {
    this.studioContext = enabled;
    if (enabled) {
      // When Studio is active, prioritize Gemini
      this.preferredProvider = 'gemini';
    }
  }

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }
}

export const llmRouter = new LLMRouter();

