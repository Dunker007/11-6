import { llmRouter } from './router';
import type {
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
} from '@/types/optimizer';

const DEFAULT_BENCHMARK_PROMPT =
  'Respond with a short confirmation message that says "Benchmark OK". This is a latency measurement request.';

const MODEL_CATALOG: ModelCatalogEntry[] = [
  {
    id: 'qwen2.5-coder:32b-instruct-q4_K_M',
    displayName: 'Qwen2.5 Coder 32B (Q4_K_M)',
    provider: 'ollama',
    family: 'Qwen2.5',
    sizeGB: 19,
    quantization: 'Q4_K_M',
    contextWindow: 32768,
    description: 'Large code-focused model with excellent reasoning and refactor performance.',
    bestFor: ['code-generation', 'analysis', 'fine-tuning'],
    tags: ['code', 'reasoning', 'large'],
    pullCommand: 'ollama pull qwen2.5-coder:32b-instruct-q4_K_M',
    minSystemMemoryGB: 32,
    minGpuMemoryGB: 16,
    strengths: ['Deep code reasoning', 'Large context window', 'Strong refactor suggestions'],
    limitations: ['High VRAM requirements', 'Slower first token latency'],
    license: 'Apache 2.0',
  },
  {
    id: 'deepseek-coder-v2:16b-lite-instruct-q4_K_M',
    displayName: 'DeepSeek Coder V2 16B Lite (Q4_K_M)',
    provider: 'ollama',
    family: 'DeepSeek V2',
    sizeGB: 9.6,
    quantization: 'Q4_K_M',
    contextWindow: 16384,
    description: 'Balanced code model optimized for fast iterations with strong completion quality.',
    bestFor: ['code-generation', 'analysis'],
    tags: ['code', 'balanced', 'fast'],
    pullCommand: 'ollama pull deepseek-coder-v2:16b-lite-instruct-q4_K_M',
    minSystemMemoryGB: 24,
    minGpuMemoryGB: 12,
    strengths: ['Great autocomplete quality', 'Responsive on 12GB GPUs', 'Handles multi-file context well'],
    limitations: ['Needs fine-tuning for niche frameworks'],
    license: 'DeepSeek License',
  },
  {
    id: 'llama3.1:8b-instruct-q4_K_M',
    displayName: 'Llama 3.1 8B Instruct (Q4_K_M)',
    provider: 'ollama',
    family: 'Llama 3.1',
    sizeGB: 4.8,
    quantization: 'Q4_K_M',
    contextWindow: 8192,
    description: 'Fast general-purpose assistant with good coding baseline and strong chat ability.',
    bestFor: ['chat-assistant', 'code-generation', 'summarization'],
    tags: ['general', 'fast', 'chat'],
    pullCommand: 'ollama pull llama3.1:8b-instruct-q4_K_M',
    minSystemMemoryGB: 16,
    minGpuMemoryGB: 8,
    strengths: ['Low latency', 'Good small GPU support', 'Versatile assistant'],
    limitations: ['Weaker on long, complex refactor plans'],
    license: 'Meta Llama 3 Community License',
  },
  {
    id: 'phi3:14b-medium-128k-instruct-q4_K_M',
    displayName: 'Phi-3 Medium 14B 128K (Q4_K_M)',
    provider: 'ollama',
    family: 'Phi-3',
    sizeGB: 8.2,
    quantization: 'Q4_K_M',
    contextWindow: 128000,
    description: 'High-context generalist suited for summarization and large spec analysis.',
    bestFor: ['analysis', 'summarization', 'chat-assistant'],
    tags: ['analysis', 'long-context', 'balanced'],
    pullCommand: 'ollama pull phi3:14b-medium-128k-instruct-q4_K_M',
    minSystemMemoryGB: 24,
    minGpuMemoryGB: 12,
    strengths: ['Very long context window', 'Stable outputs', 'Great for documentation'],
    limitations: ['Slower than 8B models', 'Less specialized for code'],
    license: 'MIT',
  },
  {
    id: 'mistral-nemo:12b-instruct-2407-q4_K_M',
    displayName: 'Mistral Nemo 12B Instruct (Q4_K_M)',
    provider: 'lmstudio',
    family: 'Mistral Nemo',
    sizeGB: 7.5,
    quantization: 'Q4_K_M',
    contextWindow: 8192,
    description: 'Balanced multilingual assistant with solid reasoning and speed.',
    bestFor: ['chat-assistant', 'analysis', 'creative-writing'],
    tags: ['multilingual', 'assistant', 'balanced'],
    downloadUrl: 'https://huggingface.co/mistralai/Mistral-Nemo-Instruct-2407',
    minSystemMemoryGB: 24,
    minGpuMemoryGB: 12,
    strengths: ['Excellent multilingual support', 'Very responsive'],
    limitations: ['Requires manual import into LM Studio'],
    license: 'Apache 2.0',
  },
  {
    id: 'openrouter/anthropic/claude-3.5-sonnet',
    displayName: 'Claude 3.5 Sonnet (OpenRouter)',
    provider: 'openrouter',
    family: 'Claude 3.5',
    sizeGB: 0,
    contextWindow: 200000,
    description: 'Top-tier reasoning and summarization with strong code comprehension.',
    bestFor: ['analysis', 'code-generation', 'summarization', 'multimodal'],
    tags: ['cloud', 'premium', 'reasoning'],
    downloadUrl: 'https://openrouter.ai/anthropic/claude-3.5-sonnet',
    strengths: ['Exceptional reasoning', 'Huge context window', 'Multimodal support'],
    limitations: ['Requires API key', 'Usage costs per token'],
    license: 'Commercial (via Anthropic terms)',
  },
  {
    id: 'openrouter/google/gemini-1.5-pro-latest',
    displayName: 'Gemini 1.5 Pro (OpenRouter)',
    provider: 'openrouter',
    family: 'Gemini 1.5',
    sizeGB: 0,
    contextWindow: 1000000,
    description: 'Massive context model ideal for design docs, Figma integration, and multimodal flows.',
    bestFor: ['analysis', 'multimodal', 'summarization'],
    tags: ['cloud', 'multimodal', 'long-context'],
    downloadUrl: 'https://openrouter.ai/google/gemini-1.5-pro-latest',
    strengths: ['Unmatched context length', 'Great tooling integration', 'Strong summarization'],
    limitations: ['Requires API key', 'Higher latency than local models'],
    license: 'Commercial (via Google terms)',
  },
];

