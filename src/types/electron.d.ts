declare global {
  interface Window {
    ipcRenderer: {
      on(channel: string, listener: (event: any, ...args: any[]) => void): void;
      off(channel: string, listener: (event: any, ...args: any[]) => void): void;
      send(channel: string, ...args: any[]): void;
      invoke(channel: string, ...args: any[]): Promise<any>;
    };
    fileSystem: {
      readFile(path: string): Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile(path: string, content: string): Promise<{ success: boolean; error?: string }>;
      mkdir(path: string, recursive?: boolean): Promise<{ success: boolean; error?: string }>;
      rm(path: string, recursive?: boolean): Promise<{ success: boolean; error?: string }>;
      readdir(path: string): Promise<{ success: boolean; entries?: FileSystemEntry[]; error?: string }>;
      stat(path: string): Promise<{ success: boolean; stats?: FileStats; error?: string }>;
      exists(path: string): Promise<{ success: boolean; exists?: boolean; error?: string }>;
      listDrives(): Promise<{ success: boolean; drives?: Array<{ name: string; path: string; type?: string }>; error?: string }>;
      getDirectorySize(path: string): Promise<{ success: boolean; size?: number; error?: string }>;
    };
    system: {
      cleanTempFiles(): Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
      cleanCache(): Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
      deepClean(): Promise<{
        tempFiles: { filesDeleted: number; spaceFreed: number; errors: string[] };
        cache: { filesDeleted: number; spaceFreed: number; errors: string[] };
        registry: { cleaned: number; errors: string[] };
        oldInstallations: { found: Array<{ name: string; path: string; size: number }>; removed: number; errors: string[] };
      }>;
    };
    dialogs: {
      openFile(options?: { filters?: { name: string; extensions: string[] }[] }): Promise<{ success: boolean; filePaths?: string[] }>;
      saveFile(options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }): Promise<{ success: boolean; filePath?: string }>;
      openDirectory(): Promise<{ success: boolean; filePaths?: string[] }>;
    };
    devTools: {
      check(command: string): Promise<{ success: boolean; installed?: boolean; output?: string; error?: string }>;
      getVersion(command: string): Promise<{ success: boolean; version?: string; error?: string }>;
      install(command: string): Promise<{ success: boolean; output?: string; error?: string }>;
    };
    monitor: {
      getDisplays(): Promise<Display[]>;
      setPrimary(displayId: string): Promise<{ success: boolean; error?: string }>;
      setDisplayBounds(displayId: string, bounds: { x: number; y: number; width: number; height: number }): Promise<{ success: boolean; error?: string }>;
    };
    program: {
      execute(command: string, workingDirectory?: string): Promise<{ success: boolean; executionId?: string; error?: string }>;
      kill(executionId: string): Promise<{ success: boolean; error?: string }>;
      onOutput(callback: (executionId: string, data: { type: 'stdout' | 'stderr'; data: string }) => void): () => void;
      onComplete(callback: (executionId: string, result: { exitCode: number; stdout: string; stderr: string }) => void): () => void;
      onError(callback: (executionId: string, error: { error: string }) => void): () => void;
    };
    updater: {
      check(): Promise<{ success: boolean; error?: string; updateInfo?: any }>;
      install(): Promise<{ success: boolean; error?: string }>;
      onAvailable(callback: (info: { version: string; releaseDate: string; releaseNotes?: string }) => void): () => void;
      onDownloaded(callback: (info: { version: string; releaseDate: string; releaseNotes?: string }) => void): () => void;
      onProgress(callback: (progress: { percent: number; transferred: number; total: number }) => void): () => void;
      onError(callback: (error: { error: string }) => void): () => void;
    };
    menu: {
      onAbout(callback: () => void): () => void;
      onShortcuts(callback: () => void): () => void;
    };
  }
}

export interface FileSystemEntry {
  name: string;
  isDirectory: boolean;
  path: string;
}

export interface FileStats {
  isFile: boolean;
  isDirectory: boolean;
  size: number;
  mtime: string;
  ctime: string;
}

export interface Display {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  isPrimary: boolean;
  name: string;
  resolution: { width: number; height: number };
}

