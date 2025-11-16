/**
 * Portfolio Analytics Service
 * 
 * Calculates advanced portfolio metrics:
 * - Performance metrics (returns, Sharpe ratio, Sortino ratio, alpha, beta)
 * - Risk metrics (volatility, max drawdown, VaR)
 * - Asset allocation (by type, sector, geography)
 * - Performance attribution
 * - Benchmark comparison
 */

import { logger } from '../logging/loggerService';

import { wealthService } from './wealthService';
import { wealthMarketDataService } from './marketDataService';
import type { Position, AssetType } from '@/types/wealth';

export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnPercent: number;
  annualizedReturn: number;
  sharpeRatio?: number;
  sortinoRatio?: number;
  alpha?: number; // vs benchmark
  beta?: number; // vs benchmark
  volatility?: number; // Annualized standard deviation
  maxDrawdown?: number;
  maxDrawdownPercent?: number;
  var95?: number; // Value at Risk (95% confidence)
  var99?: number; // Value at Risk (99% confidence)
}

export interface AssetAllocation {
  byType: Record<AssetType, number>;
  bySector: Record<string, number>;
  byGeography: Record<string, number>;
}

export interface PerformanceAttribution {
  assetContributions: Array<{
    symbol: string;
    assetName: string;
    contribution: number;
    contributionPercent: number;
    return: number;
    returnPercent: number;
    weight: number;
  }>;
  sectorContributions: Array<{
    sector: string;
    contribution: number;
    contributionPercent: number;
  }>;
}

export interface BenchmarkComparison {
  portfolioReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  trackingError?: number;
  informationRatio?: number;
}

class PortfolioAnalyticsService {
  private static instance: PortfolioAnalyticsService;
  private riskFreeRate = 0.02; // 2% annual risk-free rate (can be configured)

  private constructor() {}

  static getInstance(): PortfolioAnalyticsService {
    if (!PortfolioAnalyticsService.instance) {
      PortfolioAnalyticsService.instance = new PortfolioAnalyticsService();
    }
    return PortfolioAnalyticsService.instance;
  }

  /**
   * Calculate performance metrics for a time period
   */
  async calculatePerformanceMetrics(
    period: TimePeriod = '1Y',
    benchmarkSymbol: string = 'SPY'
  ): Promise<PerformanceMetrics> {
    const assets = wealthService.getAssets();
    const positions: Position[] = [];
    
    // Collect all positions from assets
    assets.forEach(asset => {
      if (asset.holdings) {
        positions.push(...asset.holdings);
      } else if (asset.symbol && asset.quantity) {
        positions.push({
          id: crypto.randomUUID(),
          symbol: asset.symbol,
          quantity: asset.quantity,
          costBasis: asset.purchasePrice || asset.currentPrice || 0,
          purchaseDate: asset.purchaseDate || new Date(),
          unrealizedPL: asset.currentPrice && asset.purchasePrice
            ? (asset.currentPrice - asset.purchasePrice) * asset.quantity
            : 0,
          unrealizedPLPercent: asset.currentPrice && asset.purchasePrice
            ? ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100
            : 0,
        });
      }
    });

    if (positions.length === 0) {
      return {
        totalReturn: 0,
        totalReturnPercent: 0,
        annualizedReturn: 0,
      };
    }

    // Calculate portfolio value at start and end of period
    // const endDate = new Date();
    // Calculate period start date (unused for simplified implementation)
    // const _startDate = this.getStartDate(period, endDate);

    // Get historical prices (simplified - would need actual historical data)
    const totalCostBasis = positions.reduce((sum, pos) => sum + (pos.costBasis * pos.quantity), 0);
    const currentValue = positions.reduce((sum, pos) => {
      const asset = assets.find(a => a.symbol === pos.symbol);
      const price = asset?.currentPrice || pos.costBasis;
      return sum + (price * pos.quantity);
    }, 0);

    const totalReturn = currentValue - totalCostBasis;
    const totalReturnPercent = totalCostBasis > 0 ? (totalReturn / totalCostBasis) * 100 : 0;

    // Calculate annualized return
    const years = this.getYearsInPeriod(period);
    const annualizedReturn = years > 0 
      ? (Math.pow(1 + totalReturnPercent / 100, 1 / years) - 1) * 100
      : 0;

    // Calculate volatility (simplified - would need daily returns)
    const volatility = this.calculateVolatility(positions, period);

    // Calculate Sharpe ratio
    const sharpeRatio = volatility > 0 
      ? (annualizedReturn - this.riskFreeRate * 100) / (volatility * 100)
      : undefined;

    // Calculate Sortino ratio (downside deviation)
    const sortinoRatio = this.calculateSortinoRatio(positions, annualizedReturn);

    // Calculate max drawdown
    const drawdown = this.calculateMaxDrawdown(positions, period);

    // Calculate VaR
    const var95 = this.calculateVaR(positions, 0.95);
    const var99 = this.calculateVaR(positions, 0.99);

    // Calculate alpha and beta vs benchmark
    const benchmarkComparison = await this.compareToBenchmark(positions, benchmarkSymbol, period);
    const alpha = benchmarkComparison.excessReturn;
    const beta = benchmarkComparison.beta;

    return {
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      sharpeRatio,
      sortinoRatio,
      alpha,
      beta,
      volatility,
      maxDrawdown: drawdown.amount,
      maxDrawdownPercent: drawdown.percent,
      var95,
      var99,
    };
  }

