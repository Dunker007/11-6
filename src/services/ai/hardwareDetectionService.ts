/**
 * Hardware Detection Service
 * 
 * Detects and profiles system hardware including CPU, GPU, memory, and storage.
 * Works in both Electron (using systeminformation) and browser contexts.
 */

import { logger } from '../logging/loggerService';
import type { HardwareProfile } from '@/types/optimizer';
import type { Systeminformation } from 'systeminformation';

function getOperatingSystem(): string | null {
  if (typeof navigator === 'undefined') return null;

  const ua = navigator.userAgent || '';
  if (/Windows/.test(ua)) return 'Windows';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  if (/Android/.test(ua)) return 'Android';
  if (/iPhone|iPad/.test(ua)) return 'iOS';
  return null;
}

interface GPUAdapter {
  name?: string;
  features?: { has: (feature: string) => boolean };
  requestAdapterInfo?: () => Promise<{ vendor: string; architecture: string }>;
}

interface ExtendedNavigator extends Navigator {
  gpu?: {
    requestAdapter: () => Promise<GPUAdapter | null>;
  };
  deviceMemory?: number;
  userAgentData?: {
    platform?: string;
  };
}

async function detectGPUInfo(): Promise<{
  name: string | null;
  memoryGB: number | null;
  isDiscrete: boolean | null;
}> {
  // Try Electron systeminformation first for accurate GPU detection
  if (typeof process !== 'undefined' && process.versions?.electron) {
    try {
      const si = require('systeminformation');
      const graphics = await si.graphics();
      
      if (graphics && graphics.controllers && graphics.controllers.length > 0) {
        // Find discrete GPU (prefer NVIDIA, AMD, or non-Intel)
        let discreteGPU = graphics.controllers.find((gpu: Systeminformation.GraphicsControllerData) => {
          const vendor = (gpu.vendor || '').toLowerCase();
          const model = (gpu.model || '').toLowerCase();
          // Check for discrete GPU vendors
          return vendor.includes('nvidia') || 
                 vendor.includes('amd') || 
                 vendor.includes('ati') ||
                 (!vendor.includes('intel') && !model.includes('integrated'));
        });
        
        // If no discrete GPU found, use first GPU
        const gpu = discreteGPU || graphics.controllers[0];
        
        if (gpu) {
          const gpuName = gpu.model || gpu.vendor || 'Unknown GPU';
          const memoryGB = gpu.memoryTotal ? Math.round(gpu.memoryTotal / 1024) : null;
          
          // Determine if discrete: check vendor/model or if it's not Intel integrated
          const vendor = (gpu.vendor || '').toLowerCase();
          const model = (gpu.model || '').toLowerCase();
          // Explicitly check for integrated GPUs (Intel integrated, UHD, Iris)
          const isIntegrated = vendor.includes('intel') && (
            model.includes('integrated') || 
            model.includes('uhd') || 
            model.includes('iris') ||
            model.includes('hd graphics')
          );
          // Default to discrete GPU (true) unless explicitly detected as integrated
          const isDiscrete = !isIntegrated;
          
          return {
            name: gpuName,
            memoryGB,
            isDiscrete,
          };
        }
      }
    } catch (error) {
      logger.warn('Failed to detect GPU via systeminformation:', { error });
      // Fall through to browser APIs
    }
  }

  // Fallback to browser APIs
  if (typeof navigator === 'undefined') {
    return { name: null, memoryGB: null, isDiscrete: true }; // Default to discrete GPU
  }

  try {
    const extendedNavigator = navigator as ExtendedNavigator;
    if (extendedNavigator.gpu && typeof extendedNavigator.gpu.requestAdapter === 'function') {
      const adapter: GPUAdapter | null = await extendedNavigator.gpu.requestAdapter();
      if (adapter) {
        const name = adapter.name || null;
        const info = await adapter.requestAdapterInfo?.();
        const vendor = info?.vendor || '';
        const architecture = info?.architecture || '';
        const isDiscrete = adapter?.features?.has('timestamp-query') ?? true; // Default to true
        const description = [vendor, architecture].filter(Boolean).join(' ');
        return {
          name: name || description || null,
          memoryGB: null,
          isDiscrete: isDiscrete !== false ? true : false, // Default to true unless explicitly false
        };
      }
    }
  } catch {
    // Ignore GPU detection errors
  }

  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const rendererLower = (renderer || '').toLowerCase();
        const vendorLower = (vendor || '').toLowerCase();
        // Explicitly check for integrated GPUs
        const isIntegrated = vendorLower.includes('intel') && rendererLower.includes('integrated');
        // Default to discrete GPU (true) unless explicitly detected as integrated
        const isDiscrete = !isIntegrated;
        
        return {
          name: `${vendor} ${renderer}`.trim(),
          memoryGB: null,
          isDiscrete,
        };
      }
    }
  } catch {
    // Ignore WebGL failures
  }

  // Default to discrete GPU if detection fails (most modern PCs have discrete GPUs)
  return { name: null, memoryGB: null, isDiscrete: true };
}

