/**
 * Workflow Engine Service
 * 
 * Core service for executing workflows (Project, Build, Deploy, Monitor, Monetize).
 * Handles step-by-step execution, error handling, and state management.
 */

import type {
  Workflow,
  WorkflowConfig,
  WorkflowStep,
  WorkflowExecutionResult,
  ProjectWorkflowConfig,
  BuildWorkflowConfig,
} from '@/types/workflow';
import { eventBus } from '../events/eventBus';
import { notificationService } from '../notification/notificationService';
import { aiServiceBridge } from '../ai/aiServiceBridge';

class WorkflowEngine {
  private workflows: Map<string, Workflow> = new Map();
  private activeWorkflows: Set<string> = new Set();

  /**
   * Create a new workflow from a configuration object.
   * 
   * @param config - The workflow configuration containing type, name, description, steps, and metadata
   * @returns The created workflow object with a unique ID and initial status of 'idle'
   * @throws {Error} If the config is invalid or missing required fields
   * 
   * @example
   * ```typescript
   * const workflow = workflowEngine.createWorkflow({
   *   type: 'project',
   *   name: 'Create New Project',
   *   description: 'Initialize a new project structure',
   *   steps: [
   *     { name: 'Create directory', description: 'Create project root directory' },
   *     { name: 'Initialize files', description: 'Create initial project files' }
   *   ],
   *   metadata: { projectPath: '/path/to/project' }
   * });
   * ```
   */
  createWorkflow(config: WorkflowConfig): Workflow {
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow: Workflow = {
      id: workflowId,
      type: config.type,
      name: config.name,
      description: config.description,
      status: 'idle',
      steps: config.steps.map((step, index) => ({
        id: `step_${index}_${Date.now()}`,
        name: step.name,
        description: step.description,
        status: 'pending',
        metadata: step.metadata,
      })),
      currentStepIndex: 0,
      metadata: config.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.workflows.set(workflowId, workflow);
    return workflow;
  }

  /**
   * Execute a workflow by its ID.
   * 
   * This method runs all steps in the workflow sequentially, handling errors and emitting events.
   * The workflow status is updated throughout execution, and notifications are sent for key events.
   * 
   * @param workflowId - The unique identifier of the workflow to execute
   * @returns A promise that resolves to a WorkflowExecutionResult containing success status, duration, and step counts
   * @throws {Error} If the workflow is not found or is already running
   * 
   * @example
   * ```typescript
   * const result = await workflowEngine.executeWorkflow('workflow_123');
   * if (result.success) {
   *   console.log(`Workflow completed in ${result.duration}ms`);
   * } else {
   *   console.error(`Workflow failed: ${result.error}`);
   * }
   * ```
   */
  async executeWorkflow(workflowId: string): Promise<WorkflowExecutionResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (this.activeWorkflows.has(workflowId)) {
      throw new Error(`Workflow ${workflowId} is already running`);
    }

    this.activeWorkflows.add(workflowId);
    workflow.status = 'running';
    workflow.startTime = new Date();
    workflow.currentStepIndex = 0;

    // Emit workflow started event
    eventBus.emit('workflow:started', {
      workflowId: workflow.id,
      workflowName: workflow.name,
    });

    notificationService.info('Workflow Started', `Starting workflow: ${workflow.name}`);

    try {
      // Execute workflow-specific logic
      await this.executeWorkflowSteps(workflow);

      // Mark as completed
      workflow.status = 'completed';
      workflow.endTime = new Date();
      workflow.duration = workflow.endTime.getTime() - (workflow.startTime?.getTime() || 0);

      const result: WorkflowExecutionResult = {
        success: true,
        workflowId: workflow.id,
        duration: workflow.duration,
        stepsCompleted: workflow.steps.filter(s => s.status === 'completed').length,
        stepsTotal: workflow.steps.length,
      };

      eventBus.emit('workflow:completed', {
        workflowId: workflow.id,
        workflowName: workflow.name,
        duration: workflow.duration,
        success: true,
      });

      notificationService.success('Workflow Completed', `Workflow "${workflow.name}" completed successfully`);

      return result;
    } catch (error) {
      workflow.status = 'failed';
      workflow.endTime = new Date();
      workflow.duration = workflow.endTime.getTime() - (workflow.startTime?.getTime() || 0);
      workflow.error = (error as Error).message;

      const result: WorkflowExecutionResult = {
        success: false,
        workflowId: workflow.id,
        duration: workflow.duration,
        error: workflow.error,
        stepsCompleted: workflow.steps.filter(s => s.status === 'completed').length,
        stepsTotal: workflow.steps.length,
      };

      eventBus.emit('workflow:failed', {
        workflowId: workflow.id,
        workflowName: workflow.name,
        error: workflow.error,
      });

      notificationService.error('Workflow Failed', `Workflow "${workflow.name}" failed: ${workflow.error}`);

      return result;
    } finally {
      this.activeWorkflows.delete(workflowId);
      workflow.updatedAt = new Date();
    }
  }

