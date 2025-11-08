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

const execAsync = promisify(exec);

// Store running processes
const runningProcesses = new Map<string, ChildProcess>();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Debug logging to file
const DEBUG_LOG_FILE = path.join(app.getPath('userData'), 'electron-debug.log');
function debugLog(...args: any[]) {
  const message = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  console.log(...args);
  try {
    writeFileSync(DEBUG_LOG_FILE, message, { flag: 'a' });
  } catch (err) {
    console.error('Failed to write debug log:', err);
  }
}

// Window state persistence
const WINDOW_STATE_FILE = path.join(app.getPath('userData'), 'window-state.json');

interface WindowState {
  width: number;
  height: number;
  x?: number;
  y?: number;
  isMaximized?: boolean;
}

function getWindowState(): WindowState | null {
  try {
    if (existsSync(WINDOW_STATE_FILE)) {
      const data = readFileSync(WINDOW_STATE_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load window state:', error);
  }
  return null;
}

function saveWindowState(state: WindowState) {
  try {
    writeFileSync(WINDOW_STATE_FILE, JSON.stringify(state, null, 2));
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
const url = isDev ? 'http://localhost:5173' : undefined;

function createWindow() {
  const savedState = getWindowState();
  const defaultWidth = 1400;
  const defaultHeight = 900;

  win = new BrowserWindow({
    width: savedState?.width || defaultWidth,
    height: savedState?.height || defaultHeight,
    x: savedState?.x,
    y: savedState?.y,
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

  // Load the app
  if (url) {
    debugLog('[Electron] Dev mode - loading from URL:', url);
    win.loadURL(url);
    win.webContents.openDevTools(); // Always open DevTools for debugging
  } else {
    // Open DevTools in production for debugging
    win.webContents.openDevTools();
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

// Auto-updater configuration
if (!isDev) {
  autoUpdater.checkForUpdatesAndNotify();
  
  // Check for updates every 4 hours
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify();
  }, 4 * 60 * 60 * 1000);

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
    win?.webContents.send('update:error', { error: error.message });
  });
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
    return { success: false, error: (error as Error).message };
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
    const { stdout, stderr } = await execAsync(command);
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    return { success: false, error: (error as Error).message };
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


