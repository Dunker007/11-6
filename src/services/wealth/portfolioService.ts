/**
 * Portfolio Service
 * 
 * Manages portfolios, positions, and performance calculations
 */

import type { Portfolio, Position, AssetType } from '@/types/wealth';
import { wealthMarketDataService } from './marketDataService';

const PORTFOLIOS_KEY = 'dlx_wealth_portfolios';

class PortfolioService {
  private static instance: PortfolioService;
  private portfolios: Map<string, Portfolio> = new Map();

  private constructor() {
    this.loadData();
  }

  static getInstance(): PortfolioService {
    if (!PortfolioService.instance) {
      PortfolioService.instance = new PortfolioService();
    }
    return PortfolioService.instance;
  }

  private loadData(): void {
    try {
      const data = localStorage.getItem(PORTFOLIOS_KEY);
      if (data) {
        const portfolios: Portfolio[] = JSON.parse(data);
        portfolios.forEach(portfolio => {
          portfolio.createdAt = new Date(portfolio.createdAt);
          portfolio.updatedAt = new Date(portfolio.updatedAt);
          portfolio.holdings.forEach(holding => {
            holding.purchaseDate = new Date(holding.purchaseDate);
          });
          this.portfolios.set(portfolio.id, portfolio);
        });
      }
    } catch (error) {
      console.error('Failed to load portfolios:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(PORTFOLIOS_KEY, JSON.stringify(Array.from(this.portfolios.values())));
    } catch (error) {
      console.error('Failed to save portfolios:', error);
    }
  }

  async createPortfolio(name: string, description?: string): Promise<Portfolio> {
    const portfolio: Portfolio = {
      id: crypto.randomUUID(),
      name,
      description,
      holdings: [],
      allocation: {
        stock: 0,
        etf: 0,
        bond: 0,
        mutual_fund: 0,
        crypto: 0,
        real_estate: 0,
        cash: 0,
        domain: 0,
        collectible: 0,
        other: 0,
      },
      performance: {
        totalReturn: 0,
        totalReturnPercent: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.portfolios.set(portfolio.id, portfolio);
    this.saveData();
    return portfolio;
  }

  async addPosition(
    portfolioId: string,
    symbol: string,
    quantity: number,
    costBasis: number,
    purchaseDate: Date = new Date(),
    accountId?: string,
    notes?: string
  ): Promise<Position> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    // Get current price
    let currentPrice = costBasis;
    try {
      const priceData = await wealthMarketDataService.getRealTimePrice(symbol);
      currentPrice = priceData.price;
    } catch (error) {
      console.error(`Failed to fetch price for ${symbol}, using cost basis:`, error);
    }

    const position: Position = {
      id: crypto.randomUUID(),
      symbol,
      quantity,
      costBasis,
      purchaseDate,
      unrealizedPL: (currentPrice - costBasis) * quantity,
      unrealizedPLPercent: costBasis > 0 ? ((currentPrice - costBasis) / costBasis) * 100 : 0,
      accountId,
      notes,
    };

    portfolio.holdings.push(position);
    portfolio.updatedAt = new Date();
    
    await this.updatePortfolioPerformance(portfolioId);
    this.saveData();
    
    return position;
  }

  removePosition(portfolioId: string, positionId: string): boolean {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return false;

    const index = portfolio.holdings.findIndex(p => p.id === positionId);
    if (index === -1) return false;

    portfolio.holdings.splice(index, 1);
    portfolio.updatedAt = new Date();
    
    this.updatePortfolioPerformance(portfolioId);
    this.saveData();
    
    return true;
  }

  updatePosition(
    portfolioId: string,
    positionId: string,
    updates: Partial<Position>
  ): Position | null {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return null;

    const position = portfolio.holdings.find(p => p.id === positionId);
    if (!position) return null;

    Object.assign(position, updates);
    portfolio.updatedAt = new Date();
    
    this.updatePortfolioPerformance(portfolioId);
    this.saveData();
    
    return position;
  }

  async updatePortfolioPerformance(portfolioId: string): Promise<void> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return;

    let totalCost = 0;
    let totalValue = 0;

    // Update positions with current prices
    for (const position of portfolio.holdings) {
      try {
        const priceData = await wealthMarketDataService.getRealTimePrice(position.symbol);
        const currentValue = priceData.price * position.quantity;
        totalCost += position.costBasis * position.quantity;
        totalValue += currentValue;
        
        position.unrealizedPL = (priceData.price - position.costBasis) * position.quantity;
        position.unrealizedPLPercent = position.costBasis > 0 
          ? ((priceData.price - position.costBasis) / position.costBasis) * 100 
          : 0;
      } catch (error) {
        console.error(`Failed to update price for ${position.symbol}:`, error);
        const currentValue = position.costBasis * position.quantity;
        totalCost += currentValue;
        totalValue += currentValue;
      }
    }

    // Calculate performance
    portfolio.performance.totalReturn = totalValue - totalCost;
    portfolio.performance.totalReturnPercent = totalCost > 0 
      ? (portfolio.performance.totalReturn / totalCost) * 100 
      : 0;

    // Update allocation
    this.calculateAllocation(portfolio);
    
    this.saveData();
  }

  private calculateAllocation(portfolio: Portfolio): void {
    // Reset allocation
    portfolio.allocation = {
      stock: 0,
      etf: 0,
      bond: 0,
      mutual_fund: 0,
      crypto: 0,
      real_estate: 0,
      cash: 0,
      domain: 0,
      collectible: 0,
      other: 0,
    };

    let totalValue = 0;
    const valuesByType: Record<string, number> = {};

    // Calculate total value and values by asset type
    for (const position of portfolio.holdings) {
      const positionValue = (position.costBasis + position.unrealizedPL / position.quantity) * position.quantity;
      totalValue += positionValue;
      
      // Determine asset type from symbol (simplified - in production, use asset metadata)
      const assetType = this.inferAssetType(position.symbol);
      valuesByType[assetType] = (valuesByType[assetType] || 0) + positionValue;
    }

    // Calculate percentages
    if (totalValue > 0) {
      Object.keys(portfolio.allocation).forEach(type => {
        portfolio.allocation[type as AssetType] = (valuesByType[type] || 0) / totalValue * 100;
      });
    }
  }

  private inferAssetType(symbol: string): AssetType {
    // Simple inference - in production, use asset metadata
    const cryptoPattern = /^(BTC|ETH|USDT|BNB|SOL|ADA|XRP|DOT|DOGE|AVAX|SHIB|MATIC|LTC|UNI|LINK|ATOM|ETC|XLM|ALGO|VET|ICP|FIL|TRX|EOS|AAVE|MKR|GRT|SAND|MANA|AXS|THETA|XTZ|FLOW|CHZ|ENJ|BAT|ZEC|DASH|ZRX|COMP|SNX|YFI|CRV|1INCH|SUSHI|ALPHA|REN|KNC|BAND|OCEAN|NMR|COTI|ANKR|BAL|STORJ|OMG|PAXG|SKL)$/i;
    if (cryptoPattern.test(symbol)) return 'crypto';
    
    // ETF patterns
    const etfPattern = /^(SPY|QQQ|IWM|VTI|VOO|VEA|VWO|AGG|BND|TLT|GLD|SLV|USO|UNG|DIA|EFA|EEM|IEFA|IEMG|IJH|IJR|IVV|IVW|IVE|IWD|IWF|IWN|IWO|IWP|IWR|IWS|IWV|IYY|IYZ|IYJ|IYK|IYM|IYR|IYT|IYU|IYV|IYW|IYX|IYY|IYZ|BITO|GBTC|ETHE)$/i;
    if (etfPattern.test(symbol)) return 'etf';
    
    return 'stock'; // Default to stock
  }

  async calculateReturns(portfolioId: string, period: '1d' | '1w' | '1mo' | '3mo' | '6mo' | '1y' | 'ytd' | 'all'): Promise<number> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return 0;

    // Simplified calculation - in production, use historical data
    return portfolio.performance.totalReturnPercent;
  }

