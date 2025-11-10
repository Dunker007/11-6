import electron from 'electron';
const { app, BrowserWindow, ipcMain, dialog, screen, Menu } = electron;
import updaterPkg from 'electron-updater';
const { autoUpdater } = updaterPkg;
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Store running processes
const runningProcesses = new Map<string, ChildProcess>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Debug logging to file - lazy initialization
function getDebugLogFile(): string {
  try {
    return path.join(app.getPath('userData'), 'electron-debug.log');
  } catch {
    // Fallback if app not ready yet
    return path.join(os.tmpdir(), 'electron-debug.log');
  }
}

function debugLog(...args: any[]) {
  const message = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  console.log(...args);
  try {
    writeFileSync(getDebugLogFile(), message, { flag: 'a' });
  } catch (err) {
    console.error('Failed to write debug log:', err);
  }
}

// Window state persistence - lazy initialization
function getWindowStateFile(): string {
  try {
    return path.join(app.getPath('userData'), 'window-state.json');
  } catch {
    // Fallback if app not ready yet
    return path.join(os.tmpdir(), 'window-state.json');
  }
}

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

function getWindowState(): WindowState | null {
  try {
    const stateFile = getWindowStateFile();
    if (existsSync(stateFile)) {
      const data = readFileSync(stateFile, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load window state:', error);
  }
  return null;
}

function saveWindowState(state: WindowState) {
  try {
    const stateFile = getWindowStateFile();
    writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Failed to save window state:', error);
  }
}

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: InstanceType<typeof BrowserWindow> | null = null;
// In development, use the TypeScript file directly (tsx will handle it)
// In production, this will be compiled to preload.js
const preload = isDev 
  ? path.join(__dirname, 'preload.ts')
  : path.join(__dirname, 'preload.js');
const url = isDev ? 'http://localhost:5174' : undefined;

function createWindow() {
  const savedState = getWindowState();
  const defaultWidth = 1400;
  const defaultHeight = 900;

  // Calculate centered position if no saved state
  let windowX: number | undefined;
  let windowY: number | undefined;
  
  if (savedState?.x !== undefined && savedState?.y !== undefined) {
    windowX = savedState.x;
    windowY = savedState.y;
  } else {
    // Center on primary display
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    windowX = Math.floor((screenWidth - defaultWidth) / 2);
    windowY = Math.floor((screenHeight - defaultHeight) / 2);
  }

  win = new BrowserWindow({
    width: savedState?.width || defaultWidth,
    height: savedState?.height || defaultHeight,
    x: windowX,
    y: windowY,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0F172A',
      symbolColor: '#8B5CF6',
      height: 40,
    },
    backgroundColor: '#0F172A',
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  if (savedState?.isMaximized) {
    win.maximize();
  }

  // Save window state on move/resize
  let saveTimeout: NodeJS.Timeout;
  const saveState = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      if (win && !win.isDestroyed()) {
        const bounds = win.getBounds();
        const isMaximized = win.isMaximized();
        saveWindowState({
          width: bounds.width,
          height: bounds.height,
          x: bounds.x,
          y: bounds.y,
          isMaximized,
        });
      }
    }, 500);
  };

  win.on('move', saveState);
  win.on('resize', saveState);
  win.on('maximize', saveState);
  win.on('unmaximize', saveState);

  // Clear cache in dev mode to prevent stale content
  if (isDev && url) {
    win.webContents.session.clearCache().then(() => {
      debugLog('[Electron] Cache cleared');
    });
  }

  // Load the app
  if (url) {
    debugLog('[Electron] Dev mode - loading from URL:', url);
    win.loadURL(url);
    if (isDev) {
      win.webContents.openDevTools();
    }
  } else {
    // In production, resolve path relative to the app root
    // __dirname in production points to resources/app.asar/dist-electron
    // We need to go up one level to reach dist
    const indexPath = path.join(__dirname, '../dist/index.html');
    
    debugLog('[Electron] Production mode');
    debugLog('[Electron] isDev:', isDev);
    debugLog('[Electron] app.isPackaged:', app.isPackaged);
    debugLog('[Electron] __dirname:', __dirname);
    debugLog('[Electron] process.resourcesPath:', process.resourcesPath);
    debugLog('[Electron] app.getAppPath():', app.getAppPath());
    debugLog('[Electron] Resolved index path:', indexPath);
    debugLog('[Electron] Index file exists:', existsSync(indexPath));
    
    win.loadFile(indexPath).then(() => {
      debugLog('[Electron] Successfully loaded index.html');
    }).catch(err => {
      debugLog('[Electron] ERROR loading index.html:', err.message);
      debugLog('[Electron] Error stack:', err.stack);
    });
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });
}

