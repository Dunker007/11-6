/**
 * Gemini-specific types for Google AI Studio integration
 */

export enum GeminiSafetyCategory {
  HARASSMENT = 'HARM_CATEGORY_HARASSMENT',
  HATE_SPEECH = 'HARM_CATEGORY_HATE_SPEECH',
  SEXUALLY_EXPLICIT = 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
  DANGEROUS_CONTENT = 'HARM_CATEGORY_DANGEROUS_CONTENT',
}

export enum GeminiSafetyThreshold {
  BLOCK_NONE = 'BLOCK_NONE',
  BLOCK_ONLY_HIGH = 'BLOCK_ONLY_HIGH',
  BLOCK_MEDIUM_AND_ABOVE = 'BLOCK_MEDIUM_AND_ABOVE',
  BLOCK_LOW_AND_ABOVE = 'BLOCK_LOW_AND_ABOVE',
}

export interface GeminiSafetySetting {
  category: GeminiSafetyCategory;
  threshold: GeminiSafetyThreshold;
}

export interface GeminiFunctionDeclaration {
  name: string;
  description?: string;
  parameters?: {
    type: 'object';
    properties?: Record<string, {
      type: string;
      description?: string;
      enum?: string[];
      items?: unknown;
      [key: string]: unknown;
    }>;
    required?: string[];
    [key: string]: unknown;
  };
}

export interface GeminiTool {
  functionDeclarations?: GeminiFunctionDeclaration[];
}

export interface GeminiFunctionCall {
  name: string;
  args?: Record<string, unknown>;
}

export interface GeminiFunctionResponse {
  name: string;
  response: unknown;
}

export interface GeminiContentPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string; // base64 encoded
  };
  fileData?: {
    mimeType: string;
    fileUri: string;
  };
  functionCall?: GeminiFunctionCall;
  functionResponse?: GeminiFunctionResponse;
}

export interface GeminiContent {
  role?: 'user' | 'model' | 'function';
  parts: GeminiContentPart[];
}

export interface GeminiGroundingConfig {
  googleSearchRetrieval?: {
    dynamicRetrievalConfig?: {
      mode?: 'MODE_DYNAMIC' | 'MODE_STATIC';
      dynamicThreshold?: number;
    };
  };
}

export interface GeminiResponseMetadata {
  safetyRatings?: Array<{
    category: GeminiSafetyCategory;
    probability: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  finishReason?: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
  tokenCount?: {
    promptTokens?: number;
    candidatesTokens?: number;
    totalTokens?: number;
  };
  groundingMetadata?: {
    groundingChunks?: Array<{
      web?: {
        uri?: string;
        title?: string;
      };
    }>;
  };
}

export interface GeminiSystemInstruction {
  parts: Array<{
    text: string;
  }>;
}

export interface GeminiGenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  candidateCount?: number;
  stopSequences?: string[];
  responseMimeType?: string;
  responseSchema?: {
    type: 'object';
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

export interface GeminiRequestBody {
  contents: GeminiContent[];
  systemInstruction?: GeminiSystemInstruction;
  tools?: GeminiTool[];
  safetySettings?: GeminiSafetySetting[];
  generationConfig?: GeminiGenerationConfig;
  groundingConfig?: GeminiGroundingConfig;
}

export interface GeminiCandidate {
  content: {
    parts: GeminiContentPart[];
  };
  finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
  safetyRatings: Array<{
    category: GeminiSafetyCategory;
    probability: 'NEGLIGIBLE' | 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export interface GeminiResponseData {
  candidates: GeminiCandidate[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
  groundingMetadata?: {
    groundingChunks?: Array<{
      web?: {
        uri?: string;
        title?: string;
      };
    }>;
  };
}

export interface GeminiModelInfo {
  name: string;
  supportedGenerationMethods: string[];
}

export interface GeminiErrorDetail {
  '@type': string;
  reason?: string;
  metadata?: {
    service?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface GeminiError {
  code: number;
  message: string;
  status: string;
  details?: GeminiErrorDetail[];
}

