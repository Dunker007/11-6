export interface DriveInfo {
  letter: string;
  label: string;
  freeSpace: number;
  totalSpace: number;
  type: string;
}

export interface DirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: number;
}

export interface CleanupResult {
  filesDeleted: number;
  spaceFreed: number;
  errors: string[];
}

export class FilesystemService {
  private static instance: FilesystemService;

  static getInstance(): FilesystemService {
    if (!FilesystemService.instance) {
      FilesystemService.instance = new FilesystemService();
    }
    return FilesystemService.instance;
  }

  async listDrives(): Promise<DriveInfo[]> {
    try {
      return await (window as any).electronAPI.listDrives();
    } catch (error) {
      console.error('Failed to list drives:', error);
      return [];
    }
  }

  async browseDirectory(dirPath: string): Promise<DirectoryEntry[]> {
    try {
      return await (window as any).electronAPI.browseDirectory(dirPath);
    } catch (error) {
      console.error('Failed to browse directory:', error);
      return [];
    }
  }

  async getDirectorySize(dirPath: string): Promise<{ size: number; fileCount: number }> {
    try {
      return await (window as any).electronAPI.getDirectorySize(dirPath);
    } catch (error) {
      console.error('Failed to get directory size:', error);
      return { size: 0, fileCount: 0 };
    }
  }

  async deleteFile(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await (window as any).electronAPI.deleteFile(filePath);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteDirectory(dirPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await (window as any).electronAPI.deleteDirectory(dirPath);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async moveFile(fromPath: string, toPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await (window as any).electronAPI.moveFile(fromPath, toPath);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async copyFile(fromPath: string, toPath: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await (window as any).electronAPI.copyFile(fromPath, toPath);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async cleanTempFiles(): Promise<CleanupResult> {
    try {
      return await (window as any).electronAPI.cleanTempFiles();
    } catch (error) {
      return {
        filesDeleted: 0,
        spaceFreed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async cleanCache(): Promise<CleanupResult> {
    try {
      return await (window as any).electronAPI.cleanCache();
    } catch (error) {
      return {
        filesDeleted: 0,
        spaceFreed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async cleanRegistry(): Promise<{ cleaned: number; errors: string[] }> {
    try {
      return await (window as any).electronAPI.cleanRegistry();
    } catch (error) {
      return {
        cleaned: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async cleanOldInstallations(): Promise<{
    found: Array<{ name: string; path: string; size: number }>;
    removed: number;
    errors: string[];
  }> {
    try {
      return await (window as any).electronAPI.cleanOldInstallations();
    } catch (error) {
      return {
        found: [],
        removed: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async deepCleanSystem(): Promise<{
    tempFiles: CleanupResult;
    cache: CleanupResult;
    registry: { cleaned: number; errors: string[] };
    oldInstallations: { found: Array<{ name: string; path: string; size: number }>; removed: number; errors: string[] };
  }> {
    try {
      return await (window as any).electronAPI.deepCleanSystem();
    } catch (error) {
      return {
        tempFiles: { filesDeleted: 0, spaceFreed: 0, errors: [error instanceof Error ? error.message : 'Unknown error'] },
        cache: { filesDeleted: 0, spaceFreed: 0, errors: [] },
        registry: { cleaned: 0, errors: [] },
        oldInstallations: { found: [], removed: 0, errors: [] },
      };
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const filesystemService = FilesystemService.getInstance();

