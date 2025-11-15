/**
 * llmStore.ts
 * 
 * PURPOSE:
 * Zustand store for LLM state management. Provides reactive state for models, providers,
 * active model selection, and generation operations. Wraps llmRouter with Zustand for
 * React component integration.
 * 
 * ARCHITECTURE:
 * Zustand store pattern that:
 * - Manages LLM models list and availability
 * - Tracks active model selection
 * - Provides generation methods (sync and streaming)
 * - Handles model pulling (Ollama/LM Studio)
 * - Integrates with local provider discovery
 * 
 * CURRENT STATUS:
 * ✅ Full Zustand integration
 * ✅ Model discovery and selection
 * ✅ Streaming generation support
 * ✅ Model pulling integration
 * ✅ Local provider discovery
 * ✅ StreamChunk support (includes function calls)
 * 
 * DEPENDENCIES:
 * - llmRouter: Core LLM routing logic
 * - localProviderDiscovery: Local provider detection
 * - @/types/llm: LLM type definitions
 * - window.llm: Electron IPC for model pulling (optional)
 * 
 * STATE MANAGEMENT:
 * - models: Available LLM models from all providers
 * - availableProviders: List of online providers
 * - localProviders: Local provider status (Ollama, LM Studio)
 * - activeModel: Currently selected model
 * - pullingModels: Set of models being pulled
 * - isLoading: Generation in progress flag
 * - error: Error message if any
 * 
 * PERFORMANCE:
 * - Reactive updates via Zustand
 * - Streaming doesn't block UI
 * - Efficient model list updates
 * - Provider discovery runs in background
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { useLLMStore } from '@/services/ai/llmStore';
 * 
 * function MyComponent() {
 *   const { models, activeModel, streamGenerate, isLoading } = useLLMStore();
 *   
 *   const handleGenerate = async () => {
 *     for await (const chunk of streamGenerate('Hello!')) {
 *       if (chunk.text) {
 *         console.log(chunk.text);
 *       }
 *       if (chunk.functionCalls) {
 *         console.log('Function calls:', chunk.functionCalls);
 *       }
 *     }
 *   };
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/router.ts: Core routing logic
 * - src/services/ai/providers/localProviderDiscovery.ts: Provider detection
 * - src/components/AIAssistant/AIAssistant.tsx: Uses this store
 * - src/components/LLMOptimizer/ModelCatalog.tsx: Displays models from store
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Add model performance metrics
 * - Cache model responses
 * - Support model switching mid-conversation
 * - Add model comparison features
 */
import { create } from 'zustand';
import { llmRouter } from './router';
import type { LLMModel, StreamChunk, GenerateOptions } from '../../types/llm';
import { localProviderDiscovery, type LocalProviderState } from './providers/localProviderDiscovery';
import { withAsyncOperation } from '@/utils/storeHelpers';
import { logger } from '../logging/loggerService';

interface LLMStore {
  models: LLMModel[];
  availableProviders: string[];
  localProviders: LocalProviderState[];
  isLoading: boolean;
  error: string | null;
  activeModel: LLMModel | null; // Track currently active model
  pullingModels: Set<string>; // Track models being pulled
  favoriteModels: Set<string>; // Track favorite/pinned models
  discoverProviders: (forceRefresh?: boolean) => Promise<void>;
  discoverLocalProviders: () => Promise<void>;
  setActiveModel: (model: LLMModel | null) => void;
  switchToModel: (modelId: string) => Promise<boolean>;
  pullModel: (modelId: string, pullCommand: string) => Promise<boolean>;
  toggleFavorite: (modelId: string) => void;
  isFavorite: (modelId: string) => boolean;
  generate: (prompt: string, options?: GenerateOptions) => Promise<string>;
  streamGenerate: (prompt: string, options?: GenerateOptions) => AsyncGenerator<StreamChunk>;
}

