/**
 * Browser polyfill for systeminformation
 * Returns empty/mock implementations since these are Node.js-only
 * 
 * Provides minimal type definitions matching the systeminformation package
 * structure to prevent type errors in browser contexts.
 */

export default {};

/**
 * Minimal type definitions for Systeminformation namespace
 * These match the structure used in the codebase for browser compatibility
 */
export namespace Systeminformation {
  export interface GraphicsControllerData {
    vendor?: string;
    model?: string;
    bus?: string;
    vram?: number;
    vramDynamic?: boolean;
    utilizationGPU?: number;
    utilizationGpu?: number;
    temperature?: number;
    temperatureGpu?: number;
    [key: string]: unknown;
  }

  export interface UsbData {
    id?: string;
    name?: string;
    type?: string;
    vendor?: string;
    manufacturer?: string;
    [key: string]: unknown;
  }

  export interface FsSizeData {
    fs?: string;
    type?: string;
    size?: number;
    used?: number;
    available?: number;
    use?: number;
    mount?: string;
    [key: string]: unknown;
  }

  export interface NetworkStatsData {
    iface?: string;
    operstate?: string;
    rx_bytes?: number;
    tx_bytes?: number;
    rx_errors?: number;
    tx_errors?: number;
    [key: string]: unknown;
  }
}

