import type { FileSystemEntry, FileStats } from '@/types/electron';

export interface FileSystemResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export class FileSystemService {
  private static instance: FileSystemService;

  private constructor() {}

  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  async readFile(path: string): Promise<FileSystemResult<string>> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.readFile(path);
      if (result.success && result.content !== undefined) {
        return { success: true, data: result.content };
      }
      return { success: false, error: result.error || 'Failed to read file' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async writeFile(path: string, content: string): Promise<FileSystemResult> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.writeFile(path, content);
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to write file' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async mkdir(path: string, recursive = true): Promise<FileSystemResult> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.mkdir(path, recursive);
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to create directory' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async rm(path: string, recursive = false): Promise<FileSystemResult> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.rm(path, recursive);
      if (result.success) {
        return { success: true };
      }
      return { success: false, error: result.error || 'Failed to delete' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async readdir(path: string): Promise<FileSystemResult<FileSystemEntry[]>> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.readdir(path);
      if (result.success && result.entries) {
        return { success: true, data: result.entries };
      }
      return { success: false, error: result.error || 'Failed to read directory' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async stat(path: string): Promise<FileSystemResult<FileStats>> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.stat(path);
      if (result.success && result.stats) {
        return { success: true, data: result.stats };
      }
      return { success: false, error: result.error || 'Failed to get file stats' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async exists(path: string): Promise<FileSystemResult<boolean>> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.exists(path);
      if (result.success && result.exists !== undefined) {
        return { success: true, data: result.exists };
      }
      return { success: false, error: result.error || 'Failed to check existence' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async findLargeFiles(dirPath: string, minSizeMB: number = 100): Promise<FileSystemResult<Array<{ path: string; size: number; lastModified: string }>>> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.findLargeFiles(dirPath, minSizeMB);
      if (result.success && result.files) {
        return { success: true, data: result.files };
      }
      return { success: false, error: result.error || 'Failed to find large files' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async openFileDialog(options?: { filters?: { name: string; extensions: string[] }[] }): Promise<FileSystemResult<string[]>> {
    try {
      if (!window.dialogs) {
        return { success: false, error: 'Dialog API not available' };
      }
      const result = await window.dialogs.openFile(options);
      if (result.success && result.filePaths) {
        return { success: true, data: result.filePaths };
      }
      return { success: false, error: 'File dialog cancelled' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async saveFileDialog(options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }): Promise<FileSystemResult<string>> {
    try {
      if (!window.dialogs) {
        return { success: false, error: 'Dialog API not available' };
      }
      const result = await window.dialogs.saveFile(options);
      if (result.success && result.filePath) {
        return { success: true, data: result.filePath };
      }
      return { success: false, error: 'Save dialog cancelled' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async openDirectoryDialog(): Promise<FileSystemResult<string[]>> {
    try {
      if (!window.dialogs) {
        return { success: false, error: 'Dialog API not available' };
      }
      const result = await window.dialogs.openDirectory();
      if (result.success && result.filePaths) {
        return { success: true, data: result.filePaths };
      }
      return { success: false, error: 'Directory dialog cancelled' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async listDrives(): Promise<FileSystemResult<Array<{ name: string; path: string; type?: string }>>> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.listDrives();
      if (result.success && result.drives) {
        return { success: true, data: result.drives };
      }
      return { success: false, error: result.error || 'Failed to list drives' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }

  async getDirectorySize(dirPath: string): Promise<FileSystemResult<number>> {
    try {
      if (!window.fileSystem) {
        return { success: false, error: 'File system API not available' };
      }
      const result = await window.fileSystem.getDirectorySize(dirPath);
      if (result.success && result.size !== undefined) {
        return { success: true, data: result.size };
      }
      return { success: false, error: result.error || 'Failed to get directory size' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}

export const fileSystemService = FileSystemService.getInstance();

