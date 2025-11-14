// Windows Optimization Service
// Provides Windows-specific optimization recommendations and registry tweaks

import { serviceManager } from './serviceManager';
import { registryManager } from './registryManager';
import type { SystemStats } from '../health/healthMonitor';

export interface WindowsOptimization {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'startup' | 'visual' | 'network' | 'security';
  impact: 'high' | 'medium' | 'low';
  risk: 'low' | 'medium' | 'high';
  requiresAdmin: boolean;
  enabled: boolean;
  registryPath?: string;
  registryValue?: string;
  registryData?: string;
  registryType?: 'DWORD' | 'STRING' | 'BINARY';
  serviceName?: string;
  command?: string;
  recommendedFor?: {
    highCPUUsage?: boolean;
    highMemoryUsage?: boolean;
    highVRAMUsage?: boolean;
    highGPUTemp?: boolean;
    slowStartup?: boolean;
  };
}

export interface OptimizationResult {
  optimization: WindowsOptimization;
  success: boolean;
  error?: string;
  applied: boolean;
}

export class WindowsOptimizer {
  private static instance: WindowsOptimizer;
  private optimizations: WindowsOptimization[] = [];

  private constructor() {
    this.initializeOptimizations();
  }

  static getInstance(): WindowsOptimizer {
    if (!WindowsOptimizer.instance) {
      WindowsOptimizer.instance = new WindowsOptimizer();
    }
    return WindowsOptimizer.instance;
  }

  private initializeOptimizations() {
    this.optimizations = [
      {
        id: 'disable-startup-programs',
        name: 'Disable Unnecessary Startup Programs',
        description: 'Reduce startup time by disabling non-essential programs',
        category: 'startup',
        impact: 'high',
        risk: 'low',
        requiresAdmin: false,
        enabled: false,
      },
      {
        id: 'disable-visual-effects',
        name: 'Disable Visual Effects',
        description: 'Improve performance by disabling animations and visual effects',
        category: 'visual',
        impact: 'medium',
        risk: 'low',
        requiresAdmin: true,
        enabled: false,
        registryPath: 'HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects',
        registryValue: 'VisualFXSetting',
        registryData: '2', // 2 = Adjust for best performance
        registryType: 'DWORD',
        recommendedFor: {
          highCPUUsage: true,
          highMemoryUsage: true,
        },
      },
      {
        id: 'enable-high-performance',
        name: 'Enable High Performance Power Plan',
        description: 'Switch to high performance power plan for better CPU/GPU performance',
        category: 'performance',
        impact: 'high',
        risk: 'low',
        requiresAdmin: true,
        enabled: false,
        command: 'powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c',
        recommendedFor: {
          highCPUUsage: true,
          highGPUTemp: true,
        },
      },
      {
        id: 'disable-windows-search',
        name: 'Disable Windows Search Indexing',
        description: 'Reduce CPU and disk usage by disabling search indexing',
        category: 'performance',
        impact: 'medium',
        risk: 'low',
        requiresAdmin: true,
        enabled: false,
        serviceName: 'WSearch',
      },
      {
        id: 'disable-superfetch',
        name: 'Disable Superfetch/SysMain',
        description: 'Reduce memory usage by disabling Superfetch service',
        category: 'performance',
        impact: 'medium',
        risk: 'low',
        requiresAdmin: true,
        enabled: false,
        serviceName: 'SysMain',
        recommendedFor: {
          highMemoryUsage: true,
        },
      },
      {
        id: 'optimize-virtual-memory',
        name: 'Optimize Virtual Memory',
        description: 'Set optimal virtual memory size for better performance',
        category: 'performance',
        impact: 'medium',
        risk: 'medium',
        requiresAdmin: true,
        enabled: false,
      },
      {
        id: 'disable-telemetry',
        name: 'Disable Windows Telemetry',
        description: 'Reduce background data collection and improve privacy',
        category: 'security',
        impact: 'low',
        risk: 'low',
        requiresAdmin: true,
        enabled: false,
        registryPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\DataCollection',
        registryValue: 'AllowTelemetry',
        registryData: '0',
        registryType: 'DWORD',
      },
      {
        id: 'disable-cortana',
        name: 'Disable Cortana',
        description: 'Disable Cortana to reduce background processes',
        category: 'performance',
        impact: 'low',
        risk: 'low',
        requiresAdmin: true,
        enabled: false,
        registryPath: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Search',
        registryValue: 'AllowCortana',
        registryData: '0',
        registryType: 'DWORD',
      },
      {
        id: 'optimize-network',
        name: 'Optimize Network Settings',
        description: 'Optimize TCP/IP settings for better network performance',
        category: 'network',
        impact: 'medium',
        risk: 'low',
        requiresAdmin: true,
        enabled: false,
      },
      {
        id: 'disable-game-bar',
        name: 'Disable Xbox Game Bar',
        description: 'Disable Game Bar to reduce background processes',
        category: 'performance',
        impact: 'low',
        risk: 'low',
        requiresAdmin: false,
        enabled: false,
        registryPath: 'HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\GameDVR',
        registryValue: 'AppCaptureEnabled',
        registryData: '0',
        registryType: 'DWORD',
      },
    ];
  }

  getOptimizations(): WindowsOptimization[] {
    return this.optimizations;
  }

