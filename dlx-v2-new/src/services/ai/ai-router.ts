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
import { useCredentialVault } from '../integration/credential-vault';

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

// Provider-specific implementations

async function generateWithGemini(messages: AIMessage[], options: AIGenerateOptions): Promise<string> {
  const vault = useCredentialVault.getState();
  const credential = vault.getCredential('gemini', 'api-key');

  if (!credential) {
    throw new Error('Gemini API key not configured');
  }

  logger.info('🤖 Generating with Gemini', { messages: messages.length });

  try {
    const requestBody = {
      contents: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topP: 0.95,
        topK: 40,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${credential.value}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Gemini API error', { status: response.status, error: errorText });
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const text = data.candidates[0].content.parts[0].text;
    logger.info('✅ Gemini response received', { length: text.length });

    return text;
  } catch (error) {
    logger.error('Gemini generation failed', { error });
    throw error;
  }
}

async function generateWithClaude(messages: AIMessage[], options: AIGenerateOptions): Promise<string> {
  const vault = useCredentialVault.getState();
  const credential = vault.getCredential('claude', 'api-key');

  if (!credential) {
    throw new Error('Claude API key not configured');
  }

  logger.info('🤖 Generating with Claude', { messages: messages.length });

  try {
    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const requestBody: any = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': credential.value,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Claude API error', { status: response.status, error: errorText });
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.content || data.content.length === 0) {
      throw new Error('No response from Claude');
    }

    const text = data.content[0].text;
    logger.info('✅ Claude response received', { length: text.length });

    return text;
  } catch (error) {
    logger.error('Claude generation failed', { error });
    throw error;
  }
}

async function generateWithLocal(
  provider: 'ollama' | 'lmstudio',
  modelId: string,
  messages: AIMessage[],
  options: AIGenerateOptions
): Promise<string> {
  logger.info(`🤖 Generating with ${provider}`, { model: modelId });

  const modelName = modelId.replace(`${provider}-`, '');

  try {
    if (provider === 'ollama') {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
          stream: false,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const data = await response.json();
      logger.info('✅ Ollama response received');
      return data.response;
    } else {
      // LM Studio (OpenAI-compatible)
      const response = await fetch('http://localhost:1234/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`LM Studio error: ${response.status}`);
      }

      const data = await response.json();
      logger.info('✅ LM Studio response received');
      return data.choices[0].message.content;
    }
  } catch (error) {
    logger.error(`${provider} generation failed`, { error });
    throw error;
  }
}

async function streamWithGemini(
  messages: AIMessage[],
  onChunk: (chunk: AIStreamChunk) => void,
  options: AIGenerateOptions
): Promise<void> {
  const vault = useCredentialVault.getState();
  const credential = vault.getCredential('gemini', 'api-key');

  if (!credential) {
    throw new Error('Gemini API key not configured');
  }

  logger.info('🌊 Streaming with Gemini', { messages: messages.length });

  try {
    const requestBody = {
      contents: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
      },
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:streamGenerateContent?key=${credential.value}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini streaming error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onChunk({ content: '', done: true });
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() && line.startsWith('{')) {
          try {
            const data = JSON.parse(line);
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              onChunk({ content: text, done: false });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    logger.info('✅ Gemini streaming complete');
  } catch (error) {
    logger.error('Gemini streaming failed', { error });
    throw error;
  }
}

async function streamWithClaude(
  messages: AIMessage[],
  onChunk: (chunk: AIStreamChunk) => void,
  options: AIGenerateOptions
): Promise<void> {
  const vault = useCredentialVault.getState();
  const credential = vault.getCredential('claude', 'api-key');

  if (!credential) {
    throw new Error('Claude API key not configured');
  }

  logger.info('🌊 Streaming with Claude', { messages: messages.length });

  try {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const requestBody: any = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: options.maxTokens ?? 4096,
      temperature: options.temperature ?? 0.7,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      stream: true,
    };

    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': credential.value,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Claude streaming error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        onChunk({ content: '', done: true });
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              onChunk({ content: parsed.delta.text, done: false });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    }

    logger.info('✅ Claude streaming complete');
  } catch (error) {
    logger.error('Claude streaming failed', { error });
    throw error;
  }
}

async function streamWithLocal(
  provider: 'ollama' | 'lmstudio',
  modelId: string,
  messages: AIMessage[],
  onChunk: (chunk: AIStreamChunk) => void,
  options: AIGenerateOptions
): Promise<void> {
  logger.info(`🌊 Streaming with ${provider}`, { model: modelId });

  const modelName = modelId.replace(`${provider}-`, '');

  try {
    if (provider === 'ollama') {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt: messages.map(m => `${m.role}: ${m.content}`).join('\n\n'),
          stream: true,
          options: {
            temperature: options.temperature ?? 0.7,
            num_predict: options.maxTokens ?? 2048,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onChunk({ content: '', done: true });
          break;
        }

        const text = decoder.decode(value);
        const lines = text.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              onChunk({ content: data.response, done: data.done || false });
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }
    } else {
      // LM Studio streaming
      const response = await fetch('http://localhost:1234/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`LM Studio error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onChunk({ content: '', done: true });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                onChunk({ content, done: false });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    }

    logger.info(`✅ ${provider} streaming complete`);
  } catch (error) {
    logger.error(`${provider} streaming failed`, { error });
    throw error;
  }
}
