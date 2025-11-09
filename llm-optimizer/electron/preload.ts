import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  checkLMStudio: () => ipcRenderer.invoke('check-lm-studio'),
  checkOllama: () => ipcRenderer.invoke('check-ollama'),
  checkBoltDIY: () => ipcRenderer.invoke('check-bolt-diy'),
  
  // Drive access
  listDrives: () => ipcRenderer.invoke('list-drives'),
  browseDirectory: (path: string) => ipcRenderer.invoke('browse-directory', path),
  getDirectorySize: (path: string) => ipcRenderer.invoke('get-directory-size', path),
  
  // File operations
  deleteFile: (path: string) => ipcRenderer.invoke('delete-file', path),
  deleteDirectory: (path: string) => ipcRenderer.invoke('delete-directory', path),
  moveFile: (from: string, to: string) => ipcRenderer.invoke('move-file', from, to),
  copyFile: (from: string, to: string) => ipcRenderer.invoke('copy-file', from, to),
  
  // System cleaning
  cleanTempFiles: () => ipcRenderer.invoke('clean-temp-files'),
  cleanCache: () => ipcRenderer.invoke('clean-cache'),
  cleanRegistry: () => ipcRenderer.invoke('clean-registry'),
  cleanOldInstallations: () => ipcRenderer.invoke('clean-old-installations'),
  deepCleanSystem: () => ipcRenderer.invoke('deep-clean-system'),
  
  // Dev tools
  checkDevTools: () => ipcRenderer.invoke('check-dev-tools'),
  installDevTool: (toolName: string) => ipcRenderer.invoke('install-dev-tool', toolName),
  installVSCodeExtension: (extensionId: string) => ipcRenderer.invoke('install-vscode-extension', extensionId),
  
  // System operations
  checkAdminPrivileges: () => ipcRenderer.invoke('check-admin-privileges'),
  requestAdminPrivileges: () => ipcRenderer.invoke('request-admin-privileges'),
});

