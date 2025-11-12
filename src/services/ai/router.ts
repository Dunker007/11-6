/**
 * router.ts
 * 
 * PURPOSE:
 * Intelligent routing system for LLM providers. Manages multiple LLM providers (local and cloud),
 * handles provider discovery, health checks, fallback strategies, and token tracking. Routes
 * generation requests to the best available provider based on configured strategy.
 * 
 * ARCHITECTURE:
 * Central routing hub that abstracts provider differences:
 * - Local providers: Ollama (primary), LM Studio (secondary) - privacy-focused, offline-capable
 * - Cloud providers: Gemini, NotebookLM, OpenRouter (reliable, feature-rich)
 * - Strategy-based selection: local-only, local-first, cloud-fallback, hybrid
 * - Automatic fallback on provider failure
 * - Token usage tracking for cost monitoring
 * 
 * CURRENT STATUS:
 * ✅ Supports 6 providers (LM Studio, Ollama, Ollama Cloud, Gemini, NotebookLM, OpenRouter)
 * ✅ Multiple routing strategies implemented
 * ✅ Streaming support for all providers
 * ✅ Token tracking integrated
 * ✅ Studio context prioritization (Gemini Flash 2.5)
 * 
 * DEPENDENCIES:
 * - providers/localLLM.ts: LM Studio and Ollama implementations
 * - providers/cloudLLM.ts: Gemini and NotebookLM implementations
 * - providers/openRouter.ts: OpenRouter unified cloud fallback
 * - tokenTrackingService: Token usage and cost tracking
 * - @/types/llm: LLM type definitions
 * 
 * STATE MANAGEMENT:
 * - Manages provider registry (Map<string, LLMProvider>)
 * - Tracks preferred provider and strategy
 * - Stores strategy in localStorage for persistence
 * - Does not use Zustand (stateless routing pattern)
 * 
 * PERFORMANCE:
 * - Parallel provider health checks
 * - Cached provider availability
 * - Efficient fallback logic
 * - Streaming support for real-time responses
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { llmRouter } from '@/services/ai/router';
 * 
 * // Discover available providers
 * const providers = await llmRouter.discoverProviders();
 * 
 * // Generate text
 * const response = await llmRouter.generate('Hello, world!', {
 *   temperature: 0.7,
 *   maxTokens: 100
 * });
 * 
 * // Stream generation
 * for await (const chunk of llmRouter.streamGenerate('Tell me a story')) {
 *   if (chunk.text) {
 *     console.log(chunk.text);
 *   }
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/llmStore.ts: Zustand store wrapping router
 * - src/services/ai/providers/localLLM.ts: Local provider implementations
 * - src/services/ai/providers/cloudLLM.ts: Cloud provider implementations
 * - src/services/ai/tokenTrackingService.ts: Token usage tracking
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Task-based routing (use specialized models for different tasks)
 * - Provider performance metrics and auto-selection
 * - Request queuing and rate limiting
 * - Multi-provider parallel generation for comparison
 */
import { LMStudioProvider, OllamaProvider, type LLMProvider } from './providers/localLLM';
import { GeminiProvider, NotebookLMProvider, OllamaCloudProvider } from './providers/cloudLLM';
import { OpenRouterProvider } from './providers/openRouter';
import { tokenTrackingService } from './tokenTrackingService';
import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk, TaskType } from '@/types/llm';
import { measureAsync, logSlowOperation } from '@/utils/performance';

export type { LLMProvider };

type ProviderStrategy = 'local-only' | 'local-first' | 'cloud-fallback' | 'hybrid';

export class LLMRouter {
  private providers: Map<string, LLMProvider> = new Map();
  private preferredProvider: 'lmstudio' | 'ollama' | 'ollama-cloud' | 'gemini' | 'notebooklm' | 'openrouter' | null = null;
  private strategy: ProviderStrategy = 'cloud-fallback'; // Default to cloud fallback for reliability
  private openRouterProvider: OpenRouterProvider;
  private studioContext: boolean = false; // Track if Studio is active
  private providerHealthCache: Map<string, { status: boolean; timestamp: number }> = new Map();
  private readonly HEALTH_CACHE_TTL = 5000;

