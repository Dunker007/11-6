/**
 * Model Catalog Service
 * 
 * Manages the LLM model catalog and provides model recommendations based on
 * hardware profile, use case, and optimization priorities.
 */

import { llmRouter } from './router';
import type {
  HardwareProfile,
  ModelCatalogEntry,
  ModelRecommendation,
  OptimizationPriority,
  LLMUseCase,
  ModelAvailability,
} from '@/types/optimizer';

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
  reasoning: ['reasoning', 'thinking'],
};

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

export function getModelCatalog(): ModelCatalogEntry[] {
  return MODEL_CATALOG;
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

