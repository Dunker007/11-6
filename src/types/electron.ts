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
