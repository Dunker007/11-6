/**
 * Gemini Function Registry
 * Registers common functions that can be called by Gemini models
 * Provides function schemas and execution handlers
 */

import type { GeminiFunctionDeclaration, GeminiFunctionCall, GeminiFunctionResponse } from '@/types/gemini';
import { useProjectStore } from '@/services/project/projectStore';
import { fileSystemService } from '@/services/filesystem/fileSystemService';
import { llmRouter } from '@/services/ai/router';
import { logger } from '@/services/logging/loggerService';

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
      logger.error(`Function ${call.name} execution failed:`, { error, args: call.args });
      return {
        name: call.name,
        response: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Validate that a file path is within the active project directory for security
   * Prevents path traversal attacks and ensures all file operations are restricted to project scope
   */
  private async validateProjectPath(filePath: string): Promise<{ valid: boolean; error?: string }> {
    const state = useProjectStore.getState();
    const activeProject = state.activeProject;
    
    if (!activeProject || !activeProject.rootPath) {
      return { valid: false, error: 'No active project' };
    }

    // Prevent path traversal attacks - block any path containing '..'
    if (filePath.includes('..')) {
      return { valid: false, error: 'Path traversal not allowed' };
    }

    // Resolve absolute paths and ensure they're within project root
    const projectRoot = activeProject.rootPath;
    
    // Normalize paths for comparison
    const normalizedPath = filePath.replace(/\\/g, '/');
    const normalizedRoot = projectRoot.replace(/\\/g, '/');
    
    // If path is already absolute and within project root, allow it
    if (normalizedPath.startsWith(normalizedRoot)) {
      return { valid: true };
    }
    
    // If it's a relative path starting with './', resolve it relative to project root
    if (normalizedPath.startsWith('./')) {
      const resolvedPath = `${normalizedRoot}/${normalizedPath.substring(2)}`;
      if (resolvedPath.startsWith(normalizedRoot)) {
        return { valid: true };
      }
    }
    
    // If it's a relative path without prefix, resolve it relative to project root
    if (!normalizedPath.startsWith('/')) {
      const resolvedPath = `${normalizedRoot}/${normalizedPath}`;
      if (resolvedPath.startsWith(normalizedRoot)) {
        return { valid: true };
      }
    }

    // Path is outside project directory
    return { valid: false, error: 'Path must be within project directory' };
  }

  /**
   * Register default functions
   */
  private registerDefaultFunctions(): void {
    // File Operations
    this.registerFunction(
      {
        name: 'read_file',
        description: 'Read the contents of a file within the active project',
        parameters: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'The path to the file to read (relative to project root or absolute path within project)',
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

        // Validate path is within project
        const validation = await this.validateProjectPath(filePath);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid file path');
        }

        // Read file using fileSystemService
        const result = await fileSystemService.readFile(filePath);
        if (!result.success) {
          throw new Error(result.error || 'Failed to read file');
        }

        return {
          content: result.data || '',
          path: filePath,
        };
      }
    );

    this.registerFunction(
      {
        name: 'list_files',
        description: 'List files and directories in a directory within the active project',
        parameters: {
          type: 'object',
          properties: {
            directoryPath: {
              type: 'string',
              description: 'The path to the directory (relative to project root or absolute path within project)',
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

        // Validate path is within project
        const validation = await this.validateProjectPath(directoryPath);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid directory path');
        }

        // List directory using fileSystemService
        const result = await fileSystemService.readdir(directoryPath);
        if (!result.success) {
          throw new Error(result.error || 'Failed to list directory');
        }

        // Format entries for return
        const files = (result.data || []).map(entry => ({
          name: entry.name,
          path: entry.path,
          isDirectory: entry.isDirectory,
        }));

        return {
          files,
          directoryPath,
          count: files.length,
        };
      }
    );

    // Code Operations
    this.registerFunction(
      {
        name: 'analyze_code',
        description: 'Analyze code for issues, patterns, or suggestions using AI',
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
        if (!code) {
          throw new Error('code is required');
        }

        try {
          // Use LLM to analyze code
          const analysisPrompt = `Analyze the following ${language || 'code'} for ${analysisType || 'general'} issues and provide suggestions:

\`\`\`${language || ''}
${code}
\`\`\`

Provide:
1. A summary of findings
2. Specific issues found
3. Suggestions for improvement`;

          const response = await llmRouter.generate(analysisPrompt, {
            temperature: 0.3,
            maxTokens: 1000,
          });

          return {
            analysis: response.text,
            language: language || 'unknown',
            analysisType: analysisType || 'general',
            suggestions: [], // Could parse suggestions from response.text if needed
          };
        } catch (error) {
          logger.error('Code analysis failed:', { error });
          // Fallback to basic response
          return {
            analysis: `Basic analysis: Code contains ${code.split('\n').length} lines. Analysis type: ${analysisType || 'general'}`,
            language: language || 'unknown',
            analysisType: analysisType || 'general',
            suggestions: [],
            error: error instanceof Error ? error.message : 'Analysis failed',
          };
        }
      }
    );

    // Command execution - DISABLED for security reasons
    // This function is intentionally not implemented due to security concerns.
    // If needed, implement with:
    // - Strict allowlist of allowed commands
    // - User confirmation for dangerous commands
    // - Sandboxed execution environment
    // - IPC integration with Electron main process
    this.registerFunction(
      {
        name: 'execute_command',
        description: 'Execute a shell command (DISABLED - security feature not implemented)',
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
      async (_args) => {
        throw new Error('Command execution is disabled for security reasons. This feature requires additional security measures before it can be enabled.');
      }
    );

    // Web Search - DISABLED (requires API integration)
    // This function requires Google Search API or similar integration
    this.registerFunction(
      {
        name: 'web_search',
        description: 'Search the web for information (DISABLED - API integration required)',
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
      async (_args) => {
        throw new Error('Web search is not available. This feature requires Google Search API integration.');
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
                rootPath: state.activeProject.rootPath,
              }
            : null,
        };
      }
    );
  }
}

export const geminiFunctionRegistry = new GeminiFunctionRegistry();

