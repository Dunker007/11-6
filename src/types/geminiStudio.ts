/**
 * @/types/geminiStudio.ts
 *
 * PURPOSE:
 * Defines the TypeScript interfaces for representing a project exported from
 * Google's Gemini AI Studio. This allows for type-safe parsing and handling
 * of imported projects within the application.
 */

/**
 * Represents the overall structure of an exported Gemini AI Studio project.
 * This is the top-level interface for the parsed JSON file.
 */
export interface GeminiStudioProject {
  // A unique identifier for the project, if available.
  id?: string;
  // The name of the project as defined in AI Studio.
  name: string;
  // An optional description for the project.
  description?: string;
  // The version of the export format.
  version: string;
  // Contains the core prompt and model configuration.
  prompt: GeminiStudioPrompt;
  // An array of example inputs and outputs for few-shot prompting.
  examples?: GeminiStudioExample[];
  // Metadata about the export.
  metadata: {
    // The timestamp of when the project was exported.
    exportedAt: string;
    // The version of AI Studio used to create the export.
    studioVersion?: string;
  };
  // Holds the full source code of the exported project.
  sourceFiles?: Map<string, string>;
}

/**
 * Defines the core prompt, its type, and model configuration.
 */
export interface GeminiStudioPrompt {
  // The type of prompt (e.g., 'freeform', 'structured').
  type: 'freeform' | 'structured' | 'chat';
  // The main text or template for the prompt.
  text: string;
  // Configuration for the language model to be used.
  modelConfig: GeminiStudioModelConfig;
}

/**
 * Specifies the language model and its generation parameters.
 */
export interface GeminiStudioModelConfig {
  // The identifier of the Gemini model to be used (e.g., 'gemini-1.5-pro').
  model: string;
  // The creativity of the response (0.0 to 1.0).
  temperature?: number;
  // The maximum number of tokens to generate.
  maxOutputTokens?: number;
  // The nucleus sampling parameter.
  topP?: number;
  // The top-k sampling parameter.
  topK?: number;
  // A list of sequences that will stop generation.
  stopSequences?: string[];
}

/**
 * Represents a single few-shot example with input and expected output.
 */
export interface GeminiStudioExample {
  // The example input text.
  input: string;
  // The corresponding expected output text.
  output: string;
}
