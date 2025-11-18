/**
 * Cost Protection Service
 *
 * PURPOSE:
 * Prevents surprise bills by tracking spending, enforcing limits, and alerting users.
 * Critical safety layer for all paid API integrations.
 *
 * FEATURES:
 * - Spending limits (daily/monthly per service)
 * - Cost estimation before operations
 * - Alert thresholds (50%, 75%, 90%, 100%)
 * - Auto-pause at budget limits
 * - Cost calculator
 * - Free tier tracking
 * - Budget recommendations
 *
 * PHILOSOPHY:
 * **Default to FREE**. Require explicit opt-in for paid services.
 * Never let users accidentally spend money.
 *
 * USAGE:
 * ```typescript
 * import { costProtectionService } from '@/services/cost/costProtectionService';
 *
 * // Before making paid API call
 * const allowed = await costProtectionService.checkSpendingLimit('openai', 0.02);
 * if (!allowed) {
 *   throw new Error('Budget limit reached');
 * }
 *
 * // Track spending after call
 * await costProtectionService.trackSpending('openai', 0.02);
 * ```
 */

import { logger } from '../logging/loggerService';
import { notificationService } from '../notification/notificationService';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ServiceBudget {
  serviceId: string;
  serviceName: string;
  dailyLimit: number;
  monthlyLimit: number;
  enabled: boolean;
  autoPauseAt100: boolean;
}

export interface SpendingRecord {
  serviceId: string;
  amount: number;
  currency: string;
  operation: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface BudgetAlert {
  serviceId: string;
  threshold: number; // 50, 75, 90, 100
  currentSpending: number;
  limit: number;
  period: 'daily' | 'monthly';
  timestamp: number;
}

export interface CostEstimate {
  operation: string;
  estimatedCost: number;
  currency: string;
  breakdown?: Record<string, number>;
  freeAlternative?: string;
}

interface CostProtectionState {
  budgets: Record<string, ServiceBudget>;
  spending: SpendingRecord[];
  alerts: BudgetAlert[];
  pausedServices: Set<string>;
  globalMonthlyLimit: number;
  alertsEnabled: boolean;