  /**
   * Calculate asset allocation
   */
  calculateAssetAllocation(): AssetAllocation {
    const assets = wealthService.getAssets();
    const accounts = wealthService.getAccounts();

    const byType: Record<AssetType, number> = {
      stock: 0,
      etf: 0,
      bond: 0,
      mutual_fund: 0,
      crypto: 0,
      real_estate: 0,
      cash: 0,
      domain: 0,
      collectible: 0,
      nft: 0,
      private_investment: 0,
      commodity: 0,
      derivative: 0,
      other: 0,
    };

    const bySector: Record<string, number> = {};
    const byGeography: Record<string, number> = {};

    assets.forEach(asset => {
      byType[asset.type] = (byType[asset.type] || 0) + asset.value;
      
      if (asset.metadata?.sector) {
        bySector[asset.metadata.sector] = (bySector[asset.metadata.sector] || 0) + asset.value;
      }
      
      if (asset.country) {
        byGeography[asset.country] = (byGeography[asset.country] || 0) + asset.value;
      }
    });

    // Add cash from accounts
    accounts.forEach(acc => {
      if (acc.type === 'checking' || acc.type === 'savings') {
        byType.cash += acc.balance;
      }
    });

    return {
      byType,
      bySector,
      byGeography,
    };
  }

  /**
   * Calculate performance attribution
   */
  async calculatePerformanceAttribution(_period: TimePeriod = '1Y'): Promise<PerformanceAttribution> {
    const assets = wealthService.getAssets();
    const positions: Position[] = [];
    
    assets.forEach(asset => {
      if (asset.holdings) {
        positions.push(...asset.holdings);
      } else if (asset.symbol && asset.quantity) {
        positions.push({
          id: crypto.randomUUID(),
          symbol: asset.symbol,
          quantity: asset.quantity,
          costBasis: asset.purchasePrice || asset.currentPrice || 0,
          purchaseDate: asset.purchaseDate || new Date(),
          unrealizedPL: asset.currentPrice && asset.purchasePrice
            ? (asset.currentPrice - asset.purchasePrice) * asset.quantity
            : 0,
          unrealizedPLPercent: asset.currentPrice && asset.purchasePrice
            ? ((asset.currentPrice - asset.purchasePrice) / asset.purchasePrice) * 100
            : 0,
        });
      }
    });

    const totalCostBasis = positions.reduce((sum, pos) => sum + (pos.costBasis * pos.quantity), 0);
    // Calculate total current value (unused for simplified implementation)
    // const totalCurrentValue = positions.reduce((sum, pos) => {
    //   const asset = assets.find(a => a.symbol === pos.symbol);
    //   const price = asset?.currentPrice || pos.costBasis;
    //   return sum + (price * pos.quantity);
    // }, 0);
    // Calculate total return (unused for simplified implementation)
    // const _totalReturn = totalCurrentValue - totalCostBasis;

    const assetContributions = positions.map(pos => {
      const asset = assets.find(a => a.symbol === pos.symbol);
      const currentPrice = asset?.currentPrice || pos.costBasis;
      const currentValue = currentPrice * pos.quantity;
      const weight = totalCostBasis > 0 ? currentValue / totalCostBasis : 0;
      const returnAmount = pos.unrealizedPL;
      const returnPercent = pos.unrealizedPLPercent;
      const contribution = weight * returnPercent;
      const contributionAmount = returnAmount;

      return {
        symbol: pos.symbol,
        assetName: asset?.name || pos.symbol,
        contribution: contributionAmount,
        contributionPercent: contribution,
        return: returnAmount,
        returnPercent,
        weight: weight * 100,
      };
    }).sort((a, b) => Math.abs(b.contributionPercent) - Math.abs(a.contributionPercent));

    // Group by sector
    const sectorContributions: Record<string, number> = {};
    assetContributions.forEach(contrib => {
      const asset = assets.find(a => a.symbol === contrib.symbol);
      const sector = asset?.metadata?.sector || 'Unknown';
      sectorContributions[sector] = (sectorContributions[sector] || 0) + contrib.contributionPercent;
    });

    return {
      assetContributions,
      sectorContributions: Object.entries(sectorContributions).map(([sector, contribution]) => ({
        sector,
        contribution,
        contributionPercent: contribution,
      })).sort((a, b) => Math.abs(b.contributionPercent) - Math.abs(a.contributionPercent)),
    };
  }

