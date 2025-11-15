/**
 * Dev Tools Detection Service
 * 
 * Detects installed development tools and storage drivers on the system.
 */

import { logger } from '../logging/loggerService';
import type {
  DevTool,
  DevToolsStatus,
  StorageController,
  DriverInfo,
  StorageDriversStatus,
} from '@/types/optimizer';
import type { Systeminformation } from 'systeminformation';

async function detectDevTool(name: string, command: string, installUrl?: string): Promise<DevTool> {
  try {
    if (typeof window === 'undefined' || !('devTools' in window) || !window.devTools) {
      return {
        name,
        command,
        version: null,
        installed: false,
        installPath: null,
        installUrl,
      };
    }

    const devTools = window.devTools as {
      check: (command: string) => Promise<{ success: boolean; installed?: boolean; output?: string; error?: string }>;
      getVersion: (command: string) => Promise<{ success: boolean; version?: string; error?: string }>;
      install: (command: string) => Promise<{ success: boolean; output?: string; error?: string }>;
    };
    const checkResult = await devTools.check(command);
    if (!checkResult.installed) {
      return {
        name,
        command,
        version: null,
        installed: false,
        installPath: null,
        installUrl,
      };
    }

    const versionResult = await devTools.getVersion(command);
    return {
      name,
      command,
      version: versionResult.version || null,
      installed: true,
      installPath: null, // Could be enhanced to detect install path
      installUrl,
    };
  } catch {
    return {
      name,
      command,
      version: null,
      installed: false,
      installPath: null,
      installUrl,
    };
  }
}

export async function detectStorageDrivers(): Promise<StorageDriversStatus> {
  const controllers: StorageController[] = [];
  const drivers: DriverInfo[] = [];

  // Try Electron systeminformation for storage detection
  if (typeof process !== 'undefined' && process.versions?.electron) {
    try {
      const si = require('systeminformation');
      const diskLayout = await si.diskLayout().catch(() => []);
      const usb = await si.usb().catch(() => []);

      // Process disk layout for storage controllers
      if (diskLayout && diskLayout.length > 0) {
        for (const disk of diskLayout) {
          const controller: StorageController = {
            name: disk.name || 'Unknown Storage',
            type: disk.type || disk.interfaceType || 'Unknown',
            interfaceType: disk.interfaceType,
            model: disk.model,
            vendor: disk.vendor,
            driverInstalled: true, // If disk is detected, driver is likely installed
          };

          // Check for NVMe drivers specifically
          if (disk.type === 'NVMe' || disk.interfaceType === 'NVMe') {
            controller.driverInstalled = true;
            drivers.push({
              name: 'NVMe Driver',
              version: null,
              installed: true,
              type: 'storage',
              description: `NVMe controller driver for ${disk.model || 'storage device'}`,
            });
          }

          controllers.push(controller);
        }
      }

      // Check for USB storage drivers
      if (usb && usb.length > 0) {
        const usbStorage = usb.filter((device: Systeminformation.UsbData) => 
          device.type && device.type.toLowerCase().includes('storage')
        );
        if (usbStorage.length > 0) {
          drivers.push({
            name: 'USB Storage Driver',
            version: null,
            installed: true,
            type: 'storage',
            description: 'USB mass storage driver',
          });
        }
      }
    } catch (error) {
      logger.warn('Failed to detect storage drivers:', { error });
    }
  }

  // Check for Micron NVMe driver (based on project file)
  // This is a placeholder - in a real implementation, you'd check Windows registry
  // or system files for installed drivers
  if (typeof process !== 'undefined' && process.platform === 'win32') {
    try {
      // Check if Micron NVMe driver might be installed
      // In a real implementation, query Windows registry:
      // HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\stornvme
      drivers.push({
        name: 'Micron NVMe Driver',
        version: null,
        installed: false, // Would check registry in real implementation
        type: 'storage',
        description: 'Micron NVMe storage driver (MicronNVMeDrivers_x64.msi)',
      });
    } catch {
      // Ignore errors
    }
  }

  return {
    controllers,
    drivers,
    lastChecked: new Date().toISOString(),
  };
}

export async function detectDevTools(): Promise<DevToolsStatus> {
  const tools: DevTool[] = await Promise.all([
    detectDevTool('Node.js', 'node --version', 'https://nodejs.org/'),
    detectDevTool('Python', 'python --version', 'https://www.python.org/'),
    detectDevTool('Git', 'git --version', 'https://git-scm.com/'),
    detectDevTool('Docker', 'docker --version', 'https://www.docker.com/'),
    detectDevTool('npm', 'npm --version'),
    detectDevTool('yarn', 'yarn --version', 'https://yarnpkg.com/'),
    detectDevTool('pnpm', 'pnpm --version', 'https://pnpm.io/'),
  ]);

  return {
    tools,
    lastChecked: new Date().toISOString(),
  };
}

