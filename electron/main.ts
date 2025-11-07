import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged
  ? process.env.DIST
  : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, 'preload.js');
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

app.whenReady().then(createWindow);

