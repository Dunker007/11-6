import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLLMStore } from './llmStore';
import type { LLMModel } from '@/types/llm';

// Mock dependencies
vi.mock('./router', () => ({
  llmRouter: {
    discoverProviders: vi.fn().mockResolvedValue([
      {
        provider: 'ollama',
        available: true,
        models: [
          {
            id: 'test-model-1',
            name: 'Test Model 1',
            provider: 'ollama',
          },
        ],
      },
    ]),
    generate: vi.fn().mockResolvedValue({ text: 'test response', tokensUsed: 10 }),
    streamGenerate: vi.fn().mockImplementation(async function* () {
      yield { text: 'test', done: false };
      yield { text: ' response', done: false };
      yield { text: '', done: true };
    }),
    getProvider: vi.fn().mockReturnValue({
      healthCheck: vi.fn().mockResolvedValue(true),
      getModels: vi.fn().mockResolvedValue([]),
      generate: vi.fn().mockResolvedValue({ text: 'test', tokensUsed: 5 }),
    }),
    setPreferredProvider: vi.fn(),
    getPreferredProvider: vi.fn().mockReturnValue(null),
  },
}));

vi.mock('./providers/localProviderDiscovery', () => ({
  localProviderDiscovery: {
    discover: vi.fn().mockResolvedValue([
      { name: 'Ollama', status: 'offline', endpoint: 'http://localhost:11434' },
      { name: 'LM Studio', status: 'offline', endpoint: 'http://localhost:1234' },
    ]),
  },
}));

vi.mock('../logging/loggerService', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock window.llm for Electron IPC
Object.defineProperty(window, 'llm', {
  value: {
    pullModel: vi.fn().mockResolvedValue({ success: true }),
  },
  writable: true,
});

describe('llmStore', () => {
  beforeEach(() => {
    // Reset store state
    const store = useLLMStore.getState();
    store.models = [];
    store.availableProviders = [];
    store.activeModel = null;
    store.error = null;
    store.isLoading = false;
    store.pullingModels = new Set();
    store.favoriteModels = new Set();
    
    // Clear localStorage
    localStorage.clear();
  });

  describe('discoverProviders', () => {
    it('should discover providers and update models', async () => {
      const { discoverProviders } = useLLMStore.getState();
      
      await discoverProviders();
      
      const state = useLLMStore.getState();
      expect(state.availableProviders).toContain('ollama');
      expect(state.models.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const { llmRouter } = await import('./router');
      vi.mocked(llmRouter.discoverProviders).mockRejectedValueOnce(new Error('Network error'));
      
      const { discoverProviders } = useLLMStore.getState();
      await discoverProviders();
      
      const state = useLLMStore.getState();
      expect(state.error).toBeTruthy();
    });
  });

  describe('setActiveModel', () => {
    it('should set active model', () => {
      const { setActiveModel } = useLLMStore.getState();
      const model: LLMModel = {
        id: 'test-model',
        name: 'Test Model',
        provider: 'ollama',
      };
      
      setActiveModel(model);
      
      const state = useLLMStore.getState();
      expect(state.activeModel).toEqual(model);
    });

    it('should clear active model when set to null', () => {
      const { setActiveModel } = useLLMStore.getState();
      const model: LLMModel = {
        id: 'test-model',
        name: 'Test Model',
        provider: 'ollama',
      };
      
      setActiveModel(model);
      setActiveModel(null);
      
      const state = useLLMStore.getState();
      expect(state.activeModel).toBeNull();
    });
  });

  describe('switchToModel', () => {
    it('should switch to a valid model', async () => {
      const { discoverProviders, switchToModel } = useLLMStore.getState();
      
      // First discover providers to populate models
      await discoverProviders();
      
      const result = await switchToModel('test-model-1');
      
      expect(result).toBe(true);
      const state = useLLMStore.getState();
      expect(state.activeModel?.id).toBe('test-model-1');
    });

    it('should return false for non-existent model', async () => {
      const { switchToModel } = useLLMStore.getState();
      
      const result = await switchToModel('non-existent-model');
      
      expect(result).toBe(false);
      const state = useLLMStore.getState();
      expect(state.error).toBeTruthy();
    });
  });

  describe('generate', () => {
    it('should generate text', async () => {
      const { generate } = useLLMStore.getState();
      
      const result = await generate('test prompt');
      
      expect(result).toBe('test response');
    });

    it('should handle generation errors', async () => {
      const { llmRouter } = await import('./router');
      vi.mocked(llmRouter.generate).mockRejectedValueOnce(new Error('Generation failed'));
      
      const { generate } = useLLMStore.getState();
      
      await expect(generate('test prompt')).rejects.toThrow();
    });
  });

  describe('streamGenerate', () => {
    it('should stream generation chunks', async () => {
      const { streamGenerate } = useLLMStore.getState();
      const chunks: string[] = [];
      
      for await (const chunk of streamGenerate('test prompt')) {
        if (chunk.text) {
          chunks.push(chunk.text);
        }
      }
      
      expect(chunks).toEqual(['test', ' response']);
    });

    it('should set loading state during streaming', async () => {
      const { streamGenerate } = useLLMStore.getState();
      
      const generator = streamGenerate('test prompt');
      const state1 = useLLMStore.getState();
      expect(state1.isLoading).toBe(true);
      
      // Consume generator
      for await (const _chunk of generator) {
        // Consume all chunks
      }
      
      const state2 = useLLMStore.getState();
      expect(state2.isLoading).toBe(false);
    });
  });

  describe('toggleFavorite', () => {
    it('should add model to favorites', () => {
      const { toggleFavorite, isFavorite } = useLLMStore.getState();
      
      toggleFavorite('test-model-1');
      
      expect(isFavorite('test-model-1')).toBe(true);
    });

    it('should remove model from favorites when toggled again', () => {
      const { toggleFavorite, isFavorite } = useLLMStore.getState();
      
      toggleFavorite('test-model-1');
      toggleFavorite('test-model-1');
      
      expect(isFavorite('test-model-1')).toBe(false);
    });

    it('should persist favorites to localStorage', () => {
      const { toggleFavorite } = useLLMStore.getState();
      
      toggleFavorite('test-model-1');
      
      const stored = localStorage.getItem('llm-favorites');
      expect(stored).toBeTruthy();
      const favorites = JSON.parse(stored!);
      expect(favorites).toContain('test-model-1');
    });
  });

  describe('pullModel', () => {
    it('should pull model via Electron IPC if available', async () => {
      const { pullModel } = useLLMStore.getState();
      
      const result = await pullModel('test-model', 'ollama pull test-model');
      
      expect(result).toBe(true);
      expect(window.llm?.pullModel).toHaveBeenCalledWith('test-model', 'ollama pull test-model');
    });

    it('should prevent duplicate pulls', async () => {
      const { pullModel } = useLLMStore.getState();
      
      // Start first pull
      const promise1 = pullModel('test-model', 'ollama pull test-model');
      
      // Try to start second pull immediately
      const promise2 = pullModel('test-model', 'ollama pull test-model');
      
      await Promise.all([promise1, promise2]);
      
      // Second call should return false immediately
      expect(promise2).resolves.toBe(false);
    });
  });
});

