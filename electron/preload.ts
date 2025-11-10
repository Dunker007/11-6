import electron from 'electron';
const { contextBridge, ipcRenderer } = electron;

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
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
contextBridge.exposeInMainWorld('fileSystem', {
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
  mkdir: (path: string, recursive?: boolean) => ipcRenderer.invoke('fs:mkdir', path, recursive),
  rm: (path: string, recursive?: boolean) => ipcRenderer.invoke('fs:rm', path, recursive),
  readdir: (path: string) => ipcRenderer.invoke('fs:readdir', path),
  stat: (path: string) => ipcRenderer.invoke('fs:stat', path),
  exists: (path: string) => ipcRenderer.invoke('fs:exists', path),
  listDrives: () => ipcRenderer.invoke('fs:listDrives'),
  getDirectorySize: (path: string) => ipcRenderer.invoke('fs:getDirectorySize', path),
});

// --------- Expose System API ---------
contextBridge.exposeInMainWorld('system', {
  cleanTempFiles: () => ipcRenderer.invoke('system:cleanTempFiles'),
  cleanCache: () => ipcRenderer.invoke('system:cleanCache'),
  deepClean: () => ipcRenderer.invoke('system:deepClean'),
});

// --------- Expose Dialog API ---------
contextBridge.exposeInMainWorld('dialogs', {
  openFile: (options?: { filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('dialog:openFile', options),
  saveFile: (options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) =>
    ipcRenderer.invoke('dialog:saveFile', options),
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
});

// --------- Expose Dev Tools API ---------
contextBridge.exposeInMainWorld('devTools', {
  check: (command: string) => ipcRenderer.invoke('tools:check', command),
  getVersion: (command: string) => ipcRenderer.invoke('tools:getVersion', command),
  install: (command: string) => ipcRenderer.invoke('tools:install', command),
});

// --------- Expose Monitor API ---------
contextBridge.exposeInMainWorld('monitor', {
  getDisplays: () => ipcRenderer.invoke('monitor:getDisplays'),
  setPrimary: (displayId: string) => ipcRenderer.invoke('monitor:setPrimary', displayId),
  setDisplayBounds: (displayId: string, bounds: { x: number; y: number; width: number; height: number }) =>
    ipcRenderer.invoke('monitor:setDisplayBounds', displayId, bounds),
});

// --------- Expose Program Execution API ---------
contextBridge.exposeInMainWorld('program', {
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
contextBridge.exposeInMainWorld('updater', {
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
contextBridge.exposeInMainWorld('menu', {
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

// --------- Expose Window Controls API ---------
contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
});

