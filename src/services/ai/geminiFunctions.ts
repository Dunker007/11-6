/**
 * Gemini Function Registry
 * Registers common functions that can be called by Gemini models
 * Provides function schemas and execution handlers
 */

import type { GeminiFunctionDeclaration, GeminiFunctionCall, GeminiFunctionResponse } from '@/types/gemini';
import { fileSystemService } from '@/services/filesystem/fileSystemService';
import { useProjectStore } from '@/services/project/projectStore';

export interface FunctionHandler {
  (args: Record<string, any>): Promise<any>;
}

class GeminiFunctionRegistry {
  private functions: Map<string, { declaration: GeminiFunctionDeclaration; handler: FunctionHandler }> = new Map();

  constructor() {
    this.registerDefaultFunctions();
  }

  /**
   * Register a function that can be called by Gemini
   */
  registerFunction(declaration: GeminiFunctionDeclaration, handler: FunctionHandler): void {
    this.functions.set(declaration.name, { declaration, handler });
  }

  /**
   * Get all registered function declarations
   */
  getFunctionDeclarations(): GeminiFunctionDeclaration[] {
    return Array.from(this.functions.values()).map(f => f.declaration);
  }

  /**
   * Execute a function call
   */
  async executeFunction(call: GeminiFunctionCall): Promise<GeminiFunctionResponse> {
    const func = this.functions.get(call.name);
    if (!func) {
      throw new Error(`Function ${call.name} not found`);
    }

    try {
      const result = await func.handler(call.args || {});
      return {
        name: call.name,
        response: result,
      };
    } catch (error) {
      return {
        name: call.name,
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Register default functions
   */
  private registerDefaultFunctions(): void {
    // File Operations
    this.registerFunction(
      {
        name: 'read_file',
        description: 'Read the contents of a file',
        parameters: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'The path to the file to read',
            },
          },
          required: ['filePath'],
        },
      },
      async (args) => {
        const { filePath } = args;
        if (!filePath) {
          throw new Error('filePath is required');
        }
        // Use fileSystemService to read file
        // This is a placeholder - actual implementation depends on your file system service
        return { content: 'File content placeholder' };
      }
    );

    this.registerFunction(
      {
        name: 'list_files',
        description: 'List files in a directory',
        parameters: {
          type: 'object',
          properties: {
            directoryPath: {
              type: 'string',
              description: 'The path to the directory',
            },
          },
          required: ['directoryPath'],
        },
      },
      async (args) => {
        const { directoryPath } = args;
        if (!directoryPath) {
          throw new Error('directoryPath is required');
        }
        // Use fileSystemService to list files
        return { files: [] };
      }
    );

    // Code Operations
    this.registerFunction(
      {
        name: 'analyze_code',
        description: 'Analyze code for issues, patterns, or suggestions',
        parameters: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The code to analyze',
            },
            language: {
              type: 'string',
              description: 'The programming language',
            },
            analysisType: {
              type: 'string',
              enum: ['performance', 'security', 'style', 'bugs', 'complexity'],
              description: 'Type of analysis to perform',
            },
          },
          required: ['code'],
        },
      },
      async (args) => {
        const { code, language, analysisType } = args;
        // Placeholder for code analysis
        return {
          analysis: `Analysis of ${language || 'code'} for ${analysisType || 'general'} issues`,
          suggestions: [],
        };
      }
    );

    this.registerFunction(
      {
        name: 'execute_command',
        description: 'Execute a shell command (use with caution)',
        parameters: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'The command to execute',
            },
            workingDirectory: {
              type: 'string',
              description: 'The working directory for the command',
            },
          },
          required: ['command'],
        },
      },
      async (args) => {
        const { command, workingDirectory } = args;
        // This would need IPC to Electron main process
        // Placeholder for now
        return {
          output: 'Command execution placeholder',
          exitCode: 0,
        };
      }
    );

    // Web Search (if grounding enabled)
    this.registerFunction(
      {
        name: 'web_search',
        description: 'Search the web for information',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results to return',
            },
          },
          required: ['query'],
        },
      },
      async (args) => {
        const { query, maxResults = 5 } = args;
        // This would use Google Search API or similar
        // Placeholder for now
        return {
          results: [],
          query,
        };
      }
    );

    // Project Operations
    this.registerFunction(
      {
        name: 'get_project_info',
        description: 'Get information about the current project',
        parameters: {
          type: 'object',
          properties: {},
        },
      },
      async () => {
        // Get project info from store
        const state = useProjectStore.getState();
        return {
          project: state.activeProject
            ? {
                id: state.activeProject.id,
                name: state.activeProject.name,
                description: state.activeProject.description,
                status: state.activeProject.status,
              }
            : null,
        };
      }
    );
  }
}

export const geminiFunctionRegistry = new GeminiFunctionRegistry();