  async calculateSharpeRatio(portfolioId: string): Promise<number> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return 0;

    // Simplified calculation - in production, use historical returns and risk-free rate
    if (!portfolio.performance.volatility || portfolio.performance.volatility === 0) {
      return 0;
    }

    const riskFreeRate = 0.02; // Assume 2% risk-free rate
    return (portfolio.performance.totalReturnPercent / 100 - riskFreeRate) / (portfolio.performance.volatility / 100);
  }

  async compareToBenchmark(portfolioId: string, benchmark: 'SP500' | 'BTC' | 'CUSTOM', customSymbol?: string): Promise<{
    portfolioReturn: number;
    benchmarkReturn: number;
    difference: number;
  }> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      return { portfolioReturn: 0, benchmarkReturn: 0, difference: 0 };
    }

    const benchmarkSymbol = benchmark === 'SP500' ? 'SPY' : benchmark === 'BTC' ? 'BTC' : customSymbol || 'SPY';
    
    try {
      const benchmarkPrice = await wealthMarketDataService.getRealTimePrice(benchmarkSymbol);
      // Simplified - in production, calculate actual benchmark return over period
      const benchmarkReturn = benchmarkPrice.changePercent24h;
      
      return {
        portfolioReturn: portfolio.performance.totalReturnPercent,
        benchmarkReturn,
        difference: portfolio.performance.totalReturnPercent - benchmarkReturn,
      };
    } catch (error) {
      console.error(`Failed to compare to benchmark:`, error);
      return {
        portfolioReturn: portfolio.performance.totalReturnPercent,
        benchmarkReturn: 0,
        difference: portfolio.performance.totalReturnPercent,
      };
    }
  }

  getAssetAllocation(portfolioId: string): Record<AssetType, number> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      return {
        stock: 0,
        etf: 0,
        bond: 0,
        mutual_fund: 0,
        crypto: 0,
        real_estate: 0,
        cash: 0,
        domain: 0,
        collectible: 0,
        other: 0,
      };
    }
    return portfolio.allocation;
  }

  getTopPerformers(portfolioId: string): { best: Position | null; worst: Position | null } {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio || portfolio.holdings.length === 0) {
      return { best: null, worst: null };
    }

    const sorted = [...portfolio.holdings].sort((a, b) => b.unrealizedPLPercent - a.unrealizedPLPercent);
    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
    };
  }

  async getRiskMetrics(portfolioId: string): Promise<{
    volatility: number;
    beta: number;
    correlation: number;
  }> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) {
      return { volatility: 0, beta: 0, correlation: 0 };
    }

    // Simplified - in production, calculate from historical returns
    return {
      volatility: portfolio.performance.volatility || 0,
      beta: portfolio.performance.beta || 1,
      correlation: 0.7, // Placeholder
    };
  }

  async rebalancePortfolio(
    portfolioId: string,
    targetAllocation: Record<string, number>
  ): Promise<{ symbol: string; action: 'buy' | 'sell'; quantity: number }[]> {
    const portfolio = this.portfolios.get(portfolioId);
    if (!portfolio) return [];

    const recommendations: { symbol: string; action: 'buy' | 'sell'; quantity: number }[] = [];
    
    // Calculate current allocation
    this.calculateAllocation(portfolio);
    
    // Compare with target and generate recommendations
    // Simplified - in production, implement full rebalancing logic
    
    return recommendations;
  }

  getPortfolio(id: string): Portfolio | undefined {
    return this.portfolios.get(id);
  }

  getPortfolios(): Portfolio[] {
    return Array.from(this.portfolios.values());
  }

  updatePortfolio(id: string, updates: Partial<Portfolio>): Portfolio | null {
    const portfolio = this.portfolios.get(id);
    if (!portfolio) return null;

    Object.assign(portfolio, updates);
    portfolio.updatedAt = new Date();
    this.saveData();
    
    return portfolio;
  }

  deletePortfolio(id: string): boolean {
    const deleted = this.portfolios.delete(id);
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }
}

export const portfolioService = PortfolioService.getInstance();