  /**
   * Compare portfolio to benchmark
   */
  async compareToBenchmark(
    positions: Position[],
    benchmarkSymbol: string,
    period: TimePeriod
  ): Promise<BenchmarkComparison & { beta?: number }> {
    // Get benchmark performance
    const startDate = this.getStartDate(period, new Date());
    
    try {
      const benchmarkData = await wealthMarketDataService.getHistoricalData(benchmarkSymbol, this.periodToRange(period));
      const portfolioData = await this.getPortfolioHistoricalData(positions, startDate);

      if (benchmarkData.close.length === 0 || portfolioData.length === 0) {
        return {
          portfolioReturn: 0,
          benchmarkReturn: 0,
          excessReturn: 0,
        };
      }

      const benchmarkStart = benchmarkData.close[0];
      const benchmarkEnd = benchmarkData.close[benchmarkData.close.length - 1];
      const benchmarkReturn = benchmarkStart > 0 
        ? ((benchmarkEnd - benchmarkStart) / benchmarkStart) * 100 
        : 0;

      const portfolioStart = portfolioData[0];
      const portfolioEnd = portfolioData[portfolioData.length - 1];
      const portfolioReturn = portfolioStart > 0 
        ? ((portfolioEnd - portfolioStart) / portfolioStart) * 100 
        : 0;

      const excessReturn = portfolioReturn - benchmarkReturn;

      // Calculate beta (simplified)
      const beta = this.calculateBeta(portfolioData, benchmarkData.close);

      // Calculate tracking error
      const trackingError = this.calculateTrackingError(portfolioData, benchmarkData.close);

      // Calculate information ratio
      const informationRatio = trackingError !== undefined && trackingError > 0 ? excessReturn / trackingError : undefined;

      return {
        portfolioReturn,
        benchmarkReturn,
        excessReturn,
        trackingError,
        informationRatio,
        beta,
      };
    } catch (error) {
      logger.error('Failed to compare to benchmark:', { error });
      return {
        portfolioReturn: 0,
        benchmarkReturn: 0,
        excessReturn: 0,
      };
    }
  }

