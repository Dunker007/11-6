/**
 * Portfolio Rebalancing Service
 *
 * Provides automated portfolio rebalancing with:
 * - Target allocation drift detection
 * - Tax-aware rebalancing (minimize capital gains)
 * - Threshold-based rebalancing triggers
 * - Cash flow optimization
 * - Trade generation and execution planning
 */

import { logger } from '../logging/loggerService';
import { wealthService } from './wealthService';
import { wealthMarketDataService } from './marketDataService';
import type { Position, AssetType } from '@/types/wealth';

export interface TargetAllocation {
  assetType?: AssetType;
  symbol?: string;
  targetPercent: number;
  minPercent?: number;
  maxPercent?: number;
}

export interface AllocationDrift {
  symbol: string;
  assetName: string;
  currentValue: number;
  currentPercent: number;
  targetPercent: number;
  drift: number; // Percentage points difference
  driftPercent: number; // Percent of target
  action: 'buy' | 'sell' | 'hold';
  tradeAmount?: number;
  tradeShares?: number;
}

export interface RebalanceRecommendation {
  needsRebalancing: boolean;
  totalDrift: number;
  maxDrift: number;
  trades: RebalanceTrade[];
  estimatedCost: number;
  estimatedTaxImpact: number;
  projectedAllocation: Record<string, number>;
}

export interface RebalanceTrade {
  symbol: string;
  assetName: string;
  action: 'buy' | 'sell';
  shares: number;
  estimatedPrice: number;
  estimatedValue: number;
  currentLot?: Position;
  capitalGain?: number;
  taxImpact?: number;
  priority: number; // 1-10, higher = more urgent
}

export interface RebalanceSettings {
  driftThreshold: number; // Percentage points to trigger rebalance (e.g., 5 = 5%)
  minimizeTaxes: boolean;
  useNewCashFirst: boolean;
  allowPartialShares: boolean;
  maxTradesPerRebalance?: number;
  tradingCostPerTrade: number;
}

class PortfolioRebalancingService {
  private static instance: PortfolioRebalancingService;

  private defaultSettings: RebalanceSettings = {
    driftThreshold: 5, // Rebalance if any asset drifts 5% from target
    minimizeTaxes: true,
    useNewCashFirst: true,
    allowPartialShares: false,
    maxTradesPerRebalance: 10,
    tradingCostPerTrade: 0, // Free trades assumed
  };

  private constructor() {}

  static getInstance(): PortfolioRebalancingService {
    if (!PortfolioRebalancingService.instance) {
      PortfolioRebalancingService.instance = new PortfolioRebalancingService();
    }
    return PortfolioRebalancingService.instance;
  }

  /**
   * Analyze portfolio drift and generate rebalancing recommendations
   */
  async analyzeRebalancing(
    targetAllocations: TargetAllocation[],
    settings: Partial<RebalanceSettings> = {}
  ): Promise<RebalanceRecommendation> {
    const finalSettings = { ...this.defaultSettings, ...settings };
    const assets = wealthService.getAssets();
    const positions: Position[] = [];

    // Collect all positions
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

    // Calculate total portfolio value
    const totalValue = positions.reduce((sum, pos) => {
      const asset = assets.find(a => a.symbol === pos.symbol);
      const price = asset?.currentPrice || pos.costBasis;
      return sum + (price * pos.quantity);
    }, 0);

    if (totalValue === 0) {
      return {
        needsRebalancing: false,
        totalDrift: 0,
        maxDrift: 0,
        trades: [],
        estimatedCost: 0,
        estimatedTaxImpact: 0,
        projectedAllocation: {},
      };
    }

    // Calculate current allocations and drift
    const drifts = await this.calculateDrift(positions, targetAllocations, totalValue);

    // Determine if rebalancing is needed
    const maxDrift = Math.max(...drifts.map(d => Math.abs(d.drift)));
    const totalDrift = drifts.reduce((sum, d) => sum + Math.abs(d.drift), 0);
    const needsRebalancing = maxDrift >= finalSettings.driftThreshold;

    if (!needsRebalancing) {
      return {
        needsRebalancing: false,
        totalDrift,
        maxDrift,
        trades: [],
        estimatedCost: 0,
        estimatedTaxImpact: 0,
        projectedAllocation: this.getCurrentAllocation(positions, totalValue),
      };
    }

    // Generate trades
    const trades = await this.generateRebalanceTrades(
      drifts,
      positions,
      totalValue,
      finalSettings
    );

    // Calculate costs and tax impact
    const estimatedCost = trades.length * finalSettings.tradingCostPerTrade;
    const estimatedTaxImpact = trades.reduce((sum, t) => sum + (t.taxImpact || 0), 0);

    // Calculate projected allocation after trades
    const projectedAllocation = this.calculateProjectedAllocation(positions, trades, totalValue);

    return {
      needsRebalancing,
      totalDrift,
      maxDrift,
      trades: trades.sort((a, b) => b.priority - a.priority),
      estimatedCost,
      estimatedTaxImpact,
      projectedAllocation,
    };
  }