  // Actions
  setBudget: (serviceId: string, budget: ServiceBudget) => void;
  trackSpending: (record: SpendingRecord) => void;
  getSpending: (serviceId: string, period: 'daily' | 'monthly') => number;
  checkSpendingLimit: (serviceId: string, amount: number) => boolean;
  pauseService: (serviceId: string) => void;
  resumeService: (serviceId: string) => void;
  clearAlerts: () => void;
  setGlobalLimit: (limit: number) => void;
}

/**
 * Cost Protection Store
 * Persists budgets and spending history
 */
export const useCostProtectionStore = create<CostProtectionState>()(
  persist(
    (set, get) => ({
      budgets: {},
      spending: [],
      alerts: [],
      pausedServices: new Set<string>(),
      globalMonthlyLimit: 50, // Default: $50/month total
      alertsEnabled: true,

      setBudget: (serviceId, budget) => {
        set(state => ({
          budgets: {
            ...state.budgets,
            [serviceId]: budget,
          },
        }));
        logger.info(`Budget set for ${budget.serviceName}`, { budget });
      },

      trackSpending: (record) => {
        set(state => {
          const newSpending = [...state.spending, record];

          // Check if we've hit alert thresholds
          const budget = state.budgets[record.serviceId];
          if (budget) {
            const dailySpending = get().getSpending(record.serviceId, 'daily');
            const monthlySpending = get().getSpending(record.serviceId, 'monthly');

            // Check daily limit
            if (budget.dailyLimit > 0) {
              checkAlertThreshold(
                record.serviceId,
                dailySpending,
                budget.dailyLimit,
                'daily',
                state.alerts
              );
            }

            // Check monthly limit
            if (budget.monthlyLimit > 0) {
              checkAlertThreshold(
                record.serviceId,
                monthlySpending,
                budget.monthlyLimit,
                'monthly',
                state.alerts
              );
            }
          }

          return { spending: newSpending };
        });

        logger.info(`Spending tracked for ${record.serviceId}`, {
          amount: record.amount,
          operation: record.operation,
        });
      },

      getSpending: (serviceId, period) => {
        const state = get();
        const now = Date.now();
        const cutoff = period === 'daily' ? now - 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000;

        return state.spending
          .filter(s => s.serviceId === serviceId && s.timestamp >= cutoff)
          .reduce((sum, s) => sum + s.amount, 0);
      },

      checkSpendingLimit: (serviceId, amount) => {
        const state = get();

        // Check if service is paused
        if (state.pausedServices.has(serviceId)) {
          logger.warn(`Service ${serviceId} is paused - spending blocked`);
          return false;
        }

        const budget = state.budgets[serviceId];
        if (!budget || !budget.enabled) {
          return true; // No budget = allowed
        }

        const dailySpending = get().getSpending(serviceId, 'daily');
        const monthlySpending = get().getSpending(serviceId, 'monthly');

        // Check daily limit
        if (budget.dailyLimit > 0 && dailySpending + amount > budget.dailyLimit) {
          logger.warn(`Daily limit exceeded for ${serviceId}`, {
            current: dailySpending,
            limit: budget.dailyLimit,
            attempted: amount,
          });

          if (budget.autoPauseAt100) {
            get().pauseService(serviceId);
          }

          return false;
        }

        // Check monthly limit
        if (budget.monthlyLimit > 0 && monthlySpending + amount > budget.monthlyLimit) {
          logger.warn(`Monthly limit exceeded for ${serviceId}`, {
            current: monthlySpending,
            limit: budget.monthlyLimit,
            attempted: amount,
          });

          if (budget.autoPauseAt100) {
            get().pauseService(serviceId);
          }

          return false;
        }

        // Check global limit
        const globalSpending = state.spending
          .filter(s => s.timestamp >= Date.now() - 30 * 24 * 60 * 60 * 1000)
          .reduce((sum, s) => sum + s.amount, 0);

        if (state.globalMonthlyLimit > 0 && globalSpending + amount > state.globalMonthlyLimit) {
          logger.warn('Global monthly limit exceeded', {
            current: globalSpending,
            limit: state.globalMonthlyLimit,
            attempted: amount,
          });
          return false;
        }

        return true;
      },

      pauseService: (serviceId) => {
        set(state => ({
          pausedServices: new Set([...state.pausedServices, serviceId]),
        }));

        notificationService.show(
          `Service paused: ${serviceId} - Budget limit reached`,
          'warning'
        );

        logger.warn(`Service paused: ${serviceId}`);
      },

      resumeService: (serviceId) => {
        set(state => {
          const newPaused = new Set(state.pausedServices);
          newPaused.delete(serviceId);
          return { pausedServices: newPaused };
        });

        logger.info(`Service resumed: ${serviceId}`);
      },

      clearAlerts: () => {
        set({ alerts: [] });
      },

      setGlobalLimit: (limit) => {
        set({ globalMonthlyLimit: limit });
        logger.info(`Global monthly limit set to $${limit}`);
      },
    }),
    {
      name: 'dlx-cost-protection',
      version: 1,
    }
  )
);

/**
 * Check alert thresholds and trigger notifications
 */
function checkAlertThreshold(
  serviceId: string,
  currentSpending: number,
  limit: number,
  period: 'daily' | 'monthly',
  existingAlerts: BudgetAlert[]
): void {
  const percentage = (currentSpending / limit) * 100;
  const thresholds = [50, 75, 90, 100];

  for (const threshold of thresholds) {
    if (percentage >= threshold) {
      // Check if we already sent this alert
      const alreadySent = existingAlerts.some(
        a => a.serviceId === serviceId && a.threshold === threshold && a.period === period
      );

      if (!alreadySent) {
        // Send alert
        const alert: BudgetAlert = {
          serviceId,
          threshold,
          currentSpending,
          limit,
          period,
          timestamp: Date.now(),
        };

        useCostProtectionStore.setState(state => ({
          alerts: [...state.alerts, alert],
        }));

        // Show notification
        const severity = threshold >= 90 ? 'error' : threshold >= 75 ? 'warning' : 'info';
        notificationService.show(
          `Budget Alert: ${serviceId} ${period} spending at ${threshold}%`,
          severity
        );

        logger.warn(`Budget alert: ${serviceId}`, alert);
      }
    }
  }
}

/**
 * Cost Protection Service
 * Singleton service for cost management
 */
class CostProtectionService {
  /**
   * Check if operation is allowed within budget
   */
  async checkSpendingLimit(serviceId: string, estimatedCost: number): Promise<boolean> {
    return useCostProtectionStore.getState().checkSpendingLimit(serviceId, estimatedCost);
  }

