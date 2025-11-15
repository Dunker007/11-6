/**
 * LLM Optimizer Service
 * 
 * Main entry point for LLM optimization services. Re-exports functionality from
 * specialized service modules for backward compatibility.
 * 
 * This service has been split into focused modules:
 * - modelCatalogService: Model catalog and recommendations
 * - hardwareDetectionService: Hardware profiling
 * - benchmarkService: Benchmarking operations
 * - systemCleanupService: System cleanup operations
 * - devToolsDetectionService: Dev tools detection
 */

// Re-export all functionality from specialized services
export { detectHardwareProfile } from './hardwareDetectionService';
export { getModelCatalog, recommendModels, getUseCaseOptions } from './modelCatalogService';
export { runBenchmark } from './benchmarkService';
export { detectDevTools, detectStorageDrivers } from './devToolsDetectionService';
export { cleanTempFiles, cleanCache, deepCleanSystem } from './systemCleanupService';

// Re-export types for convenience
export type {
  HardwareProfile,
  ModelCatalogEntry,
  ModelRecommendation,
  OptimizationPriority,
  LLMUseCase,
  ModelAvailability,
  BenchmarkRequest,
  BenchmarkResult,
  BenchmarkMeasurement,
  CleanupResult,
  SystemCleanupResults,
  DevTool,
  DevToolsStatus,
  StorageController,
  DriverInfo,
  StorageDriversStatus,
} from '@/types/optimizer';

// Maintain backward compatibility with the old service object
import { detectHardwareProfile } from './hardwareDetectionService';
import { getModelCatalog, recommendModels, getUseCaseOptions } from './modelCatalogService';
import { runBenchmark } from './benchmarkService';
import { detectDevTools, detectStorageDrivers } from './devToolsDetectionService';
import { cleanTempFiles, cleanCache, deepCleanSystem } from './systemCleanupService';

export const llmOptimizerService = {
  detectHardwareProfile,
  getModelCatalog,
  recommendModels,
  runBenchmark,
  getUseCaseOptions,
  detectDevTools,
  detectStorageDrivers,
  cleanTempFiles,
  cleanCache,
  deepCleanSystem,
};
