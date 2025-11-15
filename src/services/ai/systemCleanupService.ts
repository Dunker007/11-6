/**
 * System Cleanup Service
 * 
 * Provides system cleanup functionality for temporary files, cache, and system maintenance.
 */

import type {
  CleanupResult,
  SystemCleanupResults,
} from '@/types/optimizer';

export async function cleanTempFiles(): Promise<CleanupResult> {
  try {
    if (typeof window === 'undefined' || !('system' in window) || !window.system) {
      return { filesDeleted: 0, spaceFreed: 0, errors: ['System API not available'] };
    }
    const system = window.system as {
      cleanTempFiles: () => Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
      cleanCache: () => Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
      deepClean: () => Promise<{
        tempFiles: { filesDeleted: number; spaceFreed: number; errors: string[] };
        cache: { filesDeleted: number; spaceFreed: number; errors: string[] };
        registry: { cleaned: number; errors: string[] };
        oldInstallations: { found: Array<{ name: string; path: string; size: number }>; removed: number; errors: string[] };
      }>;
    };
    const result = await system.cleanTempFiles();
    return result;
  } catch (error) {
    return { filesDeleted: 0, spaceFreed: 0, errors: [(error as Error).message] };
  }
}

export async function cleanCache(): Promise<CleanupResult> {
  try {
    if (typeof window === 'undefined' || !('system' in window) || !window.system) {
      return { filesDeleted: 0, spaceFreed: 0, errors: ['System API not available'] };
    }
    const system = window.system as {
      cleanTempFiles: () => Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
      cleanCache: () => Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
      deepClean: () => Promise<{
        tempFiles: { filesDeleted: number; spaceFreed: number; errors: string[] };
        cache: { filesDeleted: number; spaceFreed: number; errors: string[] };
        registry: { cleaned: number; errors: string[] };
        oldInstallations: { found: Array<{ name: string; path: string; size: number }>; removed: number; errors: string[] };
      }>;
    };
    const result = await system.cleanCache();
    return result;
  } catch (error) {
    return { filesDeleted: 0, spaceFreed: 0, errors: [(error as Error).message] };
  }
}

export async function deepCleanSystem(): Promise<SystemCleanupResults> {
  try {
    if (typeof window === 'undefined' || !('system' in window) || !window.system) {
      return {
        tempFiles: { filesDeleted: 0, spaceFreed: 0, errors: ['System API not available'] },
        cache: { filesDeleted: 0, spaceFreed: 0, errors: ['System API not available'] },
        registry: { cleaned: 0, errors: [] },
        oldInstallations: { found: [], removed: 0, errors: [] },
      };
    }
    const system = window.system as {
      cleanTempFiles: () => Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
      cleanCache: () => Promise<{ filesDeleted: number; spaceFreed: number; errors: string[] }>;
      deepClean: () => Promise<{
        tempFiles: { filesDeleted: number; spaceFreed: number; errors: string[] };
        cache: { filesDeleted: number; spaceFreed: number; errors: string[] };
        registry: { cleaned: number; errors: string[] };
        oldInstallations: { found: Array<{ name: string; path: string; size: number }>; removed: number; errors: string[] };
      }>;
    };
    const result = await system.deepClean();
    return result;
  } catch (error) {
    return {
      tempFiles: { filesDeleted: 0, spaceFreed: 0, errors: [(error as Error).message] },
      cache: { filesDeleted: 0, spaceFreed: 0, errors: [(error as Error).message] },
      registry: { cleaned: 0, errors: [] },
      oldInstallations: { found: [], removed: 0, errors: [] },
    };
  }
}

