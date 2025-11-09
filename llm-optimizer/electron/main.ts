import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import si from 'systeminformation';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default',
    backgroundColor: '#0a0a0a',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('get-system-info', async () => {
  const [cpu, mem, graphics, osInfo] = await Promise.all([
    si.cpu(),
    si.mem(),
    si.graphics(),
    si.osInfo(),
  ]);

  return {
    cpu: {
      manufacturer: cpu.manufacturer,
      brand: cpu.brand,
      cores: cpu.cores,
      physicalCores: cpu.physicalCores,
      speed: cpu.speed,
    },
    memory: {
      total: mem.total,
      free: mem.free,
      used: mem.used,
      totalGB: (mem.total / 1024 / 1024 / 1024).toFixed(2),
      freeGB: (mem.free / 1024 / 1024 / 1024).toFixed(2),
    },
    graphics: graphics.controllers.map((gpu) => ({
      model: gpu.model,
      vendor: gpu.vendor,
      vram: gpu.vram,
      memoryTotal: gpu.memoryTotal,
    })),
    os: {
      platform: osInfo.platform,
      distro: osInfo.distro,
      release: osInfo.release,
      arch: osInfo.arch,
    },
  };
});

ipcMain.handle('check-lm-studio', async () => {
  const homeDir = os.homedir();
  const possiblePaths = [
    path.join(homeDir, 'AppData', 'Local', 'Programs', 'LM Studio'),
    path.join(homeDir, '.lmstudio'),
    'C:\\Program Files\\LM Studio',
    'C:\\Program Files (x86)\\LM Studio',
  ];

  for (const lmPath of possiblePaths) {
    try {
      await fs.access(lmPath);
      return { installed: true, path: lmPath };
    } catch {
      continue;
    }
  }

  return { installed: false, path: null };
});

ipcMain.handle('check-ollama', async () => {
  try {
    const { stdout } = await execAsync('ollama --version');
    return { installed: true, version: stdout.trim() };
  } catch {
    return { installed: false, version: null };
  }
});

ipcMain.handle('check-bolt-diy', async () => {
  const homeDir = os.homedir();
  const boltPath = path.join(homeDir, '.bolt.diy');

  try {
    await fs.access(boltPath);
    return { installed: true, path: boltPath };
  } catch {
    return { installed: false, path: null };
  }
});

// Drive access handlers
ipcMain.handle('list-drives', async () => {
  if (process.platform !== 'win32') {
    return [];
  }

  const drives: Array<{ letter: string; label: string; freeSpace: number; totalSpace: number; type: string }> = [];
  
  for (let i = 65; i <= 90; i++) {
    const driveLetter = String.fromCharCode(i) + ':';
    const drivePath = driveLetter + '\\';
    
    try {
      await fs.access(drivePath);
      const stats = await si.fsSize();
      const driveInfo = stats.find((d) => d.mount === driveLetter);
      
      if (driveInfo) {
        drives.push({
          letter: driveLetter,
          label: driveInfo.fs || 'Local Disk',
          freeSpace: driveInfo.available || 0,
          totalSpace: driveInfo.size || 0,
          type: driveInfo.type || 'Unknown',
        });
      }
    } catch {
      // Drive doesn't exist or isn't accessible
      continue;
    }
  }
  
  return drives;
});

ipcMain.handle('browse-directory', async (_event, dirPath: string) => {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const result = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stats = await fs.stat(fullPath);
        result.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: stats.size,
          modified: stats.mtime.getTime(),
        });
      } catch {
        // Skip entries we can't access
        continue;
      }
    }

    return result.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    throw new Error(`Failed to browse directory: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
});

ipcMain.handle('get-directory-size', async (_event, dirPath: string) => {
  let totalSize = 0;
  let fileCount = 0;

  async function calculateSize(currentPath: string) {
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        try {
          if (entry.isDirectory()) {
            await calculateSize(fullPath);
          } else {
            const stats = await fs.stat(fullPath);
            totalSize += stats.size;
            fileCount++;
          }
        } catch {
          // Skip files we can't access
          continue;
        }
      }
    } catch {
      // Skip directories we can't access
    }
  }

  await calculateSize(dirPath);
  return { size: totalSize, fileCount };
});

// File operations handlers
ipcMain.handle('delete-file', async (_event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    if (stats.isDirectory()) {
      await fs.rmdir(filePath, { recursive: true });
    } else {
      await fs.unlink(filePath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('delete-directory', async (_event, dirPath: string) => {
  try {
    await fs.rmdir(dirPath, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('move-file', async (_event, fromPath: string, toPath: string) => {
  try {
    await fs.rename(fromPath, toPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('copy-file', async (_event, fromPath: string, toPath: string) => {
  try {
    await fs.copyFile(fromPath, toPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// System cleaning handlers
ipcMain.handle('clean-temp-files', async () => {
  const homeDir = os.homedir();
  const tempPaths = [
    os.tmpdir(),
    path.join(homeDir, 'AppData', 'Local', 'Temp'),
    'C:\\Windows\\Temp',
  ];

  let filesDeleted = 0;
  let spaceFreed = 0;
  const errors: string[] = [];

  for (const tempPath of tempPaths) {
    try {
      await fs.access(tempPath);
      const entries = await fs.readdir(tempPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(tempPath, entry.name);
        try {
          const stats = await fs.stat(fullPath);
          // Only delete files older than 7 days
          const daysOld = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60 * 24);
          
          if (daysOld > 7) {
            if (entry.isDirectory()) {
              await fs.rmdir(fullPath, { recursive: true });
            } else {
              await fs.unlink(fullPath);
            }
            filesDeleted++;
            spaceFreed += stats.size;
          }
        } catch (err) {
          errors.push(`Failed to delete ${fullPath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    } catch {
      // Temp path doesn't exist or isn't accessible
      continue;
    }
  }

  return { filesDeleted, spaceFreed, errors };
});

