/**
 * Types for local LLM providers like LM Studio and Ollama
 */

export interface LMStudioModel {
  id: string;
  name: string;
  size: string;
  context_length?: number;
  contextLength?: number; // Some versions might use this
  loaded?: boolean;
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    families: string[] | null;
    parameter_size: string;
    quantization_level: string;
    context_length?: number;
  };
}

export interface LMStudioCompletionResponse {
  choices: {
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }[];
  usage?: {
    total_tokens?: number;
  };
}

export interface OllamaCompletionResponse {
  response?: string;
  eval_count?: number;
  done?: boolean;
}

export interface LMStudioStreamChoice {
  delta?: {
    content?: string;
  };
}

export interface LMStudioStreamResponse {
  choices: LMStudioStreamChoice[];
  error?: {
    message?: string;
  };
}

export interface OllamaStreamResponse {
  response?: string;
  error?: string;
  done?: boolean;
}
