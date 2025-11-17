/**
 * idleRevenueService.ts
 * Idle computing resource monetization service.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface ComputeResource {
  type: 'cpu' | 'gpu' | 'storage' | 'bandwidth';
  available: number;
  unit: string;
  utilizationPercent: number;
}

export interface IdleNetwork {
  id: string;
  name: string;
  type: 'storage' | 'compute' | 'scientific';
  description: string;
  paymentToken: string;
  estimatedEarnings: {
    hourly: number;
    daily: number;
    monthly: number;
  };
  requirements: {
    minCPU?: number;
    minGPU?: boolean;
    minStorage?: number;
    minBandwidth?: number;
  };
  status: 'available' | 'active' | 'paused' | 'unavailable';
  reputation?: number;
}

export interface EarningsHistory {
  networkId: string;
  timestamp: Date;
  amount: number;
  token: string;
  usdValue: number;
  taskType: string;
}

export interface PowerCost {
  cpuWatts: number;
  gpuWatts: number;
  costPerKWh: number;
  estimatedMonthlyCost: number;
}

export interface NetworkConfig {
  networkId: string;
  enabled: boolean;
  maxCPUUsage: number; // percentage
  maxGPUUsage: number; // percentage
  maxStorage: number; // GB
  schedule?: {
    enabled: boolean;
    activeHours: { start: number; end: number }[];
  };
}

class IdleRevenueService {
  private networks: IdleNetwork[] = [];
  private resources: ComputeResource[] = [];
  private earnings: EarningsHistory[] = [];
  private configurations = new Map<string, NetworkConfig>();
  private totalEarned: number = 0;

  initializeNetworks(): void {
    this.networks = [
      {
        id: 'filecoin',
        name: 'Filecoin',
        type: 'storage',
        description: 'Decentralized storage network - earn FIL by storing data',
        paymentToken: 'FIL',
        estimatedEarnings: {
          hourly: 0.05,
          daily: 1.2,
          monthly: 36.0,
        },
        requirements: {
          minStorage: 1000, // 1TB
          minBandwidth: 100, // 100 Mbps
        },
        status: 'available',
        reputation: 9.5,
      },
      {
        id: 'storj',
        name: 'Storj',
        type: 'storage',
        description: 'Decentralized cloud storage - earn STORJ tokens',
        paymentToken: 'STORJ',
        estimatedEarnings: {
          hourly: 0.03,
          daily: 0.72,
          monthly: 21.6,
        },
        requirements: {
          minStorage: 500, // 500GB
          minBandwidth: 50,
        },
        status: 'available',
        reputation: 9.2,
      },
      {
        id: 'golem',
        name: 'Golem Network',
        type: 'compute',
        description: 'Rent CPU/GPU power for rendering and computations',
        paymentToken: 'GLM',
        estimatedEarnings: {
          hourly: 0.15,
          daily: 3.6,
          monthly: 108.0,
        },
        requirements: {
          minCPU: 4, // cores
          minGPU: true,
        },
        status: 'available',
        reputation: 8.9,
      },
      {
        id: 'akash',
        name: 'Akash Network',
        type: 'compute',
        description: 'Decentralized cloud compute marketplace',
        paymentToken: 'AKT',
        estimatedEarnings: {
          hourly: 0.12,
          daily: 2.88,
          monthly: 86.4,
        },
        requirements: {
          minCPU: 2,
          minStorage: 20,
        },
        status: 'available',
        reputation: 8.7,
      },
      {
        id: 'folding',
        name: 'Folding@Home',
        type: 'scientific',
        description: 'Contribute to disease research (voluntary, reputation-based)',
        paymentToken: 'Points',
        estimatedEarnings: {
          hourly: 0.0,
          daily: 0.0,
          monthly: 0.0,
        },
        requirements: {
          minCPU: 1,
        },
        status: 'available',
        reputation: 10.0,
      },
      {
        id: 'render',
        name: 'Render Network',
        type: 'compute',
        description: 'GPU rendering for 3D graphics and AI',
        paymentToken: 'RNDR',
        estimatedEarnings: {
          hourly: 0.25,
          daily: 6.0,
          monthly: 180.0,
        },
        requirements: {
          minGPU: true,
        },
        status: 'available',
        reputation: 9.0,
      },
    ];

    logger.info('Idle computing networks initialized', { count: this.networks.length });
  }

  detectResources(): ComputeResource[] {
    // Simulate resource detection (in real app, would use system APIs)
    this.resources = [
      {
        type: 'cpu',
        available: 8,
        unit: 'cores',
        utilizationPercent: Math.random() * 40 + 10, // 10-50%
      },
      {
        type: 'gpu',
        available: 1,
        unit: 'units',
        utilizationPercent: Math.random() * 30 + 5, // 5-35%
      },
      {
        type: 'storage',
        available: Math.random() * 2000 + 500, // 500-2500 GB
        unit: 'GB',
        utilizationPercent: Math.random() * 60 + 20, // 20-80%
      },
      {
        type: 'bandwidth',
        available: Math.random() * 500 + 100, // 100-600 Mbps
        unit: 'Mbps',
        utilizationPercent: Math.random() * 20 + 5, // 5-25%
      },
    ];

    logger.info('System resources detected', {
      cpu: this.resources[0].available,
      gpu: this.resources[1].available,
      storage: this.resources[2].available,
      bandwidth: this.resources[3].available,
    });

    return this.resources;
  }

  getAvailableNetworks(): IdleNetwork[] {
    const resources = this.resources.length > 0 ? this.resources : this.detectResources();

    return this.networks.filter(network => {
      // Check if system meets requirements
      if (network.requirements.minCPU) {
        const cpu = resources.find(r => r.type === 'cpu');
        if (!cpu || cpu.available < network.requirements.minCPU) return false;
      }

      if (network.requirements.minGPU) {
        const gpu = resources.find(r => r.type === 'gpu');
        if (!gpu || gpu.available < 1) return false;
      }

      if (network.requirements.minStorage) {
        const storage = resources.find(r => r.type === 'storage');
        if (!storage || storage.available < network.requirements.minStorage) return false;
      }

      if (network.requirements.minBandwidth) {
        const bandwidth = resources.find(r => r.type === 'bandwidth');
        if (!bandwidth || bandwidth.available < network.requirements.minBandwidth) return false;
      }

      return true;
    });
  }

  calculatePotentialEarnings(): {
    hourly: number;
    daily: number;
    monthly: number;
    yearly: number;
  } {
    const available = this.getAvailableNetworks();

    const total = available.reduce(
      (sum, network) => {
        return {
          hourly: sum.hourly + network.estimatedEarnings.hourly,
          daily: sum.daily + network.estimatedEarnings.daily,
          monthly: sum.monthly + network.estimatedEarnings.monthly,
        };
      },
      { hourly: 0, daily: 0, monthly: 0 }
    );

    return {
      ...total,
      yearly: total.monthly * 12,
    };
  }

  joinNetwork(networkId: string, config?: Partial<NetworkConfig>): boolean {
    const network = this.networks.find(n => n.id === networkId);

    if (!network) {
      logger.error('Network not found', { networkId });
      return false;
    }

    const defaultConfig: NetworkConfig = {
      networkId,
      enabled: true,
      maxCPUUsage: 80,
      maxGPUUsage: 90,
      maxStorage: 1000,
      ...config,
    };

    this.configurations.set(networkId, defaultConfig);
    network.status = 'active';

    activityService.logActivity({
      type: 'idle_computing_joined',
      message: `Joined ${network.name}`,
      metadata: { networkId, estimatedMonthly: network.estimatedEarnings.monthly },
    });

    logger.info('Joined idle computing network', { networkId });

    return true;
  }

  leaveNetwork(networkId: string): boolean {
    const network = this.networks.find(n => n.id === networkId);

    if (!network) return false;

    this.configurations.delete(networkId);
    network.status = 'available';

    logger.info('Left idle computing network', { networkId });

    return true;
  }

  simulateEarnings(hours: number = 24): void {
    const activeNetworks = this.networks.filter(n => n.status === 'active');

    activeNetworks.forEach(network => {
      const hourlyEarnings = network.estimatedEarnings.hourly;

      for (let i = 0; i < hours; i++) {
        const earning: EarningsHistory = {
          networkId: network.id,
          timestamp: new Date(Date.now() - (hours - i) * 3600000),
          amount: hourlyEarnings * (0.8 + Math.random() * 0.4), // +/- 20%
          token: network.paymentToken,
          usdValue: hourlyEarnings * (0.8 + Math.random() * 0.4),
          taskType: this.getRandomTaskType(network.type),
        };

        this.earnings.push(earning);
        this.totalEarned += earning.usdValue;
      }
    });

    logger.info('Earnings simulated', { hours, totalEarned: this.totalEarned });
  }

  private getRandomTaskType(networkType: string): string {
    const types = {
      storage: ['Storage Provision', 'Data Retrieval', 'Data Sealing'],
      compute: ['CPU Task', 'GPU Rendering', 'Container Hosting'],
      scientific: ['Protein Folding', 'Disease Research', 'Climate Modeling'],
    };

    const taskTypes = types[networkType as keyof typeof types] || ['Generic Task'];
    return taskTypes[Math.floor(Math.random() * taskTypes.length)];
  }

  getEarningsHistory(networkId?: string, limit: number = 100): EarningsHistory[] {
    let filtered = this.earnings;

    if (networkId) {
      filtered = filtered.filter(e => e.networkId === networkId);
    }

    return filtered.slice(-limit).reverse();
  }

  getTotalEarnings(): {
    allTime: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byNetwork: Map<string, number>;
  } {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 3600000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const byNetwork = new Map<string, number>();

    let today = 0;
    let thisWeek = 0;
    let thisMonth = 0;

    this.earnings.forEach(earning => {
      const earnTime = earning.timestamp;

      if (earnTime >= todayStart) today += earning.usdValue;
      if (earnTime >= weekStart) thisWeek += earning.usdValue;
      if (earnTime >= monthStart) thisMonth += earning.usdValue;

      byNetwork.set(earning.networkId, (byNetwork.get(earning.networkId) || 0) + earning.usdValue);
    });

    return {
      allTime: this.totalEarned,
      today,
      thisWeek,
      thisMonth,
      byNetwork,
    };
  }

  calculatePowerCost(costPerKWh: number = 0.12): PowerCost {
    const config = Array.from(this.configurations.values());

    const cpuUsage = config.reduce((sum, c) => sum + c.maxCPUUsage, 0) / (config.length || 1);
    const gpuUsage = config.reduce((sum, c) => sum + c.maxGPUUsage, 0) / (config.length || 1);

    // Estimated power consumption
    const cpuWatts = (cpuUsage / 100) * 95; // Typical CPU TDP
    const gpuWatts = (gpuUsage / 100) * 250; // Typical GPU TDP

    const totalWatts = cpuWatts + gpuWatts;
    const monthlyKWh = (totalWatts * 24 * 30) / 1000;
    const estimatedMonthlyCost = monthlyKWh * costPerKWh;

    return {
      cpuWatts,
      gpuWatts,
      costPerKWh,
      estimatedMonthlyCost,
    };
  }

  getNetProfit(): { monthlyRevenue: number; monthlyCost: number; netProfit: number; roi: number } {
    const potential = this.calculatePotentialEarnings();
    const powerCost = this.calculatePowerCost();

    const monthlyRevenue = potential.monthly;
    const monthlyCost = powerCost.estimatedMonthlyCost;
    const netProfit = monthlyRevenue - monthlyCost;
    const roi = monthlyCost > 0 ? (netProfit / monthlyCost) * 100 : 0;

    return {
      monthlyRevenue,
      monthlyCost,
      netProfit,
      roi,
    };
  }

  getTopNetwork(): IdleNetwork | null {
    const available = this.getAvailableNetworks();

    if (available.length === 0) return null;

    return available.reduce((top, network) => {
      return network.estimatedEarnings.monthly > top.estimatedEarnings.monthly ? network : top;
    });
  }

  quickTest() {
    this.initializeNetworks();
    this.detectResources();

    // Join some networks
    this.joinNetwork('filecoin');
    this.joinNetwork('golem');
    this.joinNetwork('storj');

    // Simulate earnings
    this.simulateEarnings(72); // 3 days

    const available = this.getAvailableNetworks();
    const potential = this.calculatePotentialEarnings();
    const totalEarnings = this.getTotalEarnings();
    const powerCost = this.calculatePowerCost();
    const netProfit = this.getNetProfit();
    const topNetwork = this.getTopNetwork();

    return {
      resources: this.resources,
      availableNetworks: available.length,
      potential,
      totalEarnings: {
        allTime: totalEarnings.allTime.toFixed(2),
        today: totalEarnings.today.toFixed(2),
        thisWeek: totalEarnings.thisWeek.toFixed(2),
        thisMonth: totalEarnings.thisMonth.toFixed(2),
      },
      powerCost: {
        estimatedMonthlyCost: powerCost.estimatedMonthlyCost.toFixed(2),
      },
      netProfit: {
        monthlyRevenue: netProfit.monthlyRevenue.toFixed(2),
        monthlyCost: netProfit.monthlyCost.toFixed(2),
        netProfit: netProfit.netProfit.toFixed(2),
        roi: netProfit.roi.toFixed(1) + '%',
      },
      topNetwork: topNetwork?.name,
      activeNetworks: this.networks.filter(n => n.status === 'active').map(n => n.name),
    };
  }
}

export const idleRevenueService = new IdleRevenueService();
if (typeof window !== 'undefined') (window as any).testIdleRevenue = () => idleRevenueService.quickTest();
