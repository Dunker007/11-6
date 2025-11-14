/**
 * Plan Execution Service
 * Executes AI-generated plans step by step
 * Handles file operations, command execution, and plan state management
 */

import type { Plan, PlanStep } from '@/types/plan';
import { errorLogger } from '@/services/errors/errorLogger';

export interface PlanExecutionOptions {
  autoProceed?: boolean; // Auto-execute next step after current completes
  pauseOnError?: boolean; // Pause execution on error
  dryRun?: boolean; // Preview changes without executing
}

export interface PlanExecutionState {
  plan: Plan;
  currentStepIndex: number;
  isExecuting: boolean;
  isPaused: boolean;
  options: PlanExecutionOptions;
}

class PlanExecutionService {
  private activeExecutions: Map<string, PlanExecutionState> = new Map();
  private executionListeners: Map<string, Set<(state: PlanExecutionState) => void>> = new Map();

  /**
   * Start executing a plan
   */
  async startExecution(
    plan: Plan,
    options: PlanExecutionOptions = {}
  ): Promise<void> {
    if (this.activeExecutions.has(plan.id)) {
      throw new Error(`Plan ${plan.id} is already being executed`);
    }

    const state: PlanExecutionState = {
      plan: {
        ...plan,
        status: 'running',
        startTime: new Date(),
        currentStep: 0,
      },
      currentStepIndex: 0,
      isExecuting: true,
      isPaused: false,
      options: {
        autoProceed: true,
        pauseOnError: true,
        dryRun: false,
        ...options,
      },
    };

    this.activeExecutions.set(plan.id, state);
    this.notifyListeners(plan.id, state);

    // Start execution
    if (options.autoProceed !== false) {
      this.executeNextStep(plan.id);
    }
  }

  /**
   * Execute the next step in a plan
   */
  async executeNextStep(planId: string): Promise<void> {
    const state = this.activeExecutions.get(planId);
    if (!state || state.isPaused) {
      return;
    }

    if (state.currentStepIndex >= state.plan.steps.length) {
      // Plan complete
      state.plan.status = 'completed';
      state.plan.endTime = new Date();
      state.isExecuting = false;
      this.notifyListeners(planId, state);
      this.activeExecutions.delete(planId);
      return;
    }

    const step = state.plan.steps[state.currentStepIndex];
    step.status = 'running';
    step.startTime = new Date();

    this.notifyListeners(planId, state);

    try {
      await this.executeStep(step, state.options);
      step.status = 'completed';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - (step.startTime?.getTime() || 0);

      state.currentStepIndex++;
      state.plan.currentStep = state.currentStepIndex;

      this.notifyListeners(planId, state);

      // Auto-proceed to next step if enabled
      if (state.options.autoProceed && state.currentStepIndex < state.plan.steps.length) {
        setTimeout(() => this.executeNextStep(planId), 100);
      } else if (state.currentStepIndex >= state.plan.steps.length) {
        // Plan complete
        state.plan.status = 'completed';
        state.plan.endTime = new Date();
        state.isExecuting = false;
        this.notifyListeners(planId, state);
        this.activeExecutions.delete(planId);
      }
    } catch (error) {
      step.status = 'error';
      step.error = error instanceof Error ? error.message : 'Unknown error';
      step.endTime = new Date();
      step.duration = step.endTime.getTime() - (step.startTime?.getTime() || 0);

      state.plan.status = 'error';
      state.plan.error = step.error;
      state.isExecuting = false;

      if (state.options.pauseOnError) {
        state.isPaused = true;
      }

      this.notifyListeners(planId, state);
      errorLogger.logFromError(
        'runtime',
        error as Error,
        'error',
        { source: 'PlanExecutionService' }
      );
    }
  }

  /**
   * Execute a single plan step
   */
  private async executeStep(step: PlanStep, options: PlanExecutionOptions): Promise<void> {
    if (options.dryRun) {
      // In dry run mode, just validate the step
      return;
    }

    switch (step.type) {
      case 'THINK':
        // Thinking steps don't require execution
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate thinking
        break;

      case 'READ_FILE':
        if (!step.filePath) {
          throw new Error('filePath is required for READ_FILE step');
        }
        // Read file using fileSystemService
        // This is a placeholder - actual implementation depends on your file system service
        break;

      case 'CREATE_FILE':
      case 'EDIT_FILE':
        if (!step.filePath) {
          throw new Error('filePath is required for file operation step');
        }
        if (!step.content) {
          throw new Error('content is required for file operation step');
        }
        // Write/edit file using fileSystemService
        // This is a placeholder
        break;

      case 'DELETE_FILE':
        if (!step.filePath) {
          throw new Error('filePath is required for DELETE_FILE step');
        }
        // Delete file using fileSystemService
        // This is a placeholder
        break;

      case 'RUN_COMMAND':
        if (!step.command) {
          throw new Error('command is required for RUN_COMMAND step');
        }
        // Execute command via IPC to Electron main process
        // This is a placeholder
        break;

      default:
        throw new Error(`Unknown step type: ${(step as any).type}`);
    }
  }

  /**
   * Pause plan execution
   */
  pauseExecution(planId: string): void {
    const state = this.activeExecutions.get(planId);
    if (state) {
      state.isPaused = true;
      this.notifyListeners(planId, state);
    }
  }

  /**
   * Resume plan execution
   */
  resumeExecution(planId: string): void {
    const state = this.activeExecutions.get(planId);
    if (state && state.isPaused) {
      state.isPaused = false;
      this.notifyListeners(planId, state);
      if (state.options.autoProceed) {
        this.executeNextStep(planId);
      }
    }
  }

  /**
   * Stop plan execution
   */
  stopExecution(planId: string): void {
    const state = this.activeExecutions.get(planId);
    if (state) {
      state.isExecuting = false;
      state.isPaused = false;
      state.plan.status = 'paused';
      this.notifyListeners(planId, state);
      this.activeExecutions.delete(planId);
    }
  }

  /**
   * Retry a failed step
   */
  async retryStep(planId: string, stepIndex: number): Promise<void> {
    const state = this.activeExecutions.get(planId);
    if (!state) {
      throw new Error(`Plan ${planId} is not being executed`);
    }

    if (stepIndex < 0 || stepIndex >= state.plan.steps.length) {
      throw new Error(`Invalid step index: ${stepIndex}`);
    }

    // Reset step
    const step = state.plan.steps[stepIndex];
    step.status = 'pending';
    step.error = undefined;
    step.startTime = undefined;
    step.endTime = undefined;
    step.duration = undefined;

    // Set current step to retry
    state.currentStepIndex = stepIndex;
    state.plan.currentStep = stepIndex;

    this.notifyListeners(planId, state);

    // Execute the step
    await this.executeNextStep(planId);
  }

  /**
   * Get execution state for a plan
   */
  getExecutionState(planId: string): PlanExecutionState | undefined {
    return this.activeExecutions.get(planId);
  }

  /**
   * Subscribe to execution state updates
   */
  subscribe(planId: string, listener: (state: PlanExecutionState) => void): () => void {
    if (!this.executionListeners.has(planId)) {
      this.executionListeners.set(planId, new Set());
    }
    this.executionListeners.get(planId)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.executionListeners.get(planId)?.delete(listener);
    };
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(planId: string, state: PlanExecutionState): void {
    const listeners = this.executionListeners.get(planId);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(state);
        } catch (error) {
          console.error('Error in plan execution listener:', error);
        }
      });
    }
  }
}

export const planExecutionService = new PlanExecutionService();

