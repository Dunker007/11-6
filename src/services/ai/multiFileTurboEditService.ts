/**
 * multiFileTurboEditService.ts
 * 
 * Service for multi-file Turbo Edit operations.
 * Analyzes patterns across project and applies changes to all matches.
 */

import { aiServiceBridge } from './aiServiceBridge';
import { llmRouter } from './router';
import { multiFileContextService } from './multiFileContextService';
import { useProjectStore } from '../project/projectStore';
import { logger } from '../logging/loggerService';

export interface MultiFileEditResult {
  success: boolean;
  files: Array<{
    path: string;
    oldContent: string;
    newContent: string;
    changes: string[]; // Description of changes
  }>;
  error?: string;
}

class MultiFileTurboEditService {
  /**
   * Analyze pattern across project and apply changes to all matches.
   */
  async applyMultiFileEdit(
    instruction: string,
    pattern?: string,
    filePaths?: string[]
  ): Promise<MultiFileEditResult> {
    try {
      const { activeProject } = useProjectStore.getState();
      if (!activeProject) {
        return {
          success: false,
          files: [],
          error: 'No active project',
        };
      }

      // Get project context
      const context = await multiFileContextService.getProjectContext(activeProject.id);
      
      // If file paths provided, only analyze those files
      const filesToAnalyze = filePaths || 
        activeProject.files
          .filter(f => !f.isDirectory)
          .map(f => f.path);

      // Get content of files to analyze
      const fileContents: Array<{ path: string; content: string }> = [];
      const { getFileContent } = useProjectStore.getState();
      
      for (const path of filesToAnalyze) {
        const content = getFileContent(path);
        if (content !== null) {
          fileContents.push({ path, content });
        }
      }

      // Use LLM to identify which files need changes and what changes to make
      const prompt = `You are helping with a multi-file code edit operation.

Instructions: ${instruction}
${pattern ? `Pattern to match: ${pattern}` : ''}

Project Context:
${JSON.stringify(context, null, 2).substring(0, 2000)}

Files to analyze:
${fileContents.map(f => `\n${f.path}:\n\`\`\`\n${f.content.substring(0, 500)}\n\`\`\``).join('\n')}

For each file that needs changes:
1. Provide the full updated content
2. Describe what changed

Return JSON:
{
  "files": [
    {
      "path": "file/path.ts",
      "newContent": "full updated file content",
      "changes": ["description of change 1", "description of change 2"]
    }
  ]
}`;

      const response = await llmRouter.generate(prompt, {
        temperature: 0.7,
        maxTokens: 8000,
      });

      if (!response.success || !response.text) {
        return {
          success: false,
          files: [],
          error: response.error || 'Failed to generate edits',
        };
      }

      // Parse JSON response
      let parsedResponse: { files: Array<{ path: string; newContent: string; changes: string[] }> };
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/) || 
                         response.text.match(/```\n([\s\S]*?)\n```/) ||
                         [null, response.text];
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (error) {
        logger.error('Failed to parse multi-file edit response', error);
        return {
          success: false,
          files: [],
          error: 'Failed to parse LLM response',
        };
      }

      // Build result with old content
      const result: MultiFileEditResult = {
        success: true,
        files: parsedResponse.files.map(file => {
          const oldContent = fileContents.find(f => f.path === file.path)?.content || '';
          return {
            path: file.path,
            oldContent,
            newContent: file.newContent,
            changes: file.changes || [],
          };
        }),
      };

      return result;
    } catch (error) {
      logger.error('Multi-file edit failed', error);
      return {
        success: false,
        files: [],
        error: (error as Error).message,
      };
    }
  }

  /**
   * Preview changes before applying.
   */
  async previewMultiFileEdit(
    instruction: string,
    pattern?: string,
    filePaths?: string[]
  ): Promise<MultiFileEditResult> {
    // Same as apply, but don't actually update files
    return this.applyMultiFileEdit(instruction, pattern, filePaths);
  }
}

export const multiFileTurboEditService = new MultiFileTurboEditService();

