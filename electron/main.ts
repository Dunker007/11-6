import { app, BrowserWindow, ipcMain, dialog, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null = null;
// In development, use the TypeScript file directly (tsx will handle it)
// In production, this will be compiled to preload.js
const preload = isDev 
  ? path.join(__dirname, 'preload.ts')
  : path.join(__dirname, 'preload.js');
const url = isDev ? 'http://localhost:5173' : undefined;

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
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

  // Load the app
  if (url) {
    win.loadURL(url);
    if (isDev) {
      win.webContents.openDevTools();
    }
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  // Test active push message to Renderer-process
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });
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
    properties: ['openDirectory'],
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

ipcMain.handle('monitor:setPrimary', async (_event, displayId: string) => {
  // Note: Setting primary display programmatically is platform-specific
  // This is a placeholder - actual implementation would require platform-specific code
  return { success: false, error: 'Not implemented' };
});

ipcMain.handle('monitor:setDisplayBounds', async (_event, displayId: string, bounds: { x: number; y: number; width: number; height: number }) => {
  // Note: Setting display bounds programmatically is platform-specific
  // This is a placeholder - actual implementation would require platform-specific code
  return { success: false, error: 'Not implemented' };
});

app.whenReady().then(createWindow);

