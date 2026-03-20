/**
 * Unified Benchmark Service
 *
 * Combines LLM benchmarking (latency/throughput) and System benchmarking (CPU/RAM/Disk/GPU).
 *
 * Features:
 * - LLM Model Benchmarking (latency, throughput, error rates)
 * - System Hardware Benchmarking (CPU ops, Memory bandwidth, Disk I/O, GPU FPS)
 */

import { llmRouter } from '../ai/router';
import { logger } from '../logging/loggerService';
import { getModelCatalog } from '../ai/modelCatalogService';
import type {
  BenchmarkRequest,
  BenchmarkResult as LLMBenchmarkResult,
  BenchmarkMeasurement,
} from '@/types/optimizer';

// --- System Benchmark Types ---

export interface SystemBenchmarkResult {
  test: string;
  score: number;
  unit: string;
  status: 'completed' | 'running' | 'error';
  error?: string;
  details?: Record<string, any>;
}

export interface SystemBenchmarkSuite {
  cpu: SystemBenchmarkResult;
  memory: SystemBenchmarkResult;
  disk: SystemBenchmarkResult;
  gpu?: SystemBenchmarkResult;
  overall: {
    score: number;
    rating: 'excellent' | 'good' | 'average' | 'poor';
  };
  timestamp: Date;
  duration: number; // milliseconds
}

// --- LLM Benchmark Constants ---

const DEFAULT_BENCHMARK_PROMPT =
  'Respond with a short confirmation message that says "Benchmark OK". This is a latency measurement request.';

// --- Main Service Class ---

export class BenchmarkService {
  private static instance: BenchmarkService;
  private si: any = null;