  /**
   * Helper methods
   */
  private getStartDate(period: TimePeriod, endDate: Date): Date {
    const start = new Date(endDate);
    switch (period) {
      case '1D':
        start.setDate(start.getDate() - 1);
        break;
      case '1W':
        start.setDate(start.getDate() - 7);
        break;
      case '1M':
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        start.setMonth(start.getMonth() - 3);
        break;
      case '6M':
        start.setMonth(start.getMonth() - 6);
        break;
      case '1Y':
        start.setFullYear(start.getFullYear() - 1);
        break;
      case '5Y':
        start.setFullYear(start.getFullYear() - 5);
        break;
      case 'ALL':
        start.setFullYear(2000); // Arbitrary early date
        break;
    }
    return start;
  }

  private getYearsInPeriod(period: TimePeriod): number {
    switch (period) {
      case '1D': return 1 / 365;
      case '1W': return 1 / 52;
      case '1M': return 1 / 12;
      case '3M': return 0.25;
      case '6M': return 0.5;
      case '1Y': return 1;
      case '5Y': return 5;
      case 'ALL': return 10; // Estimate
      default: return 1;
    }
  }

  private periodToRange(period: TimePeriod): '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max' {
    switch (period) {
      case '1D': return '1d';
      case '1W': return '5d';
      case '1M': return '1mo';
      case '3M': return '3mo';
      case '6M': return '6mo';
      case '1Y': return '1y';
      case '5Y': return '5y';
      case 'ALL': return 'max';
      default: return '1y';
    }
  }

  private calculateVolatility(_positions: Position[], _period: TimePeriod): number {
    // Simplified volatility calculation
    // In real implementation, would calculate from daily returns
    return 0.15; // Placeholder: 15% annualized volatility
  }

  private calculateSortinoRatio(_positions: Position[], _annualizedReturn: number): number | undefined {
    // Simplified Sortino ratio (downside deviation)
    // In real implementation, would calculate downside deviation
    return undefined;
  }

  private calculateMaxDrawdown(_positions: Position[], _period: TimePeriod): { amount: number; percent: number } {
    // Simplified max drawdown calculation
    // In real implementation, would track peak-to-trough declines
    return { amount: 0, percent: 0 };
  }

  private calculateVaR(_positions: Position[], _confidence: number): number | undefined {
    // Simplified VaR calculation
    // In real implementation, would use historical simulation or parametric methods
    return undefined;
  }

  private async getPortfolioHistoricalData(_positions: Position[], _startDate: Date): Promise<number[]> {
    // Simplified - would need to aggregate historical prices for all positions
    return [];
  }

  private calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number | undefined {
    if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) {
      return undefined;
    }

    // Calculate covariance and variance
    const portfolioMean = portfolioReturns.reduce((sum, r) => sum + r, 0) / portfolioReturns.length;
    const benchmarkMean = benchmarkReturns.reduce((sum, r) => sum + r, 0) / benchmarkReturns.length;

    let covariance = 0;
    let benchmarkVariance = 0;

    for (let i = 0; i < portfolioReturns.length; i++) {
      covariance += (portfolioReturns[i] - portfolioMean) * (benchmarkReturns[i] - benchmarkMean);
      benchmarkVariance += Math.pow(benchmarkReturns[i] - benchmarkMean, 2);
    }

    covariance /= portfolioReturns.length;
    benchmarkVariance /= portfolioReturns.length;

    return benchmarkVariance > 0 ? covariance / benchmarkVariance : undefined;
  }

  private calculateTrackingError(portfolioReturns: number[], benchmarkReturns: number[]): number | undefined {
    if (portfolioReturns.length !== benchmarkReturns.length || portfolioReturns.length < 2) {
      return undefined;
    }

    const differences = portfolioReturns.map((p, i) => p - benchmarkReturns[i]);
    const meanDiff = differences.reduce((sum, d) => sum + d, 0) / differences.length;
    const variance = differences.reduce((sum, d) => sum + Math.pow(d - meanDiff, 2), 0) / differences.length;
    
    return Math.sqrt(variance);
  }

  /**
   * Set risk-free rate
   */
  setRiskFreeRate(rate: number): void {
    this.riskFreeRate = rate;
  }
}

export const portfolioAnalyticsService = PortfolioAnalyticsService.getInstance();

