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
  StorageController,
  DriverInfo,
  StorageDriversStatus,
} from '@/types/optimizer';

const DEFAULT_BENCHMARK_PROMPT =
  'Respond with a short confirmation message that says "Benchmark OK". This is a latency measurement request.';

const MODEL_CATALOG: ModelCatalogEntry[] = [
  // Reasoning/Thinking Models - Optimized for logical reasoning and problem-solving
  {
    id: 'qwen3-4b-claude-sonnet-4-reasoning-distill:Q4_K_S',
    displayName: 'Qwen3-4B Claude Sonnet 4 Reasoning Distill (Q4_K_S)',
    provider: 'ollama',
    family: 'Qwen3',
    sizeGB: 2.38,
    quantization: 'Q4_K_S',
    optimizationMethod: 'unsloth-dynamic-2.0',
    contextWindow: 8192,
    description: 'Distilled reasoning model optimized for logical thinking and problem-solving tasks. Excellent balance of size and reasoning capability.',
    bestFor: ['analysis', 'reasoning', 'chat-assistant'],
    tags: ['reasoning', 'thinking', 'distill', 'unsloth', 'dynamic-2.0', 'optimized'],
    pullCommand: 'ollama pull qwen3-4b-claude-sonnet-4-reasoning-distill:Q4_K_S',
    downloadUrl: 'https://huggingface.co/qwen3-4b-claude-sonnet-4-reasoning-distill-safetensor',
    minSystemMemoryGB: 8,
    minGpuMemoryGB: 4,
    strengths: ['Strong reasoning capabilities', 'Small footprint', 'Fast inference', 'Optimized distillation'],
    limitations: ['Smaller context window', 'May struggle with very complex reasoning'],
    license: 'Apache 2.0',
  },
  {
    id: 'qwen3-8b-claude-sonnet-4-reasoning-distill:Q4_K_M',
    displayName: 'Qwen3-8B Claude Sonnet 4 Reasoning Distill (Q4_K_M)',
    provider: 'ollama',
    family: 'Qwen3',
    sizeGB: 5.03,
    quantization: 'Q4_K_M',
    optimizationMethod: 'unsloth-dynamic-2.0',
    contextWindow: 16384,
    description: 'Larger reasoning model with enhanced problem-solving capabilities. Better accuracy than 4B variant while remaining efficient.',
    bestFor: ['analysis', 'reasoning', 'code-generation', 'chat-assistant'],
    tags: ['reasoning', 'thinking', 'distill', 'unsloth', 'dynamic-2.0', 'optimized'],
    pullCommand: 'ollama pull qwen3-8b-claude-sonnet-4-reasoning-distill:Q4_K_M',
    downloadUrl: 'https://huggingface.co/qwen3-8b-claude-sonnet-4-reasoning-distill',
    minSystemMemoryGB: 16,
    minGpuMemoryGB: 8,
    strengths: ['Enhanced reasoning', 'Better accuracy than 4B', 'Good context handling', 'Optimized quantization'],
    limitations: ['Requires more VRAM', 'Slower than smaller models'],
    license: 'Apache 2.0',
  },
  // Coding Models - Optimized for code generation and understanding
  {
    id: 'gemma-3n-e4b-it:Q4_K_S',
    displayName: 'Gemma 3n E4B IT (Q4_K_S)',
    provider: 'ollama',
    family: 'Gemma 3',
    sizeGB: 3.2,
    quantization: 'Q4_K_S',
    optimizationMethod: 'unsloth-dynamic-2.0',
    contextWindow: 8192,
    description: 'Efficient coding model optimized for instruction following and code generation. Great for iterative development.',
    bestFor: ['code-generation', 'chat-assistant'],
    tags: ['code', 'efficient', 'unsloth', 'dynamic-2.0', 'optimized'],
    pullCommand: 'ollama pull gemma-3n-e4b-it:Q4_K_S',
    downloadUrl: 'https://huggingface.co/unsloth/gemma-3n-e4b-it',
    minSystemMemoryGB: 12,
    minGpuMemoryGB: 6,
    strengths: ['Fast code generation', 'Good instruction following', 'Efficient memory usage', 'Optimized for coding'],
    limitations: ['Smaller model size limits complexity', 'May need fine-tuning for specific frameworks'],
    license: 'Gemma Terms of Use',
  },
  {
    id: 'qwen2.5-coder:7b-instruct-q4_K_M',
    displayName: 'Qwen2.5 Coder 7B Instruct (Q4_K_M)',
    provider: 'ollama',
    family: 'Qwen2.5',
    sizeGB: 4.5,
    quantization: 'Q4_K_M',
    optimizationMethod: 'standard',
    contextWindow: 32768,
    description: 'Specialized coding model with excellent code understanding and generation capabilities. Large context window for multi-file projects.',
    bestFor: ['code-generation', 'analysis', 'fine-tuning'],
    tags: ['code', 'instruct', 'large-context'],
    pullCommand: 'ollama pull qwen2.5-coder:7b-instruct-q4_K_M',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2.5-Coder-7B-Instruct',
    minSystemMemoryGB: 16,
    minGpuMemoryGB: 8,
    strengths: ['Excellent code understanding', 'Large context window', 'Strong refactoring', 'Multi-file support'],
    limitations: ['Requires more VRAM than smaller models', 'Slower first token'],
    license: 'Apache 2.0',
  },
  {
    id: 'deepseek-coder-v2-lite:6.7b-instruct-q4_K_S',
    displayName: 'DeepSeek Coder V2 Lite 6.7B (Q4_K_S)',
    provider: 'ollama',
    family: 'DeepSeek V2',
    sizeGB: 3.8,
    quantization: 'Q4_K_S',
    optimizationMethod: 'standard',
    contextWindow: 16384,
    description: 'Fast and efficient coding model optimized for quick iterations and autocomplete. Great for real-time coding assistance.',
    bestFor: ['code-generation', 'analysis'],
    tags: ['code', 'fast', 'lite', 'autocomplete'],
    pullCommand: 'ollama pull deepseek-coder-v2-lite:6.7b-instruct-q4_K_S',
    downloadUrl: 'https://huggingface.co/deepseek-ai/DeepSeek-Coder-V2-Lite-Instruct',
    minSystemMemoryGB: 12,
    minGpuMemoryGB: 6,
    strengths: ['Very fast inference', 'Good autocomplete', 'Efficient memory usage', 'Responsive on smaller GPUs'],
    limitations: ['Smaller context than full models', 'May need fine-tuning for niche languages'],
    license: 'DeepSeek License',
  },
  {
    id: 'llama3.2:3b-instruct-q4_K_M',
    displayName: 'Llama 3.2 3B Instruct (Q4_K_M)',
    provider: 'ollama',
    family: 'Llama 3.2',
    sizeGB: 2.1,
    quantization: 'Q4_K_M',
    optimizationMethod: 'standard',
    contextWindow: 128000,
    description: 'Ultra-efficient general-purpose model with massive context window. Great for long documents and codebases.',
    bestFor: ['chat-assistant', 'summarization', 'analysis', 'code-generation'],
    tags: ['general', 'efficient', 'long-context', 'chat'],
    pullCommand: 'ollama pull llama3.2:3b-instruct-q4_K_M',
    downloadUrl: 'https://huggingface.co/meta-llama/Llama-3.2-3B-Instruct',
    minSystemMemoryGB: 8,
    minGpuMemoryGB: 4,
    strengths: ['Massive context window', 'Very low memory', 'Fast inference', 'Versatile'],
    limitations: ['Smaller model limits complexity', 'Weaker on specialized tasks'],
    license: 'Meta Llama 3 Community License',
  },
  // Vision Models - Multimodal capabilities
  {
    id: 'llava:1.6-mistral-7b-q4_K_M',
    displayName: 'LLaVA 1.6 Mistral 7B (Q4_K_M)',
    provider: 'ollama',
    family: 'LLaVA',
    sizeGB: 4.5,
    quantization: 'Q4_K_M',
    optimizationMethod: 'standard',
    contextWindow: 4096,
    description: 'Vision-language model for image understanding and visual question answering. Great for multimodal coding and documentation.',
    bestFor: ['multimodal', 'analysis', 'chat-assistant'],
    tags: ['vision', 'multimodal', 'image-understanding'],
    pullCommand: 'ollama pull llava:1.6-mistral-7b-q4_K_M',
    downloadUrl: 'https://huggingface.co/llava-hf/llava-1.6-mistral-7b-hf',
    minSystemMemoryGB: 16,
    minGpuMemoryGB: 8,
    strengths: ['Image understanding', 'Visual Q&A', 'Multimodal coding', 'Documentation analysis'],
    limitations: ['Requires more VRAM', 'Slower than text-only models'],
    license: 'Apache 2.0',
  },
  {
    id: 'bakllava:1-mistral-7b-q4_K_S',
    displayName: 'BakLLaVA 1 Mistral 7B (Q4_K_S)',
    provider: 'ollama',
    family: 'BakLLaVA',
    sizeGB: 3.2,
    quantization: 'Q4_K_S',
    optimizationMethod: 'standard',
    contextWindow: 4096,
    description: 'Efficient vision-language model optimized for faster inference. Good balance of capability and speed.',
    bestFor: ['multimodal', 'analysis'],
    tags: ['vision', 'multimodal', 'efficient'],
    pullCommand: 'ollama pull bakllava:1-mistral-7b-q4_K_S',
    downloadUrl: 'https://huggingface.co/SkunkworksAI/BakLLaVA-1',
    minSystemMemoryGB: 12,
    minGpuMemoryGB: 6,
    strengths: ['Faster than LLaVA', 'Lower memory usage', 'Good vision capabilities', 'Efficient quantization'],
    limitations: ['Slightly lower accuracy than LLaVA', 'Smaller context'],
    license: 'Apache 2.0',
  },
  {
    id: 'qwen2-vl:7b-instruct-q4_K_M',
    displayName: 'Qwen2-VL 7B Instruct (Q4_K_M)',
    provider: 'ollama',
    family: 'Qwen2-VL',
    sizeGB: 4.5,
    quantization: 'Q4_K_M',
    optimizationMethod: 'standard',
    contextWindow: 8192,
    description: 'Advanced vision-language model with strong coding and reasoning capabilities. Excellent for technical documentation and diagrams.',
    bestFor: ['multimodal', 'code-generation', 'analysis'],
    tags: ['vision', 'multimodal', 'code', 'reasoning'],
    pullCommand: 'ollama pull qwen2-vl:7b-instruct-q4_K_M',
    downloadUrl: 'https://huggingface.co/Qwen/Qwen2-VL-7B-Instruct',
    minSystemMemoryGB: 16,
    minGpuMemoryGB: 8,
    strengths: ['Strong vision + code', 'Technical diagram understanding', 'Better reasoning', 'Larger context'],
    limitations: ['Requires more VRAM', 'Slower inference'],
    license: 'Apache 2.0',
  },
  // General Purpose Models - Balanced performance
  {
    id: 'mistral:7b-instruct-v0.3-q4_K_M',
    displayName: 'Mistral 7B Instruct v0.3 (Q4_K_M)',
    provider: 'ollama',
    family: 'Mistral',
    sizeGB: 4.5,
    quantization: 'Q4_K_M',
    optimizationMethod: 'standard',
    contextWindow: 32768,
    description: 'Versatile general-purpose model with strong reasoning and coding capabilities. Great all-around choice.',
    bestFor: ['chat-assistant', 'code-generation', 'analysis', 'reasoning'],
    tags: ['general', 'reasoning', 'chat', 'code'],
    pullCommand: 'ollama pull mistral:7b-instruct-v0.3-q4_K_M',
    downloadUrl: 'https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3',
    minSystemMemoryGB: 16,
    minGpuMemoryGB: 8,
    strengths: ['Versatile', 'Good reasoning', 'Large context', 'Strong coding'],
    limitations: ['Not specialized', 'May need fine-tuning for specific tasks'],
    license: 'Apache 2.0',
  },
  {
    id: 'codellama:7b-instruct-q4_K_M',
    displayName: 'CodeLlama 7B Instruct (Q4_K_M)',
    provider: 'ollama',
    family: 'CodeLlama',
    sizeGB: 4.5,
    quantization: 'Q4_K_M',
    optimizationMethod: 'standard',
    contextWindow: 16384,
    description: 'Specialized coding model from Meta. Excellent for code completion, debugging, and code explanation.',
    bestFor: ['code-generation', 'analysis', 'fine-tuning'],
    tags: ['code', 'instruct', 'completion'],
    pullCommand: 'ollama pull codellama:7b-instruct-q4_K_M',
    downloadUrl: 'https://huggingface.co/codellama/CodeLlama-7b-Instruct-hf',
    minSystemMemoryGB: 16,
    minGpuMemoryGB: 8,
    strengths: ['Specialized for code', 'Good completion', 'Strong debugging', 'Well-documented'],
    limitations: ['Less versatile', 'Weaker on non-code tasks'],
    license: 'Meta CodeLlama Community License',
  },
  {
    id: 'phi3:mini-128k-instruct-q4_K_M',
    displayName: 'Phi-3 Mini 128K Instruct (Q4_K_M)',
    provider: 'ollama',
    family: 'Phi-3',
    sizeGB: 2.4,
    quantization: 'Q4_K_M',
    optimizationMethod: 'standard',
    contextWindow: 128000,
    description: 'Ultra-efficient model with massive context window. Perfect for analyzing large codebases and documentation.',
    bestFor: ['analysis', 'summarization', 'chat-assistant', 'code-generation'],
    tags: ['efficient', 'long-context', 'analysis', 'general'],
    pullCommand: 'ollama pull phi3:mini-128k-instruct-q4_K_M',
    downloadUrl: 'https://huggingface.co/microsoft/Phi-3-mini-128k-instruct',
    minSystemMemoryGB: 8,
    minGpuMemoryGB: 4,
    strengths: ['Massive context', 'Very efficient', 'Good for long documents', 'Fast inference'],
    limitations: ['Smaller model limits complexity', 'Weaker on specialized tasks'],
    license: 'MIT',
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
  // Try Electron systeminformation first for accurate GPU detection
  if (typeof process !== 'undefined' && process.versions?.electron) {
    try {
      const si = require('systeminformation');
      const graphics = await si.graphics();
      
      if (graphics && graphics.controllers && graphics.controllers.length > 0) {
        // Find discrete GPU (prefer NVIDIA, AMD, or non-Intel)
        let discreteGPU = graphics.controllers.find((gpu: any) => {
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
      console.warn('Failed to detect GPU via systeminformation:', error);
      // Fall through to browser APIs
    }
  }

  // Fallback to browser APIs
  if (typeof navigator === 'undefined') {
    return { name: null, memoryGB: null, isDiscrete: true }; // Default to discrete GPU
  }

  try {
    if ('gpu' in navigator && typeof (navigator as any).gpu?.requestAdapter === 'function') {
      const adapter = await (navigator as any).gpu.requestAdapter() as any;
      if (adapter) {
        const name = (adapter as any).name || null;
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
      console.warn('Failed to detect hardware via systeminformation:', error);
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

  // Boost for Unsloth Dynamic 2.0 models
  if (entry.optimizationMethod === 'unsloth-dynamic-2.0') {
    score += 20;
    reasons.push('Unsloth Dynamic 2.0 optimization - Better accuracy at same size');
  }

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

    // Get the provider for this model
    const provider = llmRouter.getProvider(entry.provider);
    if (!provider) {
      results.push({
        modelId,
        modelName: entry.displayName,
        provider: entry.provider,
        measurements: [],
        averageLatencyMs: null,
        averageThroughput: null,
        status: 'error',
        error: `Provider ${entry.provider} not available`,
        startedAt,
        completedAt: new Date().toISOString(),
      });
      continue;
    }

    // Check if provider is healthy
    const isHealthy = await provider.healthCheck();
    if (!isHealthy) {
      results.push({
        modelId,
        modelName: entry.displayName,
        provider: entry.provider,
        measurements: [],
        averageLatencyMs: null,
        averageThroughput: null,
        status: 'error',
        error: `Provider ${entry.provider} is offline`,
        startedAt,
        completedAt: new Date().toISOString(),
      });
      continue;
    }

    // Get actual model name from provider (catalog ID might differ from provider model ID)
    let actualModelId = entry.id;
    try {
      const providerModels = await provider.getModels();
      // Try to find matching model by name or use catalog ID
      const matchingModel = providerModels.find(
        (m) => m.id === entry.id || m.name.toLowerCase().includes(entry.displayName.toLowerCase())
      );
      if (matchingModel) {
        actualModelId = matchingModel.id;
      }
    } catch (err) {
      // If we can't get models, use catalog ID as fallback
      console.warn(`Could not get models from ${entry.provider}, using catalog ID:`, err);
    }

    let error: string | undefined;
    for (let run = 0; run < runs; run += 1) {
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        // Set preferred provider temporarily for this benchmark
        const originalPreferred = llmRouter.getPreferredProvider();
        llmRouter.setPreferredProvider(entry.provider as any);
        
        const response = await provider.generate(prompt, {
          model: actualModelId,
          temperature: 0.91,
          maxTokens: 64,
        });
        
        // Restore original preferred provider
        if (originalPreferred) {
          llmRouter.setPreferredProvider(originalPreferred);
        }
        
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
        // Restore original preferred provider on error
        const originalPreferred = llmRouter.getPreferredProvider();
        if (originalPreferred && originalPreferred !== entry.provider) {
          llmRouter.setPreferredProvider(originalPreferred);
        }
        
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

export async function detectStorageDrivers(): Promise<StorageDriversStatus> {
  const controllers: StorageController[] = [];
  const drivers: DriverInfo[] = [];

  // Try Electron systeminformation for storage detection
  if (typeof process !== 'undefined' && process.versions?.electron) {
    try {
      const si = require('systeminformation');
      const diskLayout = await si.diskLayout().catch(() => []);
      const usb = await si.usb().catch(() => []);

      // Process disk layout for storage controllers
      if (diskLayout && diskLayout.length > 0) {
        for (const disk of diskLayout) {
          const controller: StorageController = {
            name: disk.name || 'Unknown Storage',
            type: disk.type || disk.interfaceType || 'Unknown',
            interfaceType: disk.interfaceType,
            model: disk.model,
            vendor: disk.vendor,
            driverInstalled: true, // If disk is detected, driver is likely installed
          };

          // Check for NVMe drivers specifically
          if (disk.type === 'NVMe' || disk.interfaceType === 'NVMe') {
            controller.driverInstalled = true;
            drivers.push({
              name: 'NVMe Driver',
              version: null,
              installed: true,
              type: 'storage',
              description: `NVMe controller driver for ${disk.model || 'storage device'}`,
            });
          }

          controllers.push(controller);
        }
      }

      // Check for USB storage drivers
      if (usb && usb.length > 0) {
        const usbStorage = usb.filter((device: any) => 
          device.type && device.type.toLowerCase().includes('storage')
        );
        if (usbStorage.length > 0) {
          drivers.push({
            name: 'USB Storage Driver',
            version: null,
            installed: true,
            type: 'storage',
            description: 'USB mass storage driver',
          });
        }
      }
    } catch (error) {
      console.warn('Failed to detect storage drivers:', error);
    }
  }

  // Check for Micron NVMe driver (based on project file)
  // This is a placeholder - in a real implementation, you'd check Windows registry
  // or system files for installed drivers
  if (typeof process !== 'undefined' && process.platform === 'win32') {
    try {
      // Check if Micron NVMe driver might be installed
      // In a real implementation, query Windows registry:
      // HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\stornvme
      drivers.push({
        name: 'Micron NVMe Driver',
        version: null,
        installed: false, // Would check registry in real implementation
        type: 'storage',
        description: 'Micron NVMe storage driver (MicronNVMeDrivers_x64.msi)',
      });
    } catch {
      // Ignore errors
    }
  }

  return {
    controllers,
    drivers,
    lastChecked: new Date().toISOString(),
  };
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
  detectStorageDrivers,
  cleanTempFiles,
  cleanCache,
  deepCleanSystem,
};

