/**
 * eslintService.ts
 * 
 * PURPOSE:
 * Service for real-time ESLint integration. Provides methods to lint files,
 * get lint results, and apply fixes. Designed to work with Monaco Editor
 * for real-time error/warning display.
 * 
 * ARCHITECTURE:
 * Service that uses ESLint Node.js API via IPC:
 * - ESLint runs in Electron main process
 * - Results sent to renderer via IPC
 * - Monaco Editor markers updated based on results
 * 
 * Features:
 * - Real-time file linting
 * - Error and warning detection
 * - Auto-fix capability
 * - Quick fixes
 * - Rule descriptions
 * 
 * CURRENT STATUS:
 * ✅ File linting
 * ✅ Result parsing
 * ✅ Auto-fix
 * 
 * DEPENDENCIES:
 * - ESLint: Linting engine (in main process)
 * - Electron IPC: Communication between processes
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { eslintService } from '@/services/codeQuality/eslintService';
 * 
 * const results = await eslintService.lintFile('/path/to/file.ts', content);
 * const fixed = await eslintService.fixFile('/path/to/file.ts', content);
 * ```
 * 
 * RELATED FILES:
 * - electron/ipc/eslintHandlers.ts: IPC handlers in main process
 * - src/components/VibeEditor/VibeEditor.tsx: Monaco Editor integration
 */

export interface ESLintResult {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  ruleId: string | null;
  fix?: {
    range: [number, number];
    text: string;
  };
  suggestions?: Array<{
    desc: string;
    fix: {
      range: [number, number];
      text: string;
    };
  }>;
}

export interface LintFileResult {
  filePath: string;
  results: ESLintResult[];
  fixable: boolean;
  fixed?: boolean;
}

class ESLintService {
  private static instance: ESLintService;

  private constructor() {}

  static getInstance(): ESLintService {
    if (!ESLintService.instance) {
      ESLintService.instance = new ESLintService();
    }
    return ESLintService.instance;
  }

  /**
   * Lint a file with content
   */
  async lintFile(
    filePath: string,
    content: string
  ): Promise<LintFileResult> {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && !(window as any).electron) {
        throw new Error('ESLint is only available in Electron environment');
      }

      // Use IPC to execute ESLint in main process
      if (typeof window !== 'undefined' && (window as any).eslint) {
        const result = await (window as any).eslint.lint(filePath, content);

        if (result.success && result.data) {
          return this.parseLintResults(filePath, result.data);
        }

        throw new Error(result.error || 'Failed to lint file');
      }

      // Fallback: would need direct ESLint access (not available in renderer)
      return {
        filePath,
        results: [],
        fixable: false,
      };
    } catch (error) {
      console.error('Error linting file:', error);
      return {
        filePath,
        results: [],
        fixable: false,
      };
    }
  }

  /**
   * Fix a file automatically
   */
  async fixFile(filePath: string, content: string): Promise<{ success: boolean; fixed: string; error?: string }> {
    try {
      if (typeof window !== 'undefined' && !(window as any).electron) {
        throw new Error('ESLint fix is only available in Electron environment');
      }

      if (typeof window !== 'undefined' && (window as any).eslint) {
        const result = await (window as any).eslint.fix(filePath, content);

        if (result.success) {
          return {
            success: true,
            fixed: result.fixed || content,
          };
        }

        return {
          success: false,
          fixed: content,
          error: result.error || 'Failed to fix file',
        };
      }

      return {
        success: false,
        fixed: content,
        error: 'Not in Electron environment',
      };
    } catch (error) {
      return {
        success: false,
        fixed: content,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Parse ESLint results from API response
   */
  private parseLintResults(filePath: string, eslintResults: any[]): LintFileResult {
    const results: ESLintResult[] = [];
    let fixable = false;

    if (eslintResults && eslintResults.length > 0) {
      const fileResults = eslintResults[0];
      
      if (fileResults.messages) {
        for (const message of fileResults.messages) {
          const severity = message.severity === 2 ? 'error' : message.severity === 1 ? 'warning' : 'info';
          
          const result: ESLintResult = {
            line: message.line || 1,
            column: message.column || 1,
            endLine: message.endLine,
            endColumn: message.endColumn,
            severity,
            message: message.message,
            ruleId: message.ruleId || null,
          };

          if (message.fix) {
            result.fix = {
              range: [message.fix.range[0], message.fix.range[1]],
              text: message.fix.text,
            };
            fixable = true;
          }

          if (message.suggestions) {
            result.suggestions = message.suggestions.map((s: any) => ({
              desc: s.desc,
              fix: {
                range: [s.fix.range[0], s.fix.range[1]],
                text: s.fix.text,
              },
            }));
          }

          results.push(result);
        }
      }
    }

    return {
      filePath,
      results,
      fixable,
    };
  }

  /**
   * Convert ESLint result to Monaco marker
   */
  eslintResultToMonacoMarker(result: ESLintResult): {
    severity: number;
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
    message: string;
    source: string;
    code?: string;
  } {
    return {
      severity: result.severity === 'error' ? 8 : result.severity === 'warning' ? 4 : 2, // Monaco MarkerSeverity
      startLineNumber: result.line,
      startColumn: result.column,
      endLineNumber: result.endLine || result.line,
      endColumn: result.endColumn || result.column + 1,
      message: result.message,
      source: 'ESLint',
      code: result.ruleId || undefined,
    };
  }

  /**
   * Convert multiple ESLint results to Monaco markers
   */
  eslintResultsToMonacoMarkers(results: ESLintResult[]): Array<ReturnType<typeof this.eslintResultToMonacoMarker>> {
    return results.map(result => this.eslintResultToMonacoMarker(result));
  }
}

export const eslintService = ESLintService.getInstance();

