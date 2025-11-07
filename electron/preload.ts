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

