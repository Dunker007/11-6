/**
 * conversionFunnelService.ts
 * Conversion funnel visualization and drop-off analysis.
 */

import { logger } from '../logging/loggerService';

export interface FunnelStep {
  name: string;
  visitors: number;
  dropOffRate: number;
  conversionRate: number;
}

export interface Funnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  totalVisitors: number;
  overallConversion: number;
}

class ConversionFunnelService {
  private funnels: Funnel[] = [];

  createFunnel(name: string, stepNames: string[]): Funnel {
    const funnel: Funnel = {
      id: crypto.randomUUID(),
      name,
      steps: stepNames.map(name => ({ name, visitors: 0, dropOffRate: 0, conversionRate: 0 })),
      totalVisitors: 0,
      overallConversion: 0,
    };

    this.funnels.push(funnel);
    return funnel;
  }

  trackStep(funnelId: string, stepIndex: number, visitors: number) {
    const funnel = this.funnels.find(f => f.id === funnelId);
    if (!funnel || !funnel.steps[stepIndex]) return;

    funnel.steps[stepIndex].visitors = visitors;

    if (stepIndex === 0) {
      funnel.totalVisitors = visitors;
    }

    this.calculateRates(funnel);
  }

  private calculateRates(funnel: Funnel) {
    funnel.steps.forEach((step, i) => {
      if (i === 0) {
        step.conversionRate = 100;
        step.dropOffRate = 0;
      } else {
        const previous = funnel.steps[i - 1];
        step.conversionRate = previous.visitors > 0 ? (step.visitors / previous.visitors) * 100 : 0;
        step.dropOffRate = 100 - step.conversionRate;
      }
    });

    const lastStep = funnel.steps[funnel.steps.length - 1];
    funnel.overallConversion = funnel.totalVisitors > 0 ? (lastStep.visitors / funnel.totalVisitors) * 100 : 0;
  }

  getBottlenecks(funnelId: string): FunnelStep[] {
    const funnel = this.funnels.find(f => f.id === funnelId);
    if (!funnel) return [];

    return [...funnel.steps].filter(s => s.dropOffRate > 30).sort((a, b) => b.dropOffRate - a.dropOffRate);
  }

  quickTest() {
    const funnel = this.createFunnel('Product Purchase', ['Landing', 'Product Page', 'Cart', 'Checkout', 'Purchase']);
    this.trackStep(funnel.id, 0, 1000);
    this.trackStep(funnel.id, 1, 650);
    this.trackStep(funnel.id, 2, 400);
    this.trackStep(funnel.id, 3, 280);
    this.trackStep(funnel.id, 4, 200);

    return {
      funnel: this.funnels.find(f => f.id === funnel.id),
      bottlenecks: this.getBottlenecks(funnel.id),
    };
  }
}

export const conversionFunnelService = new ConversionFunnelService();
if (typeof window !== 'undefined') (window as any).testConversionFunnel = () => conversionFunnelService.quickTest();
