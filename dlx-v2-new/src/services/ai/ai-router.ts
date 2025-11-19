/**
 * AI Router
 * Provider abstraction layer for Gemini, Claude, and local models
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AIProvider,
  AIModel,
  AIMessage,
  AIGenerateOptions,
  AIStreamChunk,
  ProviderDetectionResult,
} from '../../types/ai';
import { logger } from '../foundation/logger';

interface AIState {
  activeProvider: AIProvider;
  activeModel: string | null;
  models: AIModel[];
  isGenerating: boolean;
  detectedProviders: ProviderDetectionResult[];

  // Actions
  setProvider: (provider: AIProvider) => void;
  setModel: (modelId: string) => void;
  detectProviders: () => Promise<void>;
  generate: (messages: AIMessage[], options?: AIGenerateOptions) => Promise<string>;
  streamGenerate: (
    messages: AIMessage[],
    onChunk: (chunk: AIStreamChunk) => void,
    options?: AIGenerateOptions
  ) => Promise<void>;
}

export const useAIStore = create<AIState>()(
  persist(
    (set, get) => ({
      activeProvider: 'gemini',
      activeModel: null,
      models: [
        {
          id: 'gemini-2.0-flash',
          name: 'Gemini 2.0 Flash',
          provider: 'gemini',
          capabilities: ['chat', 'code-generation', 'function-calling', 'vision', 'voice', 'streaming'],
          contextWindow: 1000000,
          isAvailable: false,
          cost: { input: 0.075, output: 0.30 },
        },
        {
          id: 'claude-3-5-sonnet',
          name: 'Claude 3.5 Sonnet',
          provider: 'claude',
          capabilities: ['chat', 'code-generation', 'streaming'],
          contextWindow: 200000,
          isAvailable: false,
          cost: { input: 3.0, output: 15.0 },
        },
      ],
      isGenerating: false,
      detectedProviders: [],

      setProvider: (provider) => {
        set({ activeProvider: provider });
        logger.info(`AI provider changed to ${provider}`);

        // Auto-select best model for provider
        const models = get().models.filter((m) => m.provider === provider && m.isAvailable);
        if (models.length > 0) {
          set({ activeModel: models[0].id });
        }
      },

      setModel: (modelId) => {
        const model = get().models.find((m) => m.id === modelId);
        if (model) {
          set({ activeModel: modelId, activeProvider: model.provider });
          logger.info(`AI model changed to ${model.name}`);
        }
      },

      detectProviders: async () => {
        logger.info('Detecting AI providers...');
        const results: ProviderDetectionResult[] = [];

        // Detect Ollama (localhost:11434)
        try {
          const startTime = Date.now();
          const response = await fetch('http://localhost:11434/api/tags', {
            signal: AbortSignal.timeout(3000),
          });

          if (response.ok) {
            const data = await response.json();
            results.push({
              provider: 'ollama',
              detected: true,
              url: 'http://localhost:11434',
              models: data.models?.map((m: any) => m.name) || [],
              responseTime: Date.now() - startTime,
            });

            // Add detected models to store
            const ollamaModels: AIModel[] = (data.models || []).map((m: any) => ({
              id: `ollama-${m.name}`,
              name: m.name,
              provider: 'ollama' as AIProvider,
              capabilities: ['chat', 'code-generation', 'streaming'] as any,
              contextWindow: 4096,
              isAvailable: true,
            }));

            set((state) => ({
              models: [
                ...state.models.filter((m) => m.provider !== 'ollama'),
                ...ollamaModels,
              ],
            }));

            logger.info('Ollama detected', { models: data.models?.length });
          }
        } catch {
          results.push({
            provider: 'ollama',
            detected: false,
          });
        }

        // Detect LM Studio (localhost:1234)
        try {
          const startTime = Date.now();
          const response = await fetch('http://localhost:1234/v1/models', {
            signal: AbortSignal.timeout(3000),
          });

          if (response.ok) {
            const data = await response.json();
            results.push({
              provider: 'lmstudio',
              detected: true,
              url: 'http://localhost:1234',
              models: data.data?.map((m: any) => m.id) || [],
              responseTime: Date.now() - startTime,
            });

            // Add detected models
            const lmstudioModels: AIModel[] = (data.data || []).map((m: any) => ({
              id: `lmstudio-${m.id}`,
              name: m.id,
              provider: 'lmstudio' as AIProvider,
              capabilities: ['chat', 'code-generation', 'streaming'] as any,
              contextWindow: 4096,
              isAvailable: true,
            }));

            set((state) => ({
              models: [
                ...state.models.filter((m) => m.provider !== 'lmstudio'),
                ...lmstudioModels,
              ],
            }));

            logger.info('LM Studio detected', { models: data.data?.length });
          }
        } catch {
          results.push({
            provider: 'lmstudio',
            detected: false,
          });
        }

        // Check for Gemini API key (from environment or localStorage)
        const geminiKey = localStorage.getItem('gemini-api-key') || import.meta.env.VITE_GEMINI_API_KEY;
        if (geminiKey) {
          results.push({
            provider: 'gemini',
            detected: true,
          });

          set((state) => ({
            models: state.models.map((m) =>
              m.provider === 'gemini' ? { ...m, isAvailable: true } : m
            ),
          }));

          logger.info('Gemini API key found');
        }

        // Check for Claude API key
        const claudeKey = localStorage.getItem('claude-api-key') || import.meta.env.VITE_CLAUDE_API_KEY;
        if (claudeKey) {
          results.push({
            provider: 'claude',
            detected: true,
          });

          set((state) => ({
            models: state.models.map((m) =>
              m.provider === 'claude' ? { ...m, isAvailable: true } : m
            ),
          }));

          logger.info('Claude API key found');
        }

        set({ detectedProviders: results });

        // Auto-select first available model
        const availableModels = get().models.filter((m) => m.isAvailable);
        if (availableModels.length > 0 && !get().activeModel) {
          get().setModel(availableModels[0].id);
        }

        logger.info('Provider detection complete', {
          detected: results.filter((r) => r.detected).map((r) => r.provider),
        });
      },

      generate: async (messages, options = {}) => {
        const { activeProvider, activeModel, models } = get();

        if (!activeModel) {
          throw new Error('No AI model selected');
        }

        const model = models.find((m) => m.id === activeModel);
        if (!model) {
          throw new Error('Selected model not found');
        }

        set({ isGenerating: true });

        try {
          // Route to appropriate provider
          switch (activeProvider) {
            case 'gemini':
              return await generateWithGemini(messages, options);
            case 'claude':
              return await generateWithClaude(messages, options);
            case 'ollama':
            case 'lmstudio':
              return await generateWithLocal(activeProvider, activeModel, messages, options);
            default:
              throw new Error(`Unknown provider: ${activeProvider}`);
          }
        } finally {
          set({ isGenerating: false });
        }
      },

      streamGenerate: async (messages, onChunk, options = {}) => {
        const { activeProvider, activeModel } = get();

        if (!activeModel) {
          throw new Error('No AI model selected');
        }

        set({ isGenerating: true });

        try {
          switch (activeProvider) {
            case 'gemini':
              await streamWithGemini(messages, onChunk, options);
              break;
            case 'claude':
              await streamWithClaude(messages, onChunk, options);
              break;
            case 'ollama':
            case 'lmstudio':
              await streamWithLocal(activeProvider, activeModel, messages, onChunk, options);
              break;
            default:
              throw new Error(`Unknown provider: ${activeProvider}`);
          }
        } finally {
          set({ isGenerating: false });
        }
      },
    }),
    {
      name: 'dlx-ai',
      version: 1,
    }
  )
);

// Provider-specific implementations (stubs for now - will be completed later)

async function generateWithGemini(messages: AIMessage[], _options: AIGenerateOptions): Promise<string> {
  // TODO: Implement Gemini API call
  logger.info('Generating with Gemini (stubbed)', { messages: messages.length });
  return 'Gemini response (stub - API integration needed)';
}

async function generateWithClaude(messages: AIMessage[], _options: AIGenerateOptions): Promise<string> {
  // TODO: Implement Claude API call
  logger.info('Generating with Claude (stubbed)', { messages: messages.length });
  return 'Claude response (stub - API integration needed)';
}

async function generateWithLocal(
  provider: 'ollama' | 'lmstudio',
  modelId: string,
  _messages: AIMessage[],
  _options: AIGenerateOptions
): Promise<string> {
  // TODO: Implement local model API call
  logger.info(`Generating with ${provider} (stubbed)`, { model: modelId });
  return `${provider} response (stub - API integration needed)`;
}

async function streamWithGemini(
  _messages: AIMessage[],
  onChunk: (chunk: AIStreamChunk) => void,
  _options: AIGenerateOptions
): Promise<void> {
  // TODO: Implement streaming
  logger.info('Streaming with Gemini (stubbed)');
  onChunk({ content: 'Gemini streaming response (stub)', done: true });
}

async function streamWithClaude(
  _messages: AIMessage[],
  onChunk: (chunk: AIStreamChunk) => void,
  _options: AIGenerateOptions
): Promise<void> {
  // TODO: Implement streaming
  logger.info('Streaming with Claude (stubbed)');
  onChunk({ content: 'Claude streaming response (stub)', done: true });
}

async function streamWithLocal(
  provider: 'ollama' | 'lmstudio',
  _modelId: string,
  _messages: AIMessage[],
  onChunk: (chunk: AIStreamChunk) => void,
  _options: AIGenerateOptions
): Promise<void> {
  // TODO: Implement streaming
  logger.info(`Streaming with ${provider} (stubbed)`);
  onChunk({ content: `${provider} streaming response (stub)`, done: true });
}
