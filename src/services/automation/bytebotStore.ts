import { create } from 'zustand';
import { byteBotService, type ByteBotTask, type ByteBotConfig } from './bytebotService';
import { withAsyncOperation } from '@/utils/storeHelpers';

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
    const result = await withAsyncOperation(
      async () => {
        const connectResult = await byteBotService.connect(endpoint);
        if (!connectResult.success) {
          throw new Error(connectResult.error || 'Failed to connect');
        }
        set({ config: byteBotService.getConfig() });
        return true;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'bytebotStore'
    );
    return result ?? false;
  },

  executeTask: async (command: string) => {
    const result = await withAsyncOperation(
      async () => {
        const taskResult = await byteBotService.executeTask(command);
        if (!taskResult.success) {
          throw new Error(taskResult.error || 'Failed to execute task');
        }
        set({ tasks: byteBotService.getTasks() });
        return true;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'bytebotStore'
    );
    return result ?? false;
  },

  getTasks: () => {
    return byteBotService.getTasks();
  },

  getTaskStatus: (taskId: string) => {
    return byteBotService.getTaskStatus(taskId);
  },

  cancelTask: async (taskId: string) => {
    const result = await withAsyncOperation(
      async () => {
        const cancelResult = await byteBotService.cancelTask(taskId);
        if (!cancelResult.success) {
          throw new Error(cancelResult.error || 'Failed to cancel task');
        }
        set({ tasks: byteBotService.getTasks() });
        return true;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'bytebotStore'
    );
    return result ?? false;
  },

  setConfig: (config: Partial<ByteBotConfig>) => {
    byteBotService.setConfig(config);
    set({ config: byteBotService.getConfig() });
  },
}));

