export interface ThresholdStatus {
  currentProfit: number;
  threshold: number;
  isGracePeriod: boolean;
  daysUntilThreshold?: number;
  projectedThresholdDate?: Date;
}

export interface ThresholdAlert {
  id: string;
  type: 'approaching' | 'reached' | 'exceeded';
  message: string;
  actions: string[];
  timestamp: Date;
}

export class ThresholdService {
  private static instance: ThresholdService;
  private threshold: number = 5000; // $5k default

  private constructor() {}

  static getInstance(): ThresholdService {
    if (!ThresholdService.instance) {
      ThresholdService.instance = new ThresholdService();
    }
    return ThresholdService.instance;
  }

  calculateProfit(income: number, expenses: number): number {
    return income - expenses;
  }

  checkThreshold(income: number, expenses: number): ThresholdStatus {
    const profit = this.calculateProfit(income, expenses);
    const isGracePeriod = profit < this.threshold;

    // Calculate projection if we're in grace period
    let daysUntilThreshold: number | undefined;
    let projectedThresholdDate: Date | undefined;

    if (isGracePeriod && income > 0) {
      // Simple projection: assume current monthly income rate
      const monthlyIncome = income; // This would be calculated from time period
      const monthlyProfit = monthlyIncome - expenses;
      if (monthlyProfit > 0) {
        // Determine how much profit is still needed and convert that to days at the current run rate.
        const remainingProfit = this.threshold - profit;
        const daysNeeded = (remainingProfit / monthlyProfit) * 30;
        daysUntilThreshold = Math.ceil(daysNeeded);
        projectedThresholdDate = new Date();
        projectedThresholdDate.setDate(projectedThresholdDate.getDate() + daysNeeded);
      }
    }

    return {
      currentProfit: profit,
      threshold: this.threshold,
      isGracePeriod,
      daysUntilThreshold,
      projectedThresholdDate,
    };
  }

  generateAlert(status: ThresholdStatus): ThresholdAlert | null {
    const profit = status.currentProfit;
    const percentage = (profit / this.threshold) * 100;

    // Approaching threshold (80% of way there)
    if (profit >= this.threshold * 0.8 && profit < this.threshold) {
      return {
        id: crypto.randomUUID(),
        type: 'approaching',
        message: `You're approaching the $5k profit threshold (${percentage.toFixed(1)}% there). Start preparing for incorporation and serious reporting.`,
        actions: [
          'Review legal documents in Lawyer Agent',
          'Schedule lawyer consultation',
          'Prepare incorporation documents',
          'Set up proper income reporting system',
        ],
        timestamp: new Date(),
      };
    }

    // Reached threshold
    if (profit >= this.threshold && profit < this.threshold * 1.1) {
      return {
        id: crypto.randomUUID(),
        type: 'reached',
        message: `Congratulations! You've reached $5k profit. Time to get serious about incorporation and income reporting.`,
        actions: [
          'Schedule lawyer meeting immediately',
          'File for LLC or appropriate business entity',
          'Set up proper accounting system',
          'Begin formal income reporting',
          'Review all compliance requirements',
        ],
        timestamp: new Date(),
      };
    }

    // Exceeded threshold significantly
    if (profit >= this.threshold * 1.1) {
      return {
        id: crypto.randomUUID(),
        type: 'exceeded',
        message: `You've exceeded the threshold significantly. Incorporation and proper reporting should be a priority.`,
        actions: [
          'URGENT: Schedule lawyer meeting',
          'File for business entity ASAP',
          'Set up proper tax reporting',
          'Review all legal compliance',
        ],
        timestamp: new Date(),
      };
    }

    return null;
  }

  getGracePeriodMessage(status: ThresholdStatus): string {
    if (status.isGracePeriod) {
      const remaining = this.threshold - status.currentProfit;
      if (status.daysUntilThreshold) {
        return `Grace Period Active: $${remaining.toFixed(2)} until threshold. Estimated ${status.daysUntilThreshold} days away. Focus on building - compliance framework is being prepared.`;
      }
      return `Grace Period Active: $${remaining.toFixed(2)} until threshold. Track everything, build framework, no enforcement pressure yet.`;
    }
    return 'Threshold Reached: Time to get serious about incorporation and reporting.';
  }

  setThreshold(amount: number): void {
    this.threshold = amount;
  }

  getThreshold(): number {
    return this.threshold;
  }
}

export const thresholdService = ThresholdService.getInstance();

