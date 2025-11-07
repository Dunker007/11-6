import { create } from 'zustand';
import { toolManager, type ToolCheckResult } from './toolManager';
import type { DevTool } from './toolRegistry';

interface DevToolsStore {
  // State
  tools: ToolCheckResult[];
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;

  // Actions
  checkAllTools: () => Promise<void>;
  checkTool: (tool: DevTool) => Promise<void>;
  installTool: (tool: DevTool) => Promise<boolean>;
  getToolsByCategory: (category: DevTool['category']) => DevTool[];
  getInstalledTools: () => DevTool[];
  clearCache: () => void;
}

export const useDevToolsStore = create<DevToolsStore>((set, get) => ({
  tools: [],
  isLoading: false,
  error: null,
  lastChecked: null,

  checkAllTools: async () => {
    set({ isLoading: true, error: null });
    try {
      const results = await toolManager.checkAllTools();
      set({
        tools: results,
        isLoading: false,
        lastChecked: new Date(),
      });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
    }
  },

  checkTool: async (tool: DevTool) => {
    set({ isLoading: true, error: null });
    try {
      const result = await toolManager.checkTool(tool);
      set((state) => {
        const tools = [...state.tools];
        const index = tools.findIndex((t) => t.tool.id === tool.id);
        if (index >= 0) {
          tools[index] = result;
        } else {
          tools.push(result);
        }
        return { tools, isLoading: false };
      });
    } catch (error) {
      set({
        isLoading: false,
        error: (error as Error).message,
      });
    }
  },

  installTool: async (tool: DevTool) => {
    set({ isLoading: true, error: null });
    try {
      const result = await toolManager.installTool(tool);
      if (result.success) {
        // Re-check the tool after installation
        await get().checkTool(tool);
        set({ isLoading: false });
        return true;
      }
      set({ isLoading: false, error: result.error });
      return false;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  getToolsByCategory: (category: DevTool['category']) => {
    return toolManager.getToolsByCategory(category);
  },

  getInstalledTools: () => {
    return toolManager.getInstalledTools();
  },

  clearCache: () => {
    toolManager.clearCache();
    set({ tools: [], lastChecked: null });
  },
}));

