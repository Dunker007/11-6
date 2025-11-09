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

