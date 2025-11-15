/**
 * Shared types for LLM providers
 * Extracted to break circular dependencies between router and provider implementations
 */
import type { LLMModel, GenerateOptions, GenerateResponse, StreamChunk } from '@/types/llm';

export interface LLMProvider {
  name: string;
  type: 'local' | 'cloud';
  healthCheck(): Promise<boolean>;
  getModels(): Promise<LLMModel[]>;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResponse>;
  streamGenerate(prompt: string, options?: GenerateOptions): AsyncGenerator<StreamChunk>;
}

