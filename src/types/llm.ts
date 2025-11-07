export interface LLMModel {
  id: string;
  name: string;
  provider: 'lmstudio' | 'ollama' | 'gemini' | 'notebooklm' | 'openai' | 'anthropic';
  size?: string;
  contextWindow?: number;
  capabilities?: string[];
  description?: string;
  isAvailable: boolean;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
}

export interface GenerateResponse {
  text: string;
  tokensUsed?: number;
  finishReason?: string;
}

export interface StreamChunk {
  text: string;
  done: boolean;
}

