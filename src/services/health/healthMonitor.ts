// Only import systeminformation in Electron context
// In browser, this will be null and we'll use mock data
let si: any = null;
if (typeof process !== 'undefined' && process.versions?.electron) {
  try {
    // Only require in Electron context
    si = require('systeminformation');
  } catch {
    // systeminformation not available
    si = null;
  }
}

import { logSlowOperation } from '@/utils/performance';

export interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  }[];
  network: {
    interfaces: {
      name: string;
      bytesReceived: number;
      bytesSent: number;
    }[];
  };
  processes: {
    total: number;
    running: number;
  };
  uptime: number;
  timestamp: Date;
  hostname?: string; // PC/Computer name
  gpu?: {
    name: string | null;
    memoryGB: number | null;
    utilization?: number; // GPU utilization percentage (0-100)
    memoryUsedGB?: number; // VRAM used in GB
    memoryTotalGB?: number; // Total VRAM in GB
    temperature?: number; // GPU temperature in Celsius
  };
}

export interface HealthMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  threshold: {
    warning: number;
    critical: number;
  };
  status: 'healthy' | 'warning' | 'critical';
  timestamp: Date;
}

export interface HealthAlert {
  id: string;
  metric: string;
  message: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
  metadata?: Record<string, any>;
}

export class HealthMonitor {
  private static instance: HealthMonitor;
  private metrics: Map<string, HealthMetric> = new Map();
  private alerts: HealthAlert[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  async getSystemStats(): Promise<SystemStats> {
    const start = performance.now();

    // Return mock data if systeminformation is not available (browser context)
    if (!si) {
      // Try to detect GPU via WebGL in browser
      let browserGPU: SystemStats['gpu'] | undefined;
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const webglContext = gl as WebGLRenderingContext;
          const debugInfo = webglContext.getExtension('WEBGL_debug_renderer_info');
          if (debugInfo) {
            const vendor = webglContext.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = webglContext.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            browserGPU = {
              name: renderer || vendor || 'Unknown GPU (Browser)',
              memoryGB: null,
              utilization: undefined,
              memoryUsedGB: undefined,
              memoryTotalGB: undefined,
              temperature: undefined,
            };
          }
        }
      } catch (error) {
        console.warn('Failed to detect GPU via WebGL:', error);
      }

      const fallbackStats: SystemStats = {
        cpu: {
          usage: 0,
          cores: 4,
          model: 'Unknown (Browser Mode)',
        },
        memory: {
          total: 0,
          used: 0,
          free: 0,
          usage: 0,
        },
        disk: [],
        network: {
          interfaces: [],
        },
        processes: {
          total: 0,
          running: 0,
        },
        uptime: 0,
        timestamp: new Date(),
        gpu: browserGPU,
      };

      logSlowOperation(
        'healthMonitor.getSystemStats',
        performance.now() - start,
        300,
        { systemInformationAvailable: false }
      );

      return fallbackStats;
    }

    // Gather hardware metrics concurrently to minimize collection latency.
    const [cpu, cpuInfo, mem, fsSize, networkStats, processes, time] = await Promise.all([
      si.currentLoad(),
      si.cpu(),
      si.mem(),
      si.fsSize(),
      si.networkStats(),
      si.processes(),
      si.time(),
    ]);

    const cpuTemp = await si.cpuTemperature().catch(() => ({ main: null }));
    const osInfo = await si.osInfo().catch(() => ({ hostname: null }));
    
    // Get GPU stats
    let gpuStats: SystemStats['gpu'] | undefined;
    try {
      const graphics = await si.graphics();
      if (graphics && graphics.controllers && graphics.controllers.length > 0) {
        // Find discrete GPU (prefer NVIDIA, AMD, or non-Intel)
        // Prefer discrete GPUs so we surface the most meaningful VRAM stats.
        let discreteGPU = graphics.controllers.find((gpu: any) => {
          const vendor = (gpu.vendor || '').toLowerCase();
          const model = (gpu.model || '').toLowerCase();
          return vendor.includes('nvidia') || 
                 vendor.includes('amd') || 
                 vendor.includes('ati') ||
                 (!vendor.includes('intel') && !model.includes('integrated'));
        });
        
          const gpu = discreteGPU || graphics.controllers[0];
        if (gpu) {
          const gpuName = gpu.model || gpu.vendor || 'Unknown GPU';
          const memoryTotalGB = gpu.memoryTotal ? Math.round(gpu.memoryTotal / 1024) : null;
          const memoryUsedGB = gpu.memoryUsed ? Math.round(gpu.memoryUsed / 1024) : null;
          const utilization = gpu.utilizationGPU || gpu.utilizationGpu || null;
          const temperature = gpu.temperatureGpu || gpu.temperature || null;
          
          gpuStats = {
            name: gpuName,
            memoryGB: memoryTotalGB,
            utilization: utilization !== null && utilization !== undefined ? utilization : undefined,
            memoryUsedGB: memoryUsedGB !== null && memoryUsedGB !== undefined ? memoryUsedGB : undefined,
            memoryTotalGB: memoryTotalGB !== null && memoryTotalGB !== undefined ? memoryTotalGB : undefined,
            temperature: temperature !== null && temperature !== undefined ? temperature : undefined,
          };
        }
      }
    } catch (error) {
      // GPU stats not available, continue without them
      console.warn('Failed to get GPU stats:', error);
    }

