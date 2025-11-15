import { create } from 'zustand';
import { fileSystemService } from './fileSystemService';
import type { FileSystemEntry, FileStats } from '@/types/electron';
import { withAsyncOperation } from '@/utils/storeHelpers';

interface FileSystemStore {
  // State
  recentFiles: string[];
  openFiles: Set<string>;
  currentDirectory: string | null;
  fileWatchers: Map<string, () => void>;
  isLoading: boolean;
  error: string | null;

  // Actions
  addRecentFile: (path: string) => void;
  openFile: (path: string) => void;
  closeFile: (path: string) => void;
  setCurrentDirectory: (path: string) => void;
  readFile: (path: string) => Promise<string | null>;
  writeFile: (path: string, content: string) => Promise<boolean>;
  createDirectory: (path: string) => Promise<boolean>;
  deleteFile: (path: string) => Promise<boolean>;
  listDirectory: (path: string) => Promise<FileSystemEntry[] | null>;
  getFileStats: (path: string) => Promise<FileStats | null>;
  checkExists: (path: string) => Promise<boolean>;
  openFileDialog: (options?: { filters?: { name: string; extensions: string[] }[] }) => Promise<string[] | null>;
  saveFileDialog: (options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
  openDirectoryDialog: () => Promise<string[] | null>;
}

export const useFileSystemStore = create<FileSystemStore>((set, get) => ({
  recentFiles: [],
  openFiles: new Set(),
  currentDirectory: null,
  fileWatchers: new Map(),
  isLoading: false,
  error: null,

  addRecentFile: (path: string) => {
    set((state) => {
      const recent = [path, ...state.recentFiles.filter((p) => p !== path)].slice(0, 20);
      return { recentFiles: recent };
    });
  },

  openFile: (path: string) => {
    set((state) => {
      const openFiles = new Set(state.openFiles);
      openFiles.add(path);
      return { openFiles };
    });
    get().addRecentFile(path);
  },

  closeFile: (path: string) => {
    set((state) => {
      const openFiles = new Set(state.openFiles);
      openFiles.delete(path);
      return { openFiles };
    });
  },

  setCurrentDirectory: (path: string) => {
    set({ currentDirectory: path });
  },

  readFile: async (path: string) => {
    return await withAsyncOperation(
      async () => {
        const result = await fileSystemService.readFile(path);
        if (result.success && result.data) {
          get().addRecentFile(path);
          return result.data;
        }
        throw new Error(result.error || 'Failed to read file');
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'fileSystemStore'
    );
  },

  writeFile: async (path: string, content: string) => {
    const result = await withAsyncOperation(
      async () => {
        const writeResult = await fileSystemService.writeFile(path, content);
        if (writeResult.success) {
          get().addRecentFile(path);
          return true;
        }
        throw new Error(writeResult.error || 'Failed to write file');
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'fileSystemStore'
    );
    return result ?? false;
  },

  createDirectory: async (path: string) => {
    const result = await withAsyncOperation(
      async () => {
        const mkdirResult = await fileSystemService.mkdir(path, true);
        if (!mkdirResult.success) {
          throw new Error(mkdirResult.error || 'Failed to create directory');
        }
        return mkdirResult.success;
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'fileSystemStore'
    );
    return result ?? false;
  },

  deleteFile: async (path: string) => {
    const result = await withAsyncOperation(
      async () => {
        const rmResult = await fileSystemService.rm(path, false);
        if (rmResult.success) {
          get().closeFile(path);
          return true;
        }
        throw new Error(rmResult.error || 'Failed to delete file');
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'fileSystemStore'
    );
    return result ?? false;
  },

  listDirectory: async (path: string) => {
    return await withAsyncOperation(
      async () => {
        const result = await fileSystemService.readdir(path);
        if (result.success && result.data) {
          set({ currentDirectory: path });
          return result.data;
        }
        throw new Error(result.error || 'Failed to list directory');
      },
      (errorMessage) => set({ error: errorMessage }),
      () => set({ isLoading: true, error: null }),
      () => set({ isLoading: false }),
      true,
      'runtime',
      'fileSystemStore'
    );
  },

  getFileStats: async (path: string) => {
    try {
      const result = await fileSystemService.stat(path);
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  checkExists: async (path: string) => {
    try {
      const result = await fileSystemService.exists(path);
      return result.success && result.data === true;
    } catch (error) {
      return false;
    }
  },

  openFileDialog: async (options?: { filters?: { name: string; extensions: string[] }[] }) => {
    try {
      const result = await fileSystemService.openFileDialog(options);
      if (result.success && result.data) {
        result.data.forEach((path) => get().addRecentFile(path));
        return result.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  saveFileDialog: async (options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => {
    try {
      const result = await fileSystemService.saveFileDialog(options);
      if (result.success && result.data) {
        get().addRecentFile(result.data);
        return result.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  },

  openDirectoryDialog: async () => {
    try {
      const result = await fileSystemService.openDirectoryDialog();
      if (result.success && result.data) {
        get().setCurrentDirectory(result.data[0]);
        return result.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  },
}));

