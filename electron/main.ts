/**
 * main.ts - CLEAN VERSION WITH FILE SYSTEM
 * 
 * Phase 2: File System Integration
 * 
 * Proper Electron initialization order:
 * 1. Imports & setup
 * 2. Function definitions (createWindow, registerIPC, etc.)
 * 3. app.whenReady() - call functions in correct order
 * 4. App lifecycle handlers
 */

import { app, BrowserWindow, ipcMain, screen, dialog, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// Setup paths
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = isDev
  ? path.join(process.env.DIST, '../public')
  : process.env.DIST;

let win: BrowserWindow | null = null;

const preload = isDev 
  ? path.join(__dirname, '../dist-electron/preload.js')
  : path.join(__dirname, 'preload.js');

const url = isDev ? 'http://localhost:4173' : undefined;

/**
 * Create the main application window
 */
function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  win = new BrowserWindow({
    width: Math.min(1400, Math.floor(screenWidth * 0.9)),
    height: Math.min(900, Math.floor(screenHeight * 0.9)),
    webPreferences: {
      preload,
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: false, // Frameless window for custom title bar
    backgroundColor: '#0a0e1a',
    show: false, // Show after ready-to-show
  });

  // Load app
  if (isDev && url) {
    win.loadURL(url);
    win.webContents.openDevTools();
  } else if (process.env.DIST) {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  // Show when ready
  win.once('ready-to-show', () => {
    win?.show();
  });

  // Cleanup on close
  win.on('closed', () => {
    win = null;
  });
}

/**
 * Recursive large file finder
 */
async function findLargeFilesRecursive(
  dirPath: string,
  minSizeBytes: number,
  onProgress?: (currentPath: string, filesFound: number) => void
): Promise<Array<{ path: string; size: number; mtime: Date }>> {
  const largeFiles: Array<{ path: string; size: number; mtime: Date }> = [];
  
  async function scanDirectory(currentPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        // Skip common system/hidden directories
        if (entry.name.startsWith('.') && entry.name !== '.') {
          continue;
        }
        
        // Skip node_modules and other common large directories
        if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'build') {
          continue;
        }
        
        try {
          if (entry.isDirectory()) {
            await scanDirectory(fullPath);
          } else if (entry.isFile()) {
            const stats = await fs.stat(fullPath);
            if (stats.size >= minSizeBytes) {
              largeFiles.push({
                path: fullPath,
                size: stats.size,
                mtime: stats.mtime,
              });
              onProgress?.(fullPath, largeFiles.length);
            }
          }
        } catch (error) {
          // Skip files/directories we can't access
          continue;
        }
      }
    } catch (error) {
      // Skip directories we can't access
      return;
    }
  }
  
  await scanDirectory(dirPath);
  return largeFiles;
}

/**
 * Register IPC handlers - MUST be called after app.whenReady()
 */
function registerIPCHandlers() {
  // Window controls
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

  // File System handlers
  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    try {
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

  ipcMain.handle('fs:findLargeFiles', async (_event, dirPath: string, minSizeMB: number = 100) => {
    try {
      const normalizedPath = path.normalize(dirPath);
      const minSizeBytes = minSizeMB * 1024 * 1024;
      
      const largeFiles = await findLargeFilesRecursive(normalizedPath, minSizeBytes);
      
      return {
        success: true,
        files: largeFiles.map((file) => ({
          path: file.path,
          size: file.size,
          lastModified: file.mtime.toISOString(),
        })),
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Shell handlers
  ipcMain.handle('shell:showItemInFolder', async (_event, filePath: string) => {
    try {
      shell.showItemInFolder(path.normalize(filePath));
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Dialog handlers
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

  console.log('✅ IPC handlers registered (window + file system + dialogs)');
}

/**
 * App initialization - proper order
 */
app.whenReady().then(() => {
  console.log('🚀 App ready, initializing...');
  
  createWindow();
  registerIPCHandlers();
  
  console.log('✅ DLX Studios Ultimate initialized with file system support');
});

/**
 * App lifecycle
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

console.log('📦 Electron main process loaded with file system capabilities');
