import { create } from 'zustand';
import { toolManager, type ToolCheckResult } from './toolManager';
import { toolUpdateService } from './toolUpdateService';
import type { DevTool } from './toolRegistry';
import type { ToolUpdateCheckResult } from '@/types/devtools';
import { withAsyncOperation } from '@/utils/storeHelpers';

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
    await withAsyncOperation(
      async () => {
        const results = await toolManager.checkAllTools();
        set({
          tools: results,
          lastChecked: new Date(),
        });
        // Automatically check for updates after checking tools
        await get().checkToolUpdates();
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'toolStore'
    );
  },

  checkTool: async (tool: DevTool) => {
    await withAsyncOperation(
      async () => {
        const result = await toolManager.checkTool(tool);
        set((state) => {
          const tools = [...state.tools];
          const index = tools.findIndex((t) => t.tool.id === tool.id);
          if (index >= 0) {
            tools[index] = result;
          } else {
            tools.push(result);
          }
          return { tools };
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
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'toolStore'
    );
  },

  installTool: async (tool: DevTool) => {
    const result = await withAsyncOperation(
      async () => {
        const installResult = await toolManager.installTool(tool);
        if (!installResult.success) {
          throw new Error(installResult.error || 'Failed to install tool');
        }
        // Re-check the tool after installation
        await get().checkTool(tool);
        return true;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'toolStore'
    );
    return result ?? false;
  },

  checkToolUpdates: async () => {
    await withAsyncOperation(
      async () => {
        const { tools } = get();
        const toolData = tools.map((t) => ({
          tool: t.tool,
          version: t.version,
          isInstalled: t.isInstalled,
        }));
        const updates = await toolUpdateService.checkAllToolUpdates(toolData);
        set({ updateInfo: updates });
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isCheckingUpdates: true, error: null }),
      () => set({ isCheckingUpdates: false }),
      true,
      'runtime',
      'toolStore'
    );
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