  /**
   * Get recommended optimizations based on current system stats
   */
  getRecommendedOptimizations(stats: SystemStats | null): WindowsOptimization[] {
    if (!stats) return [];

    const recommendations: WindowsOptimization[] = [];

    // Check CPU usage
    const highCPUUsage = stats.cpu.usage > 80;
    const highMemoryUsage = stats.memory.usage > 85;
    const highVRAMUsage = stats.gpu?.memoryUsedGB && stats.gpu?.memoryTotalGB
      ? (stats.gpu.memoryUsedGB / stats.gpu.memoryTotalGB) * 100 > 90
      : false;
    const highGPUTemp = (stats.gpu?.temperature ?? 0) > 85;

    this.optimizations.forEach((opt) => {
      if (opt.enabled) return; // Skip already enabled optimizations

      const recommended = opt.recommendedFor;
      if (!recommended) return;

      if (
        (recommended.highCPUUsage && highCPUUsage) ||
        (recommended.highMemoryUsage && highMemoryUsage) ||
        (recommended.highVRAMUsage && highVRAMUsage) ||
        (recommended.highGPUTemp && highGPUTemp)
      ) {
        recommendations.push(opt);
      }
    });

    // Sort by impact (high first)
    return recommendations.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  /**
   * Get optimizations by category
   */
  getOptimizationsByCategory(category: WindowsOptimization['category']): WindowsOptimization[] {
    return this.optimizations.filter(opt => opt.category === category);
  }

  async detectUnusedServices(): Promise<string[]> {
    try {
      const unusedServices = await serviceManager.getUnusedServices();
      return unusedServices.map(s => s.Name);
    } catch (error) {
      console.error('Failed to detect unused services:', error);
      return [];
    }
  }

  async applyOptimization(optimizationId: string): Promise<OptimizationResult> {
    const optimization = this.optimizations.find(opt => opt.id === optimizationId);
    if (!optimization) {
      return {
        optimization: optimization as unknown as WindowsOptimization,
        success: false,
        error: 'Optimization not found',
        applied: false,
      };
    }

    // Check if running on Windows
    if (typeof process === 'undefined' || process.platform !== 'win32') {
      return {
        optimization,
        success: false,
        error: 'Windows optimizations only available on Windows',
        applied: false,
      };
    }

    try {
      // Apply registry changes
      if (optimization.registryPath && optimization.registryValue && optimization.registryData) {
        const result = await registryManager.writeRegistryValue(
          optimization.registryPath,
          optimization.registryValue,
          optimization.registryData,
          optimization.registryType || 'STRING'
        );
        
        if (!result.success) {
          return {
            optimization,
            success: false,
            error: result.error || 'Failed to write registry value',
            applied: false,
          };
        }
      }

      // Disable service
      if (optimization.serviceName) {
        const result = await serviceManager.disableService(optimization.serviceName);
        if (!result.success) {
          return {
            optimization,
            success: false,
            error: result.error || 'Failed to disable service',
            applied: false,
          };
        }
      }

      // Run command
      if (optimization.command) {
        const adminResult = await window.windows?.checkAdmin();
        const isAdmin = adminResult?.isAdmin || false;
        
        const result = await window.windows?.runCommand(optimization.command, optimization.requiresAdmin && !isAdmin);
        if (!result?.success) {
          return {
            optimization,
            success: false,
            error: result?.error || 'Failed to execute command',
            applied: false,
          };
        }
      }

      // Mark as enabled
      optimization.enabled = true;

      return {
        optimization,
        success: true,
        applied: true,
      };
    } catch (error) {
      return {
        optimization,
        success: false,
        error: (error as Error).message,
        applied: false,
      };
    }
  }

  async revertOptimization(optimizationId: string): Promise<OptimizationResult> {
    const optimization = this.optimizations.find(opt => opt.id === optimizationId);
    if (!optimization) {
      return {
        optimization: optimization as unknown as WindowsOptimization,
        success: false,
        error: 'Optimization not found',
        applied: false,
      };
    }

    try {
      // Restore registry value
      if (optimization.registryPath && optimization.registryValue) {
        const restoreResult = await registryManager.restoreRegistryValue(
          optimization.registryPath,
          optimization.registryValue
        );
        
        // If restore fails, try to set default value
        if (!restoreResult.success) {
          // Set default values based on optimization type
          let defaultData = '1'; // Usually enabled = 1
          if (optimization.id === 'disable-visual-effects') {
            defaultData = '0'; // Visual effects: 0 = Let Windows decide
          }
          
          await registryManager.writeRegistryValue(
            optimization.registryPath,
            optimization.registryValue,
            defaultData,
            optimization.registryType || 'STRING'
          );
        }
      }

      // Enable service
      if (optimization.serviceName) {
        await serviceManager.enableService(optimization.serviceName);
      }

      // Mark as disabled
      optimization.enabled = false;

      return {
        optimization,
        success: true,
        applied: false,
      };
    } catch (error) {
      return {
        optimization,
        success: false,
        error: (error as Error).message,
        applied: false,
      };
    }
  }

  async getSystemInfo(): Promise<{ platform: string; isWindows: boolean; isAdmin: boolean }> {
    const platform = typeof process !== 'undefined' ? process.platform : 'unknown';
    const isWindows = platform === 'win32';
    
    // Check admin status via IPC
    let isAdmin = false;
    if (isWindows && window.windows) {
      try {
        const adminResult = await window.windows.checkAdmin();
        isAdmin = adminResult.isAdmin;
      } catch (error) {
        console.error('Failed to check admin status:', error);
      }
    }

    return { platform, isWindows, isAdmin };
  }
}

export const windowsOptimizer = WindowsOptimizer.getInstance();

