/**
 * eslintHandlers.ts
 * 
 * PURPOSE:
 * IPC handlers for ESLint operations. These handlers run in the Electron main
 * process and provide ESLint linting and fixing capabilities.
 * 
 * ARCHITECTURE:
 * IPC handlers that wrap ESLint Node.js API:
 * - Lint file content
 * - Fix file content
 * - Get ESLint configuration
 * 
 * Features:
 * - File linting
 * - Auto-fix
 * - Configuration loading
 * 
 * CURRENT STATUS:
 * ✅ File linting
 * ✅ Auto-fix
 * 
 * DEPENDENCIES:
 * - ESLint: Linting engine
 * - Electron main process: Required for Node.js ESLint API
 */

import { ESLint } from 'eslint';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache ESLint instances per project
const eslintInstances = new Map<string, ESLint>();

/**
 * Get or create ESLint instance for a project
 */
async function getESLintInstance(projectPath: string): Promise<ESLint> {
  if (eslintInstances.has(projectPath)) {
    return eslintInstances.get(projectPath)!;
  }

  try {
    const eslint = new ESLint({
      cwd: projectPath,
      useEslintrc: true,
      fix: false,
    });

    eslintInstances.set(projectPath, eslint);
    return eslint;
  } catch (error) {
    // Fallback: create ESLint with default config
    const eslint = new ESLint({
      cwd: projectPath,
      useEslintrc: false,
      baseConfig: {
        extends: ['eslint:recommended'],
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: 'module',
        },
      },
    });

    eslintInstances.set(projectPath, eslint);
    return eslint;
  }
}

/**
 * Register ESLint IPC handlers
 */
export function registerESLintHandlers(ipcMain: any) {
  /**
   * Lint file content
   */
  ipcMain.handle('eslint:lint', async (_event: any, filePath: string, content: string) => {
    try {
      const projectPath = path.dirname(filePath);
      const eslint = await getESLintInstance(projectPath);

      const results = await eslint.lintText(content, {
        filePath,
        warnIgnored: false,
      });

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        data: null,
      };
    }
  });

  /**
   * Fix file content
   */
  ipcMain.handle('eslint:fix', async (_event: any, filePath: string, content: string) => {
    try {
      const projectPath = path.dirname(filePath);
      const eslint = await getESLintInstance(projectPath);

      const results = await eslint.lintText(content, {
        filePath,
        fix: true,
        warnIgnored: false,
      });

      if (results && results.length > 0 && results[0].output) {
        return {
          success: true,
          fixed: results[0].output,
        };
      }

      return {
        success: true,
        fixed: content, // No fixes available
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        fixed: content,
      };
    }
  });
}

