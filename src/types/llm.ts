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

export interface LLMModel {
  id: string;
  name: string;
  provider: 'lmstudio' | 'ollama' | 'gemini' | 'notebooklm' | 'openai' | 'anthropic';
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
}

