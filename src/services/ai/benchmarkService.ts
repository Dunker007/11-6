/**
 * Benchmark Service
 * 
 * Provides benchmarking functionality for LLM models to measure latency and throughput.
 */

import { llmRouter } from './router';
import { logger } from '../logging/loggerService';
import { getModelCatalog } from './modelCatalogService';
import type {
  BenchmarkRequest,
  BenchmarkResult,
  BenchmarkMeasurement,
} from '@/types/optimizer';

const DEFAULT_BENCHMARK_PROMPT =
  'Respond with a short confirmation message that says "Benchmark OK". This is a latency measurement request.';

export async function runBenchmark(request: BenchmarkRequest): Promise<BenchmarkResult[]> {
  const prompt = request.prompt || DEFAULT_BENCHMARK_PROMPT;
  const runs = request.runs && request.runs > 0 ? request.runs : 1;
  const catalogById = new Map(getModelCatalog().map((entry) => [entry.id, entry]));
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
      logger.warn(`Could not get models from ${entry.provider}, using catalog ID:`, { error: err });
    }

    let error: string | undefined;
    for (let run = 0; run < runs; run += 1) {
      const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        // Set preferred provider temporarily for this benchmark
        const originalPreferred = llmRouter.getPreferredProvider();
        llmRouter.setPreferredProvider(entry.provider as 'ollama' | 'lmstudio' | 'gemini');
        
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

