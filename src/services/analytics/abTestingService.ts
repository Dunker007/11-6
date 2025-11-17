/**
 * abTestingService.ts
 * A/B testing framework with statistical significance.
 */

import { logger } from '../logging/loggerService';

export interface ABTest {
  id: string;
  name: string;
  variants: { id: string; name: string; traffic: number }[];
  metric: string;
  status: 'draft' | 'running' | 'completed';
  results?: TestResults;
  startedAt?: Date;
  completedAt?: Date;
}

export interface TestResults {
  winner: string | null;
  confidence: number;
  variantResults: Map<string, { conversions: number; visitors: number; rate: number }>;
  significant: boolean;
}

class ABTestingService {
  private tests: ABTest[] = [];

  createTest(name: string, variants: string[], metric: string): ABTest {
    const test: ABTest = {
      id: crypto.randomUUID(),
      name,
      variants: variants.map((v, i) => ({ id: `var_${i}`, name: v, traffic: 100 / variants.length })),
      metric,
      status: 'draft',
    };

    this.tests.push(test);
    logger.info('A/B test created', { id: test.id, name });
    return test;
  }

  startTest(testId: string): boolean {
    const test = this.tests.find(t => t.id === testId);
    if (!test) return false;

    test.status = 'running';
    test.startedAt = new Date();
    logger.info('A/B test started', { id: testId });
    return true;
  }

  recordConversion(testId: string, variantId: string, converted: boolean) {
    const test = this.tests.find(t => t.id === testId);
    if (!test || test.status !== 'running') return;

    if (!test.results) {
      test.results = {
        winner: null,
        confidence: 0,
        variantResults: new Map(),
        significant: false,
      };
    }

    const existing = test.results.variantResults.get(variantId) || { conversions: 0, visitors: 0, rate: 0 };
    existing.visitors++;
    if (converted) existing.conversions++;
    existing.rate = (existing.conversions / existing.visitors) * 100;
    test.results.variantResults.set(variantId, existing);

    this.calculateSignificance(test);
  }

  private calculateSignificance(test: ABTest) {
    if (!test.results) return;

    const variants = Array.from(test.results.variantResults.entries());
    if (variants.length < 2) return;

    const [best] = variants.sort((a, b) => b[1].rate - a[1].rate);
    const sampleSize = variants.reduce((sum, [, data]) => sum + data.visitors, 0);

    test.results.confidence = Math.min(95, (sampleSize / 100) * 10);
    test.results.significant = test.results.confidence >= 95;
    test.results.winner = test.results.significant ? best[0] : null;
  }

  getTest(testId: string): ABTest | undefined {
    return this.tests.find(t => t.id === testId);
  }

  quickTest() {
    const test = this.createTest('Landing Page Headline', ['Version A', 'Version B'], 'conversions');
    this.startTest(test.id);

    for (let i = 0; i < 100; i++) {
      this.recordConversion(test.id, 'var_0', Math.random() > 0.7);
      this.recordConversion(test.id, 'var_1', Math.random() > 0.6);
    }

    return this.getTest(test.id);
  }
}

export const abTestingService = new ABTestingService();
if (typeof window !== 'undefined') (window as any).testABTesting = () => abTestingService.quickTest();
