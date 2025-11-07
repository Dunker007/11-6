import type { ProgramExecution } from '@/types/program';

declare global {
  interface Window {
    program: {
      execute: (command: string, workingDirectory?: string) => Promise<{ success: boolean; executionId?: string; error?: string }>;
      kill: (executionId: string) => Promise<{ success: boolean; error?: string }>;
      onOutput: (callback: (executionId: string, data: { type: 'stdout' | 'stderr'; data: string }) => void) => void;
      onComplete: (callback: (executionId: string, result: { exitCode: number; stdout: string; stderr: string }) => void) => void;
      onError: (callback: (executionId: string, error: { error: string }) => void) => void;
    };
  }
}

class ProgramService {
  private static instance: ProgramService;
  private executions: Map<string, ProgramExecution> = new Map();
  private listeners: Set<(executions: ProgramExecution[]) => void> = new Set();

  static getInstance(): ProgramService {
    if (!ProgramService.instance) {
      ProgramService.instance = new ProgramService();
      ProgramService.instance.setupListeners();
    }
    return ProgramService.instance;
  }

  private setupListeners(): void {
    if (typeof window === 'undefined' || !window.program) return;

    window.program.onOutput((executionId, data) => {
      const execution = this.executions.get(executionId);
      if (execution) {
        execution.output.push(data.data);
        this.notifyListeners();
      }
    });

    window.program.onComplete((executionId, result) => {
      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = result.exitCode === 0 ? 'completed' : 'failed';
        execution.endTime = new Date();
        execution.exitCode = result.exitCode;
        if (result.stderr) {
          execution.error = result.stderr;
        }
        this.notifyListeners();
      }
    });

    window.program.onError((executionId, error) => {
      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = 'failed';
        execution.endTime = new Date();
        execution.error = error.error;
        this.notifyListeners();
      }
    });
  }

  async execute(command: string, workingDirectory?: string): Promise<ProgramExecution | null> {
    if (typeof window === 'undefined' || !window.program) {
      throw new Error('Program execution not available');
    }

    const result = await window.program.execute(command, workingDirectory);
    
    if (!result.success || !result.executionId) {
      throw new Error(result.error || 'Failed to execute command');
    }

    const execution: ProgramExecution = {
      id: result.executionId,
      command,
      workingDirectory,
      status: 'running',
      startTime: new Date(),
      output: [],
    };

    this.executions.set(result.executionId, execution);
    this.notifyListeners();
    return execution;
  }

  async kill(executionId: string): Promise<boolean> {
    if (typeof window === 'undefined' || !window.program) {
      return false;
    }

    const result = await window.program.kill(executionId);
    
    if (result.success) {
      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = 'killed';
        execution.endTime = new Date();
        this.notifyListeners();
      }
    }

    return result.success;
  }

  getExecution(id: string): ProgramExecution | undefined {
    return this.executions.get(id);
  }

  getAllExecutions(): ProgramExecution[] {
    return Array.from(this.executions.values());
  }

  getActiveExecutions(): ProgramExecution[] {
    return Array.from(this.executions.values()).filter((e) => e.status === 'running');
  }

  subscribe(listener: (executions: ProgramExecution[]) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const executions = this.getAllExecutions();
    this.listeners.forEach((listener) => listener(executions));
  }
}

export const programService = ProgramService.getInstance();

