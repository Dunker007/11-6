/**
 * preload.ts
 * 
 * PURPOSE:
 * Electron preload script that safely exposes Node.js APIs to the renderer process via
 * contextBridge. Provides secure IPC communication layer between renderer and main process.
 * Uses safeExpose helper to prevent property conflicts that could cause renderer crashes.
 * 
 * ARCHITECTURE:
 * Preload script that exposes APIs via contextBridge:
 * - fileSystem: File operations (read, write, mkdir, etc.)
 * - system: System operations (clean temp files, cache, etc.)
 * - dialogs: File/directory dialogs
 * - shell: Shell operations (showItemInFolder)
 * - devTools: Development tool management
 * - llm: LLM operations (model pulling)
 * - ipcRenderer: Direct IPC access (limited)
 * 
 * Key safety features:
 * - safeExpose helper prevents property conflicts
 * - Checks for existing properties before exposing
 * - Error handling for exposure failures
 * - Secure contextBridge usage
 * 
 * CURRENT STATUS:
 * ✅ File system API exposure
 * ✅ System operations API
 * ✅ Dialog API
 * ✅ Shell API
 * ✅ Dev tools API
 * ✅ LLM API
 * ✅ Safe property exposure
 * ✅ Error handling
 * 
 * DEPENDENCIES:
 * - electron: contextBridge, ipcRenderer
 * 
 * STATE MANAGEMENT:
 * - No state (pure API exposure)
 * 
 * PERFORMANCE:
 * - Lightweight script
 * - Efficient IPC forwarding
 * - Minimal overhead
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * // In renderer process (TypeScript)
 * // Types defined in src/types/electron.d.ts
 * 
 * const result = await window.fileSystem.readFile('/path/to/file');
 * await window.shell.showItemInFolder('/path/to/file');
 * ```
 * 
 * RELATED FILES:
 * - electron/main.ts: IPC handler implementations
 * - src/types/electron.d.ts: TypeScript definitions
 * - src/services/filesystem/fileSystemService.ts: Uses exposed APIs
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - More API endpoints
 * - API versioning
 * - Request validation
 * - Rate limiting
 */
import electron from 'electron';
const { contextBridge, ipcRenderer } = electron;

// Helper to safely expose APIs - checks if property already exists
function safeExpose(name: string, api: any) {
  if (window.hasOwnProperty(name)) {
    console.warn(`[Preload] Property ${name} already exists on window, skipping exposure`);
    return;
  }
  try {
    contextBridge.exposeInMainWorld(name, api);
  } catch (error) {
    console.error(`[Preload] Failed to expose ${name}:`, error);
  }
}

// --------- Expose some API to the Renderer process ---------
safeExpose('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
});

// --------- Expose File System API ---------
safeExpose('fileSystem', {
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
  mkdir: (path: string, recursive?: boolean) => ipcRenderer.invoke('fs:mkdir', path, recursive),
  rm: (path: string, recursive?: boolean) => ipcRenderer.invoke('fs:rm', path, recursive),
  readdir: (path: string) => ipcRenderer.invoke('fs:readdir', path),
  stat: (path: string) => ipcRenderer.invoke('fs:stat', path),
  exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
  listDrives: () => ipcRenderer.invoke('fs:listDrives'),
  getDirectorySize: (path: string) => ipcRenderer.invoke('fs:getDirectorySize', path),
  findLargeFiles: (dirPath: string, minSizeMB?: number) => ipcRenderer.invoke('fs:findLargeFiles', dirPath, minSizeMB),
});

// --------- Expose System API ---------
safeExpose('system', {
  cleanTempFiles: () => ipcRenderer.invoke('system:cleanTempFiles'),
  cleanCache: () => ipcRenderer.invoke('system:cleanCache'),
  deepClean: () => ipcRenderer.invoke('system:deepClean'),
});

