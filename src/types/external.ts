/**
 * Type definitions for external libraries
 * 
 * This file provides TypeScript type definitions for third-party libraries
 * that may not have complete type definitions or need additional type support.
 */

import type { Systeminformation } from 'systeminformation';

/**
 * LanceDB Schema and Vector type definitions
 * These types extend the existing LanceDB types to support schema creation
 * Note: These are type assertions for the actual LanceDB library which may have different internal types
 */
export interface LanceDBSchema {
  from(schema: Record<string, unknown>): unknown;
}

export interface LanceDBVector {
  (dimension: number): unknown;
}

export interface LanceDBModule {
  connect(uri: string): Promise<unknown>;
  Schema: LanceDBSchema;
  Vector: LanceDBVector;
}

/**
 * Extended Systeminformation types for properties that may not be in the base types
 */
export interface ExtendedGraphicsControllerData extends Systeminformation.GraphicsControllerData {
  /**
   * GPU utilization percentage (0-100)
   * May be available as utilizationGPU or utilizationGpu depending on systeminformation version
   */
  utilizationGPU?: number;
  utilizationGpu?: number;
  
  /**
   * GPU temperature in Celsius
   * May be available as temperature or temperatureGpu depending on systeminformation version
   */
  temperature?: number;
  temperatureGpu?: number;
}

/**
 * Extended USB device type for systeminformation
 */
export interface ExtendedUsbData extends Systeminformation.UsbData {
  /**
   * Additional properties that may be present on USB devices
   */
  [key: string]: unknown;
}

/**
 * Type guard to check if a value is an ExtendedGraphicsControllerData
 */
export function isExtendedGraphicsControllerData(
  value: unknown
): value is ExtendedGraphicsControllerData {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('model' in value || 'vendor' in value)
  );
}

/**
 * Helper to safely access GPU utilization from graphics controller data
 */
export function getGpuUtilization(gpu: Systeminformation.GraphicsControllerData): number | null {
  if (isExtendedGraphicsControllerData(gpu)) {
    return gpu.utilizationGPU ?? gpu.utilizationGpu ?? null;
  }
  return null;
}

/**
 * Helper to safely access GPU temperature from graphics controller data
 */
export function getGpuTemperature(gpu: Systeminformation.GraphicsControllerData): number | null {
  if (isExtendedGraphicsControllerData(gpu)) {
    return gpu.temperatureGpu ?? gpu.temperature ?? null;
  }
  return null;
}

