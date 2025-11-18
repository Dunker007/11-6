/**
 * Type definitions for Electron window extensions
 * These types extend the Window interface with Electron-specific APIs
 *
 * This file provides TypeScript type definitions for all Electron IPC APIs
 * exposed via the preload script. These types ensure type safety when
 * accessing window.* APIs in the renderer process.
 */

import type { UpdateInfo, UpdateProgress } from '@/types/update';

/**
 * Window controls API for managing Electron window state
 */
export interface WindowControlsAPI {
  /**
   * Check if the window is currently maximized
   * @returns Promise resolving to window maximized state
   */
  isMaximized(): Promise<{ success: boolean; isMaximized: boolean }>;

  /**
   * Minimize the window
   * @returns Promise that resolves when minimize completes
   */
  minimize(): Promise<void>;

  /**
   * Maximize or restore the window (toggles)
   * @returns Promise resolving to new maximized state
   */
  maximize(): Promise<{ success: boolean; isMaximized: boolean }>;

  /**
   * Close the window
   * @returns Promise that resolves when close completes
   */
  close(): Promise<void>;
}

/**
 * Auto-updater API for checking and installing application updates
 */
export interface UpdaterAPI {
  /**
   * Register callback for when an update is available
   * @param callback Function called when update becomes available
   * @returns Cleanup function to remove the listener
   */
  onAvailable(callback: (info: UpdateInfo) => void): () => void;

  /**
   * Register callback for when an update has finished downloading
   * @param callback Function called when update download completes
   * @returns Cleanup function to remove the listener
   */
  onDownloaded(callback: (info: UpdateInfo) => void): () => void;

  /**
   * Register callback for update download progress
   * @param callback Function called with progress updates
   * @returns Cleanup function to remove the listener
   */
  onProgress(callback: (progress: UpdateProgress) => void): () => void;

  /**
   * Register callback for update errors
   * @param callback Function called when an error occurs
   * @returns Cleanup function to remove the listener
   */
  onError(callback: (error: { error: string }) => void): () => void;

  /**
   * Check for available updates
   * @returns Promise resolving to check result with optional update info
   */
  check(): Promise<{ success: boolean; error?: string; updateInfo?: UpdateInfo; suppressed?: boolean }>;

  /**
   * Install the downloaded update and restart the application
   * @returns Promise resolving to install result
   */
  install(): Promise<{ success: boolean; error?: string }>;
}

/**
 * File system entry type
 */
export interface FileSystemEntry {
  name: string;
  isDirectory: boolean;
  isFile: boolean;
  path: string;
}

/**
 * File stats type
 */
export interface FileStats {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  mtime: string;
  ctime: string;
}

/**
 * Global type augmentations for Window interface
 */
declare global {
  interface Window {
    /**
     * Window controls API (only available in Electron environment)
     */
    windowControls?: WindowControlsAPI;

    /**
     * Auto-updater API (only available in Electron environment)
     */
    updater?: UpdaterAPI;

    /**
     * File system API
     */
    fileSystem?: {
      readFile(path: string): Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile(path: string, content: string): Promise<{ success: boolean; error?: string }>;
      mkdir(path: string, recursive?: boolean): Promise<{ success: boolean; error?: string }>;
      rm(path: string, recursive?: boolean): Promise<{ success: boolean; error?: string }>;
      readdir(path: string): Promise<{ success: boolean; entries?: FileSystemEntry[]; error?: string }>;
      stat(path: string): Promise<{ success: boolean; stats?: FileStats; error?: string }>;
      exists(path: string): Promise<{ success: boolean; exists?: boolean; error?: string }>;
      listDrives(): Promise<{ success: boolean; drives?: Array<{ name: string; path: string; type?: string }>; error?: string }>;
      getDirectorySize(path: string): Promise<{ success: boolean; size?: number; error?: string }>;
      findLargeFiles(dirPath: string, minSizeMB?: number): Promise<{ success: boolean; files?: Array<{ path: string; size: number; lastModified: string }>; error?: string }>;
    };

    /**
     * Dialogs API
     */
    dialogs?: {
      openFile(options?: { filters?: { name: string; extensions: string[] }[] }): Promise<{ success: boolean; filePaths?: string[] }>;
      saveFile(options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }): Promise<{ success: boolean; filePath?: string }>;
      openDirectory(): Promise<{ success: boolean; filePaths?: string[] }>;
    };

    /**
     * Shell API
     */
    shell?: {
      showItemInFolder(filePath: string): Promise<{ success: boolean; error?: string }>;
    };

    /**
     * DevTools API
     */
    devTools?: {
      check(command: string): Promise<{ success: boolean; installed?: boolean; output?: string; error?: string }>;
      getVersion(command: string): Promise<{ success: boolean; version?: string; error?: string }>;
      install(command: string): Promise<{ success: boolean; output?: string; error?: string }>;
    };

    /**
     * Program execution API
     */
    program?: {
      execute(command: string, workingDirectory?: string): Promise<{ success: boolean; executionId?: string; error?: string }>;
      kill(executionId: string): Promise<{ success: boolean; error?: string }>;
      onOutput(callback: (executionId: string, data: { type: 'stdout' | 'stderr'; data: string }) => void): () => void;
      onComplete(callback: (executionId: string, result: { exitCode: number; stdout: string; stderr: string }) => void): () => void;
      onError(callback: (executionId: string, error: { error: string }) => void): () => void;
    };

    /**
     * LLM API
     */
    llm?: {
      openExternalUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
      pullModel: (modelId: string, pullCommand: string) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
      pullModelStream: (modelId: string, pullCommand: string) => Promise<{ success: boolean; exitCode?: number; stdout?: string; stderr?: string; error?: string }>;
      onPullProgress: (callback: (data: { executionId: string; modelId: string; type: 'stdout' | 'stderr'; data: string }) => void) => () => void;
      onPullComplete: (callback: (data: { executionId: string; modelId: string; exitCode: number; success: boolean }) => void) => () => void;
      onPullError: (callback: (data: { executionId: string; modelId: string; error: string }) => void) => () => void;
    };

    /**
     * Windows-specific API
     */
    windows?: {
      listServices: () => Promise<{ success: boolean; services?: Array<{ Name: string; DisplayName: string; Status: string; StartType: string }>; error?: string }>;
      getServiceStatus: (serviceName: string) => Promise<{ success: boolean; service?: { Name: string; Status: string; StartType: string }; error?: string }>;
      disableService: (serviceName: string) => Promise<{ success: boolean; error?: string }>;
      enableService: (serviceName: string) => Promise<{ success: boolean; error?: string }>;
      readRegistry: (path: string, value: string) => Promise<{ success: boolean; value?: string; error?: string }>;
      writeRegistry: (path: string, value: string, data: string, type?: 'DWORD' | 'STRING' | 'BINARY') => Promise<{ success: boolean; error?: string }>;
      checkAdmin: () => Promise<{ isAdmin: boolean; isWindows: boolean }>;
      runCommand: (command: string, admin?: boolean) => Promise<{ success: boolean; stdout?: string; stderr?: string; error?: string }>;
    };
  }

  interface Console {
    /**
     * Original console.error function (used by console interceptor)
     */
    __originalError?: typeof console.error;

    /**
     * Original console.warn function (used by console interceptor)
     */
    __originalWarn?: typeof console.warn;
  }
}
