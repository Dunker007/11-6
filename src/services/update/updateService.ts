import type { UpdateInfo, UpdateProgress } from '@/types/update';
import type { UpdaterAPI } from '@/types/electron';
import { logger } from '../logging/loggerService';

class UpdateService {
  private static instance: UpdateService;
  private listeners: Map<string, Set<Function>> = new Map();

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
      UpdateService.instance.setupListeners();
    }
    return UpdateService.instance;
  }

  private setupListeners() {
    if (typeof window !== 'undefined' && window.updater) {
      const updater: UpdaterAPI = window.updater;

      updater.onAvailable((info: UpdateInfo) => {
        this.notifyListeners('available', info);
      });

      updater.onDownloaded((info: UpdateInfo) => {
        this.notifyListeners('downloaded', info);
      });

      updater.onProgress((progress: UpdateProgress) => {
        this.notifyListeners('progress', progress);
      });

      updater.onError((error: { error: string }) => {
        this.notifyListeners('error', error);
      });
    }
  }

  async checkForUpdates(): Promise<{ success: boolean; error?: string; updateInfo?: UpdateInfo; suppressed?: boolean }> {
    if (typeof window !== 'undefined' && window.updater) {
      return await window.updater.check();
    }
    return { success: false, error: 'Update service not available' };
  }

  async installUpdate(): Promise<{ success: boolean; error?: string }> {
    if (typeof window !== 'undefined' && window.updater) {
      return await window.updater.install();
    }
    return { success: false, error: 'Update service not available' };
  }

  on(event: 'available' | 'downloaded' | 'progress' | 'error', callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        logger.error(`Error in update listener for ${event}:`, { error });
      }
    });
  }
}

export const updateService = UpdateService.getInstance();

