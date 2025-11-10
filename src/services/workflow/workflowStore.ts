/**
 * Workflow Store
 * 
 * Zustand store for managing workflow state across the application.
 */

import { create } from 'zustand';
import { workflowEngine } from './workflowEngine';
import type {
  Workflow,
  WorkflowConfig,
  WorkflowExecutionResult,
  WorkflowType,
} from '@/types/workflow';

interface WorkflowStore {
  workflows: Workflow[];
  activeWorkflowId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createWorkflow: (config: WorkflowConfig) => Workflow;
  executeWorkflow: (workflowId: string) => Promise<WorkflowExecutionResult>;
  cancelWorkflow: (workflowId: string) => void;
  deleteWorkflow: (workflowId: string) => void;
  getWorkflow: (workflowId: string) => Workflow | undefined;
  getAllWorkflows: () => Workflow[];
  getActiveWorkflows: () => Workflow[];
  getWorkflowsByType: (type: WorkflowType) => Workflow[];
  setActiveWorkflow: (workflowId: string | null) => void;
  refreshWorkflows: () => void;
  clearError: () => void;
}

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  workflows: [],
  activeWorkflowId: null,
  isLoading: false,
  error: null,

  createWorkflow: (config) => {
    try {
      const workflow = workflowEngine.createWorkflow(config);
      set((state) => ({
        workflows: [...state.workflows, workflow],
      }));
      return workflow;
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  executeWorkflow: async (workflowId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await workflowEngine.executeWorkflow(workflowId);
      get().refreshWorkflows();
      set({ isLoading: false, activeWorkflowId: workflowId });
      return result;
    } catch (error) {
      const errorMessage = (error as Error).message;
      set({ isLoading: false, error: errorMessage });
      throw error;
    }
  },

  cancelWorkflow: (workflowId) => {
    try {
      workflowEngine.cancelWorkflow(workflowId);
      get().refreshWorkflows();
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  deleteWorkflow: (workflowId) => {
    try {
      workflowEngine.deleteWorkflow(workflowId);
      set((state) => ({
        workflows: state.workflows.filter((w) => w.id !== workflowId),
        activeWorkflowId: state.activeWorkflowId === workflowId ? null : state.activeWorkflowId,
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  getWorkflow: (workflowId) => {
    return workflowEngine.getWorkflow(workflowId);
  },

  getAllWorkflows: () => {
    return workflowEngine.getAllWorkflows();
  },

  getActiveWorkflows: () => {
    return workflowEngine.getActiveWorkflows();
  },

  getWorkflowsByType: (type) => {
    return get().workflows.filter((w) => w.type === type);
  },

  setActiveWorkflow: (workflowId) => {
    set({ activeWorkflowId: workflowId });
  },

  refreshWorkflows: () => {
    const workflows = workflowEngine.getAllWorkflows();
    set({ workflows });
  },

  clearError: () => {
    set({ error: null });
  },
}));

