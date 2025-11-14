/**
 * @/services/ai/geminiStudioService.ts
 *
 * PURPOSE:
 * Provides services for importing, parsing, and managing projects exported
 * from Google's Gemini AI Studio. This allows developers to bring their
 * AI Studio prototypes directly into the local development environment.
 */
import type { GeminiStudioProject } from '@/types/geminiStudio';
import JSZip from 'jszip';

/**
 * Represents the structure of the manifest.json file from a Gemini AI Studio export.
 */
interface GeminiManifest {
  name: string;
  description?: string;
  prompt?: string;
}

/**
 * Represents the result of a project import operation.
 */
export interface ImportResult {
  success: boolean;
  project?: GeminiStudioProject;
  error?: string;
  // The raw source code files included in the export.
  sourceFiles?: Map<string, string>;
}

class GeminiStudioService {
  /**
   * Parses a ZIP file exported from Gemini AI Studio.
   *
   * @param file - The .zip file object to parse.
   * @returns A promise that resolves to an ImportResult.
   */
  public async importProjectFromZip(file: File): Promise<ImportResult> {
    try {
      const zip = await JSZip.loadAsync(file);
      const sourceFiles = new Map<string, string>();

      const manifestFile = zip.file('manifest.json');
      const packageFile = zip.file('package.json');
      const tsconfigFile = zip.file('tsconfig.json');

      if (!manifestFile || !packageFile || !tsconfigFile) {
        return {
          success: false,
          error: 'Invalid project archive: missing manifest.json, package.json, or tsconfig.json.',
        };
      }

      const manifestContent = await manifestFile.async('string');
      // Package and tsconfig are validated but content not currently used
      await packageFile.async('string');
      await tsconfigFile.async('string');

      const manifest: GeminiManifest = JSON.parse(manifestContent);

      // Extract all other files as source files
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          sourceFiles.set(relativePath, await zipEntry.async('string'));
        }
      }

      // The prompt logic for this type of export is likely in the source code.
      // We will handle that in the "Project Host" component.
      const project: GeminiStudioProject = {
        name: manifest.name,
        description: manifest.description,
        version: '1.0.0', // Not present in manifest, so we'll default it.
        prompt: {
          type: 'structured', // Assuming it's a structured, code-based prompt
          text: manifest.prompt || '',
          modelConfig: {
            model: 'gemini-1.5-pro', // Default model
          },
        },
        metadata: {
          exportedAt: new Date().toISOString(),
        },
        // We attach the full source code for the project runner to use.
        // This is a new property we should add to the type.
        sourceFiles,
      };

      return { success: true, project, sourceFiles };
    } catch (error) {
      return {
        success: false,
        error: `Failed to import project from ZIP: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Parses the raw JSON content of an AI Studio project export.
   * This is a placeholder and will be replaced by the ZIP parser.
   *
   * @param jsonContent - The string content of the project's primary JSON file.
   * @returns A promise that resolves to an ImportResult.
   */
  public async parseProjectJson(jsonContent: string): Promise<ImportResult> {
    try {
      const parsed: GeminiStudioProject = JSON.parse(jsonContent);

      // Basic validation to ensure it looks like an AI Studio project.
      if (!parsed.name || !parsed.prompt) {
        return {
          success: false,
          error: 'Invalid project format: missing name or prompt.',
        };
      }

      const project: GeminiStudioProject = {
        name: parsed.name,
        description: parsed.description,
        version: parsed.version || '1.0.0',
        prompt: {
          type: parsed.prompt.type || 'freeform',
          text: parsed.prompt.text || '',
          modelConfig: {
            model: parsed.prompt.modelConfig?.model || 'gemini-1.5-pro',
            temperature: parsed.prompt.modelConfig?.temperature,
            maxOutputTokens: parsed.prompt.modelConfig?.maxOutputTokens,
            topP: parsed.prompt.modelConfig?.topP,
            topK: parsed.prompt.modelConfig?.topK,
            stopSequences: parsed.prompt.modelConfig?.stopSequences,
          },
        },
        examples: parsed.examples,
        metadata: {
          ...parsed.metadata,
          exportedAt: new Date().toISOString(), // Override with fresh export time
        },
      };

      return { success: true, project };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse project JSON: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }
}

export const geminiStudioService = new GeminiStudioService();