export async function detectHardwareProfile(): Promise<HardwareProfile> {
  const now = new Date().toISOString();

  // Try Electron systeminformation first for accurate hardware detection
  if (typeof process !== 'undefined' && process.versions?.electron) {
    try {
      const si = require('systeminformation');
      const [cpu, mem, osInfo, diskLayout] = await Promise.all([
        si.cpu(),
        si.mem(),
        si.osInfo(),
        si.diskLayout().catch(() => []),
      ]);

      // Get CPU info
      const cpuModel = cpu.manufacturer && cpu.brand 
        ? `${cpu.manufacturer} ${cpu.brand}`.trim()
        : cpu.brand || cpu.manufacturer || 'Unknown CPU';
      const cpuCores = cpu.cores || cpu.physicalCores || null;
      const cpuThreads = cpu.processors || cpuCores || null;

      // Get memory info (convert bytes to GB)
      const systemMemoryGB = mem.total ? Math.round(mem.total / (1024 * 1024 * 1024)) : null;

      // Get GPU info
      const gpuInfo = await detectGPUInfo();
      
      // Determine storage type from disk layout
      let storageType: 'ssd' | 'hdd' | 'nvme' | null = null;
      if (diskLayout && diskLayout.length > 0) {
        const firstDisk = diskLayout[0];
        const diskType = (firstDisk.type || firstDisk.interfaceType || '').toLowerCase();
        if (diskType.includes('nvme')) {
          storageType = 'nvme';
        } else if (diskType.includes('ssd') || diskType.includes('solid')) {
          storageType = 'ssd';
        } else if (diskType.includes('hdd') || diskType.includes('hard')) {
          storageType = 'hdd';
        }
      }

      // Get OS info
      const os = osInfo.platform === 'win32' ? 'Windows' :
                 osInfo.platform === 'darwin' ? 'macOS' :
                 osInfo.platform === 'linux' ? 'Linux' :
                 getOperatingSystem();

      return {
        cpuModel,
        cpuCores,
        cpuThreads,
        gpuModel: gpuInfo.name,
        gpuMemoryGB: gpuInfo.memoryGB,
        hasDiscreteGPU: gpuInfo.isDiscrete,
        systemMemoryGB,
        storageType,
        operatingSystem: os,
        supportsAVX: os === 'Windows' || os === 'Linux' || os === 'macOS' ? true : null,
        supportsMetal: os === 'macOS' ? true : null,
        notes: undefined,
        collectedAt: now,
        source: 'auto-detected',
      };
    } catch (error) {
      logger.warn('Failed to detect hardware via systeminformation:', { error });
      // Fall through to browser APIs
    }
  }

  // Fallback to browser APIs
  const cpuCores =
    typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : null;

  const deviceMemory =
    typeof navigator !== 'undefined' && 'deviceMemory' in navigator
      ? Number((navigator as ExtendedNavigator).deviceMemory) || null
      : null;

  const gpuInfo = await detectGPUInfo();
  const os = getOperatingSystem();

  let cpuModel: string | null = null;
  if (typeof navigator !== 'undefined' && 'userAgentData' in navigator) {
    const uaData = (navigator as ExtendedNavigator).userAgentData;
    cpuModel = uaData?.platform ?? null;
  }
  if (!cpuModel && typeof navigator !== 'undefined') {
    const ua = navigator.userAgent;
    const match = ua.match(/\(([^)]+)\)/);
    cpuModel = match ? match[1] : null;
  }

  return {
    cpuModel: cpuModel || 'Unknown CPU',
    cpuCores,
    cpuThreads: cpuCores ? cpuCores * 2 : null,
    gpuModel: gpuInfo.name,
    gpuMemoryGB: gpuInfo.memoryGB,
    hasDiscreteGPU: gpuInfo.isDiscrete,
    systemMemoryGB: deviceMemory ? Math.round(deviceMemory) : null,
    storageType: null,
    operatingSystem: os,
    supportsAVX: os === 'Windows' || os === 'Linux' || os === 'macOS' ? true : null,
    supportsMetal: os === 'macOS' ? true : null,
    notes: undefined,
    collectedAt: now,
    source: 'auto-detected',
  };
}

