/**
 * llm.ts
 * 
 * PURPOSE:
 * TypeScript type definitions for LLM (Large Language Model) operations. Defines interfaces
 * for models, generation options, responses, and streaming chunks. Includes provider-specific
 * options (especially Gemini) and function calling support.
 * 
 * ARCHITECTURE:
 * Core type definitions that:
 * - Define LLMModel interface (provider, size, context window, capabilities)
 * - Define GenerateOptions (temperature, maxTokens, provider-specific options)
 * - Define GenerateResponse (text, tokens, function calls)
 * - Define StreamChunk (text, done flag, function calls)
 * - Import Gemini-specific types for extended options
 * 
 * CURRENT STATUS:
 * ✅ LLMModel interface with provider support
 * ✅ GenerateOptions with Gemini-specific options
 * ✅ GenerateResponse with function call support
 * ✅ StreamChunk with function call support (added Jan 2025)
 * ✅ Multi-modal content support
 * ✅ Provider-specific metadata
 * 
 * DEPENDENCIES:
 * - @/types/gemini: Gemini-specific types
 * 
 * STATE MANAGEMENT:
 * - Type definitions only (no state)
 * 
 * PERFORMANCE:
 * - Type-only file (no runtime code)
 * - Efficient type checking
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import type { LLMModel, GenerateOptions, StreamChunk } from '@/types/llm';
 * 
 * const model: LLMModel = {
 *   id: 'gemini-2.0-flash-exp',
 *   name: 'Gemini Flash 2.0',
 *   provider: 'gemini',
 *   contextWindow: 32768,
 *   isAvailable: true,
 * };
 * 
 * const options: GenerateOptions = {
 *   temperature: 0.7,
 *   maxTokens: 1000,
 *   tools: [...],
 * };
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/router.ts: Uses these types
 * - src/services/ai/llmStore.ts: Uses these types
 * - src/services/ai/providers/cloudLLM.ts: Implements these interfaces
 * - src/types/gemini.ts: Gemini-specific types
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - More provider-specific options
 * - Streaming metadata types
 * - Model capability flags
 * - Provider feature detection types
 */
// Import Gemini types for extended options
import type {
  GeminiSafetySetting,
  GeminiTool,
  GeminiGroundingConfig,
  GeminiSystemInstruction,
  GeminiContent,
  GeminiResponseMetadata,
  GeminiFunctionCall,
} from './gemini';

export type TaskType = 'general' | 'coding' | 'vision' | 'reasoning' | 'function-calling';

export interface LLMModel {
  id: string;
  name: string;
  provider: 'lmstudio' | 'ollama' | 'ollama-cloud' | 'gemini' | 'notebooklm' | 'openai' | 'anthropic';
  size?: string;
  contextWindow?: number;
  capabilities?: string[];
  description?: string;
  isAvailable: boolean;
  metadata?: {
    quantization?: string;
    loaded?: boolean;
    modifiedAt?: string;
    [key: string]: any;
  };
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  taskType?: TaskType;
  systemPrompt?: string;
  // Gemini-specific options
  safetySettings?: GeminiSafetySetting[];
  systemInstruction?: GeminiSystemInstruction | string;
  tools?: GeminiTool[];
  groundingConfig?: GeminiGroundingConfig;
  responseMimeType?: string;
  candidateCount?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  // Multi-modal content support
  contents?: GeminiContent[];
}

export interface GenerateResponse {
  text: string;
  tokensUsed?: number;
  finishReason?: string;
  // Gemini-specific response metadata
  metadata?: GeminiResponseMetadata;
  functionCalls?: GeminiFunctionCall[];
  candidates?: Array<{
    content: {
      parts: Array<{
        text?: string;
        functionCall?: GeminiFunctionCall;
      }>;
    };
    finishReason?: string;
  }>;
}

export interface StreamChunk {
  text: string;
  done: boolean;
  functionCalls?: GeminiFunctionCall[];
}

