/**
 * llmOptimizerStore.ts
 * 
 * PURPOSE:
 * Zustand store for LLM optimization state. Manages hardware profiling, model catalog,
 * recommendations, benchmarks, and optimization settings. Provides reactive state for
 * the LLM Optimizer panel and related components.
 * 
 * ARCHITECTURE:
 * Zustand store that wraps llmOptimizerService with reactive state:
 * - Hardware detection and profiling
 * - Model catalog management
 * - Model recommendations based on hardware/use case
 * - Benchmark execution and results
 * - Optimization priority settings (quality/speed/balanced)
 * - Use case selection (code-generation, chat, etc.)
 * 
 * CURRENT STATUS:
 * ✅ Hardware profiling
 * ✅ Model catalog loading
 * ✅ Recommendations generation
 * ✅ Benchmark execution
 * ✅ Priority and use case management
 * ✅ Hardware override support
 * 
 * DEPENDENCIES:
 * - llmOptimizerService: Core optimization logic
 * - @/types/optimizer: Optimizer type definitions
 * 
 * STATE MANAGEMENT:
 * - hardwareProfile: Detected hardware capabilities
 * - hardwareOverride: Manual hardware overrides
 * - modelCatalog: Available models catalog
 * - recommendations: Model recommendations
 * - benchmarks: Benchmark results
 * - selectedUseCase: Current use case
 * - priority: Optimization priority (quality/speed/balanced)
 * - Loading/error states for each operation
 * 
 * PERFORMANCE:
 * - Reactive updates via Zustand
 * - Cached hardware profile (unless forced refresh)
 * - Async operations don't block UI
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';
 * 
 * function OptimizerPanel() {
 *   const { 
 *     hardwareProfile, 
 *     recommendations, 
 *     priority, 
 *     setPriority,
 *     refreshRecommendations 
 *   } = useLLMOptimizerStore();
 *   
 *   useEffect(() => {
 *     refreshRecommendations();
 *   }, [priority]);
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/llmOptimizerService.ts: Core optimization logic
 * - src/components/LLMOptimizer/LLMOptimizerPanel.tsx: Main UI component
 * - src/components/LLMOptimizer/RecommendationPanel.tsx: Displays recommendations
 * - src/utils/llmConfig.ts: Uses priority for temperature mapping
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Real-time hardware monitoring
 * - Model performance history
 * - Custom benchmark suites
 * - A/B testing between models
 */
import { create } from 'zustand';
import { llmOptimizerService } from './llmOptimizerService';
import type {
  HardwareProfile,
  ModelCatalogEntry,
  ModelRecommendation,
  OptimizationPriority,
  LLMUseCase,
  BenchmarkResult,
} from '@/types/optimizer';

interface LLMOptimizerState {
  hardwareProfile: HardwareProfile | null;
  hardwareOverride: Partial<HardwareProfile> | null;
  modelCatalog: ModelCatalogEntry[];
  recommendations: ModelRecommendation[];
  benchmarks: BenchmarkResult[];
  selectedUseCase: LLMUseCase;
  priority: OptimizationPriority;
  isProfiling: boolean;
  isCatalogLoading: boolean;
  isBenchmarking: boolean;
  profilerError: string | null;
  catalogError: string | null;
  recommendationError: string | null;
  benchmarkError: string | null;
  recommendationTimestamp: string | null;
  benchmarkTimestamp: string | null;
  detectHardware: (force?: boolean) => Promise<void>;
  setHardwareOverride: (override: Partial<HardwareProfile>) => void;
  clearHardwareOverride: () => void;
  loadCatalog: () => Promise<void>;
  setUseCase: (useCase: LLMUseCase) => void;
  setPriority: (priority: OptimizationPriority) => void;
  refreshRecommendations: () => Promise<void>;
  runBenchmarks: (modelIds: string[]) => Promise<void>;
}

const DEFAULT_USE_CASE: LLMUseCase = 'code-generation';
const DEFAULT_PRIORITY: OptimizationPriority = 'balanced';

export const useLLMOptimizerStore = create<LLMOptimizerState>((set, get) => ({
  hardwareProfile: null,
  hardwareOverride: null,
  modelCatalog: [],
  recommendations: [],
  benchmarks: [],
  selectedUseCase: DEFAULT_USE_CASE,
  priority: DEFAULT_PRIORITY,
  isProfiling: false,
  isCatalogLoading: false,
  isBenchmarking: false,
  profilerError: null,
  catalogError: null,
  recommendationError: null,
  benchmarkError: null,
  recommendationTimestamp: null,
  benchmarkTimestamp: null,

  detectHardware: async (force = false) => {
    const state = get();
    if (state.isProfiling) return;
    if (state.hardwareProfile && !force) return;

    set({ isProfiling: true, profilerError: null });
    try {
      const profile = await llmOptimizerService.detectHardwareProfile();
      set({
        hardwareProfile: profile,
        isProfiling: false,
        profilerError: null,
      });
      await get().refreshRecommendations();
    } catch (error) {
      set({
        isProfiling: false,
        profilerError: (error as Error).message,
      });
    }
  },

  setHardwareOverride: (override) => {
    const existing = get().hardwareProfile;
    const merged: HardwareProfile | null = existing
      ? {
          ...existing,
          ...override,
          source: 'manual',
          collectedAt: new Date().toISOString(),
        }
      : null;
    set({ hardwareOverride: override, hardwareProfile: merged });
    get().refreshRecommendations();
  },

  clearHardwareOverride: () => {
    set({ hardwareOverride: null });
    get().detectHardware(true);
  },

  loadCatalog: async () => {
    if (get().isCatalogLoading || get().modelCatalog.length > 0) return;
    set({ isCatalogLoading: true, catalogError: null });
    try {
      const catalog = llmOptimizerService.getModelCatalog();
      set({ modelCatalog: catalog, isCatalogLoading: false });
      await get().refreshRecommendations();
    } catch (error) {
      set({
        catalogError: (error as Error).message,
        isCatalogLoading: false,
      });
    }
  },

  setUseCase: (useCase) => {
    set({ selectedUseCase: useCase });
    get().refreshRecommendations();
  },

  setPriority: (priority) => {
    set({ priority });
    get().refreshRecommendations();
  },

  refreshRecommendations: async () => {
    const { hardwareProfile, selectedUseCase, priority } = get();
    if (!hardwareProfile && !get().hardwareOverride) {
      return;
    }

    try {
      const recs = await llmOptimizerService.recommendModels(hardwareProfile, selectedUseCase, priority);
      set({
        recommendations: recs,
        recommendationError: null,
        recommendationTimestamp: new Date().toISOString(),
      });
    } catch (error) {
      set({
        recommendationError: (error as Error).message,
      });
    }
  },

  runBenchmarks: async (modelIds) => {
    if (modelIds.length === 0) return;
    if (get().isBenchmarking) return;

    set({ isBenchmarking: true, benchmarkError: null });
    try {
      const results = await llmOptimizerService.runBenchmark({
        modelIds,
        runs: 1,
      });
      set({
        benchmarks: results,
        benchmarkTimestamp: new Date().toISOString(),
        benchmarkError: null,
      });
    } catch (error) {
      set({
        benchmarkError: (error as Error).message,
      });
    } finally {
      set({ isBenchmarking: false });
    }
  },
}));

