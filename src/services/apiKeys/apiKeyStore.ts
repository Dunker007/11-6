import { create } from 'zustand';
import type { APIKey, LLMProvider } from '../../types/apiKeys';
import { apiKeyService } from './apiKeyService';
import { withAsyncOperation } from '@/utils/storeHelpers';

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
    await withAsyncOperation(
      async () => {
        const keys = await apiKeyService.getAllKeysAsync();
        set({ keys });
        return keys;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'apiKeyStore'
    );
  },

  addKey: async (provider, key, name) => {
    await withAsyncOperation(
      async () => {
        await apiKeyService.addKey(provider, key, name);
        const keys = await apiKeyService.getAllKeysAsync();
        set({ keys });
        return keys;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'apiKeyStore'
    );
  },

  updateKey: async (id, updates) => {
    await withAsyncOperation(
      async () => {
        await apiKeyService.updateKey(id, updates);
        const keys = await apiKeyService.getAllKeysAsync();
        set({ keys });
        return keys;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'apiKeyStore'
    );
  },

  deleteKey: async (id) => {
    await withAsyncOperation(
      async () => {
        await apiKeyService.deleteKey(id);
        const keys = await apiKeyService.getAllKeysAsync();
        set({ keys });
        return keys;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'apiKeyStore'
    );
  },

  validateKey: async (provider, key) => {
    return apiKeyService.validateKey(provider, key);
  },

  healthCheck: async (provider) => {
    return apiKeyService.healthCheck(provider);
  },
}));