// --------- Expose Dialog API ---------
safeExpose('dialogs', {
  openFile: (options?: { filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('dialog:saveFile', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
});

// --------- Expose Shell API ---------
safeExpose('shell', {
  showItemInFolder: (filePath: string) => ipcRenderer.invoke('shell:showItemInFolder', filePath),
});

// --------- Expose Dev Tools API ---------
safeExpose('devTools', {
  check: (command: string) => ipcRenderer.invoke('tools:check', command),
  getVersion: (command: string) => ipcRenderer.invoke('tools:getVersion', command),
  install: (command: string) => ipcRenderer.invoke('tools:install', command),
});

// --------- Expose Monitor API ---------
safeExpose('monitor', {
  getDisplays: () => ipcRenderer.invoke('monitor:getDisplays'),
  setPrimary: (displayId: string) => ipcRenderer.invoke('monitor:setPrimary', displayId),
  setDisplayBounds: (displayId: string, bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke('monitor:setDisplayBounds', displayId, bounds),
});

// --------- Expose Screen API ---------
safeExpose('screenAPI', {
  getDisplayInfo: () => ipcRenderer.invoke('screen:getDisplayInfo'),
});

// --------- Expose Program Execution API ---------
safeExpose('program', {
  execute: (command: string, workingDirectory?: string) => 
    ipcRenderer.invoke('program:execute', command, workingDirectory),
  kill: (executionId: string) => ipcRenderer.invoke('program:kill', executionId),
  onOutput: (callback: (executionId: string, data: { type: 'stdout' | 'stderr'; data: string }) => void) => {
    const listener = (_event: any, executionId: string, data: { type: 'stdout' | 'stderr'; data: string }) => 
      callback(executionId, data);
    ipcRenderer.on('program:output', listener);
    return () => ipcRenderer.off('program:output', listener);
  },
  onComplete: (callback: (executionId: string, result: { exitCode: number; stdout: string; stderr: string }) => void) => {
    const listener = (_event: any, executionId: string, result: { exitCode: number; stdout: string; stderr: string }) => 
      callback(executionId, result);
    ipcRenderer.on('program:complete', listener);
    return () => ipcRenderer.off('program:complete', listener);
  },
  onError: (callback: (executionId: string, error: { error: string }) => void) => {
    const listener = (_event: any, executionId: string, error: { error: string }) => 
      callback(executionId, error);
    ipcRenderer.on('program:error', listener);
    return () => ipcRenderer.off('program:error', listener);
  },
});

// --------- Expose Update API ---------
safeExpose('updater', {
  check: () => ipcRenderer.invoke('update:check'),
  install: () => ipcRenderer.invoke('update:install'),
  onAvailable: (callback: (info: { version: string; releaseDate: string; releaseNotes?: string }) => void) => {
    const listener = (_event: any, info: { version: string; releaseDate: string; releaseNotes?: string }) => 
      callback(info);
    ipcRenderer.on('update:available', listener);
    return () => ipcRenderer.off('update:available', listener);
  },
  onDownloaded: (callback: (info: { version: string; releaseDate: string; releaseNotes?: string }) => void) => {
    const listener = (_event: any, info: { version: string; releaseDate: string; releaseNotes?: string }) => 
      callback(info);
    ipcRenderer.on('update:downloaded', listener);
    return () => ipcRenderer.off('update:downloaded', listener);
  },
  onProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => {
    const listener = (_event: any, progress: { percent: number; transferred: number; total: number }) => 
      callback(progress);
    ipcRenderer.on('update:progress', listener);
    return () => ipcRenderer.off('update:progress', listener);
  },
  onError: (callback: (error: { error: string }) => void) => {
    const listener = (_event: any, error: { error: string }) => 
      callback(error);
    ipcRenderer.on('update:error', listener);
    return () => ipcRenderer.off('update:error', listener);
  },
});

// --------- Expose Menu Events ---------
safeExpose('menu', {
  onAbout: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('menu:about', listener);
    return () => ipcRenderer.off('menu:about', listener);
  },
  onShortcuts: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on('menu:shortcuts', listener);
    return () => ipcRenderer.off('menu:shortcuts', listener);
  },
});

// --------- Expose LLM API ---------
safeExpose('llm', {
  openExternalUrl: (url: string) => ipcRenderer.invoke('llm:openExternalUrl', url),
  pullModel: (modelId: string, pullCommand: string) => ipcRenderer.invoke('llm:pullModel', modelId, pullCommand),
  pullModelStream: (modelId: string, pullCommand: string) => ipcRenderer.invoke('llm:pullModelStream', modelId, pullCommand),
  onPullProgress: (callback: (data: { executionId: string; modelId: string; type: 'stdout' | 'stderr'; data: string }) => void) => {
    const listener = (_event: any, data: { executionId: string; modelId: string; type: 'stdout' | 'stderr'; data: string }) => callback(data);
    ipcRenderer.on('llm:pull-progress', listener);
    return () => ipcRenderer.off('llm:pull-progress', listener);
  },
  onPullComplete: (callback: (data: { executionId: string; modelId: string; exitCode: number; success: boolean }) => void) => {
    const listener = (_event: any, data: { executionId: string; modelId: string; exitCode: number; success: boolean }) => callback(data);
    ipcRenderer.on('llm:pull-complete', listener);
    return () => ipcRenderer.off('llm:pull-complete', listener);
  },
  onPullError: (callback: (data: { executionId: string; modelId: string; error: string }) => void) => {
    const listener = (_event: any, data: { executionId: string; modelId: string; error: string }) => callback(data);
    ipcRenderer.on('llm:pull-error', listener);
    return () => ipcRenderer.off('llm:pull-error', listener);
  },
});

// --------- Expose Windows API ---------
safeExpose('windows', {
  listServices: () => ipcRenderer.invoke('windows:listServices'),
  getServiceStatus: (serviceName: string) => ipcRenderer.invoke('windows:getServiceStatus', serviceName),
  disableService: (serviceName: string) => ipcRenderer.invoke('windows:disableService', serviceName),
  enableService: (serviceName: string) => ipcRenderer.invoke('windows:enableService', serviceName),
  readRegistry: (path: string, value: string) => ipcRenderer.invoke('windows:readRegistry', path, value),
  writeRegistry: (path: string, value: string, data: string, type?: 'DWORD' | 'STRING' | 'BINARY') => 
    ipcRenderer.invoke('windows:writeRegistry', path, value, data, type),
  checkAdmin: () => ipcRenderer.invoke('windows:checkAdmin'),
  runCommand: (command: string, admin?: boolean) => ipcRenderer.invoke('windows:runCommand', command, admin),
});

// --------- Expose Benchmark API ---------
safeExpose('benchmark', {
  disk: () => ipcRenderer.invoke('benchmark:disk'),
});

// --------- Expose Window Controls API ---------
safeExpose('windowControls', {
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
});

