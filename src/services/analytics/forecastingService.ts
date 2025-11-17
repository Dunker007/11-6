/**
 * forecastingService.ts
 * Revenue forecasting with confidence intervals and scenario planning.
 */

import { logger } from '../logging/loggerService';

export interface Forecast {
  period: string;
  predicted: number;
  low: number;
  high: number;
  confidence: number;
}

export interface Scenario {
  name: string;
  growthRate: number;
  forecast: Forecast[];
}

class ForecastingService {
  generateForecast(historicalData: number[], periods: number = 12): Forecast[] {
    const forecasts: Forecast[] = [];
    const avg = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const trend = (historicalData[historicalData.length - 1] - historicalData[0]) / historicalData.length;

    for (let i = 1; i <= periods; i++) {
      const predicted = avg + (trend * (historicalData.length + i));
      const confidence = Math.max(50, 95 - (i * 2));
      const variance = predicted * (0.2 + (i * 0.05));

      forecasts.push({
        period: `Month ${i}`,
        predicted: Math.round(predicted),
        low: Math.round(predicted - variance),
        high: Math.round(predicted + variance),
        confidence,
      });
    }

    return forecasts;
  }

  generateScenarios(baseRevenue: number): Scenario[] {
    return [
      { name: 'Conservative', growthRate: 0.05, forecast: this.projectScenario(baseRevenue, 0.05, 12) },
      { name: 'Moderate', growthRate: 0.15, forecast: this.projectScenario(baseRevenue, 0.15, 12) },
      { name: 'Aggressive', growthRate: 0.30, forecast: this.projectScenario(baseRevenue, 0.30, 12) },
    ];
  }

  private projectScenario(base: number, growthRate: number, periods: number): Forecast[] {
    const forecasts: Forecast[] = [];
    let current = base;

    for (let i = 1; i <= periods; i++) {
      current *= (1 + growthRate);
      forecasts.push({
        period: `Month ${i}`,
        predicted: Math.round(current),
        low: Math.round(current * 0.8),
        high: Math.round(current * 1.2),
        confidence: 80,
      });
    }

    return forecasts;
  }

  quickTest() {
    const historical = [5000, 5500, 6000, 6200, 7000, 7500, 8000, 8500];
    return {
      forecast: this.generateForecast(historical, 6),
      scenarios: this.generateScenarios(8500),
    };
  }
}

export const forecastingService = new ForecastingService();
if (typeof window !== 'undefined') (window as any).testForecasting = () => forecastingService.quickTest();
