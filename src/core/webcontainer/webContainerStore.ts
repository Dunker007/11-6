/**
 * WebContainer Store
 * React state management for WebContainer operations
 */

import { create } from 'zustand';
import { webContainerService, WebContainerInstance, ExecutionResult } from './webContainerService';
import type { ProjectService } from '../project/projectService';

interface WebContainerState {
  // State
  containers: Map<string, WebContainerInstance>;
  currentProject: string | null;
  isInitializing: boolean;
  isExecuting: boolean;
  lastResult: ExecutionResult | null;
  error: string | null;

  // Actions
  initializeContainer: (projectId: string) => Promise<void>;
  loadProjectFiles: (projectId: string, files: Record<string, any>) => Promise<void>;
  loadProjectFromService: (projectId: string, projectService: ProjectService) => Promise<void>;
  ensureContainerReady: (projectId: string) => Promise<void>;
  executeCommand: (projectId: string, command: string, args?: string[]) => Promise<ExecutionResult>;
  installDependencies: (projectId: string) => Promise<ExecutionResult>;
  startDevServer: (projectId: string, port?: number) => Promise<ExecutionResult>;
  buildProject: (projectId: string) => Promise<ExecutionResult>;
  runTests: (projectId: string) => Promise<ExecutionResult>;
  destroyContainer: (projectId: string) => Promise<void>;
  clearError: () => void;
}

export const useWebContainerStore = create<WebContainerState>((set, get) => ({
  containers: new Map(),
  currentProject: null,
  isInitializing: false,
  isExecuting: false,
  lastResult: null,
  error: null,

  initializeContainer: async (projectId: string) => {
    set({ isInitializing: true, error: null });

    try {
      const container = await webContainerService.initializeContainer(projectId);
      const containers = new Map(get().containers);
      containers.set(projectId, container);

      set({
        containers,
        currentProject: projectId,
        isInitializing: false
      });

      console.log(`WebContainer initialized for project: ${projectId}`);

    } catch (error) {
      set({
        isInitializing: false,
        error: (error as Error).message
      });
      throw error;
    }
  },

  loadProjectFiles: async (projectId: string, files: Record<string, any>) => {
    set({ error: null });

    try {
      await webContainerService.loadProjectFiles(projectId, files);
      console.log(`Project files loaded for: ${projectId}`);

    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  loadProjectFromService: async (projectId: string, projectService: ProjectService) => {
    set({ error: null });

    try {
      await webContainerService.loadProjectFromService(projectId, projectService);
      console.log(`Project files loaded from ProjectService for: ${projectId}`);

    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  ensureContainerReady: async (projectId: string) => {
    const containers = get().containers;
    
    // Check if container already exists and is ready
    if (containers.has(projectId)) {
      const instance = containers.get(projectId);
      if (instance && instance.status === 'ready') {
        return;
      }
    }

    // Initialize if missing or not ready
    await get().initializeContainer(projectId);
  },

  executeCommand: async (projectId: string, command: string, args: string[] = []) => {
    // Ensure container is ready before executing
    await get().ensureContainerReady(projectId);
    
    set({ isExecuting: true, error: null });

    try {
      const result = await webContainerService.executeCommand(projectId, command, args);
      set({
        lastResult: result,
        isExecuting: false
      });

      console.log(`Command executed: ${command} ${args.join(' ')} - ${result.success ? 'SUCCESS' : 'FAILED'}`);

      return result;

    } catch (error) {
      const errorMessage = (error as Error).message;
      set({
        isExecuting: false,
        error: errorMessage,
        lastResult: {
          success: false,
          output: '',
          error: errorMessage,
          duration: 0
        }
      });
      throw error;
    }
  },

  installDependencies: async (projectId: string) => {
    const result = await get().executeCommand(projectId, 'npm', ['install']);
    return result;
  },

  startDevServer: async (projectId: string, port: number = 3000) => {
    const result = await get().executeCommand(projectId, 'npm', ['run', 'dev', '--', '--port', port.toString()]);
    return result;
  },

  buildProject: async (projectId: string) => {
    const result = await get().executeCommand(projectId, 'npm', ['run', 'build']);
    return result;
  },

  runTests: async (projectId: string) => {
    const result = await get().executeCommand(projectId, 'npm', ['test']);
    return result;
  },

  destroyContainer: async (projectId: string) => {
    try {
      await webContainerService.destroyContainer(projectId);
      const containers = new Map(get().containers);
      containers.delete(projectId);

      set({
        containers,
        currentProject: get().currentProject === projectId ? null : get().currentProject
      });

      console.log(`Container destroyed for project: ${projectId}`);

    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