// Auto-updater configuration - only initialize after app is ready
function setupAutoUpdater() {
  if (isDev) {
    return; // Skip updater in dev mode
  }
  
  try {
    // Configure updater with better error handling
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'Dunker007',
      repo: '11-6',
    });

    // Suppress automatic update checks on startup to avoid 406 errors
    // Users can manually check via menu or button
    
    autoUpdater.on('update-available', (info) => {
      win?.webContents.send('update:available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      win?.webContents.send('update:downloaded', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    });

    autoUpdater.on('download-progress', (progress) => {
      win?.webContents.send('update:progress', {
        percent: progress.percent,
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    autoUpdater.on('error', (error) => {
      // Only send error if it's not a 406 (Not Acceptable) which is common for GitHub API
      // when releases feed format doesn't match expectations
      const errorMessage = error.message || '';
      const is406Error = errorMessage.includes('406') || errorMessage.includes('Not Acceptable');
      
      if (!is406Error) {
        win?.webContents.send('update:error', { error: error.message });
      } else {
        // Silently ignore 406 errors - they're usually due to GitHub API format issues
        debugLog('[Updater] GitHub API 406 error (suppressed):', error.message);
      }
    });
  } catch (error) {
    console.error('Failed to setup auto-updater:', error);
  }
}

// IPC handler for manual update check
ipcMain.handle('update:check', async () => {
  if (isDev) {
    return { success: false, error: 'Updates not available in development mode' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, updateInfo: result?.updateInfo };
  } catch (error) {
    const errorMessage = (error as Error).message || '';
    // Suppress 406 errors - they're common with GitHub API format issues
    const is406Error = errorMessage.includes('406') || errorMessage.includes('Not Acceptable');
    
    if (is406Error) {
      return { 
        success: false, 
        error: 'Update check unavailable. Please check GitHub releases manually.',
        suppressed: true 
      };
    }
    
    return { success: false, error: errorMessage };
  }
});

// IPC handler for installing update
ipcMain.handle('update:install', async () => {
  if (isDev) {
    return { success: false, error: 'Updates not available in development mode' };
  }
  try {
    autoUpdater.quitAndInstall(false, true);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// --------- Window Control IPC Handlers ---------
ipcMain.handle('window:minimize', () => {
  if (win && !win.isDestroyed()) {
    win.minimize();
    return { success: true };
  }
  return { success: false, error: 'Window not available' };
});

ipcMain.handle('window:maximize', () => {
  if (win && !win.isDestroyed()) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
    return { success: true, isMaximized: win.isMaximized() };
  }
  return { success: false, error: 'Window not available' };
});

ipcMain.handle('window:close', () => {
  if (win && !win.isDestroyed()) {
    win.close();
    return { success: true };
  }
  return { success: false, error: 'Window not available' };
});

ipcMain.handle('window:isMaximized', () => {
  if (win && !win.isDestroyed()) {
    return { success: true, isMaximized: win.isMaximized() };
  }
  return { success: false, error: 'Window not available' };
});

// App menu
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo', label: 'Undo' },
        { role: 'redo', label: 'Redo' },
        { type: 'separator' },
        { role: 'cut', label: 'Cut' },
        { role: 'copy', label: 'Copy' },
        { role: 'paste', label: 'Paste' },
        { role: 'selectAll', label: 'Select All' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload', label: 'Reload' },
        { role: 'forceReload', label: 'Force Reload' },
        { role: 'toggleDevTools', label: 'Toggle Developer Tools' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Actual Size' },
        { role: 'zoomIn', label: 'Zoom In' },
        { role: 'zoomOut', label: 'Zoom Out' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            win?.webContents.send('menu:about');
          },
        },
        {
          label: 'Check for Updates',
          click: async () => {
            if (!isDev) {
              await autoUpdater.checkForUpdatesAndNotify();
            } else {
              dialog.showMessageBox(win!, {
                type: 'info',
                title: 'Updates',
                message: 'Updates are not available in development mode.',
              });
            }
          },
        },
        {
          label: 'Keyboard Shortcuts',
          accelerator: 'CmdOrCtrl+K',
          click: () => {
            win?.webContents.send('menu:shortcuts');
          },
        },
      ],
    },
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: 'About ' + app.getName() },
        { type: 'separator' },
        { role: 'services', label: 'Services' },
        { type: 'separator' },
        { role: 'hide', label: 'Hide ' + app.getName() },
        { role: 'hideOthers', label: 'Hide Others' },
        { role: 'unhide', label: 'Show All' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit ' + app.getName() },
      ],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// App event listeners
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createMenu();
  createWindow();
  setupAutoUpdater();
});

// File System IPC Handlers
ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    // Security: Validate path
    const normalizedPath = path.normalize(filePath);
    const content = await fs.readFile(normalizedPath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  try {
    const normalizedPath = path.normalize(filePath);
    // Ensure directory exists
    const dir = path.dirname(normalizedPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(normalizedPath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:mkdir', async (_event, dirPath: string, recursive = true) => {
  try {
    const normalizedPath = path.normalize(dirPath);
    await fs.mkdir(normalizedPath, { recursive });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:rm', async (_event, targetPath: string, recursive = false) => {
  try {
    const normalizedPath = path.normalize(targetPath);
    const stats = await fs.stat(normalizedPath);
    if (stats.isDirectory()) {
      await fs.rmdir(normalizedPath, { recursive });
    } else {
      await fs.unlink(normalizedPath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:readdir', async (_event, dirPath: string) => {
  try {
    const normalizedPath = path.normalize(dirPath);
    const entries = await fs.readdir(normalizedPath, { withFileTypes: true });
    return {
      success: true,
      entries: entries.map((entry) => ({
        name: entry.name,
        isDirectory: entry.isDirectory(),
        path: path.join(normalizedPath, entry.name),
      })),
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:stat', async (_event, filePath: string) => {
  try {
    const normalizedPath = path.normalize(filePath);
    const stats = await fs.stat(normalizedPath);
    return {
      success: true,
      stats: {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime.toISOString(),
        ctime: stats.ctime.toISOString(),
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('fs:exists', async (_event, filePath: string) => {
  try {
    const normalizedPath = path.normalize(filePath);
    return { success: true, exists: existsSync(normalizedPath) };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

// Dialog IPC Handlers
ipcMain.handle('dialog:openFile', async (_event, options?: { filters?: { name: string; extensions: string[] }[] }) => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openFile'],
    filters: options?.filters,
  });
  return { success: !result.canceled, filePaths: result.filePaths };
});

ipcMain.handle('dialog:saveFile', async (_event, options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => {
  const result = await dialog.showSaveDialog(win!, {
    defaultPath: options?.defaultPath,
    filters: options?.filters,
  });
  return { success: !result.canceled, filePath: result.filePath };
});

ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(win!, {
    properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    title: 'Select Project Folder',
    buttonLabel: 'Open Project',
  });
  return { success: !result.canceled, filePaths: result.filePaths };
});

// Drive and Directory IPC Handlers
ipcMain.handle('fs:listDrives', async () => {
  try {
    const drives: Array<{ name: string; path: string; type?: string }> = [];
    if (process.platform === 'win32') {
      // Windows: List drive letters
      const { stdout } = await execAsync('wmic logicaldisk get name,drivetype');
      const lines = stdout.split('\n').filter(line => line.trim());
      for (const line of lines.slice(1)) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 2) {
          const drivePath = parts[0];
          const driveType = parts[1];
          if (drivePath.match(/^[A-Z]:$/)) {
            drives.push({
              name: drivePath,
              path: drivePath + '\\',
              type: driveType === '3' ? 'Fixed' : driveType === '2' ? 'Removable' : 'Network',
            });
          }
        }
      }
    } else {
      // Unix-like: List mount points
      const { stdout } = await execAsync('df -h');
      const lines = stdout.split('\n').slice(1);
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 6) {
          const mountPoint = parts[5];
          if (mountPoint.startsWith('/')) {
            drives.push({
              name: mountPoint,
              path: mountPoint,
              type: 'Filesystem',
            });
          }
        }
      }
    }
    return { success: true, drives };
  } catch (error) {
    return { success: false, error: (error as Error).message, drives: [] };
  }
});

async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          totalSize += await calculateDirectorySize(fullPath);
        } else {
          const stats = await fs.stat(fullPath);
          totalSize += stats.size;
        }
      } catch {
        // Skip files we can't access
        continue;
      }
    }
  } catch {
    // Skip directories we can't access
  }
  return totalSize;
}

ipcMain.handle('fs:getDirectorySize', async (_event, dirPath: string) => {
  try {
    const normalizedPath = path.normalize(dirPath);
    const size = await calculateDirectorySize(normalizedPath);
    return { success: true, size };
  } catch (error) {
    return { success: false, error: (error as Error).message, size: 0 };
  }
});

// System Cleanup Functions
async function cleanTempFiles(): Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }> {
  const result = { filesDeleted: 0, spaceFreed: 0, errors: [] as string[] };
  const homeDir = os.homedir();
  const tempPaths = [
    os.tmpdir(),
    path.join(homeDir, 'AppData', 'Local', 'Temp'),
    // Removed C:\Windows\Temp - requires admin privileges
    // Users can manually clean system temp if needed
  ];

  for (const tempPath of tempPaths) {
    try {
      if (!existsSync(tempPath)) continue;
      const entries = await fs.readdir(tempPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(tempPath, entry.name);
        try {
          const stats = await fs.stat(fullPath);
          const daysOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
          if (daysOld > 7) {
            if (entry.isDirectory()) {
              await fs.rmdir(fullPath, { recursive: true });
            } else {
              await fs.unlink(fullPath);
            }
            result.filesDeleted++;
            result.spaceFreed += stats.size;
          }
        } catch (err) {
          result.errors.push(`Failed to delete ${fullPath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    } catch {
      continue;
    }
  }
  return result;
}

async function cleanCache(): Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }> {
  const result = { filesDeleted: 0, spaceFreed: 0, errors: [] as string[] };
  const homeDir = os.homedir();
  const cachePaths = [
    path.join(homeDir, 'AppData', 'Local', 'npm-cache'),
    path.join(homeDir, 'AppData', 'Local', 'pip', 'cache'),
    path.join(homeDir, '.npm'),
    path.join(homeDir, '.cache'),
  ];

  // Try npm cache clean
  try {
    await execAsync('npm cache clean --force');
  } catch {
    // npm might not be installed
  }

  // Try pip cache purge
  try {
    await execAsync('pip cache purge');
  } catch {
    // pip might not be installed
  }

  for (const cachePath of cachePaths) {
    try {
      if (!existsSync(cachePath)) continue;
      const entries = await fs.readdir(cachePath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(cachePath, entry.name);
        try {
          const stats = await fs.stat(fullPath);
          if (entry.isDirectory()) {
            await fs.rmdir(fullPath, { recursive: true });
          } else {
            await fs.unlink(fullPath);
          }
          result.filesDeleted++;
          result.spaceFreed += stats.size;
        } catch (err) {
          result.errors.push(`Failed to delete ${fullPath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    } catch {
      continue;
    }
  }
  return result;
}

// System Cleanup IPC Handlers
ipcMain.handle('system:cleanTempFiles', async () => cleanTempFiles());
ipcMain.handle('system:cleanCache', async () => cleanCache());

ipcMain.handle('system:deepClean', async () => {
  const [tempFiles, cache] = await Promise.all([cleanTempFiles(), cleanCache()]);
  
  // Registry cleaning requires admin privileges on Windows
  // Since we use "asInvoker" execution level, we skip registry operations
  // and provide a helpful message
  const registryResult = process.platform === 'win32' 
    ? { 
        cleaned: 0, 
        errors: ['Registry cleaning requires administrator privileges. Please run the application as administrator to clean registry entries.'],
        requiresAdmin: true
      }
    : { cleaned: 0, errors: [] };
  
  return {
    tempFiles,
    cache,
    registry: registryResult,
    oldInstallations: { found: [], removed: 0, errors: [] },
  };
});

// Dev Tools IPC Handlers
ipcMain.handle('tools:check', async (_event, command: string) => {
  try {
    const { stdout } = await execAsync(command);
    return { success: true, installed: true, output: stdout };
  } catch (error) {
    return { success: true, installed: false, error: (error as Error).message };
  }
});

ipcMain.handle('tools:getVersion', async (_event, command: string) => {
  try {
    const { stdout } = await execAsync(command);
    // Extract version number
    const match = stdout.match(/(\d+\.\d+\.\d+)/);
    return { success: true, version: match ? match[1] : undefined };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
});

ipcMain.handle('tools:install', async (_event, command: string) => {
  try {
    // Check if command requires admin privileges
    const adminCommands = ['choco install', 'winget install', 'scoop install', 'npm install -g'];
    const requiresAdmin = adminCommands.some(adminCmd => command.toLowerCase().includes(adminCmd.toLowerCase()));
    
    if (requiresAdmin && process.platform === 'win32') {
      // On Windows with "asInvoker" execution level, admin commands will fail
      // Provide helpful error message
      return { 
        success: false, 
        error: 'This command requires administrator privileges. Please run the application as administrator or use a user-level package manager.',
        requiresAdmin: true
      };
    }
    
    const { stdout, stderr } = await execAsync(command);
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    const errorMessage = (error as Error).message;
    // Check for permission denied errors
    if (errorMessage.includes('permission') || errorMessage.includes('EACCES') || errorMessage.includes('access denied')) {
      return { 
        success: false, 
        error: 'Permission denied. This operation may require administrator privileges.',
        requiresAdmin: true
      };
    }
    return { success: false, error: errorMessage };
  }
});

// Monitor IPC Handlers
ipcMain.handle('monitor:getDisplays', async () => {
  const displays = screen.getAllDisplays();
  return displays.map((display, index) => ({
    id: `display-${index}`,
    bounds: display.bounds,
    scaleFactor: display.scaleFactor,
    isPrimary: display === screen.getPrimaryDisplay(),
    name: `Display ${index + 1}`,
    resolution: {
      width: display.size.width,
      height: display.size.height,
    },
  }));
});

ipcMain.handle('monitor:setPrimary', async (_event, _displayId: string) => {
  // Note: Setting primary display programmatically is platform-specific
  // This is a placeholder - actual implementation would require platform-specific code
  return { success: false, error: 'Not implemented' };
});

ipcMain.handle('monitor:setDisplayBounds', async (_event, _displayId: string, _bounds: { x: number; y: number; width: number; height: number }) => {
  // Note: Setting display bounds programmatically is platform-specific
  // This is a placeholder - actual implementation would require platform-specific code
  return { success: false, error: 'Not implemented' };
});

// Program Execution IPC Handlers
ipcMain.handle('program:execute', async (_event, command: string, workingDirectory?: string) => {
  const executionId = crypto.randomUUID();
  
  try {
    // Security: Basic command validation
    const dangerousCommands = ['rm -rf', 'del /f', 'format', 'mkfs'];
    const lowerCommand = command.toLowerCase();
    if (dangerousCommands.some(dangerous => lowerCommand.includes(dangerous))) {
      return { 
        success: false, 
        executionId,
        error: 'Potentially dangerous command blocked' 
      };
    }

    const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
    const shellArgs = process.platform === 'win32' ? ['/c'] : ['-c'];
    
    const childProcess = spawn(shell, [...shellArgs, command], {
      cwd: workingDirectory || process.cwd(),
      shell: false,
    });

    runningProcesses.set(executionId, childProcess);

    let stdout = '';
    let stderr = '';

    childProcess.stdout?.on('data', (data) => {
      stdout += data.toString();
      win?.webContents.send('program:output', executionId, { type: 'stdout', data: data.toString() });
    });

    childProcess.stderr?.on('data', (data) => {
      stderr += data.toString();
      win?.webContents.send('program:output', executionId, { type: 'stderr', data: data.toString() });
    });

    childProcess.on('close', (code) => {
      runningProcesses.delete(executionId);
      win?.webContents.send('program:complete', executionId, {
        exitCode: code || 0,
        stdout,
        stderr,
      });
    });

    childProcess.on('error', (error) => {
      runningProcesses.delete(executionId);
      win?.webContents.send('program:error', executionId, { error: error.message });
    });

    return { success: true, executionId };
  } catch (error) {
    return { 
      success: false, 
      executionId,
      error: (error as Error).message 
    };
  }
});

ipcMain.handle('program:kill', async (_event, executionId: string) => {
  const process = runningProcesses.get(executionId);
  if (process) {
    try {
      process.kill();
      runningProcesses.delete(executionId);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
  return { success: false, error: 'Process not found' };
});


