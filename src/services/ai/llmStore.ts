import { create } from 'zustand';
import { llmRouter } from './router';
import type { LLMModel } from '../../types/llm';

interface LLMStore {
  models: LLMModel[];
  availableProviders: string[];
  isLoading: boolean;
  error: string | null;
  discoverProviders: () => Promise<void>;
  generate: (prompt: string, options?: any) => Promise<string>;
  streamGenerate: (prompt: string, options?: any) => AsyncGenerator<string>;
}

export const useLLMStore = create<LLMStore>((set) => ({
  models: [],
  availableProviders: [],
  isLoading: false,
  error: null,

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

