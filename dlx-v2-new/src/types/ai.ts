/**
 * AI Types
 * Models for AI provider abstraction and orchestration
 */

export type AIProvider = 'gemini' | 'claude' | 'ollama' | 'lmstudio';

export type AIMode = 'fast' | 'balanced' | 'strategic';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  capabilities: AICapability[];
  contextWindow: number;
  isAvailable: boolean;
  cost?: {
    input: number; // per million tokens
    output: number;
  };
}

export type AICapability =
  | 'chat'
  | 'code-generation'
  | 'function-calling'
  | 'vision'
  | 'voice'
  | 'streaming';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  metadata?: Record<string, any>;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  context?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIGenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
  functions?: AIFunction[];
}

export interface AIFunction {
  name: string;
  description: string;
  parameters: Record<string, any>;
  handler: (args: any) => Promise<any>;
}

export interface AIStreamChunk {
  content: string;
  done: boolean;
  metadata?: Record<string, any>;
}

export interface ProviderDetectionResult {
  provider: AIProvider;
  detected: boolean;
  url?: string;
  models?: string[];
  version?: string;
  responseTime?: number;
}