  /**
   * Execute all steps in a workflow sequentially.
   * 
   * This private method iterates through workflow steps, updating their status and handling errors.
   * If any step fails, the entire workflow fails and the error is propagated.
   * 
   * @param workflow - The workflow object containing steps to execute
   * @throws {Error} If any step execution fails, causing the workflow to fail
   */
  private async executeWorkflowSteps(workflow: Workflow): Promise<void> {
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      workflow.currentStepIndex = i;

      try {
        step.status = 'running';
        step.startTime = new Date();
        workflow.updatedAt = new Date();

        // Execute step based on workflow type
        await this.executeStep(workflow, step);

        step.status = 'completed';
        step.endTime = new Date();
        step.duration = step.endTime.getTime() - (step.startTime?.getTime() || 0);
      } catch (error) {
        step.status = 'failed';
        step.endTime = new Date();
        step.duration = step.endTime.getTime() - (step.startTime?.getTime() || 0);
        step.error = (error as Error).message;
        throw error; // Re-throw to fail the workflow
      }
    }
  }

  /**
   * Execute a single workflow step based on the workflow type.
   * 
   * Routes to the appropriate step executor based on workflow type (project, build, deploy, monitor, monetize).
   * 
   * @param workflow - The workflow containing the step
   * @param step - The step to execute
   * @throws {Error} If the workflow type is unknown or step execution fails
   */
  private async executeStep(workflow: Workflow, step: WorkflowStep): Promise<void> {
    // Route to workflow-specific step executor
    switch (workflow.type) {
      case 'project':
        await this.executeProjectStep(workflow, step);
        break;
      case 'build':
        await this.executeBuildStep(workflow, step);
        break;
      case 'deploy':
        await this.executeDeployStep(workflow, step);
        break;
      case 'monitor':
        await this.executeMonitorStep(workflow, step);
        break;
      case 'monetize':
        await this.executeMonetizeStep(workflow, step);
        break;
      default:
        throw new Error(`Unknown workflow type: ${workflow.type}`);
    }
  }

  /**
   * Execute a step in a project workflow.
   * 
   * Handles project-specific actions like creating projects, analyzing project structure,
   * and generating project code using AI services.
   * 
   * @param workflow - The project workflow
   * @param step - The step to execute (supports actions: 'create', 'analyze', 'generate')
   */
  private async executeProjectStep(workflow: Workflow, step: WorkflowStep): Promise<void> {
    const config = workflow.metadata as ProjectWorkflowConfig['metadata'] & { actions?: string[] };
    const action = step.metadata?.action as string;

    switch (action) {
      case 'create':
        // Project creation is handled by projectStore
        break;
      case 'analyze':
        // Use AI service bridge to analyze project
        if (config?.projectPath) {
          await aiServiceBridge.startIndexing(config.projectPath);
        }
        break;
      case 'generate':
        // Use AI to generate project structure
        if (step.metadata?.prompt) {
          await aiServiceBridge.createPlan(step.metadata.prompt as string);
        }
        break;
      default:
        // Generic step execution
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate work
    }
  }

  /**
   * Execute a step in a build workflow.
   * 
   * Handles build-specific actions like executing build commands and compiling code.
   * 
   * @param workflow - The build workflow
   * @param step - The step to execute (may contain build commands in metadata)
   */
  private async executeBuildStep(workflow: Workflow, step: WorkflowStep): Promise<void> {
    const config = workflow.metadata as BuildWorkflowConfig['metadata'] & { buildCommand?: string };
    
    // Build steps are typically command execution
    // In a real implementation, this would execute build commands
    if (step.metadata?.command) {
      // Execute build command (would integrate with program runner)
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate build
    } else if (config?.buildCommand) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate build
    } else {
      // Default: simulate build step
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Execute a step in a deployment workflow.
   * 
   * Handles deployment-specific actions like deploying to various targets (staging, production, etc.).
   * 
   * @param _workflow - The deployment workflow
   * @param step - The step to execute (may contain deployment commands in metadata)
   */
  private async executeDeployStep(_workflow: Workflow, step: WorkflowStep): Promise<void> {
    // Deploy steps would integrate with deployment services
    if (step.metadata?.deployCommand) {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate deployment
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Execute a step in a monitoring workflow.
   * 
   * Handles monitoring-specific actions like checking system health, performance metrics, and LLM status.
   * 
   * @param _workflow - The monitoring workflow
   * @param step - The step to execute (supports metrics: 'health', 'performance', 'llm-status')
   */
  private async executeMonitorStep(_workflow: Workflow, step: WorkflowStep): Promise<void> {
    // Monitor steps check system health, metrics, etc.
    const metric = step.metadata?.metric as string;
    
    switch (metric) {
      case 'health':
        // Check system health
        break;
      case 'performance':
        // Check performance metrics
        break;
      case 'llm-status':
        // Check LLM provider status
        break;
      default:
        // Generic monitoring
        break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  /**
   * Execute a step in a monetization workflow.
   * 
   * Handles monetization-specific actions like setting up revenue streams and pricing strategies.
   * 
   * @param _workflow - The monetization workflow
   * @param _step - The step to execute
   */
  private async executeMonetizeStep(_workflow: Workflow, _step: WorkflowStep): Promise<void> {
    // Monetize steps would set up revenue streams, pricing, etc.
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Get a workflow by its unique identifier.
   * 
   * @param workflowId - The unique identifier of the workflow
   * @returns The workflow object if found, undefined otherwise
   * 
   * @example
   * ```typescript
   * const workflow = workflowEngine.getWorkflow('workflow_123');
   * if (workflow) {
   *   console.log(`Workflow status: ${workflow.status}`);
   * }
   * ```
   */
  getWorkflow(workflowId: string): Workflow | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * Get all workflows that have been created.
   * 
   * @returns An array of all workflow objects, regardless of their status
   * 
   * @example
   * ```typescript
   * const allWorkflows = workflowEngine.getAllWorkflows();
   * console.log(`Total workflows: ${allWorkflows.length}`);
   * ```
   */
  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  /**
   * Get all workflows that are currently running.
   * 
   * @returns An array of workflow objects with status 'running'
   * 
   * @example
   * ```typescript
   * const activeWorkflows = workflowEngine.getActiveWorkflows();
   * console.log(`Currently running: ${activeWorkflows.length} workflows`);
   * ```
   */
  getActiveWorkflows(): Workflow[] {
    return Array.from(this.activeWorkflows)
      .map(id => this.workflows.get(id))
      .filter((w): w is Workflow => w !== undefined);
  }

  /**
   * Cancel a running workflow.
   * 
   * Sets the workflow status to 'cancelled' and removes it from active workflows.
   * Only workflows with status 'running' can be cancelled.
   * 
   * @param workflowId - The unique identifier of the workflow to cancel
   * @throws {Error} If the workflow is not found
   * 
   * @example
   * ```typescript
   * try {
   *   workflowEngine.cancelWorkflow('workflow_123');
   *   console.log('Workflow cancelled successfully');
   * } catch (error) {
   *   console.error('Failed to cancel workflow:', error);
   * }
   * ```
   */
  cancelWorkflow(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    if (workflow.status === 'running') {
      workflow.status = 'cancelled';
      this.activeWorkflows.delete(workflowId);
      workflow.updatedAt = new Date();
      
      notificationService.warn('Workflow Cancelled', `Workflow "${workflow.name}" was cancelled`);
    }
  }

  /**
   * Delete a workflow from the engine.
   * 
   * Removes the workflow from storage and active workflows. This operation cannot be undone.
   * 
   * @param workflowId - The unique identifier of the workflow to delete
   * 
   * @example
   * ```typescript
   * workflowEngine.deleteWorkflow('workflow_123');
   * // Workflow is permanently removed
   * ```
   */
  deleteWorkflow(workflowId: string): void {
    this.workflows.delete(workflowId);
    this.activeWorkflows.delete(workflowId);
  }
}

export const workflowEngine = new WorkflowEngine();