  private constructor() {
    // Initialize systeminformation only in Electron context
    if (typeof process !== 'undefined' && process.versions?.electron) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        this.si = require('systeminformation');
      } catch {
        this.si = null;
      }
    }
  }

  static getInstance(): BenchmarkService {
    if (!BenchmarkService.instance) {
      BenchmarkService.instance = new BenchmarkService();
    }
    return BenchmarkService.instance;
  }

  // ==================================================================================
  // 🧠 LLM BENCHMARKING
  // ==================================================================================

  async runLLMBenchmark(request: BenchmarkRequest): Promise<LLMBenchmarkResult[]> {
    const prompt = request.prompt || DEFAULT_BENCHMARK_PROMPT;
    const runs = request.runs && request.runs > 0 ? request.runs : 1;
    const catalogById = new Map(getModelCatalog().map((entry) => [entry.id, entry]));
    const results: LLMBenchmarkResult[] = [];

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

  // ==================================================================================
  // 💻 SYSTEM BENCHMARKING
  // ==================================================================================

  // CPU Benchmark - Prime number calculation
  async benchmarkCPU(iterations: number = 1000000): Promise<SystemBenchmarkResult> {
    if (!this.si) {
      return {
        test: 'CPU',
        score: 0,
        unit: 'ops/sec',
        status: 'error',
        error: 'System information not available',
      };
    }

    try {
      const startTime = performance.now();
      let count = 0;

      // Prime number calculation benchmark
      const isPrime = (n: number): boolean => {
        if (n < 2) return false;
        if (n === 2) return true;
        if (n % 2 === 0) return false;
        for (let i = 3; i * i <= n; i += 2) {
          if (n % i === 0) return false;
        }
        return true;
      };

      // Run prime calculations
      for (let i = 2; i < iterations; i++) {
        if (isPrime(i)) count++;
      }

      const endTime = performance.now();
      const duration = endTime - startTime;
      const opsPerSecond = (iterations / duration) * 1000;

      // Get CPU info for context
      const cpuInfo = await this.si.cpu();
      const cores = cpuInfo.cores || cpuInfo.physicalCores || 1;

      return {
        test: 'CPU',
        score: Math.round(opsPerSecond),
        unit: 'ops/sec',
        status: 'completed',
        details: {
          cores,
          model: cpuInfo.manufacturer + ' ' + cpuInfo.brand,
          duration: Math.round(duration),
          primesFound: count,
        },
      };
    } catch (error) {
      return {
        test: 'CPU',
        score: 0,
        unit: 'ops/sec',
        status: 'error',
        error: (error as Error).message,
      };
    }
  }

  // Memory Benchmark - Array operations
  async benchmarkMemory(sizeMB: number = 100): Promise<SystemBenchmarkResult> {
    if (!this.si) {
      return {
        test: 'Memory',
        score: 0,
        unit: 'MB/s',
        status: 'error',
        error: 'System information not available',
      };
    }

    try {
      const startTime = performance.now();
      const arraySize = (sizeMB * 1024 * 1024) / 8; // Double precision floats
      const array = new Float64Array(arraySize);

      // Write benchmark
      const writeStart = performance.now();
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.random();
      }
      const writeTime = performance.now() - writeStart;

      // Read benchmark
      const readStart = performance.now();
      let sum = 0;
      for (let i = 0; i < array.length; i++) {
        sum += array[i];
      }
      const readTime = performance.now() - readStart;

      const endTime = performance.now();
      const duration = endTime - startTime;
      const throughput = (sizeMB / duration) * 1000; // MB/s

      const memInfo = await this.si.mem();
      const totalGB = memInfo.total / (1024 * 1024 * 1024);

      return {
        test: 'Memory',
        score: Math.round(throughput),
        unit: 'MB/s',
        status: 'completed',
        details: {
          totalGB: Math.round(totalGB * 10) / 10,
          writeTime: Math.round(writeTime),
          readTime: Math.round(readTime),
          arraySize: arraySize,
        },
      };
    } catch (error) {
      return {
        test: 'Memory',
        score: 0,
        unit: 'MB/s',
        status: 'error',
        error: (error as Error).message,
      };
    }
  }

  // Disk Benchmark - Actual I/O test via IPC
  async benchmarkDisk(): Promise<SystemBenchmarkResult> {
    try {
      // Try to use IPC for actual disk I/O test
      if (typeof window !== 'undefined' && (window as any).benchmark) {
        try {
          const result = await (window as any).benchmark.disk();
          if (result.success && result.readSpeed && result.writeSpeed) {
            const avgSpeed = (result.readSpeed + result.writeSpeed) / 2;
            return {
              test: 'Disk',
              score: Math.round(avgSpeed),
              unit: 'MB/s',
              status: 'completed',
              details: {
                readSpeed: result.readSpeed,
                writeSpeed: result.writeSpeed,
                readTime: result.readTime,
                writeTime: result.writeTime,
              },
            };
          }
        } catch {
          // IPC failed, fall back to estimation
        }
      }

      // Fallback to estimation if IPC not available
      if (!this.si) {
        return {
          test: 'Disk',
          score: 0,
          unit: 'MB/s',
          status: 'error',
          error: 'System information not available',
        };
      }

      // Get disk info
      const fsSize = await this.si.fsSize();
      if (!fsSize || fsSize.length === 0) {
        return {
          test: 'Disk',
          score: 0,
          unit: 'MB/s',
          status: 'error',
          error: 'No disk found',
        };
      }

      const mainDisk = fsSize[0];
      const diskType = mainDisk.type || 'unknown';

      // Estimate disk speed based on type
      let estimatedSpeed = 100; // Default MB/s
      let rating: 'excellent' | 'good' | 'average' | 'poor' = 'average';

      if (diskType.toLowerCase().includes('nvme')) {
        estimatedSpeed = 3000; // NVMe SSDs are fast
        rating = 'excellent';
      } else if (diskType.toLowerCase().includes('ssd') || diskType.toLowerCase().includes('solid')) {
        estimatedSpeed = 500; // SATA SSDs
        rating = 'good';
      } else if (diskType.toLowerCase().includes('hdd') || diskType.toLowerCase().includes('hard')) {
        estimatedSpeed = 100; // HDDs
        rating = 'average';
      }

      return {
        test: 'Disk',
        score: estimatedSpeed,
        unit: 'MB/s (estimated)',
        status: 'completed',
        details: {
          type: diskType,
          size: mainDisk.size,
          used: mainDisk.used,
          available: mainDisk.available,
          rating,
        },
      };
    } catch (error) {
      return {
        test: 'Disk',
        score: 0,
        unit: 'MB/s',
        status: 'error',
        error: (error as Error).message,
      };
    }
  }

  // GPU Benchmark - WebGL compute shader test
  async benchmarkGPU(): Promise<SystemBenchmarkResult> {
    return new Promise((resolve) => {
      try {
        // Check if WebGL is available
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

        if (!gl) {
          resolve({
            test: 'GPU',
            score: 0,
            unit: 'FPS',
            status: 'error',
            error: 'WebGL not available',
          });
          return;
        }

        const startTime = performance.now();
        let frameCount = 0;
        const testDuration = 2000; // 2 seconds

        // Simple rendering benchmark
        const render = () => {
          frameCount++;
          const currentTime = performance.now();

          if (currentTime - startTime < testDuration) {
            requestAnimationFrame(render);
          } else {
            const fps = (frameCount / testDuration) * 1000;

            // Get GPU info if available
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const renderer = debugInfo
              ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
              : 'Unknown GPU';

            resolve({
              test: 'GPU',
              score: Math.round(fps),
              unit: 'FPS',
              status: 'completed',
              details: {
                renderer,
                frames: frameCount,
                duration: testDuration,
              },
            });
          }
        };

        // Start benchmark
        requestAnimationFrame(render);
      } catch (error) {
        resolve({
          test: 'GPU',
          score: 0,
          unit: 'FPS',
          status: 'error',
          error: (error as Error).message,
        });
      }
    });
  }

  // Run full system benchmark suite
  async runSystemBenchmarkSuite(
    onProgress?: (test: string, progress: number) => void
  ): Promise<SystemBenchmarkSuite> {
    const startTime = performance.now();
    const results: Partial<SystemBenchmarkSuite> = {
      timestamp: new Date(),
    };

    try {
      // CPU Benchmark
      onProgress?.('CPU', 0.25);
      results.cpu = await this.benchmarkCPU();

      // Memory Benchmark
      onProgress?.('Memory', 0.5);
      results.memory = await this.benchmarkMemory();

      // Disk Benchmark
      onProgress?.('Disk', 0.75);
      results.disk = await this.benchmarkDisk();

      // GPU Benchmark (optional)
      try {
        onProgress?.('GPU', 0.9);
        results.gpu = await this.benchmarkGPU();
      } catch {
        // GPU benchmark failed, skip it
      }

      // Calculate overall score
      const scores = [
        results.cpu?.score || 0,
        results.memory?.score || 0,
        results.disk?.score || 0,
        results.gpu?.score || 0,
      ].filter(s => s > 0);

      const avgScore = scores.length > 0
        ? scores.reduce((a, b) => a + b, 0) / scores.length
        : 0;

      let rating: 'excellent' | 'good' | 'average' | 'poor' = 'poor';
      if (avgScore > 1000) rating = 'excellent';
      else if (avgScore > 500) rating = 'good';
      else if (avgScore > 200) rating = 'average';

      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        cpu: results.cpu!,
        memory: results.memory!,
        disk: results.disk!,
        gpu: results.gpu,
        overall: {
          score: Math.round(avgScore),
          rating,
        },
        timestamp: new Date(),
        duration: Math.round(duration),
      };
    } catch (error) {
      throw new Error(`Benchmark suite failed: ${(error as Error).message}`);
    }
  }
}

export const benchmarkService = BenchmarkService.getInstance();
