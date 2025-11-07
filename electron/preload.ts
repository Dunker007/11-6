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
    ipcRenderer.on('program:output', (_event, executionId, data) => callback(executionId, data));
  },
  onComplete: (callback: (executionId: string, result: { exitCode: number; stdout: string; stderr: string }) => void) => {
    ipcRenderer.on('program:complete', (_event, executionId, result) => callback(executionId, result));
  },
  onError: (callback: (executionId: string, error: { error: string }) => void) => {
    ipcRenderer.on('program:error', (_event, executionId, error) => callback(executionId, error));
  },
});

// --------- Expose Update API ---------
contextBridge.exposeInMainWorld('updater', {
  check: () => ipcRenderer.invoke('update:check'),
  install: () => ipcRenderer.invoke('update:install'),
  onAvailable: (callback: (info: { version: string; releaseDate: string; releaseNotes?: string }) => void) => {
    ipcRenderer.on('update:available', (_event, info) => callback(info));
  },
  onDownloaded: (callback: (info: { version: string; releaseDate: string; releaseNotes?: string }) => void) => {
    ipcRenderer.on('update:downloaded', (_event, info) => callback(info));
  },
  onProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => {
    ipcRenderer.on('update:progress', (_event, progress) => callback(progress));
  },
  onError: (callback: (error: { error: string }) => void) => {
    ipcRenderer.on('update:error', (_event, error) => callback(error));
  },
});

// --------- Expose Menu Events ---------
contextBridge.exposeInMainWorld('menu', {
  onAbout: (callback: () => void) => {
    ipcRenderer.on('menu:about', () => callback());
  },
  onShortcuts: (callback: () => void) => {
    ipcRenderer.on('menu:shortcuts', () => callback());
  },
});