  /**
   * Calculate drift for each position
   */
  private async calculateDrift(
    positions: Position[],
    targetAllocations: TargetAllocation[],
    totalValue: number
  ): Promise<AllocationDrift[]> {
    const assets = wealthService.getAssets();
    const drifts: AllocationDrift[] = [];

    for (const target of targetAllocations) {
      const relevantPositions = target.symbol
        ? positions.filter(p => p.symbol === target.symbol)
        : positions.filter(p => {
            const asset = assets.find(a => a.symbol === p.symbol);
            return asset?.type === target.assetType;
          });

      const currentValue = relevantPositions.reduce((sum, pos) => {
        const asset = assets.find(a => a.symbol === pos.symbol);
        const price = asset?.currentPrice || pos.costBasis;
        return sum + (price * pos.quantity);
      }, 0);

      const currentPercent = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
      const drift = currentPercent - target.targetPercent;
      const driftPercent = target.targetPercent > 0
        ? (drift / target.targetPercent) * 100
        : 0;

      let action: 'buy' | 'sell' | 'hold' = 'hold';
      if (drift > 0) action = 'sell';
      else if (drift < 0) action = 'buy';

      const symbol = target.symbol || `${target.assetType}_allocation`;
      const asset = target.symbol ? assets.find(a => a.symbol === target.symbol) : null;

      drifts.push({
        symbol,
        assetName: asset?.name || symbol,
        currentValue,
        currentPercent,
        targetPercent: target.targetPercent,
        drift,
        driftPercent,
        action,
      });
    }

    return drifts;
  }

  /**
   * Generate tax-optimized rebalancing trades
   */
  private async generateRebalanceTrades(
    drifts: AllocationDrift[],
    positions: Position[],
    totalValue: number,
    settings: RebalanceSettings
  ): Promise<RebalanceTrade[]> {
    const assets = wealthService.getAssets();
    const trades: RebalanceTrade[] = [];

    // Sort drifts by absolute drift size
    const sortedDrifts = [...drifts].sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

    for (const drift of sortedDrifts) {
      if (drift.action === 'hold') continue;

      const targetValue = (drift.targetPercent / 100) * totalValue;
      const tradeValue = targetValue - drift.currentValue;

      if (Math.abs(tradeValue) < 10) continue; // Skip tiny trades

      const asset = assets.find(a => a.symbol === drift.symbol);
      const currentPrice = asset?.currentPrice || 100;
      let tradeShares = tradeValue / currentPrice;

      if (!settings.allowPartialShares) {
        tradeShares = drift.action === 'buy'
          ? Math.floor(tradeShares)
          : Math.ceil(tradeShares);
      }

      if (Math.abs(tradeShares) < 0.01) continue;

      // Calculate tax impact if selling
      let capitalGain = 0;
      let taxImpact = 0;
      let currentLot: Position | undefined;

      if (drift.action === 'sell' && settings.minimizeTaxes) {
        // Find lot with highest cost basis (minimize gains) or largest loss
        const relevantPositions = positions.filter(p => p.symbol === drift.symbol);

        if (relevantPositions.length > 0) {
          // Sort by cost basis (highest first for tax efficiency)
          const sortedLots = relevantPositions.sort((a, b) => b.costBasis - a.costBasis);
          currentLot = sortedLots[0];

          capitalGain = (currentPrice - currentLot.costBasis) * Math.abs(tradeShares);

          // Estimate tax (simplified - assumes 20% long-term capital gains)
          const holdingPeriod = new Date().getTime() - new Date(currentLot.purchaseDate).getTime();
          const isLongTerm = holdingPeriod > 365 * 24 * 60 * 60 * 1000;
          const taxRate = isLongTerm ? 0.20 : 0.37; // Long-term vs short-term
          taxImpact = Math.max(0, capitalGain * taxRate);
        }
      }

      // Calculate priority (higher drift = higher priority)
      const priority = Math.min(10, Math.max(1, Math.floor(Math.abs(drift.driftPercent) / 10)));

      trades.push({
        symbol: drift.symbol,
        assetName: drift.assetName,
        action: drift.action,
        shares: Math.abs(tradeShares),
        estimatedPrice: currentPrice,
        estimatedValue: Math.abs(tradeValue),
        currentLot,
        capitalGain,
        taxImpact,
        priority,
      });
    }

    // Limit number of trades if specified
    if (settings.maxTradesPerRebalance) {
      return trades.slice(0, settings.maxTradesPerRebalance);
    }

    return trades;
  }

