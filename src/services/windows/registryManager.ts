// Windows Registry Management Service
// Provides utilities for reading and writing registry values

import { logger } from '../logging/loggerService';

export interface RegistryValue {
  path: string;
  value: string;
  data: string;
  type: 'DWORD' | 'STRING' | 'BINARY';
}

export interface RegistryOperationResult {
  success: boolean;
  value?: string;
  error?: string;
}

export class RegistryManager {
  private static instance: RegistryManager;
  private backups: Map<string, RegistryValue> = new Map();

  private constructor() {}

  static getInstance(): RegistryManager {
    if (!RegistryManager.instance) {
      RegistryManager.instance = new RegistryManager();
    }
    return RegistryManager.instance;
  }

  parseRegistryPath(path: string): { hkey: string; subkey: string } {
    // Parse HKEY_LOCAL_MACHINE\SOFTWARE\... or HKEY_CURRENT_USER\SOFTWARE\...
    const hkeyMatch = path.match(/^(HKEY_LOCAL_MACHINE|HKEY_CURRENT_USER|HKLM|HKCU)\\(.+)$/i);
    if (!hkeyMatch) {
      throw new Error(`Invalid registry path: ${path}`);
    }

    const hkey = hkeyMatch[1].toUpperCase();
    const subkey = hkeyMatch[2];

    // Normalize HKEY names
    const normalizedHkey = hkey.startsWith('HKEY_') ? hkey : 
      hkey === 'HKLM' ? 'HKEY_LOCAL_MACHINE' : 'HKEY_CURRENT_USER';

    return { hkey: normalizedHkey, subkey };
  }

  async readRegistryValue(path: string, value: string): Promise<RegistryOperationResult> {
    try {
      const result = await window.windows?.readRegistry(path, value);
      if (result?.success && result.value !== undefined) {
        return {
          success: true,
          value: result.value,
        };
      }
      return {
        success: false,
        error: result?.error || 'Value not found',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async writeRegistryValue(
    path: string,
    value: string,
    data: string,
    type: 'DWORD' | 'STRING' | 'BINARY' = 'STRING'
  ): Promise<RegistryOperationResult> {
    try {
      // Backup original value before writing
      await this.backupRegistryValue(path, value);

      const result = await window.windows?.writeRegistry(path, value, data, type);
      if (result?.success) {
        return { success: true };
      }
      return {
        success: false,
        error: result?.error || 'Failed to write registry value',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async backupRegistryValue(path: string, value: string): Promise<void> {
    const backupKey = `${path}\\${value}`;
    
    // Only backup if not already backed up
    if (this.backups.has(backupKey)) {
      return;
    }

    try {
      const readResult = await this.readRegistryValue(path, value);
      if (readResult.success && readResult.value) {
        // Determine type from existing value (simplified - in production, read type from registry)
        const type: 'DWORD' | 'STRING' | 'BINARY' = /^\d+$/.test(readResult.value) ? 'DWORD' : 'STRING';
        
        this.backups.set(backupKey, {
          path,
          value,
          data: readResult.value,
          type,
        });
      }
    } catch (error) {
      logger.warn(`Failed to backup registry value ${backupKey}:`, { error });
    }
  }

  async restoreRegistryValue(path: string, value: string): Promise<RegistryOperationResult> {
    const backupKey = `${path}\\${value}`;
    const backup = this.backups.get(backupKey);

    if (!backup) {
      return {
        success: false,
        error: 'No backup found for this registry value',
      };
    }

    try {
      const result = await window.windows?.writeRegistry(
        backup.path,
        backup.value,
        backup.data,
        backup.type
      );

      if (result?.success) {
        // Remove from backups after successful restore
        this.backups.delete(backupKey);
        return { success: true };
      }

      return {
        success: false,
        error: result?.error || 'Failed to restore registry value',
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  getBackups(): RegistryValue[] {
    return Array.from(this.backups.values());
  }

  clearBackups(): void {
    this.backups.clear();
  }
}

export const registryManager = RegistryManager.getInstance();

