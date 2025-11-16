/**
 * refactoringService.ts
 * 
 * Service for refactoring operations, especially rename refactoring with preview.
 */

import { llmRouter } from './router';
import { multiFileContextService } from './multiFileContextService';
import { useProjectStore } from '../project/projectStore';
import { logger } from '../logging/loggerService';

export interface RefactoringResult {
  success: boolean;
  occurrences: Array<{
    path: string;
    line: number;
    column: number;
    context: string; // Surrounding code
  }>;
  preview?: string; // Preview of changes
  error?: string;
}

export interface RenameRefactoringParams {
  symbolName: string;
  newName: string;
  symbolType?: 'variable' | 'function' | 'class' | 'interface' | 'type';
  scope?: 'file' | 'project';
}

class RefactoringService {
  /**
   * Find all occurrences of a symbol in the project.
   */
  async findOccurrences(params: RenameRefactoringParams): Promise<RefactoringResult> {
    try {
      const { activeProject } = useProjectStore.getState();
      if (!activeProject) {
        return {
          success: false,
          occurrences: [],
          error: 'No active project',
        };
      }

      const { symbolName, symbolType, scope = 'project' } = params;

      // Get project context
      const context = await multiFileContextService.getProjectContext(activeProject.id);
      
      // Search for symbol occurrences using LLM
      const prompt = `Find all occurrences of the ${symbolType || 'symbol'} "${symbolName}" in this project.

${scope === 'project' ? 'Search the entire project' : 'Search only the current file'}.

Project structure:
${JSON.stringify(context, null, 2).substring(0, 2000)}

For each occurrence, provide:
- File path
- Line number
- Column number (approximate)
- Surrounding context (5 lines before and after)

Return JSON:
{
  "occurrences": [
    {
      "path": "file/path.ts",
      "line": 42,
      "column": 10,
      "context": "surrounding code context"
    }
  ]
}`;

      const response = await llmRouter.generate(prompt, {
        temperature: 0.3,
        maxTokens: 4000,
      });

      if (!response.success || !response.text) {
        return {
          success: false,
          occurrences: [],
          error: response.error || 'Failed to find occurrences',
        };
      }

      // Parse JSON response
      let parsedResponse: { occurrences: Array<{ path: string; line: number; column: number; context: string }> };
      try {
        const jsonMatch = response.text.match(/```json\n([\s\S]*?)\n```/) || 
                         response.text.match(/```\n([\s\S]*?)\n```/) ||
                         [null, response.text];
        parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch (error) {
        logger.error('Failed to parse refactoring response', error);
        return {
          success: false,
          occurrences: [],
          error: 'Failed to parse LLM response',
        };
      }

      return {
        success: true,
        occurrences: parsedResponse.occurrences || [],
      };
    } catch (error) {
      logger.error('Find occurrences failed', error);
      return {
        success: false,
        occurrences: [],
        error: (error as Error).message,
      };
    }
  }

  /**
   * Preview rename refactoring showing all occurrences.
   */
  async previewRename(params: RenameRefactoringParams): Promise<RefactoringResult> {
    const occurrences = await this.findOccurrences(params);
    
    if (!occurrences.success) {
      return occurrences;
    }

    // Generate preview showing what will change
    const preview = `Rename "${params.symbolName}" to "${params.newName}" in ${occurrences.occurrences.length} location(s):\n\n` +
      occurrences.occurrences.map(occ => 
        `${occ.path}:${occ.line}:${occ.column}\n${occ.context}`
      ).join('\n\n---\n\n');

    return {
      ...occurrences,
      preview,
    };
  }

  /**
   * Apply rename refactoring.
   */
  async applyRename(params: RenameRefactoringParams): Promise<RefactoringResult> {
    const preview = await this.previewRename(params);
    
    if (!preview.success) {
      return preview;
    }

    const { updateFile, getFileContent } = useProjectStore.getState();
    const { symbolName, newName } = params;

    // Group occurrences by file
    const byFile = new Map<string, typeof preview.occurrences>();
    for (const occ of preview.occurrences) {
      if (!byFile.has(occ.path)) {
        byFile.set(occ.path, []);
      }
      byFile.get(occ.path)!.push(occ);
    }

    // Update each file
    for (const [path, occurrences] of byFile.entries()) {
      let content = getFileContent(path) || '';
      
      // Replace all occurrences in this file
      // Simple replacement - in production, use AST-based replacement
      const regex = new RegExp(`\\b${symbolName}\\b`, 'g');
      content = content.replace(regex, newName);
      
      updateFile(path, content);
    }

    return preview;
  }
}

export const refactoringService = new RefactoringService();