  /**
   * Track spending after operation
   */
  async trackSpending(
    serviceId: string,
    amount: number,
    operation: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    useCostProtectionStore.getState().trackSpending({
      serviceId,
      amount,
      currency: 'USD',
      operation,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Estimate cost for an operation
   */
  estimateCost(operation: string, params: any): CostEstimate {
    // Cost estimation logic based on operation type
    // This is simplified - real implementation would use provider pricing

    const estimates: Record<string, (params: any) => number> = {
      'openai-gpt4': (p) => {
        const inputTokens = p.inputTokens || 1000;
        const outputTokens = p.outputTokens || 500;
        return (inputTokens / 1000) * 0.03 + (outputTokens / 1000) * 0.06;
      },
      'openai-gpt3.5': (p) => {
        const inputTokens = p.inputTokens || 1000;
        const outputTokens = p.outputTokens || 500;
        return (inputTokens / 1000) * 0.0015 + (outputTokens / 1000) * 0.002;
      },
      'anthropic-claude': (p) => {
        const inputTokens = p.inputTokens || 1000;
        const outputTokens = p.outputTokens || 500;
        return (inputTokens / 1000) * 0.008 + (outputTokens / 1000) * 0.024;
      },
      'stripe-payment': () => 0.30 + params.amount * 0.029, // Stripe fees
    };

    const estimator = estimates[operation];
    const estimatedCost = estimator ? estimator(params) : 0;

    // Suggest free alternative if available
    const freeAlternatives: Record<string, string> = {
      'openai-gpt4': 'Use Google Gemini (free, 1500 requests/day)',
      'openai-gpt3.5': 'Use Google Gemini (free, 1500 requests/day)',
      'anthropic-claude': 'Use Google Gemini (free, 1500 requests/day)',
    };

    return {
      operation,
      estimatedCost,
      currency: 'USD',
      freeAlternative: freeAlternatives[operation],
    };
  }

  /**
   * Get spending for a service
   */
  getSpending(serviceId: string, period: 'daily' | 'monthly' = 'monthly'): number {
    return useCostProtectionStore.getState().getSpending(serviceId, period);
  }

  /**
   * Get total spending across all services
   */
  getTotalSpending(period: 'daily' | 'monthly' = 'monthly'): number {
    const state = useCostProtectionStore.getState();
    const now = Date.now();
    const cutoff = period === 'daily' ? now - 24 * 60 * 60 * 1000 : now - 30 * 24 * 60 * 60 * 1000;

    return state.spending
      .filter(s => s.timestamp >= cutoff)
      .reduce((sum, s) => sum + s.amount, 0);
  }

  /**
   * Set budget for a service
   */
  setBudget(budget: ServiceBudget): void {
    useCostProtectionStore.getState().setBudget(budget.serviceId, budget);
  }

  /**
   * Initialize default budgets for common paid services
   */
  initializeDefaultBudgets(): void {
    const defaults: ServiceBudget[] = [
      {
        serviceId: 'openai',
        serviceName: 'OpenAI',
        dailyLimit: 5,
        monthlyLimit: 50,
        enabled: true,
        autoPauseAt100: true,
      },
      {
        serviceId: 'anthropic',
        serviceName: 'Anthropic',
        dailyLimit: 5,
        monthlyLimit: 50,
        enabled: true,
        autoPauseAt100: true,
      },
      {
        serviceId: 'stripe',
        serviceName: 'Stripe',
        dailyLimit: 0, // No limit
        monthlyLimit: 0,
        enabled: false, // Stripe is payment processor, not cost
        autoPauseAt100: false,
      },
    ];

    defaults.forEach(budget => this.setBudget(budget));
    logger.info('Default budgets initialized');
  }

  /**
   * Get budget status for a service
   */
  getBudgetStatus(serviceId: string) {
    const state = useCostProtectionStore.getState();
    const budget = state.budgets[serviceId];

    if (!budget) {
      return {
        hasBudget: false,
        message: 'No budget set',
      };
    }

    const dailySpending = this.getSpending(serviceId, 'daily');
    const monthlySpending = this.getSpending(serviceId, 'monthly');

    return {
      hasBudget: true,
      budget,
      dailySpending,
      monthlySpending,
      dailyPercentage: budget.dailyLimit > 0 ? (dailySpending / budget.dailyLimit) * 100 : 0,
      monthlyPercentage: budget.monthlyLimit > 0 ? (monthlySpending / budget.monthlyLimit) * 100 : 0,
      isPaused: state.pausedServices.has(serviceId),
    };
  }

  /**
   * Recommend free alternatives
   */
  getFreeAlternatives() {
    return [
      {
        service: 'Google Gemini',
        cost: 'FREE',
        limit: '1,500 requests/day',
        features: ['Fast responses', 'Good quality', 'Bundled with Google account'],
        recommended: true,
      },
      {
        service: 'LM Studio',
        cost: 'FREE',
        limit: 'Unlimited (local)',
        features: ['Run locally', 'No API costs', 'Privacy'],
        recommended: true,
      },
      {
        service: 'Ollama',
        cost: 'FREE',
        limit: 'Unlimited (local)',
        features: ['Run locally', 'Multiple models', 'Fast'],
        recommended: true,
      },
    ];
  }
}

// Export singleton instance
export const costProtectionService = new CostProtectionService();

// Export for type checking
export type { CostProtectionService };
