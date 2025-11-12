/**
 * optimizer.ts
 * 
 * PURPOSE:
 * TypeScript type definitions for LLM optimization system. Defines types for hardware profiling,
 * model catalog entries, recommendations, benchmarks, and optimization state. Used by LLM
 * Optimizer panel and related services.
 * 
 * ARCHITECTURE:
 * Comprehensive type system for optimization:
 * - LLMUseCase: Use case types (code-generation, chat-assistant, etc.)
 * - OptimizationPriority: Priority levels (quality, speed, balanced)
 * - HardwareProfile: Hardware capabilities detection
 * - ModelCatalogEntry: Model catalog entries with metadata
 * - ModelRecommendation: Hardware-based recommendations
 * - BenchmarkResult: Performance benchmark results
 * - OptimizerStateSnapshot: Complete optimizer state
 * 
 * CURRENT STATUS:
 * ✅ LLM use case types
 * ✅ Optimization priority types
 * ✅ Hardware profile interface
 * ✅ Model catalog entry interface
 * ✅ Model recommendation interface
 * ✅ Benchmark result interface
 * ✅ State snapshot interface
 * ✅ Cleanup result interface
 * 
 * DEPENDENCIES:
 * - None (standalone type definitions)
 * 
 * STATE MANAGEMENT:
 * - Type definitions only (no state)
 * 
 * PERFORMANCE:
 * - Type-only file (no runtime code)
 * - Efficient type checking
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import type { 
 *   HardwareProfile, 
 *   ModelCatalogEntry, 
 *   OptimizationPriority 
 * } from '@/types/optimizer';
 * 
 * const profile: HardwareProfile = {
 *   cpuModel: 'Intel i7',
 *   cpuCores: 8,
 *   gpuMemoryGB: 16,
 *   systemMemoryGB: 32,
 *   // ...
 * };
 * 
 * const priority: OptimizationPriority = 'balanced';
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/llmOptimizerService.ts: Uses these types
 * - src/services/ai/llmOptimizerStore.ts: Uses these types
 * - src/components/LLMOptimizer/LLMOptimizerPanel.tsx: Uses these types
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - More use case types
 * - Model performance metrics types
 * - A/B testing types
 * - Custom benchmark suite types
 */
export type LLMUseCase =
  | 'code-generation'
  | 'chat-assistant'
  | 'analysis'
  | 'summarization'
  | 'creative-writing'
  | 'fine-tuning'
  | 'multimodal';

export type OptimizationPriority = 'quality' | 'speed' | 'balanced';

export interface HardwareProfile {
  cpuModel: string;
  cpuCores: number | null;
  cpuThreads: number | null;
  gpuModel: string | null;
  gpuMemoryGB: number | null;
  hasDiscreteGPU: boolean | null;
  systemMemoryGB: number | null;
  storageType?: 'ssd' | 'hdd' | 'nvme' | null;
  operatingSystem: string | null;
  supportsAVX?: boolean | null;
  supportsMetal?: boolean | null;
  notes?: string;
  collectedAt: string;
  source: 'auto-detected' | 'manual';
}

export interface ModelCatalogEntry {
  id: string;
  displayName: string;
  provider: 'ollama' | 'lmstudio' | 'openrouter';
  family: string;
  sizeGB: number;
  quantization?: string;
  optimizationMethod?: 'unsloth-dynamic-2.0' | 'standard' | 'qat';
  contextWindow: number;
  description: string;
  bestFor: LLMUseCase[];
  tags: string[];
  downloadUrl?: string;
  pullCommand?: string;
  minSystemMemoryGB?: number;
  minGpuMemoryGB?: number;
  strengths: string[];
  limitations: string[];
  license?: string;
}

export interface ModelAvailability {
  provider: string;
  isOnline: boolean;
  reason?: string;
}

export interface ModelRecommendation {
  modelId: string;
  catalogEntry: ModelCatalogEntry;
  score: number;
  priorityFit: number;
  hardwareFit: number;
  availability: ModelAvailability;
  rationale: string[];
}

export interface BenchmarkRequest {
  modelIds: string[];
  prompt?: string;
  runs?: number;
}

export interface BenchmarkMeasurement {
  run: number;
  latencyMs: number;
  tokensPerSecond?: number;
  error?: string;
}

export interface BenchmarkResult {
  modelId: string;
  modelName: string;
  provider: string;
  measurements: BenchmarkMeasurement[];
  averageLatencyMs: number | null;
  averageThroughput?: number | null;
  status: 'success' | 'partial' | 'error';
  error?: string;
  startedAt: string;
  completedAt: string | null;
}

export interface OptimizerStateSnapshot {
  hardwareProfile: HardwareProfile | null;
  selectedUseCase: LLMUseCase;
  priority: OptimizationPriority;
  recommendations: ModelRecommendation[];
  benchmarkResults: BenchmarkResult[];
}

export interface CleanupResult {
  filesDeleted: number;
  spaceFreed: number; // bytes
  errors: string[];
}

export interface SystemCleanupResults {
  tempFiles: CleanupResult;
  cache: CleanupResult;
  registry: { cleaned: number; errors: string[] };
  oldInstallations: {
    found: Array<{ name: string; path: string; size: number }>;
    removed: number;
    errors: string[];
  };
}

export interface DevTool {
  name: string;
  command: string;
  version: string | null;
  installed: boolean;
  installPath: string | null;
  installUrl?: string;
}

export interface DevToolsStatus {
  tools: DevTool[];
  lastChecked: string;
}

export interface StorageController {
  name: string;
  type: string; // e.g., "NVMe", "SATA", "USB"
  interfaceType?: string;
  model?: string;
  vendor?: string;
  driverInstalled?: boolean;
  driverVersion?: string;
}

export interface DriverInfo {
  name: string;
  version: string | null;
  installed: boolean;
  type: 'storage' | 'graphics' | 'network' | 'other';
  description?: string;
}

export interface StorageDriversStatus {
  controllers: StorageController[];
  drivers: DriverInfo[];
  lastChecked: string;
}