  constructor() {
    // Local providers
    this.providers.set('lmstudio', new LMStudioProvider());
    this.providers.set('ollama', new OllamaProvider());
    
    // Cloud providers
    this.providers.set('gemini', new GeminiProvider());
    this.providers.set('notebooklm', new NotebookLMProvider());
    this.providers.set('ollama-cloud', new OllamaCloudProvider());
    
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
    return measureAsync(
      'llmRouter.discoverProviders',
      async () => {
        const results: { provider: string; available: boolean; models: LLMModel[] }[] = [];

        for (const [name, provider] of this.providers.entries()) {
          try {
        const isHealthy = await this.isProviderHealthy(name, provider);
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
      },
      200,
      { providerCount: this.providers.size, strategy: this.strategy }
    );
  }

  async getAvailableProvider(): Promise<LLMProvider | null> {
    // If Studio context is active, prioritize Gemini Flash 2.5
    if (this.studioContext) {
      const gemini = this.providers.get('gemini');
      if (gemini && (await this.isProviderHealthy('gemini', gemini))) {
        this.preferredProvider = 'gemini';
        return gemini;
      }
    }

    // Check preferred provider first
    if (this.preferredProvider) {
      const provider = this.providers.get(this.preferredProvider);
      if (provider && (await this.isProviderHealthy(this.preferredProvider, provider))) {
        return provider;
      }
    }

    // Local-first strategy (default)
    if (this.strategy === 'local-first') {
      // Try local providers first (Ollama primary, LM Studio secondary)
      const ollama = this.providers.get('ollama');
      if (ollama && (await this.isProviderHealthy('ollama', ollama))) {
        this.preferredProvider = 'ollama';
        return ollama;
      }

      const lmStudio = this.providers.get('lmstudio');
      if (lmStudio && (await this.isProviderHealthy('lmstudio', lmStudio))) {
        this.preferredProvider = 'lmstudio';
        return lmStudio;
      }

      // Fallback to cloud
      const gemini = this.providers.get('gemini');
      if (gemini && (await this.isProviderHealthy('gemini', gemini))) {
        this.preferredProvider = 'gemini';
        return gemini;
      }
    }

    // Cloud-fallback strategy (try local first, then cloud)
    if (this.strategy === 'cloud-fallback') {
      // Try local providers first (Ollama primary, LM Studio secondary)
      const ollama = this.providers.get('ollama');
      if (ollama && (await this.isProviderHealthy('ollama', ollama))) {
        this.preferredProvider = 'ollama';
        return ollama;
      }

      const lmStudio = this.providers.get('lmstudio');
      if (lmStudio && (await this.isProviderHealthy('lmstudio', lmStudio))) {
        this.preferredProvider = 'lmstudio';
        return lmStudio;
      }

      // Fallback to cloud (try Ollama Cloud first, then Gemini)
      const ollamaCloud = this.providers.get('ollama-cloud');
      if (ollamaCloud && (await this.isProviderHealthy('ollama-cloud', ollamaCloud))) {
        this.preferredProvider = 'ollama-cloud';
        return ollamaCloud;
      }

      const gemini = this.providers.get('gemini');
      if (gemini && (await this.isProviderHealthy('gemini', gemini))) {
        this.preferredProvider = 'gemini';
        return gemini;
      }
    }

    return null;
  }

  async getAllModels(): Promise<LLMModel[]> {
    const allModels: LLMModel[] = [];

    for (const [name, provider] of this.providers.entries()) {
      try {
        if (await this.isProviderHealthy(name, provider)) {
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
    const provider = await measureAsync(
      'llmRouter.selectProvider',
      () => this.selectProvider(options),
      50,
      { strategy: this.strategy, taskType: options?.taskType }
    );
    
    if (!provider) {
      throw new Error('No LLM providers available. Please configure Ollama, LM Studio, or OpenRouter.');
    }

    try {
      const response = await measureAsync(
        `llmRouter.generate:${provider.name}`,
        () => provider.generate(prompt, options),
        500,
        { model: options?.model, taskType: options?.taskType }
      );
      
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
          const response = await measureAsync(
            `llmRouter.generate:${fallback.name}`,
            () => fallback.generate(prompt, options),
            500,
            { fallback: true, model: options?.model, taskType: options?.taskType }
          );
          
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

  private async selectModelForTask(taskType?: TaskType): Promise<LLMProvider | null> {
    if (!taskType || taskType === 'general') {
      return null;
    }

    let preferredOrder: string[] = [];

    switch (taskType) {
      case 'coding':
        preferredOrder = ['ollama', 'lmstudio', 'ollama-cloud', 'openrouter', 'gemini'];
        break;
      case 'vision':
        preferredOrder = ['gemini', 'openrouter', 'ollama-cloud'];
        break;
      case 'reasoning':
        preferredOrder = ['ollama-cloud', 'openrouter', 'ollama', 'lmstudio', 'gemini'];
        break;
      case 'function-calling':
        preferredOrder = ['gemini', 'openrouter', 'ollama-cloud', 'ollama'];
        break;
      default:
        preferredOrder = [];
    }

    // Respect user-selected preferred provider if it supports the task.
    if (this.preferredProvider && preferredOrder.includes(this.preferredProvider)) {
      preferredOrder = [this.preferredProvider, ...preferredOrder];
    }

    // Deduplicate while preserving order.
    const orderedProviders = preferredOrder.filter(
      (provider, index) => preferredOrder.indexOf(provider) === index
    );

    for (const providerName of orderedProviders) {
      const provider = this.providers.get(providerName);
      if (!provider) continue;
      try {
        if (await this.isProviderHealthy(providerName, provider)) {
          return provider;
        }
      } catch {
        // ignore and continue to next provider
      }
    }

    return null;
  }

  private async isProviderHealthy(name: string, provider: LLMProvider): Promise<boolean> {
    const cached = this.providerHealthCache.get(name);
    const now = Date.now();
    if (cached && now - cached.timestamp < this.HEALTH_CACHE_TTL) {
      return cached.status;
    }

    try {
      const status = await provider.healthCheck();
      this.providerHealthCache.set(name, { status, timestamp: now });
      return status;
    } catch (error) {
      console.warn(`Health check failed for provider ${name}:`, error);
      this.providerHealthCache.set(name, { status: false, timestamp: now });
      return false;
    }
  }

  private async selectProvider(options?: GenerateOptions): Promise<LLMProvider | null> {
    // Try task-aware routing first (falls back to strategy if nothing suitable is available).
    const taskAwareProvider = await this.selectModelForTask(options?.taskType);
    if (taskAwareProvider) {
      return taskAwareProvider;
    }

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
      // Local unavailable -> immediately route to aggregated OpenRouter fallback.
      return this.providers.get('openrouter') || null;
    }

    // Strategy 4: hybrid - Use best provider for task (future enhancement)
    if (this.strategy === 'hybrid') {
      // For now, same as cloud-fallback
      const local = await this.getLocalProvider();
      if (local) return local;
      // Hybrid currently favors OpenRouter when neither local provider is healthy.
      return this.providers.get('openrouter') || null;
    }

    return null;
  }

  private async getLocalProvider(): Promise<LLMProvider | null> {
    // Try Ollama first (faster, better)
    const ollama = this.providers.get('ollama');
    if (ollama && await this.isProviderHealthy('ollama', ollama)) {
      return ollama;
    }

    // Fallback to LM Studio
    const lmstudio = this.providers.get('lmstudio');
    if (lmstudio && await this.isProviderHealthy('lmstudio', lmstudio)) {
      return lmstudio;
    }

    return null;
  }

  private async getFallbackProvider(failedProvider: LLMProvider): Promise<LLMProvider | null> {
    // If local provider failed, try OpenRouter
    if (failedProvider.type === 'local') {
      // Local failure usually means runtime down; defer to resilient cloud fallback.
      const openrouter = this.providers.get('openrouter');
      if (openrouter && await this.isProviderHealthy('openrouter', openrouter)) {
        return openrouter;
      }
    }

    // If cloud provider failed, try local
    if (failedProvider.type === 'cloud') {
      // Cloud outages should bounce requests back to whichever local runtime is online.
      return await this.getLocalProvider();
    }

    return null;
  }

  async *streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk> {
    let provider = await measureAsync(
      'llmRouter.selectProvider',
      () => this.selectProvider(options),
      50,
      { strategy: this.strategy, taskType: options?.taskType }
    );

    if (!provider) {
      throw new Error('No LLM providers available. Please configure Ollama, LM Studio, or OpenRouter.');
    }

    while (provider) {
      const start = performance.now();
      try {
        for await (const chunk of provider.streamGenerate(prompt, options)) {
          yield chunk;
        }
        logSlowOperation(
          `llmRouter.streamGenerate:${provider.name}`,
          performance.now() - start,
          750,
          { model: options?.model, taskType: options?.taskType }
        );
        return;
      } catch (error) {
        logSlowOperation(
          `llmRouter.streamGenerateError:${provider.name}`,
          performance.now() - start,
          750,
          { failure: true, model: options?.model, taskType: options?.taskType }
        );
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

  setPreferredProvider(provider: 'lmstudio' | 'ollama' | 'ollama-cloud' | 'gemini' | 'notebooklm' | 'openrouter'): void {
    this.preferredProvider = provider;
  }

  getPreferredProvider(): 'lmstudio' | 'ollama' | 'ollama-cloud' | 'gemini' | 'notebooklm' | 'openrouter' | null {
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

