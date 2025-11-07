import { create } from 'zustand';
import { byteBotService, type ByteBotTask, type ByteBotConfig } from './bytebotService';

interface ByteBotStore {
  // State
  config: ByteBotConfig;
  tasks: ByteBotTask[];
  isLoading: boolean;
  error: string | null;

  // Actions
  connect: (endpoint: string) => Promise<boolean>;
  executeTask: (command: string) => Promise<boolean>;
  getTasks: () => ByteBotTask[];
  getTaskStatus: (taskId: string) => ByteBotTask | null;
  cancelTask: (taskId: string) => Promise<boolean>;
  setConfig: (config: Partial<ByteBotConfig>) => void;
}

export const useByteBotStore = create<ByteBotStore>((set) => ({
  config: byteBotService.getConfig(),
  tasks: [],
  isLoading: false,
  error: null,

  connect: async (endpoint: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await byteBotService.connect(endpoint);
      if (result.success) {
        set({ config: byteBotService.getConfig(), isLoading: false });
        return true;
      }
      set({ isLoading: false, error: result.error });
      return false;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  executeTask: async (command: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await byteBotService.executeTask(command);
      if (result.success) {
        set({ tasks: byteBotService.getTasks(), isLoading: false });
        return true;
      }
      set({ isLoading: false, error: result.error });
      return false;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  getTasks: () => {
    return byteBotService.getTasks();
  },

  getTaskStatus: (taskId: string) => {
    return byteBotService.getTaskStatus(taskId);
  },

  cancelTask: async (taskId: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await byteBotService.cancelTask(taskId);
      if (result.success) {
        set({ tasks: byteBotService.getTasks(), isLoading: false });
        return true;
      }
      set({ isLoading: false, error: result.error });
      return false;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  setConfig: (config: Partial<ByteBotConfig>) => {
    byteBotService.setConfig(config);
    set({ config: byteBotService.getConfig() });
  },
}));

