import { describe, it, expect, beforeEach, vi } from 'vitest';
import { llmRouter } from './router';

// Mock dependencies
vi.mock('./providers/localLLM', () => ({
  lmStudioProvider: {
    name: 'lmstudio',
    isAvailable: vi.fn().mockResolvedValue(false),
    getModels: vi.fn().mockResolvedValue([]),
    generate: vi.fn().mockResolvedValue({ text: 'test response' }),
  },
  ollamaProvider: {
    name: 'ollama',
    isAvailable: vi.fn().mockResolvedValue(false),
    getModels: vi.fn().mockResolvedValue([]),
    generate: vi.fn().mockResolvedValue({ text: 'test response' }),
  },
}));

vi.mock('./providers/cloudLLM', () => ({
  GeminiProvider: vi.fn().mockImplementation(() => ({
    name: 'gemini',
    isAvailable: vi.fn().mockResolvedValue(true),
    getModels: vi.fn().mockResolvedValue([]),
    generate: vi.fn().mockResolvedValue({ text: 'test response' }),
  })),
  NotebookLMProvider: vi.fn().mockImplementation(() => ({
    name: 'notebooklm',
    isAvailable: vi.fn().mockResolvedValue(false),
    getModels: vi.fn().mockResolvedValue([]),
    generate: vi.fn().mockResolvedValue({ text: 'test response' }),
  })),
  OllamaCloudProvider: vi.fn().mockImplementation(() => ({
    name: 'ollama-cloud',
    isAvailable: vi.fn().mockResolvedValue(false),
    getModels: vi.fn().mockResolvedValue([]),
    generate: vi.fn().mockResolvedValue({ text: 'test response' }),
  })),
}));

vi.mock('./providers/openRouter', () => ({
  OpenRouterProvider: vi.fn().mockImplementation(() => ({
    name: 'openrouter',
    isAvailable: vi.fn().mockResolvedValue(false),
    getModels: vi.fn().mockResolvedValue([]),
    generate: vi.fn().mockResolvedValue({ text: 'test response' }),
    setApiKey: vi.fn(),
  })),
}));

vi.mock('./providers/localProviderDiscovery', () => ({
  localProviderDiscovery: {
    discover: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock('../activity/activityService', () => ({
  activityService: {
    addActivity: vi.fn(),
  },
}));

vi.mock('./tokenTrackingService', () => ({
  tokenTrackingService: {
    trackUsage: vi.fn(),
  },
}));

vi.mock('@/utils/performance', () => ({
  measureAsync: vi.fn((name, fn) => fn()),
  logSlowOperation: vi.fn(),
}));

vi.mock('@/services/errors/errorLogger', () => ({
  errorLogger: {
    logFromError: vi.fn(),
  },
}));

vi.mock('@/services/logging/loggerService', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('LLMRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('getStrategy', () => {
    it('should return the current strategy', () => {
      const strategy = llmRouter.getStrategy();
      expect(['local-only', 'local-first', 'cloud-fallback', 'hybrid']).toContain(strategy);
    });
  });

  describe('setStrategy', () => {
    it('should update the routing strategy', () => {
      llmRouter.setStrategy('local-only');
      expect(llmRouter.getStrategy()).toBe('local-only');
    });

    it('should persist strategy changes', () => {
      llmRouter.setStrategy('hybrid');
      const saved = localStorage.getItem('llm-strategy');
      expect(saved).toBe('hybrid');
    });
  });

  describe('discoverProviders', () => {
    it('should discover available providers', async () => {
      const providers = await llmRouter.discoverProviders();
      expect(Array.isArray(providers)).toBe(true);
      expect(providers.length).toBeGreaterThan(0);
    });

    it('should return provider availability status', async () => {
      const providers = await llmRouter.discoverProviders();
      providers.forEach(provider => {
        expect(provider).toHaveProperty('provider');
        expect(provider).toHaveProperty('available');
        expect(typeof provider.available).toBe('boolean');
      });
    });

    it('should debounce rapid discovery calls', async () => {
      await llmRouter.discoverProviders();
      const start = Date.now();
      await llmRouter.discoverProviders();
      const end = Date.now();
      // Should return quickly due to debouncing
      expect(end - start).toBeLessThan(100);
    });
  });

  describe('generate', () => {
    it('should generate text using available provider', async () => {
      const response = await llmRouter.generate('test prompt', {
        temperature: 0.7,
        maxTokens: 100,
      });
      expect(response).toHaveProperty('text');
      expect(typeof response.text).toBe('string');
    });

    it('should handle generation errors gracefully', async () => {
      // Mock all providers to fail
      const { GeminiProvider } = await import('./providers/cloudLLM');
      const mockProvider = new GeminiProvider();
      vi.mocked(mockProvider.generate).mockRejectedValueOnce(new Error('Generation failed'));

      // Should still return a response (fallback or error handling)
      const response = await llmRouter.generate('test', {});
      expect(response).toBeDefined();
    });
  });

  describe('setOpenRouterKey', () => {
    it('should set the OpenRouter API key', () => {
      expect(() => {
        llmRouter.setOpenRouterKey('test-key');
      }).not.toThrow();
    });
  });
});

