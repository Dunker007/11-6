export interface ElectronAPI {
  getSystemInfo: () => Promise<{
    cpu: {
      manufacturer: string;
      brand: string;
      cores: number;
      physicalCores: number;
      speed: string;
    };
    memory: {
      total: number;
      free: number;
      used: number;
      totalGB: string;
      freeGB: string;
    };
    graphics: Array<{
      model: string;
      vendor: string;
      vram?: number;
      memoryTotal?: number;
    }>;
    os: {
      platform: string;
      distro: string;
      release: string;
      arch: string;
    };
  }>;
  checkLMStudio: () => Promise<{ installed: boolean; path: string | null }>;
  checkOllama: () => Promise<{ installed: boolean; version: string | null }>;
  checkBoltDIY: () => Promise<{ installed: boolean; path: string | null }>;
  
  // Drive access
  listDrives: () => Promise<Array<{
    letter: string;
    label: string;
    freeSpace: number;
    totalSpace: number;
    type: string;
  }>>;
  browseDirectory: (path: string) => Promise<Array<{
    name: string;
    path: string;
    isDirectory: boolean;
    size: number;
    modified: number;
  }>>;
  getDirectorySize: (path: string) => Promise<{ size: number; fileCount: number }>;
  
  // File operations
  deleteFile: (path: string) => Promise<{ success: boolean; error?: string }>;
  deleteDirectory: (path: string) => Promise<{ success: boolean; error?: string }>;
  moveFile: (from: string, to: string) => Promise<{ success: boolean; error?: string }>;
  copyFile: (from: string, to: string) => Promise<{ success: boolean; error?: string }>;
  
  // System cleaning
  cleanTempFiles: () => Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
  cleanCache: () => Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
  cleanRegistry: () => Promise<{ cleaned: number; errors: string[] }>;
  cleanOldInstallations: () => Promise<{
    found: Array<{ name: string; path: string; size: number }>;
    removed: number;
    errors: string[];
  }>;
  deepCleanSystem: () => Promise<{
    tempFiles: { filesDeleted: number; spaceFreed: number; errors: string[] };
    cache: { filesDeleted: number; spaceFreed: number; errors: string[] };
    registry: { cleaned: number; errors: string[] };
    oldInstallations: {
      found: Array<{ name: string; path: string; size: number }>;
      removed: number;
      errors: string[];
    };
  }>;
  
  // Dev tools
  checkDevTools: () => Promise<Array<{ name: string; installed: boolean; version: string | null }>>;
  installDevTool: (toolName: string) => Promise<{ success: boolean; error?: string }>;
  installVSCodeExtension: (extensionId: string) => Promise<{ success: boolean; error?: string }>;
  
  // System operations
  checkAdminPrivileges: () => Promise<{ isAdmin: boolean }>;
  requestAdminPrivileges: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

