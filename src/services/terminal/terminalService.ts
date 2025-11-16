/**
 * terminalService.ts
 * 
 * Service for terminal command execution.
 * Handles command execution via Electron IPC and output parsing.
 */

import { logger } from '../logging/loggerService';
import { useProjectStore } from '../project/projectStore';

export interface CommandResult {
  success: boolean;
  executionId: string;
  exitCode?: number;
  stdout?: string;
  stderr?: string;
  error?: string;
}

export interface TerminalOutput {
  type: 'stdout' | 'stderr' | 'system';
  data: string;
  timestamp: number;
}

class TerminalService {
  private outputListeners: Map<string, Set<(output: TerminalOutput) => void>> = new Map();
  private completionListeners: Map<string, Set<(result: CommandResult) => void>> = new Map();
  private errorListeners: Map<string, Set<(error: { error: string }) => void>> = new Map();

  /**
   * Execute a command in the terminal.
   */
  async executeCommand(
    command: string,
    workingDirectory?: string,
    sessionId?: string
  ): Promise<CommandResult> {
    try {
      // If no working directory provided, use active project root
      if (!workingDirectory) {
        const { activeProject } = useProjectStore.getState();
        if (activeProject?.rootPath) {
          workingDirectory = activeProject.rootPath;
        }
      }

      if (!(window as any).program) {
        logger.error('Terminal: program API not available (Electron only)');
        return {
          success: false,
          executionId: '',
          error: 'Terminal not available in browser mode',
        };
      }

      // Execute command via IPC
      const result = await (window as any).program.execute(command, workingDirectory);
      
      if (!result.success || !result.executionId) {
        return {
          success: false,
          executionId: result.executionId || '',
          error: result.error || 'Failed to execute command',
        };
      }

      // Set up listeners for this execution
      const executionId = result.executionId;
      if (sessionId) {
        this.setupListeners(executionId, sessionId);
      }

      return {
        success: true,
        executionId,
      };
    } catch (error) {
      logger.error('Terminal: Command execution failed', { error: error as Error });
      return {
        success: false,
        executionId: '',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Kill a running command.
   */
  async killCommand(executionId: string): Promise<boolean> {
    try {
      if (!(window as any).program) {
        return false;
      }

      const result = await (window as any).program.kill(executionId);
      return result.success;
    } catch (error) {
      logger.error('Terminal: Failed to kill command', { error: error as Error });
      return false;
    }
  }

  /**
   * Set up listeners for command output.
   */
  private setupListeners(executionId: string, sessionId: string) {
    if (!(window as any).program) return;

    // Output listener
    const outputCleanup = (window as any).program.onOutput((execId: string, data: { type: 'stdout' | 'stderr'; data: string }) => {
      if (execId === executionId) {
        const output: TerminalOutput = {
          type: data.type,
          data: data.data,
          timestamp: Date.now(),
        };
        
        const listeners = this.outputListeners.get(sessionId);
        if (listeners) {
          listeners.forEach(listener => listener(output));
        }
      }
    });

    // Completion listener
    const completeCleanup = (window as any).program.onComplete((execId: string, result: { exitCode: number; stdout: string; stderr: string }) => {
      if (execId === executionId) {
        const commandResult: CommandResult = {
          success: result.exitCode === 0,
          executionId: execId,
          exitCode: result.exitCode,
          stdout: result.stdout,
          stderr: result.stderr,
        };
        
        const listeners = this.completionListeners.get(sessionId);
        if (listeners) {
          listeners.forEach(listener => listener(commandResult));
        }

        // Cleanup listeners
        outputCleanup();
        completeCleanup();
      }
    });

    // Error listener
    const errorCleanup = (window as any).program.onError((execId: string, error: { error: string }) => {
      if (execId === executionId) {
        const listeners = this.errorListeners.get(sessionId);
        if (listeners) {
          listeners.forEach(listener => listener(error));
        }

        // Cleanup listeners
        outputCleanup();
        completeCleanup();
        errorCleanup();
      }
    });
  }

  /**
   * Register output listener for a session.
   */
  onOutput(sessionId: string, callback: (output: TerminalOutput) => void): () => void {
    if (!(window as any).program) {
      return () => {}; // Return no-op cleanup if not available
    }

    if (!this.outputListeners.has(sessionId)) {
      this.outputListeners.set(sessionId, new Set());
    }
    this.outputListeners.get(sessionId)!.add(callback);

    // Set up IPC listener
    const cleanup = (window as any).program.onOutput((_execId: string, data: { type: 'stdout' | 'stderr'; data: string }) => {
      // Only call callback if execution matches (will be handled by setupListeners for active executions)
      // For passive listening, check if execId is relevant
      const output: TerminalOutput = {
        type: data.type,
        data: data.data,
        timestamp: Date.now(),
      };
      callback(output);
    });

    return () => {
      cleanup();
      const listeners = this.outputListeners.get(sessionId);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Register completion listener for a session.
   */
  onComplete(sessionId: string, callback: (result: CommandResult) => void): () => void {
    if (!(window as any).program) {
      return () => {}; // Return no-op cleanup if not available
    }

    if (!this.completionListeners.has(sessionId)) {
      this.completionListeners.set(sessionId, new Set());
    }
    this.completionListeners.get(sessionId)!.add(callback);

    // Set up IPC listener
    const cleanup = (window as any).program.onComplete((execId: string, result: { exitCode: number; stdout: string; stderr: string }) => {
      const commandResult: CommandResult = {
        success: result.exitCode === 0,
        executionId: execId,
        exitCode: result.exitCode,
        stdout: result.stdout,
        stderr: result.stderr,
      };
      callback(commandResult);
    });

    return () => {
      cleanup();
      const listeners = this.completionListeners.get(sessionId);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Register error listener for a session.
   */
  onError(sessionId: string, callback: (error: { error: string }) => void): () => void {
    if (!(window as any).program) {
      return () => {}; // Return no-op cleanup if not available
    }

    if (!this.errorListeners.has(sessionId)) {
      this.errorListeners.set(sessionId, new Set());
    }
    this.errorListeners.get(sessionId)!.add(callback);

    // Set up IPC listener
    const cleanup = (window as any).program.onError((_execId: string, error: { error: string }) => {
      callback(error);
    });

    return () => {
      cleanup();
      const listeners = this.errorListeners.get(sessionId);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  /**
   * Parse terminal output for errors and return structured data.
   */
  parseOutput(output: string): {
    hasErrors: boolean;
    errors: string[];
    warnings: string[];
    lines: string[];
  } {
    const lines = output.split('\n');
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('error') || lower.includes('failed') || lower.includes('exception')) {
        errors.push(line);
      } else if (lower.includes('warning') || lower.includes('deprecated')) {
        warnings.push(line);
      }
    }

    return {
      hasErrors: errors.length > 0,
      errors,
      warnings,
      lines,
    };
  }
}

export const terminalService = new TerminalService();

