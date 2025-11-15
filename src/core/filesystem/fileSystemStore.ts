import { create } from 'zustand';
import { fileSystemService } from './fileSystemService';
import type { FileSystemEntry, FileStats } from '@/types/electron';

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
    set({ isLoading: true, error: null });
    try {
      const result = await fileSystemService.readFile(path);
      if (result.success && result.data) {
        get().addRecentFile(path);
        set({ isLoading: false });
        return result.data;
      }
      set({ isLoading: false, error: result.error || 'Failed to read file' });
      return null;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return null;
    }
  },

  writeFile: async (path: string, content: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fileSystemService.writeFile(path, content);
      if (result.success) {
        get().addRecentFile(path);
        set({ isLoading: false });
        return true;
      }
      set({ isLoading: false, error: result.error || 'Failed to write file' });
      return false;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  createDirectory: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fileSystemService.mkdir(path, true);
      set({ isLoading: false });
      return result.success;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  deleteFile: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fileSystemService.rm(path, false);
      if (result.success) {
        get().closeFile(path);
        set({ isLoading: false });
        return true;
      }
      set({ isLoading: false, error: result.error || 'Failed to delete file' });
      return false;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return false;
    }
  },

  listDirectory: async (path: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await fileSystemService.readdir(path);
      if (result.success && result.data) {
        set({ isLoading: false, currentDirectory: path });
        return result.data;
      }
      set({ isLoading: false, error: result.error || 'Failed to list directory' });
      return null;
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
      return null;
    }
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

