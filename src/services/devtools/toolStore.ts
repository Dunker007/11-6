import { create } from 'zustand';
import { toolManager, type ToolCheckResult } from './toolManager';
import { toolUpdateService } from './toolUpdateService';
import type { DevTool } from './toolRegistry';
import type { ToolUpdateCheckResult } from '@/types/devtools';

interface DevToolsStore {
  // State
  tools: ToolCheckResult[];
  updateInfo: Map<string, ToolUpdateCheckResult>;
  isLoading: boolean;
  isCheckingUpdates: boolean;
  error: string | null;
  lastChecked: Date | null;

  // Actions
  checkAllTools: () => Promise<void>;
  checkTool: (tool: DevTool) => Promise<void>;
  installTool: (tool: DevTool) => Promise<boolean>;
  checkToolUpdates: () => Promise<void>;
  getToolsByCategory: (category: DevTool['category']) => DevTool[];
  getInstalledTools: () => DevTool[];
  clearCache: () => void;
}

export const useDevToolsStore = create<DevToolsStore>((set, get) => ({
  tools: [],
  updateInfo: new Map(),
  isLoading: false,
  isCheckingUpdates: false,
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
      // Automatically check for updates after checking tools
      await get().checkToolUpdates();
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
      // Check for updates if tool is installed
      if (result.isInstalled && result.version) {
        const updateResult = await toolUpdateService.checkToolUpdate(tool, result.version);
        set((state) => {
          const newUpdateInfo = new Map(state.updateInfo);
          newUpdateInfo.set(tool.id, updateResult);
          return { updateInfo: newUpdateInfo };
        });
      }
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

  checkToolUpdates: async () => {
    set({ isCheckingUpdates: true, error: null });
    try {
      const { tools } = get();
      const toolData = tools.map((t) => ({
        tool: t.tool,
        version: t.version,
        isInstalled: t.isInstalled,
      }));
      const updates = await toolUpdateService.checkAllToolUpdates(toolData);
      set({ updateInfo: updates, isCheckingUpdates: false });
    } catch (error) {
      set({
        isCheckingUpdates: false,
        error: (error as Error).message,
      });
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
    toolUpdateService.clearCache();
    set({ tools: [], updateInfo: new Map(), lastChecked: null });
  },
}));