    const stats: SystemStats = {
      cpu: {
        usage: cpu.currentLoad,
        cores: cpu.cpus.length,
        model: cpuInfo.manufacturer + ' ' + cpuInfo.brand || 'Unknown',
        temperature: cpuTemp.main || undefined,
      },
      memory: {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        usage: (mem.used / mem.total) * 100,
      },
      disk: fsSize.map((disk: any) => ({
        total: disk.size,
        used: disk.used,
        free: disk.available,
        usage: (disk.used / disk.size) * 100,
      })),
      network: {
        interfaces: networkStats.map((iface: any) => ({
          name: iface.iface,
          bytesReceived: iface.rx_bytes,
          bytesSent: iface.tx_bytes,
        })),
      },
      processes: {
        total: processes.all,
        running: processes.running,
      },
      uptime: time.uptime,
      timestamp: new Date(),
      hostname: osInfo.hostname || undefined,
      gpu: gpuStats,
    };

    logSlowOperation(
      'healthMonitor.getSystemStats',
      performance.now() - start,
      300,
      { systemInformationAvailable: true, hasGpu: Boolean(gpuStats) }
    );

    return stats;
  }

  async checkHealth(stats: SystemStats): Promise<HealthMetric[]> {
    const start = performance.now();
    const metrics: HealthMetric[] = [];

    // CPU Usage
    metrics.push({
      id: 'cpu-usage',
      name: 'CPU Usage',
      value: stats.cpu.usage,
      unit: '%',
      threshold: { warning: 70, critical: 90 },
      status: this.getStatus(stats.cpu.usage, 70, 90),
      timestamp: stats.timestamp,
    });

    // Memory Usage
    metrics.push({
      id: 'memory-usage',
      name: 'Memory Usage',
      value: stats.memory.usage,
      unit: '%',
      threshold: { warning: 80, critical: 95 },
      status: this.getStatus(stats.memory.usage, 80, 95),
      timestamp: stats.timestamp,
    });

    // Disk Usage (check primary disk)
    if (stats.disk.length > 0) {
      const primaryDisk = stats.disk[0];
      metrics.push({
        id: 'disk-usage',
        name: 'Disk Usage',
        value: primaryDisk.usage,
        unit: '%',
        threshold: { warning: 85, critical: 95 },
        status: this.getStatus(primaryDisk.usage, 85, 95),
        timestamp: stats.timestamp,
      });
    }

    // CPU Temperature
    if (stats.cpu.temperature) {
      metrics.push({
        id: 'cpu-temperature',
        name: 'CPU Temperature',
        value: stats.cpu.temperature,
        unit: '°C',
        threshold: { warning: 70, critical: 85 },
        status: this.getStatus(stats.cpu.temperature, 70, 85),
        timestamp: stats.timestamp,
      });
    }

    // GPU Metrics
    if (stats.gpu) {
      // GPU Utilization
      if (stats.gpu.utilization !== undefined) {
        metrics.push({
          id: 'gpu-utilization',
          name: 'GPU Utilization',
          value: stats.gpu.utilization,
          unit: '%',
          threshold: { warning: 90, critical: 95 },
          status: this.getStatus(stats.gpu.utilization, 90, 95),
          timestamp: stats.timestamp,
        });
      }

      // GPU Temperature
      if (stats.gpu.temperature !== undefined) {
        metrics.push({
          id: 'gpu-temperature',
          name: 'GPU Temperature',
          value: stats.gpu.temperature,
          unit: '°C',
          threshold: { warning: 80, critical: 90 },
          status: this.getStatus(stats.gpu.temperature, 80, 90),
          timestamp: stats.timestamp,
        });
      }

      // VRAM Usage (Critical for LLM workloads)
      if (stats.gpu.memoryUsedGB !== undefined && stats.gpu.memoryTotalGB !== undefined) {
        const vramUsagePercent = (stats.gpu.memoryUsedGB / stats.gpu.memoryTotalGB) * 100;
        metrics.push({
          id: 'vram-usage',
          name: 'VRAM Usage',
          value: vramUsagePercent,
          unit: '%',
          threshold: { warning: 85, critical: 95 },
          status: this.getStatus(vramUsagePercent, 85, 95),
          timestamp: stats.timestamp,
        });

        // Proactive VRAM alert: warn when approaching critical threshold
        if (vramUsagePercent >= 90 && vramUsagePercent < 95) {
          this.createProactiveAlert(
            'vram-usage',
            `VRAM usage is high: ${stats.gpu.memoryUsedGB.toFixed(1)}GB / ${stats.gpu.memoryTotalGB}GB (${vramUsagePercent.toFixed(1)}%)`,
            'warning',
            {
              vramUsed: stats.gpu.memoryUsedGB,
              vramTotal: stats.gpu.memoryTotalGB,
              vramUsagePercent,
            }
          );
        }

        // Critical VRAM alert
        if (vramUsagePercent >= 95) {
          this.createProactiveAlert(
            'vram-usage-critical',
            `CRITICAL: VRAM nearly full! ${stats.gpu.memoryUsedGB.toFixed(1)}GB / ${stats.gpu.memoryTotalGB}GB (${vramUsagePercent.toFixed(1)}%)`,
            'critical',
            {
              vramUsed: stats.gpu.memoryUsedGB,
              vramTotal: stats.gpu.memoryTotalGB,
              vramUsagePercent,
            }
          );
        }
      }
    }

    // Update metrics map
    metrics.forEach((metric) => {
      this.metrics.set(metric.id, metric);
    });

    // Check for alerts
    this.checkAlerts(metrics);

    logSlowOperation(
      'healthMonitor.checkHealth',
      performance.now() - start,
      75,
      { metricCount: metrics.length, hasGpu: Boolean(stats.gpu) }
    );

    return metrics;
  }

  private getStatus(value: number, warning: number, critical: number): 'healthy' | 'warning' | 'critical' {
    if (value >= critical) return 'critical';
    if (value >= warning) return 'warning';
    return 'healthy';
  }

  private checkAlerts(metrics: HealthMetric[]): void {
    metrics.forEach((metric) => {
      if (metric.status === 'critical' || metric.status === 'warning') {
        // Persist at most one active alert per metric so we don't spam the UI each sample.
        const existingAlert = this.alerts.find(
          (a) => a.metric === metric.id && !a.acknowledged
        );

        if (!existingAlert) {
          this.createAlert(
            metric.id,
            `${metric.name} is ${metric.status}: ${metric.value}${metric.unit}`,
            metric.status === 'critical' ? 'critical' : 'warning'
          );
        } else {
          // Update existing alert message with current value
          // (prevents stale percentages while keeping acknowledgement state).
          existingAlert.message = `${metric.name} is ${metric.status}: ${metric.value}${metric.unit}`;
          existingAlert.timestamp = new Date();
        }
      }
    });
  }

  /**
   * Create a proactive alert (for VRAM and other critical metrics)
   */
  private createProactiveAlert(
    metric: string,
    message: string,
    severity: 'warning' | 'critical',
    metadata?: Record<string, any>
  ): void {
    const existingAlert = this.alerts.find(
      (a) => a.metric === metric && !a.acknowledged
    );

    if (!existingAlert) {
      this.createAlert(metric, message, severity, metadata);
    } else {
      // Update existing alert
      existingAlert.message = message;
      existingAlert.timestamp = new Date();
      if (metadata) {
        existingAlert.metadata = metadata;
      }
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(
    metric: string,
    message: string,
    severity: 'warning' | 'critical',
    metadata?: Record<string, any>
  ): void {
    this.alerts.push({
      id: crypto.randomUUID(),
      metric,
      message,
      severity,
      timestamp: new Date(),
      acknowledged: false,
      metadata,
    });
  }

  getAlerts(): HealthAlert[] {
    return this.alerts.filter((a) => !a.acknowledged);
  }

  acknowledgeAlert(id: string): void {
    const alert = this.alerts.find((a) => a.id === id);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  startMonitoring(intervalMs = 5000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(async () => {
      try {
        const stats = await this.getSystemStats();
        await this.checkHealth(stats);
      } catch (error) {
        console.error('Health monitoring error:', error);
      }
    }, intervalMs);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  getMetrics(): HealthMetric[] {
    return Array.from(this.metrics.values());
  }

  clearAlerts(): void {
    this.alerts = [];
  }
}

// Export singleton instance
const healthMonitorInstance = HealthMonitor.getInstance();
export { healthMonitorInstance as healthMonitor };

