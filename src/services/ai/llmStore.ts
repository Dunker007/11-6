import { create } from 'zustand';
import { llmRouter } from './router';
import type { LLMModel } from '../../types/llm';
import { localProviderDiscovery, type LocalProviderState } from './providers/localProviderDiscovery';

interface LLMStore {
  models: LLMModel[];
  availableProviders: string[];
  localProviders: LocalProviderState[];
  isLoading: boolean;
  error: string | null;
  activeModel: LLMModel | null; // Track currently active model
  pullingModels: Set<string>; // Track models being pulled
  discoverProviders: () => Promise<void>;
  discoverLocalProviders: () => Promise<void>;
  setActiveModel: (model: LLMModel | null) => void;
  switchToModel: (modelId: string) => Promise<boolean>;
  pullModel: (modelId: string, pullCommand: string) => Promise<boolean>;
  generate: (prompt: string, options?: any) => Promise<string>;
  streamGenerate: (prompt: string, options?: any) => AsyncGenerator<string>;
}

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

  discoverProviders: async () => {
    set({ isLoading: true, error: null });
    try {
      const results = await llmRouter.discoverProviders();
      const available = results.filter((r) => r.available).map((r) => r.provider);
      const allModels = results.flatMap((r) => r.models);

      set({
        availableProviders: available,
        models: allModels,
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  discoverLocalProviders: async () => {
    try {
      const providers = await localProviderDiscovery.discover();
      set({ localProviders: providers });
    } catch (error) {
      console.error('Failed to discover local providers:', error);
      // Don't set error state, just log it
    }
  },

  setActiveModel: (model: LLMModel | null) => {
    set({ activeModel: model });
    // Update router's preferred provider based on active model
    if (model) {
      llmRouter.setPreferredProvider(model.provider as any);
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
    llmRouter.setPreferredProvider(model.provider as any);
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
      if (!window.llm?.pullModel) {
        throw new Error('Model pulling not available');
      }

      const result = await window.llm.pullModel(modelId, pullCommand);
      
      if (result.success) {
        // Refresh providers to get updated model list
        await get().discoverProviders();
        set((state) => {
          const newPulling = new Set(state.pullingModels);
          newPulling.delete(modelId);
          return { pullingModels: newPulling };
        });
        return true;
      } else {
        set((state) => {
          const newPulling = new Set(state.pullingModels);
          newPulling.delete(modelId);
          return { 
            pullingModels: newPulling,
            error: result.error || 'Failed to pull model',
          };
        });
        return false;
      }
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
    set({ isLoading: true, error: null });
    try {
      const response = await llmRouter.generate(prompt, options);
      set({ isLoading: false });
      return response.text;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
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
        yield chunk.text;
      }
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },
}));