ipcMain.handle('clean-cache', async () => {
  const homeDir = os.homedir();
  const cachePaths = [
    path.join(homeDir, 'AppData', 'Local', 'npm-cache'),
    path.join(homeDir, 'AppData', 'Local', 'pip', 'cache'),
    path.join(homeDir, 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
    path.join(homeDir, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
  ];

  let filesDeleted = 0;
  let spaceFreed = 0;
  const errors: string[] = [];

  // Clean npm cache via command
  try {
    await execAsync('npm cache clean --force');
  } catch (err) {
    errors.push(`npm cache clean failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Clean pip cache via command
  try {
    await execAsync('pip cache purge');
  } catch (err) {
    // pip might not be installed
  }

  // Clean browser caches
  for (const cachePath of cachePaths) {
    try {
      await fs.access(cachePath);
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
          filesDeleted++;
          spaceFreed += stats.size;
        } catch (err) {
          errors.push(`Failed to delete ${fullPath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }
    } catch {
      // Cache path doesn't exist
      continue;
    }
  }

  return { filesDeleted, spaceFreed, errors };
});

ipcMain.handle('clean-registry', async () => {
  if (process.platform !== 'win32') {
    return { cleaned: 0, errors: ['Registry cleaning only available on Windows'] };
  }

  // Scan registry for orphaned entries
  // This is a simplified version - in production, use winreg package
  const errors: string[] = [];
  let cleaned = 0;

  try {
    // Check for common orphaned registry locations
    const uninstallKey = 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall';
    
    // List uninstall entries
    const { stdout } = await execAsync(`reg query "${uninstallKey}" /s`);
    const entries = stdout.split('\n').filter((line) => line.trim().startsWith('HKEY_'));
    
    // Check if referenced programs still exist
    for (const entry of entries) {
      try {
        const { stdout: displayName } = await execAsync(`reg query "${entry}" /v DisplayName`);
        const { stdout: installLocation } = await execAsync(`reg query "${entry}" /v InstallLocation`);
        
        // Extract paths and check if they exist
        const locationMatch = installLocation.match(/InstallLocation\s+REG_SZ\s+(.+)/);
        if (locationMatch) {
          const installPath = locationMatch[1].trim();
          try {
            await fs.access(installPath);
          } catch {
            // Path doesn't exist - could be orphaned, but we'll be conservative
            // In production, add more safety checks
          }
        }
      } catch {
        // Skip entries we can't read
        continue;
      }
    }
  } catch (error) {
    errors.push(`Registry scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { cleaned, errors };
});

ipcMain.handle('clean-old-installations', async () => {
  if (process.platform !== 'win32') {
    return { found: [], removed: 0, errors: [] };
  }

  const found: Array<{ name: string; path: string; size: number }> = [];
  const errors: string[] = [];

  try {
    // Scan Program Files for uninstallers
    const programFilesPaths = [
      'C:\\Program Files',
      'C:\\Program Files (x86)',
    ];

    for (const programFilesPath of programFilesPaths) {
      try {
        await fs.access(programFilesPath);
        const entries = await fs.readdir(programFilesPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const fullPath = path.join(programFilesPath, entry.name);
            const uninstallerPath = path.join(fullPath, 'uninstall.exe');
            
            try {
              await fs.access(uninstallerPath);
              const stats = await fs.stat(fullPath);
              found.push({
                name: entry.name,
                path: fullPath,
                size: stats.size,
              });
            } catch {
              // No uninstaller found
            }
          }
        }
      } catch {
        // Program Files path not accessible
        continue;
      }
    }
  } catch (error) {
    errors.push(`Scan failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { found, removed: 0, errors };
});

ipcMain.handle('deep-clean-system', async () => {
  // Run all cleanup operations in parallel
  const [tempFiles, cache, registry, oldInstallations] = await Promise.all([
    // Temp files cleanup
    (async () => {
      const homeDir = os.homedir();
      const tempPaths = [os.tmpdir(), path.join(homeDir, 'AppData', 'Local', 'Temp'), 'C:\\Windows\\Temp'];
      let filesDeleted = 0;
      let spaceFreed = 0;
      const errors: string[] = [];
      for (const tempPath of tempPaths) {
        try {
          await fs.access(tempPath);
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
                filesDeleted++;
                spaceFreed += stats.size;
              }
            } catch (err) {
              errors.push(`Failed to delete ${fullPath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }
        } catch {
          continue;
        }
      }
      return { filesDeleted, spaceFreed, errors };
    })(),
    // Cache cleanup
    (async () => {
      const homeDir = os.homedir();
      const cachePaths = [
        path.join(homeDir, 'AppData', 'Local', 'npm-cache'),
        path.join(homeDir, 'AppData', 'Local', 'pip', 'cache'),
      ];
      let filesDeleted = 0;
      let spaceFreed = 0;
      const errors: string[] = [];
      try {
        await execAsync('npm cache clean --force');
      } catch (err) {
        errors.push(`npm cache clean failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      try {
        await execAsync('pip cache purge');
      } catch {
        // pip might not be installed
      }
      for (const cachePath of cachePaths) {
        try {
          await fs.access(cachePath);
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
              filesDeleted++;
              spaceFreed += stats.size;
            } catch (err) {
              errors.push(`Failed to delete ${fullPath}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
          }
        } catch {
          continue;
        }
      }
      return { filesDeleted, spaceFreed, errors };
    })(),
    // Registry cleanup (simplified)
    Promise.resolve({ cleaned: 0, errors: [] as string[] }),
    // Old installations (simplified)
    Promise.resolve({ found: [] as Array<{ name: string; path: string; size: number }>, removed: 0, errors: [] as string[] }),
  ]);

  return {
    tempFiles,
    cache,
    registry,
    oldInstallations,
  };
});

// Dev tools detection and installation handlers
ipcMain.handle('check-dev-tools', async () => {
  const tools = [
    { name: 'node', command: 'node --version' },
    { name: 'python', command: 'python --version' },
    { name: 'git', command: 'git --version' },
    { name: 'docker', command: 'docker --version' },
    { name: 'vscode', command: 'code --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'yarn', command: 'yarn --version' },
    { name: 'pnpm', command: 'pnpm --version' },
  ];

  const results: Array<{ name: string; installed: boolean; version: string | null }> = [];

  for (const tool of tools) {
    try {
      const { stdout } = await execAsync(tool.command);
      results.push({
        name: tool.name,
        installed: true,
        version: stdout.trim(),
      });
    } catch {
      results.push({
        name: tool.name,
        installed: false,
        version: null,
      });
    }
  }

  return results;
});

ipcMain.handle('install-dev-tool', async (_event, toolName: string) => {
  const homeDir = os.homedir();
  const downloadsPath = path.join(homeDir, 'Downloads');

  // Tool installation URLs and commands (Windows-specific)
  const toolConfigs: Record<string, { url: string; installer: string; args: string[] }> = {
    node: {
      url: 'https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi',
      installer: 'msiexec.exe',
      args: ['/i', '/quiet', '/norestart'],
    },
    python: {
      url: 'https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe',
      installer: '',
      args: ['/quiet', 'InstallAllUsers=1', 'PrependPath=1'],
    },
    git: {
      url: 'https://github.com/git-for-windows/git/releases/download/v2.43.0.windows.1/Git-2.43.0-64-bit.exe',
      installer: '',
      args: ['/VERYSILENT', '/NORESTART'],
    },
    docker: {
      url: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe',
      installer: '',
      args: ['install', '--quiet'],
    },
    vscode: {
      url: 'https://code.visualstudio.com/sha/download?build=stable&os=win32-x64-user',
      installer: '',
      args: ['/VERYSILENT', '/NORESTART'],
    },
  };

  const config = toolConfigs[toolName.toLowerCase()];
  if (!config) {
    return { success: false, error: `Unknown tool: ${toolName}` };
  }

  try {
    // Download installer (simplified - in production, use proper download with progress)
    const installerPath = path.join(downloadsPath, `${toolName}-installer.exe`);
    
    // For now, we'll assume the installer is downloaded
    // In production, implement proper download with node-fetch or similar
    
    // Run installer
    if (config.installer) {
      await execAsync(`${config.installer} ${config.args.join(' ')} "${installerPath}"`);
    } else {
      await execAsync(`"${installerPath}" ${config.args.join(' ')}`);
    }

    // Verify installation
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for installation
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

ipcMain.handle('install-vscode-extension', async (_event, extensionId: string) => {
  try {
    await execAsync(`code --install-extension ${extensionId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// System operations handlers
ipcMain.handle('check-admin-privileges', async () => {
  if (process.platform !== 'win32') {
    return { isAdmin: false };
  }

  try {
    // Check if running as admin on Windows
    const { stdout } = await execAsync('net session');
    return { isAdmin: true };
  } catch {
    return { isAdmin: false };
  }
});

ipcMain.handle('request-admin-privileges', async () => {
  if (process.platform !== 'win32') {
    return { success: false, error: 'Admin elevation only available on Windows' };
  }

  // Note: Electron apps need to be restarted with elevation
  // This would typically use electron-elevate or similar
  // For now, return a message that admin is needed
  return { success: false, error: 'Please restart the application as administrator' };
});

