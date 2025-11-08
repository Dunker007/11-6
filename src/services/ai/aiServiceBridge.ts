// src/services/ai/aiServiceBridge.ts
import { Plan } from '../../../electron/ai/workflowEngine';

// This function safely retrieves the ipcRenderer from the window object.
const getIpcRenderer = () => (window as any).ipcRenderer;

interface PlanResponse {
  success: boolean;
  plan?: Plan;
  error?: string;
}

interface StructuredIdea {
  title: string;
  summary: string;
}

const ipcRenderer = getIpcRenderer();

export const aiServiceBridge = {
  startIndexing: (projectRoot: string): Promise<void> => {
    if (!ipcRenderer) {
      return Promise.reject(new Error("IPC Renderer not available. Not in Electron context?"));
    }
    console.log('Bridge sending ai:startIndexing to main...');
    return ipcRenderer.invoke('ai:startIndexing', projectRoot);
  },
  stopIndexing: (): Promise<void> => {
    if (!ipcRenderer) {
      return Promise.reject(new Error("IPC Renderer not available."));
    }
    return ipcRenderer.invoke('ai:stopIndexing');
  },
  createPlan: (prompt: string): Promise<PlanResponse> => {
    if (!ipcRenderer) {
      return Promise.reject(new Error("IPC Renderer not available."));
    }
    console.log('Bridge sending ai:createPlan to main...');
    return ipcRenderer.invoke('ai:createPlan', prompt);
  },
  structureIdea: (rawText: string): Promise<StructuredIdea> => {
    if (!ipcRenderer) {
      // Mock response for non-electron environments
      return Promise.resolve({
        title: rawText.substring(0, 50) + "...",
        summary: rawText,
      });
    }
    console.log('Bridge sending ai:structureIdea to main...');
    // This will need to be implemented in the Electron main process
    return ipcRenderer.invoke('ai:structureIdea', rawText);
  },
};