const USE_CASE_PRIORITIES: Record<LLMUseCase, string[]> = {
  'code-generation': ['code', 'reasoning'],
  'chat-assistant': ['chat', 'general'],
  analysis: ['analysis', 'reasoning', 'long-context'],
  summarization: ['summarization', 'analysis', 'long-context'],
  'creative-writing': ['creative', 'chat'],
  'fine-tuning': ['code', 'balanced'],
  multimodal: ['multimodal', 'long-context'],
};

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

async function detectGPUInfo(): Promise<{
  name: string | null;
  memoryGB: number | null;
  isDiscrete: boolean | null;
}> {
  if (typeof navigator === 'undefined') {
    return { name: null, memoryGB: null, isDiscrete: null };
  }

  try {
    if ('gpu' in navigator && typeof (navigator as any).gpu?.requestAdapter === 'function') {
      const adapter = await (navigator as any).gpu.requestAdapter() as any;
      if (adapter) {
        const name = (adapter as any).name || null;
        const info = await adapter.requestAdapterInfo?.();
        const vendor = info?.vendor || '';
        const architecture = info?.architecture || '';
        const isDiscrete = adapter?.features?.has('timestamp-query') ?? null;
        const description = [vendor, architecture].filter(Boolean).join(' ');
        return {
          name: name || description || null,
          memoryGB: null,
          isDiscrete,
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
        return {
          name: `${vendor} ${renderer}`.trim(),
          memoryGB: null,
          isDiscrete: renderer?.toLowerCase().includes('discrete') ?? null,
        };
      }
    }
  } catch {
    // Ignore WebGL failures
  }

  const electronProcess = typeof window !== 'undefined' ? (window as any).process : undefined;
  if (electronProcess?.getGPUFeatureStatus) {
    const gpuInfo = electronProcess.getGPUFeatureStatus?.();
    const description = gpuInfo ? JSON.stringify(gpuInfo) : null;
    return {
      name: description,
      memoryGB: null,
      isDiscrete: null,
    };
  }

  return { name: null, memoryGB: null, isDiscrete: null };
}

export async function detectHardwareProfile(): Promise<HardwareProfile> {
  const now = new Date().toISOString();

  const cpuCores =
    typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number'
      ? navigator.hardwareConcurrency
      : null;

  const deviceMemory =
    typeof navigator !== 'undefined' && 'deviceMemory' in navigator
      ? Number((navigator as any).deviceMemory) || null
      : null;

  const gpuInfo = await detectGPUInfo();
  const os = getOperatingSystem();

  let cpuModel: string | null = null;
  if (typeof navigator !== 'undefined' && 'userAgentData' in navigator) {
    const uaData = (navigator as any).userAgentData;
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

async function getAvailabilityForProvider(provider: string): Promise<ModelAvailability> {
  try {
    const results = await llmRouter.discoverProviders();
    const match = results.find((r) => r.provider === provider);
    if (!match) {
      return { provider, isOnline: false, reason: 'Provider not configured' };
    }
    return {
      provider,
      isOnline: match.available,
      reason: match.available ? undefined : 'Provider offline or unreachable',
    };
  } catch (error) {
    return {
      provider,
      isOnline: false,
      reason: (error as Error).message,
    };
  }
}

function scoreRecommendation(
  entry: ModelCatalogEntry,
  hardware: HardwareProfile | null,
  useCase: LLMUseCase,
  priority: OptimizationPriority
): { score: number; reasons: string[]; hardwareFit: number; priorityFit: number } {
  let score = 0;
  const reasons: string[] = [];

  // Base score from use case matches
  const desiredTags = USE_CASE_PRIORITIES[useCase] ?? [];
  const matchedTags = entry.tags.filter((tag) => desiredTags.includes(tag));
  const tagScore = matchedTags.length * 10;
  score += tagScore;
  if (matchedTags.length > 0) {
    reasons.push(`Matches use-case tags: ${matchedTags.join(', ')}`);
  }

  // Priority adjustments
  let priorityFit = 0;
  if (priority === 'quality') {
    if (entry.sizeGB >= 15) {
      score += 15;
      priorityFit += 15;
      reasons.push('Optimized for quality: large parameter count');
    } else if (entry.sizeGB >= 7) {
      score += 8;
      priorityFit += 8;
    }
  } else if (priority === 'speed') {
    if (entry.sizeGB <= 6) {
      score += 12;
      priorityFit += 12;
      reasons.push('Optimized for speed: lightweight model');
    }
  } else {
    score += 5;
    priorityFit += 5;
  }

  // Hardware compatibility
  let hardwareFit = 0;
  if (hardware) {
    if (entry.minSystemMemoryGB && hardware.systemMemoryGB) {
      if (hardware.systemMemoryGB >= entry.minSystemMemoryGB) {
        score += 10;
        hardwareFit += 10;
        reasons.push('Sufficient system memory');
      } else {
        const deficit = entry.minSystemMemoryGB - hardware.systemMemoryGB;
        score -= deficit * 2;
        hardwareFit -= deficit * 2;
        reasons.push(`May require additional system memory (+${deficit}GB)`);
      }
    }

    if (entry.minGpuMemoryGB && hardware.gpuMemoryGB != null) {
      if (hardware.gpuMemoryGB >= entry.minGpuMemoryGB) {
        score += 12;
        hardwareFit += 12;
        reasons.push('GPU memory meets recommended threshold');
      } else {
        score -= 15;
        hardwareFit -= 15;
        reasons.push('GPU memory below recommended threshold');
      }
    }

    if (hardware.hasDiscreteGPU === false && entry.minGpuMemoryGB) {
      score -= 10;
      hardwareFit -= 10;
      reasons.push('Discrete GPU recommended for best performance');
    }
  } else {
    score += 5;
    hardwareFit += 5;
    reasons.push('Using generic profile');
  }

  return {
    score,
    reasons,
    hardwareFit,
    priorityFit,
  };
}

export async function recommendModels(
  hardware: HardwareProfile | null,
  useCase: LLMUseCase,
  priority: OptimizationPriority
): Promise<ModelRecommendation[]> {
  const availabilityCache = new Map<string, ModelAvailability>();

  const recommendations: ModelRecommendation[] = [];
  for (const entry of MODEL_CATALOG) {
    if (!entry.bestFor.includes(useCase)) {
      continue;
    }

    let availability = availabilityCache.get(entry.provider);
    if (!availability) {
      availability = await getAvailabilityForProvider(entry.provider);
      availabilityCache.set(entry.provider, availability);
    }

    const { score, reasons, hardwareFit, priorityFit } = scoreRecommendation(entry, hardware, useCase, priority);

    const rationale = [...reasons];
    if (!availability.isOnline) {
      rationale.push(availability.reason || 'Provider offline');
    } else {
      rationale.push('Provider online and ready');
    }

    recommendations.push({
      modelId: entry.id,
      catalogEntry: entry,
      score,
      priorityFit,
      hardwareFit,
      availability,
      rationale,
    });
  }

  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export function getModelCatalog(): ModelCatalogEntry[] {
  return MODEL_CATALOG;
}

export async function runBenchmark(request: BenchmarkRequest): Promise<BenchmarkResult[]> {
  const prompt = request.prompt || DEFAULT_BENCHMARK_PROMPT;
  const runs = request.runs && request.runs > 0 ? request.runs : 1;
  const catalogById = new Map(MODEL_CATALOG.map((entry) => [entry.id, entry]));
  const results: BenchmarkResult[] = [];

  for (const modelId of request.modelIds) {
    const entry = catalogById.get(modelId);
    if (!entry) {
      results.push({
        modelId,
        modelName: modelId,
        provider: 'unknown',
        measurements: [],
        averageLatencyMs: null,
        averageThroughput: null,
        status: 'error',
        error: 'Model not found in catalog',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
      continue;
    }

    const startedAt = new Date().toISOString();
    const measurements: BenchmarkMeasurement[] = [];

    let error: string | undefined;
    for (let run = 0; run < runs; run += 1) {
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        const response = await llmRouter.generate(prompt, {
          model: entry.id,
          temperature: 0.91,
          maxTokens: 64,
        });
        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const latency = endTime - startTime;
        const tokens = response.tokensUsed ?? null;
        const throughput =
          tokens && latency > 0 ? (tokens / (latency / 1000)) : undefined;

        measurements.push({
          run: run + 1,
          latencyMs: latency,
          tokensPerSecond: throughput,
        });
      } catch (err) {
        const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
        const latency = endTime - startTime;
        const reason = (err as Error).message || 'Unknown error';
        measurements.push({
          run: run + 1,
          latencyMs: latency,
          error: reason,
        });
        error = reason;
      }
    }

    const successfulRuns = measurements.filter((m) => !m.error);
    const averageLatency =
      successfulRuns.length > 0
        ? successfulRuns.reduce((sum, m) => sum + m.latencyMs, 0) / successfulRuns.length
        : null;
    const averageThroughput =
      successfulRuns.length > 0
        ? successfulRuns.reduce((sum, m) => sum + (m.tokensPerSecond ?? 0), 0) / successfulRuns.length
        : null;

    results.push({
      modelId,
      modelName: entry.displayName,
      provider: entry.provider,
      measurements,
      averageLatencyMs: averageLatency,
      averageThroughput: averageThroughput ?? null,
      status: error
        ? successfulRuns.length > 0
          ? 'partial'
          : 'error'
        : 'success',
      error,
      startedAt,
      completedAt: new Date().toISOString(),
    });
  }

  return results;
}

export function getUseCaseOptions(): { id: LLMUseCase; label: string; description: string }[] {
  return [
    {
      id: 'code-generation',
      label: 'Code Generation',
      description: 'Multi-file context, refactoring, test generation, and live code assist',
    },
    {
      id: 'chat-assistant',
      label: 'Assistant / Pair Programmer',
      description: 'Conversational partner for debugging, brainstorming, and lightweight coding',
    },
    {
      id: 'analysis',
      label: 'Analysis & Audit',
      description: 'Deep project analysis, security review, and dependency mapping',
    },
    {
      id: 'summarization',
      label: 'Summarization & Docs',
      description: 'Project briefs, changelog drafting, and knowledge distillation',
    },
    {
      id: 'creative-writing',
      label: 'Creative & UX Copy',
      description: 'Marketing copy, UX micoscopy, naming, and mood-based content',
    },
    {
      id: 'fine-tuning',
      label: 'Fine-tuning Base',
      description: 'Model bases best suited for further instruction tuning and RAG',
    },
    {
      id: 'multimodal',
      label: 'Multimodal & Design',
      description: 'Figma alignment, asset audits, and design-to-code guidance',
    },
  ];
}

async function detectDevTool(name: string, command: string, installUrl?: string): Promise<DevTool> {
  try {
    if (!window.devTools) {
      return {
        name,
        command,
        version: null,
        installed: false,
        installPath: null,
        installUrl,
      };
    }

    const checkResult = await window.devTools.check(command);
    if (!checkResult.installed) {
      return {
        name,
        command,
        version: null,
        installed: false,
        installPath: null,
        installUrl,
      };
    }

    const versionResult = await window.devTools.getVersion(command);
    return {
      name,
      command,
      version: versionResult.version || null,
      installed: true,
      installPath: null, // Could be enhanced to detect install path
      installUrl,
    };
  } catch {
    return {
      name,
      command,
      version: null,
      installed: false,
      installPath: null,
      installUrl,
    };
  }
}

export async function detectDevTools(): Promise<DevToolsStatus> {
  const tools: DevTool[] = await Promise.all([
    detectDevTool('Node.js', 'node --version', 'https://nodejs.org/'),
    detectDevTool('Python', 'python --version', 'https://www.python.org/'),
    detectDevTool('Git', 'git --version', 'https://git-scm.com/'),
    detectDevTool('Docker', 'docker --version', 'https://www.docker.com/'),
    detectDevTool('npm', 'npm --version'),
    detectDevTool('yarn', 'yarn --version', 'https://yarnpkg.com/'),
    detectDevTool('pnpm', 'pnpm --version', 'https://pnpm.io/'),
  ]);

  return {
    tools,
    lastChecked: new Date().toISOString(),
  };
}

export async function cleanTempFiles(): Promise<CleanupResult> {
  try {
    if (!window.system) {
      return { filesDeleted: 0, spaceFreed: 0, errors: ['System API not available'] };
    }
    const result = await window.system.cleanTempFiles();
    return result;
  } catch (error) {
    return { filesDeleted: 0, spaceFreed: 0, errors: [(error as Error).message] };
  }
}

export async function cleanCache(): Promise<CleanupResult> {
  try {
    if (!window.system) {
      return { filesDeleted: 0, spaceFreed: 0, errors: ['System API not available'] };
    }
    const result = await window.system.cleanCache();
    return result;
  } catch (error) {
    return { filesDeleted: 0, spaceFreed: 0, errors: [(error as Error).message] };
  }
}

export async function deepCleanSystem(): Promise<SystemCleanupResults> {
  try {
    if (!window.system) {
      return {
        tempFiles: { filesDeleted: 0, spaceFreed: 0, errors: ['System API not available'] },
        cache: { filesDeleted: 0, spaceFreed: 0, errors: ['System API not available'] },
        registry: { cleaned: 0, errors: [] },
        oldInstallations: { found: [], removed: 0, errors: [] },
      };
    }
    const result = await window.system.deepClean();
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

export const llmOptimizerService = {
  detectHardwareProfile,
  getModelCatalog,
  recommendModels,
  runBenchmark,
  getUseCaseOptions,
  detectDevTools,
  cleanTempFiles,
  cleanCache,
  deepCleanSystem,
};

