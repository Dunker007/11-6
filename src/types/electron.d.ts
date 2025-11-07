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

