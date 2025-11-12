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
      items?: any;
      [key: string]: any;
    }>;
    required?: string[];
    [key: string]: any;
  };
}

export interface GeminiTool {
  functionDeclarations?: GeminiFunctionDeclaration[];
}

export interface GeminiFunctionCall {
  name: string;
  args?: Record<string, any>;
}

export interface GeminiFunctionResponse {
  name: string;
  response: any;
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
    properties?: Record<string, any>;
    required?: string[];
  };
}

