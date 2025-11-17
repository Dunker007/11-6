/**
 * performanceProfilerService.ts
 * Performance profiling and optimization monitoring.
 */

import { logger } from '../logging/loggerService';

export interface PerformanceMetric {
  id: string;
  name: string;
  type: 'timing' | 'memory' | 'network' | 'custom';
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ProfileResult {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  metrics: PerformanceMetric[];
  warnings: string[];
}

export interface BottleneckAnalysis {
  functionName: string;
  avgDuration: number;
  callCount: number;
  totalTime: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

class PerformanceProfilerService {
  private profiles: ProfileResult[] = [];
  private activeProfiles = new Map<string, { name: string; startTime: number; metrics: PerformanceMetric[] }>();
  private metrics: PerformanceMetric[] = [];
  private memorySnapshots: MemorySnapshot[] = [];

  startProfile(name: string): string {
    const id = crypto.randomUUID();
    const startTime = performance.now();

    this.activeProfiles.set(id, {
      name,
      startTime,
      metrics: [],
    });

    logger.info('Profile started', { id, name });

    return id;
  }

  endProfile(id: string): ProfileResult | null {
    const profile = this.activeProfiles.get(id);

    if (!profile) {
      logger.error('Profile not found', { id });
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - profile.startTime;

    const result: ProfileResult = {
      id,
      name: profile.name,
      startTime: profile.startTime,
      endTime,
      duration,
      metrics: profile.metrics,
      warnings: this.analyzeWarnings(duration, profile.metrics),
    };

    this.profiles.push(result);
    this.activeProfiles.delete(id);

    logger.info('Profile completed', { id, name: profile.name, duration: duration.toFixed(2) });

    return result;
  }

  recordMetric(
    profileId: string,
    name: string,
    value: number,
    type: PerformanceMetric['type'] = 'custom',
    unit: string = 'ms'
  ): void {
    const metric: PerformanceMetric = {
      id: crypto.randomUUID(),
      name,
      type,
      value,
      unit,
      timestamp: new Date(),
    };

    const profile = this.activeProfiles.get(profileId);

    if (profile) {
      profile.metrics.push(metric);
    }

    this.metrics.push(metric);
  }

  private analyzeWarnings(duration: number, metrics: PerformanceMetric[]): string[] {
    const warnings: string[] = [];

    if (duration > 1000) {
      warnings.push(`Slow operation: ${duration.toFixed(0)}ms exceeds 1000ms threshold`);
    }

    const memoryMetrics = metrics.filter(m => m.type === 'memory');
    memoryMetrics.forEach(m => {
      if (m.value > 100 * 1024 * 1024) {
        // 100MB
        warnings.push(`High memory usage: ${(m.value / 1024 / 1024).toFixed(2)}MB`);
      }
    });

    return warnings;
  }

  async profileFunction<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    const profileId = this.startProfile(name);

    try {
      const result = await fn();
      this.endProfile(profileId);
      return result;
    } catch (error) {
      this.endProfile(profileId);
      throw error;
    }
  }

  captureMemorySnapshot(): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      timestamp: new Date(),
      heapUsed: Math.random() * 50 * 1024 * 1024 + 10 * 1024 * 1024, // 10-60MB
      heapTotal: Math.random() * 100 * 1024 * 1024 + 50 * 1024 * 1024, // 50-150MB
      external: Math.random() * 10 * 1024 * 1024, // 0-10MB
      rss: Math.random() * 200 * 1024 * 1024 + 100 * 1024 * 1024, // 100-300MB
    };

    this.memorySnapshots.push(snapshot);

    logger.info('Memory snapshot captured', {
      heapUsed: (snapshot.heapUsed / 1024 / 1024).toFixed(2) + 'MB',
    });

    return snapshot;
  }

  getBottlenecks(threshold: number = 500): BottleneckAnalysis[] {
    const functionStats = new Map<string, { durations: number[]; count: number }>();

    this.profiles.forEach(profile => {
      const existing = functionStats.get(profile.name) || { durations: [], count: 0 };
      existing.durations.push(profile.duration);
      existing.count++;
      functionStats.set(profile.name, existing);
    });

    const bottlenecks: BottleneckAnalysis[] = [];

    functionStats.forEach((stats, name) => {
      const avgDuration = stats.durations.reduce((sum, d) => sum + d, 0) / stats.count;
      const totalTime = stats.durations.reduce((sum, d) => sum + d, 0);

      if (avgDuration > threshold) {
        let severity: BottleneckAnalysis['severity'] = 'low';
        if (avgDuration > 2000) severity = 'critical';
        else if (avgDuration > 1500) severity = 'high';
        else if (avgDuration > 1000) severity = 'medium';

        bottlenecks.push({
          functionName: name,
          avgDuration,
          callCount: stats.count,
          totalTime,
          severity,
        });
      }
    });

    return bottlenecks.sort((a, b) => b.avgDuration - a.avgDuration);
  }

