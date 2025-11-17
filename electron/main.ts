/**
 * main.ts - MINIMAL CLEAN VERSION
 * 
 * Proper Electron initialization order:
 * 1. Imports & setup
 * 2. Function definitions (createWindow, registerIPC, etc.)
 * 3. app.whenReady() - call functions in correct order
 * 4. App lifecycle handlers
 */

import { app, BrowserWindow, ipcMain, screen } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

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
    frame: false, // Custom title bar
    titleBarStyle: 'hidden',
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

  console.log('✅ IPC handlers registered');
}

/**
 * App initialization - proper order
 */
app.whenReady().then(() => {
  console.log('🚀 App ready, initializing...');
  
  createWindow();
  registerIPCHandlers();
  
  console.log('✅ DLX Studios Ultimate initialized');
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

console.log('📦 Electron main process loaded');
