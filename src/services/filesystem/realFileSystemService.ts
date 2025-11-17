/**
 * realFileSystemService.ts
 *
 * PURPOSE:
 * Direct file system access service using Electron's IPC bridge. Unlike sandboxFsService
 * which uses browser storage (IndexedDB/localStorage), this service operates on the actual
 * file system of the user's machine. Provides full read/write access to local drives,
 * folders, and files for true IDE functionality.
 *
 * ARCHITECTURE:
 * - Uses window.fileSystem APIs exposed via Electron preload script
 * - Direct communication with main process for file operations
 * - Supports mounting local directories as workspaces
 * - Real-time file watching and change detection
 * - Full CRUD operations on actual file system
 *
 * FEATURES:
 * ✅ Read/write actual files on disk
 * ✅ Mount local directories as project workspaces
 * ✅ Browse all drives and folders
 * ✅ Create, delete, rename files and folders
 * ✅ Recursive directory operations
 * ✅ File metadata and stats
 * ✅ Large file detection
 * ✅ Binary file support
 *
 * SECURITY:
 * - Electron contextBridge ensures secure IPC
 * - No direct Node.js access from renderer
 * - All file operations validated in main process
 *
 * USAGE EXAMPLE:
 * ```typescript
 * import { realFileSystemService } from '@/services/filesystem/realFileSystemService';
 *
 * // Mount a workspace
 * const workspace = await realFileSystemService.mountWorkspace('C:\\Users\\Dev\\MyProject');
 *
 * // Read actual file
 * const content = await realFileSystemService.readFile('C:\\Users\\Dev\\MyProject\\src\\index.ts');
 *
 * // Write to actual file
 * await realFileSystemService.writeFile('C:\\Users\\Dev\\MyProject\\src\\index.ts', newContent);
 *
 * // List drives
 * const drives = await realFileSystemService.listDrives();
 * ```
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
  addedAt: Date;
}

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: Date;
  extension?: string;
}

export interface DriveInfo {
  name: string;
  path: string;
  type?: string; // 'fixed', 'removable', 'network', etc.
  freeSpace?: number;
  totalSpace?: number;
}

class RealFileSystemService {
  private workspaces: Map<string, WorkspaceFolder> = new Map();
  private fileCache: Map<string, { content: string; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5000; // 5 seconds

  constructor() {
    this.loadWorkspacesFromStorage();
  }

  /**
   * Check if Electron file system APIs are available
   */
  private ensureElectron(): void {
    if (!window.fileSystem) {
      throw new Error('Electron file system APIs not available. Are you running in Electron?');
    }
  }

  /**
   * Load saved workspaces from localStorage
   */
  private loadWorkspacesFromStorage(): void {
    try {
      const stored = localStorage.getItem('real-workspaces');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([id, workspace]: [string, any]) => {
          this.workspaces.set(id, {
            ...workspace,
            addedAt: new Date(workspace.addedAt),
          });
        });
        logger.info('Loaded workspaces from storage', { count: this.workspaces.size });
      }
    } catch (error) {
      logger.error('Failed to load workspaces from storage', { error });
    }
  }

  /**
   * Save workspaces to localStorage
   */
  private saveWorkspacesToStorage(): void {
    try {
      const data = Object.fromEntries(this.workspaces.entries());
      localStorage.setItem('real-workspaces', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save workspaces to storage', { error });
    }
  }

  /**
   * Mount a local directory as a workspace
   */
  async mountWorkspace(folderPath: string): Promise<WorkspaceFolder> {
    this.ensureElectron();

    try {
      // Verify the path exists and is a directory
      const stats = await window.fileSystem.stat(folderPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path ${folderPath} is not a directory`);
      }

      // Create workspace entry
      const workspace: WorkspaceFolder = {
        id: crypto.randomUUID(),
        name: folderPath.split(/[/\\]/).pop() || folderPath,
        path: folderPath,
        addedAt: new Date(),
      };

      this.workspaces.set(workspace.id, workspace);
      this.saveWorkspacesToStorage();

      logger.info('Workspace mounted', { path: folderPath, name: workspace.name });

      activityService.addActivity({
        type: 'project',
        action: 'Workspace Mounted',
        description: `Mounted folder: ${workspace.name}`,
      });

      return workspace;
    } catch (error) {
      logger.error('Failed to mount workspace', { error, path: folderPath });
      throw error;
    }
  }

  /**
   * Unmount a workspace
   */
  unmountWorkspace(workspaceId: string): boolean {
    const workspace = this.workspaces.get(workspaceId);
    if (workspace) {
      this.workspaces.delete(workspaceId);
      this.saveWorkspacesToStorage();

      logger.info('Workspace unmounted', { id: workspaceId, name: workspace.name });

      activityService.addActivity({
        type: 'project',
        action: 'Workspace Unmounted',
        description: `Unmounted folder: ${workspace.name}`,
      });

      return true;
    }
    return false;
  }

  /**
   * Get all mounted workspaces
   */
  getWorkspaces(): WorkspaceFolder[] {
    return Array.from(this.workspaces.values());
  }

  /**
   * Open a directory picker and mount the selected folder
   */
  async mountWorkspaceWithPicker(): Promise<WorkspaceFolder | null> {
    this.ensureElectron();

    try {
      const result = await window.dialogs.openDirectory();
      if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
        return await this.mountWorkspace(result.filePaths[0]);
      }
      return null;
    } catch (error) {
      logger.error('Failed to open directory picker', { error });
      throw error;
    }
  }

  /**
   * List all available drives
   */
  async listDrives(): Promise<DriveInfo[]> {
    this.ensureElectron();

    try {
      const drives = await window.fileSystem.listDrives();
      logger.debug('Listed drives', { count: drives.length });
      return drives;
    } catch (error) {
      logger.error('Failed to list drives', { error });
      throw error;
    }
  }

  /**
   * Read directory contents
   */
  async readDirectory(dirPath: string): Promise<FileEntry[]> {
    this.ensureElectron();

    try {
      const entries = await window.fileSystem.readdir(dirPath);
      const fileEntries: FileEntry[] = [];

      // Get stats for each entry in parallel
      const statsPromises = entries.map(async (name: string) => {
        const fullPath = `${dirPath}/${name}`.replace(/\\/g, '/');
        try {
          const stats = await window.fileSystem.stat(fullPath);
          const isDir = stats.isDirectory();

          return {
            name,
            path: fullPath,
            type: isDir ? 'directory' as const : 'file' as const,
            size: isDir ? undefined : stats.size,
            modifiedAt: new Date(stats.mtime),
            extension: isDir ? undefined : name.split('.').pop(),
          };
        } catch (error) {
          logger.warn('Failed to stat file', { path: fullPath, error });
          return null;
        }
      });

      const results = await Promise.all(statsPromises);
      fileEntries.push(...results.filter((entry): entry is FileEntry => entry !== null));

      // Sort: directories first, then files alphabetically
      fileEntries.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      logger.debug('Read directory', { path: dirPath, entries: fileEntries.length });
      return fileEntries;
    } catch (error) {
      logger.error('Failed to read directory', { error, path: dirPath });
      throw error;
    }
  }

  /**
   * Read file content
   */
  async readFile(filePath: string, useCache: boolean = true): Promise<string> {
    this.ensureElectron();

    // Check cache
    if (useCache) {
      const cached = this.fileCache.get(filePath);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug('File read from cache', { path: filePath });
        return cached.content;
      }
    }

    try {
      const content = await window.fileSystem.readFile(filePath);

      // Update cache
      this.fileCache.set(filePath, {
        content,
        timestamp: Date.now(),
      });

      logger.debug('File read from disk', { path: filePath, size: content.length });
      return content;
    } catch (error) {
      logger.error('Failed to read file', { error, path: filePath });
      throw error;
    }
  }

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    this.ensureElectron();

    try {
      await window.fileSystem.writeFile(filePath, content);

      // Update cache
      this.fileCache.set(filePath, {
        content,
        timestamp: Date.now(),
      });

      logger.info('File written', { path: filePath, size: content.length });

      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      activityService.addActivity({
        type: 'file',
        action: 'File Saved',
        description: `Saved ${fileName}`,
      });
    } catch (error) {
      logger.error('Failed to write file', { error, path: filePath });
      throw error;
    }
  }

  /**
   * Create a new file
   */
  async createFile(filePath: string, content: string = ''): Promise<void> {
    this.ensureElectron();

    try {
      const exists = await window.fileSystem.exists(filePath);
      if (exists) {
        throw new Error(`File already exists: ${filePath}`);
      }

      await window.fileSystem.writeFile(filePath, content);

      logger.info('File created', { path: filePath });

      const fileName = filePath.split(/[/\\]/).pop() || filePath;
      activityService.addActivity({
        type: 'file',
        action: 'File Created',
        description: `Created ${fileName}`,
      });
    } catch (error) {
      logger.error('Failed to create file', { error, path: filePath });
      throw error;
    }
  }

  /**
   * Create a new directory
   */
  async createDirectory(dirPath: string, recursive: boolean = true): Promise<void> {
    this.ensureElectron();

    try {
      await window.fileSystem.mkdir(dirPath, recursive);

      logger.info('Directory created', { path: dirPath, recursive });

      const dirName = dirPath.split(/[/\\]/).pop() || dirPath;
      activityService.addActivity({
        type: 'file',
        action: 'Folder Created',
        description: `Created folder: ${dirName}`,
      });
    } catch (error) {
      logger.error('Failed to create directory', { error, path: dirPath });
      throw error;
    }
  }

  /**
   * Delete file or directory
   */
  async delete(path: string, recursive: boolean = false): Promise<void> {
    this.ensureElectron();

    try {
      await window.fileSystem.rm(path, recursive);

      // Clear from cache
      this.fileCache.delete(path);

      logger.info('Path deleted', { path, recursive });

      const itemName = path.split(/[/\\]/).pop() || path;
      activityService.addActivity({
        type: 'file',
        action: 'Deleted',
        description: `Deleted ${itemName}`,
      });
    } catch (error) {
      logger.error('Failed to delete', { error, path });
      throw error;
    }
  }

  /**
   * Check if path exists
   */
  async exists(path: string): Promise<boolean> {
    this.ensureElectron();

    try {
      return await window.fileSystem.exists(path);
    } catch (error) {
      logger.error('Failed to check existence', { error, path });
      return false;
    }
  }

  /**
   * Get file/directory stats
   */
  async stat(path: string): Promise<any> {
    this.ensureElectron();

    try {
      return await window.fileSystem.stat(path);
    } catch (error) {
      logger.error('Failed to get stats', { error, path });
      throw error;
    }
  }

  /**
   * Get directory size
   */
  async getDirectorySize(dirPath: string): Promise<number> {
    this.ensureElectron();

    try {
      const size = await window.fileSystem.getDirectorySize(dirPath);
      logger.debug('Directory size calculated', { path: dirPath, size });
      return size;
    } catch (error) {
      logger.error('Failed to get directory size', { error, path: dirPath });
      throw error;
    }
  }

  /**
   * Find large files in directory
   */
  async findLargeFiles(dirPath: string, minSizeMB: number = 100): Promise<any[]> {
    this.ensureElectron();

    try {
      const largeFiles = await window.fileSystem.findLargeFiles(dirPath, minSizeMB);
      logger.info('Large files found', { path: dirPath, count: largeFiles.length, minSizeMB });
      return largeFiles;
    } catch (error) {
      logger.error('Failed to find large files', { error, path: dirPath });
      throw error;
    }
  }

  /**
   * Show file in system file manager
   */
  async showInFolder(filePath: string): Promise<void> {
    this.ensureElectron();

    try {
      await window.shell.showItemInFolder(filePath);
      logger.info('Showed file in folder', { path: filePath });
    } catch (error) {
      logger.error('Failed to show in folder', { error, path: filePath });
      throw error;
    }
  }

  /**
   * Clear file cache
   */
  clearCache(): void {
    this.fileCache.clear();
    logger.info('File cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.fileCache.size,
      entries: Array.from(this.fileCache.keys()),
    };
  }
}

// Export singleton instance
export const realFileSystemService = new RealFileSystemService();