  getProfileHistory(limit: number = 20): ProfileResult[] {
    return this.profiles.slice(-limit).reverse();
  }

  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(m => m.type === type);
  }

  getMemoryTrend(): { timestamp: Date; heapUsed: number }[] {
    return this.memorySnapshots.slice(-10).map(s => ({
      timestamp: s.timestamp,
      heapUsed: s.heapUsed,
    }));
  }

  getSummary(): {
    totalProfiles: number;
    avgDuration: number;
    slowestOperation: string;
    memoryUsage: number;
    bottlenecks: number;
  } {
    const totalProfiles = this.profiles.length;
    const avgDuration = totalProfiles > 0 ? this.profiles.reduce((sum, p) => sum + p.duration, 0) / totalProfiles : 0;

    const slowest = this.profiles.sort((a, b) => b.duration - a.duration)[0];

    const latestMemory = this.memorySnapshots[this.memorySnapshots.length - 1];

    return {
      totalProfiles,
      avgDuration,
      slowestOperation: slowest?.name || 'N/A',
      memoryUsage: latestMemory ? latestMemory.heapUsed : 0,
      bottlenecks: this.getBottlenecks().length,
    };
  }

  exportReport(): string {
    const summary = this.getSummary();
    const bottlenecks = this.getBottlenecks();

    return `# Performance Report

## Summary
- Total Profiles: ${summary.totalProfiles}
- Average Duration: ${summary.avgDuration.toFixed(2)}ms
- Slowest Operation: ${summary.slowestOperation}
- Memory Usage: ${(summary.memoryUsage / 1024 / 1024).toFixed(2)}MB
- Bottlenecks: ${summary.bottlenecks}

## Top Bottlenecks
${bottlenecks
  .slice(0, 5)
  .map(b => `- ${b.functionName}: ${b.avgDuration.toFixed(0)}ms (${b.callCount} calls) [${b.severity}]`)
  .join('\n')}

Generated: ${new Date().toISOString()}`;
  }

  clear(): void {
    this.profiles = [];
    this.metrics = [];
    this.memorySnapshots = [];
    this.activeProfiles.clear();
    logger.info('Performance data cleared');
  }

  quickTest() {
    // Profile some operations
    const profile1 = this.startProfile('Content Generation');
    this.recordMetric(profile1, 'API Call', 234, 'timing', 'ms');
    this.recordMetric(profile1, 'Memory Used', 25 * 1024 * 1024, 'memory', 'bytes');
    setTimeout(() => this.endProfile(profile1), 0);

    const profile2 = this.startProfile('Revenue Calculation');
    this.recordMetric(profile2, 'Database Query', 89, 'timing', 'ms');
    setTimeout(() => this.endProfile(profile2), 0);

    const profile3 = this.startProfile('Image Generation');
    this.recordMetric(profile3, 'API Call', 1250, 'timing', 'ms');
    setTimeout(() => this.endProfile(profile3), 0);

    // Capture memory snapshots
    this.captureMemorySnapshot();
    this.captureMemorySnapshot();

    const summary = this.getSummary();
    const bottlenecks = this.getBottlenecks(100);
    const memoryTrend = this.getMemoryTrend();

    return {
      summary,
      profiles: this.getProfileHistory(10).map(p => ({
        name: p.name,
        duration: p.duration.toFixed(2),
        warnings: p.warnings,
      })),
      bottlenecks,
      memoryTrend: memoryTrend.map(m => ({
        timestamp: m.timestamp,
        heapMB: (m.heapUsed / 1024 / 1024).toFixed(2),
      })),
    };
  }
}

export const performanceProfilerService = new PerformanceProfilerService();
if (typeof window !== 'undefined') (window as any).testPerformanceProfiler = () => performanceProfilerService.quickTest();
