import { create } from 'zustand';
import type { APIKey, LLMProvider } from '../../types/apiKeys';
import { apiKeyService } from './apiKeyService';

interface APIKeyStore {
  keys: APIKey[];
  isLoading: boolean;
  error: string | null;
  loadKeys: () => Promise<void>;
  addKey: (provider: LLMProvider, key: string, name: string) => Promise<void>;
  updateKey: (id: string, updates: Partial<APIKey>) => Promise<void>;
  deleteKey: (id: string) => Promise<void>;
  validateKey: (provider: LLMProvider, key: string) => Promise<boolean>;
  healthCheck: (provider: LLMProvider) => Promise<boolean>;
}

export const useAPIKeyStore = create<APIKeyStore>((set) => ({
  keys: [],
  isLoading: false,
  error: null,

  loadKeys: async () => {
    set({ isLoading: true, error: null });
    try {
      const keys = apiKeyService.getAllKeys();
      set({ keys, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addKey: async (provider, key, name) => {
    set({ isLoading: true, error: null });
    try {
      await apiKeyService.addKey(provider, key, name);
      const keys = apiKeyService.getAllKeys();
      set({ keys, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateKey: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await apiKeyService.updateKey(id, updates);
      const keys = apiKeyService.getAllKeys();
      set({ keys, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteKey: async (id) => {
    set({ isLoading: true, error: null });
    try {
      apiKeyService.deleteKey(id);
      const keys = apiKeyService.getAllKeys();
      set({ keys, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  validateKey: async (provider, key) => {
    return apiKeyService.validateKey(provider, key);
  },

  healthCheck: async (provider) => {
    return apiKeyService.healthCheck(provider);
  },
}));