// Load favorites from localStorage
const loadFavorites = (): Set<string> => {
  try {
    const stored = localStorage.getItem('llm-favorites');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

// Save favorites to localStorage
const saveFavorites = (favorites: Set<string>): void => {
  try {
    localStorage.setItem('llm-favorites', JSON.stringify(Array.from(favorites)));
  } catch {
    // Silently fail if localStorage is not available
  }
};

export const useLLMStore = create<LLMStore>((set, get) => ({
  models: [],
  availableProviders: [],
  localProviders: [
    { name: 'Ollama', status: 'offline', endpoint: 'http://localhost:11434' },
    { name: 'LM Studio', status: 'offline', endpoint: 'http://localhost:1234' },
  ],
  isLoading: false,
  error: null,
  activeModel: null,
  pullingModels: new Set(),
  favoriteModels: loadFavorites(),

  discoverProviders: async (forceRefresh: boolean = false) => {
    await withAsyncOperation(
      async () => {
        const results = await llmRouter.discoverProviders(forceRefresh);
        const available = results.filter((r) => r.available).map((r) => r.provider);
        const allModels = results.flatMap((r) => r.models);

        set({
          availableProviders: available,
          models: allModels,
        });
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'llmStore'
    );
  },

  discoverLocalProviders: async () => {
    try {
      const providers = await localProviderDiscovery.discover();
      set({ localProviders: providers });
    } catch (error) {
      logger.error('Failed to discover local providers', { error });
      // Don't set error state, just log it
    }
  },

  setActiveModel: (model: LLMModel | null) => {
    set({ activeModel: model });
    // Update router's preferred provider based on active model
    if (model) {
      const validProviders = ['lmstudio', 'ollama', 'ollama-cloud', 'gemini', 'notebooklm', 'openrouter'] as const;
      type ValidProvider = typeof validProviders[number];
      if (validProviders.includes(model.provider as ValidProvider)) {
        llmRouter.setPreferredProvider(model.provider as ValidProvider);
      }
    }
  },

  switchToModel: async (modelId: string) => {
    const { models } = get();
    const model = models.find((m) => m.id === modelId);
    
    if (!model) {
      set({ error: `Model ${modelId} not found` });
      return false;
    }

    // Check if provider is available
    const { availableProviders } = get();
    if (!availableProviders.includes(model.provider)) {
      set({ error: `Provider ${model.provider} is not available` });
      return false;
    }

    set({ activeModel: model, error: null });
    const validProviders = ['lmstudio', 'ollama', 'ollama-cloud', 'gemini', 'notebooklm', 'openrouter'] as const;
    type ValidProvider = typeof validProviders[number];
    if (validProviders.includes(model.provider as ValidProvider)) {
      llmRouter.setPreferredProvider(model.provider as ValidProvider);
    }
    return true;
  },

  pullModel: async (modelId: string, pullCommand: string) => {
    const { pullingModels } = get();
    if (pullingModels.has(modelId)) {
      return false; // Already pulling
    }

    set((state) => ({
      pullingModels: new Set(state.pullingModels).add(modelId),
      error: null,
    }));

    try {
      // Try Electron IPC first (for future desktop features)
      if (window.llm?.pullModel) {
        const result = await window.llm.pullModel(modelId, pullCommand);
        
          if (result.success) {
            // Force refresh to get updated model list after pulling
            await get().discoverProviders(true);
          set((state) => {
            const newPulling = new Set(state.pullingModels);
            newPulling.delete(modelId);
            return { pullingModels: newPulling };
          });
          return true;
        } else {
          throw new Error(result.error || 'Failed to pull model');
        }
      }

      // Fallback to direct Ollama API call (works in dev/browser mode)
      const ollamaProvider = llmRouter.getProvider('ollama');
      if (!ollamaProvider || !('pullModel' in ollamaProvider)) {
        throw new Error('Ollama provider not available or does not support pulling');
      }

      // Type guard: we've checked pullModel exists above
      interface ProviderWithPullModel {
        pullModel: (modelId: string) => Promise<void>;
      }
      await (ollamaProvider as unknown as ProviderWithPullModel).pullModel(modelId);
      
      // Refresh providers to get updated model list after pulling
      await get().discoverProviders(true);
      set((state) => {
        const newPulling = new Set(state.pullingModels);
        newPulling.delete(modelId);
        return { pullingModels: newPulling };
      });
      return true;
    } catch (error) {
      set((state) => {
        const newPulling = new Set(state.pullingModels);
        newPulling.delete(modelId);
        return { 
          pullingModels: newPulling,
          error: (error as Error).message,
        };
      });
      return false;
    }
  },

  generate: async (prompt, options) => {
    const result = await withAsyncOperation(
      async () => {
        const response = await llmRouter.generate(prompt, options);
        return response.text;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'llmStore'
    );
    if (!result) {
      throw new Error('Failed to generate response');
    }
    return result;
  },

  streamGenerate: async function* (prompt, options) {
    set({ isLoading: true, error: null });
    try {
      const stream = llmRouter.streamGenerate(prompt, options);
      for await (const chunk of stream) {
        if (chunk.done) {
          set({ isLoading: false });
          break;
        }
        // Yield the full chunk object to preserve function calls
        yield chunk;
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  toggleFavorite: (modelId: string) => {
    set((state) => {
      const newFavorites = new Set(state.favoriteModels);
      if (newFavorites.has(modelId)) {
        newFavorites.delete(modelId);
      } else {
        newFavorites.add(modelId);
      }
      saveFavorites(newFavorites);
      return { favoriteModels: newFavorites };
    });
  },

  isFavorite: (modelId: string) => {
    return get().favoriteModels.has(modelId);
  },
}));

