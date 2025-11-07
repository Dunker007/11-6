import * as si from 'systeminformation';

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

    return {
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
      disk: fsSize.map((disk) => ({
        total: disk.size,
        used: disk.used,
        free: disk.available,
        usage: (disk.used / disk.size) * 100,
      })),
      network: {
        interfaces: networkStats.map((iface) => ({
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
    };
  }

  async checkHealth(stats: SystemStats): Promise<HealthMetric[]> {
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

    // Update metrics map
    metrics.forEach((metric) => {
      this.metrics.set(metric.id, metric);
    });

    // Check for alerts
    this.checkAlerts(metrics);

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
        const existingAlert = this.alerts.find(
          (a) => a.metric === metric.id && !a.acknowledged
        );

        if (!existingAlert) {
          this.alerts.push({
            id: crypto.randomUUID(),
            metric: metric.id,
            message: `${metric.name} is ${metric.status}: ${metric.value}${metric.unit}`,
            severity: metric.status === 'critical' ? 'critical' : 'warning',
            timestamp: new Date(),
            acknowledged: false,
          });
        }
      }
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

export const healthMonitor = HealthMonitor.getInstance();