  /**
   * Get current portfolio allocation
   */
  private getCurrentAllocation(positions: Position[], totalValue: number): Record<string, number> {
    const assets = wealthService.getAssets();
    const allocation: Record<string, number> = {};

    positions.forEach(pos => {
      const asset = assets.find(a => a.symbol === pos.symbol);
      const price = asset?.currentPrice || pos.costBasis;
      const value = price * pos.quantity;
      const percent = totalValue > 0 ? (value / totalValue) * 100 : 0;
      allocation[pos.symbol] = percent;
    });

    return allocation;
  }

  /**
   * Calculate projected allocation after executing trades
   */
  private calculateProjectedAllocation(
    positions: Position[],
    trades: RebalanceTrade[],
    totalValue: number
  ): Record<string, number> {
    const assets = wealthService.getAssets();
    const allocation: Record<string, number> = {};

    // Start with current positions
    const projectedPositions = new Map<string, number>();
    positions.forEach(pos => {
      const asset = assets.find(a => a.symbol === pos.symbol);
      const price = asset?.currentPrice || pos.costBasis;
      const value = price * pos.quantity;
      projectedPositions.set(pos.symbol, value);
    });

    // Apply trades
    trades.forEach(trade => {
      const currentValue = projectedPositions.get(trade.symbol) || 0;
      const tradeValue = trade.action === 'buy'
        ? trade.estimatedValue
        : -trade.estimatedValue;
      projectedPositions.set(trade.symbol, currentValue + tradeValue);
    });

    // Calculate percentages
    projectedPositions.forEach((value, symbol) => {
      allocation[symbol] = totalValue > 0 ? (value / totalValue) * 100 : 0;
    });

    return allocation;
  }

  /**
   * Auto-rebalance using new cash contributions
   */
  async rebalanceWithCashContribution(
    cashAmount: number,
    targetAllocations: TargetAllocation[]
  ): Promise<RebalanceTrade[]> {
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
          unrealizedPL: 0,
          unrealizedPLPercent: 0,
        });
      }
    });

    const currentValue = positions.reduce((sum, pos) => {
      const asset = assets.find(a => a.symbol === pos.symbol);
      const price = asset?.currentPrice || pos.costBasis;
      return sum + (price * pos.quantity);
    }, 0);

    const targetValue = currentValue + cashAmount;
    const trades: RebalanceTrade[] = [];

    // Calculate how much of each asset to buy
    for (const target of targetAllocations) {
      const currentPositions = target.symbol
        ? positions.filter(p => p.symbol === target.symbol)
        : [];

      const currentAssetValue = currentPositions.reduce((sum, pos) => {
        const asset = assets.find(a => a.symbol === pos.symbol);
        const price = asset?.currentPrice || pos.costBasis;
        return sum + (price * pos.quantity);
      }, 0);

      const targetAssetValue = (target.targetPercent / 100) * targetValue;
      const buyAmount = targetAssetValue - currentAssetValue;

      if (buyAmount > 0 && target.symbol) {
        const asset = assets.find(a => a.symbol === target.symbol);
        const price = asset?.currentPrice || 100;
        const shares = Math.floor(buyAmount / price);

        if (shares > 0) {
          trades.push({
            symbol: target.symbol,
            assetName: asset?.name || target.symbol,
            action: 'buy',
            shares,
            estimatedPrice: price,
            estimatedValue: shares * price,
            priority: 5,
          });
        }
      }
    }

    logger.info('Generated cash contribution rebalance trades', {
      cashAmount,
      trades: trades.length,
    });

    return trades;
  }

  /**
   * Execute rebalancing trades (simulation)
   */
  async executeRebalance(trades: RebalanceTrade[]): Promise<{ success: boolean; executedTrades: number }> {
    // In a real implementation, this would:
    // 1. Connect to broker API
    // 2. Submit orders
    // 3. Monitor execution
    // 4. Update portfolio positions

    logger.info('Executing rebalance', { trades: trades.length });

    // Simulate execution
    return {
      success: true,
      executedTrades: trades.length,
    };
  }
}

export const portfolioRebalancingService = PortfolioRebalancingService.getInstance();
