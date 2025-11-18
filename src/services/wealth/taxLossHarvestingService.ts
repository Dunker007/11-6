/**
 * Tax-Loss Harvesting Service
 *
 * Identifies tax-loss harvesting opportunities while ensuring:
 * - Wash-sale rule compliance (30-day rule)
 * - Replacement security suggestions
 * - Estimated tax benefit calculations
 * - Automated harvesting with constraints
 */

import { logger } from '../logging/loggerService';
import { wealthService } from './wealthService';
import { wealthMarketDataService } from './marketDataService';
import type { Position } from '@/types/wealth';

export interface TaxLossHarvestOpportunity {
  position: Position;
  symbol: string;
  assetName: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedLoss: number;
  unrealizedLossPercent: number;
  purchaseDate: Date;
  daysHeld: number;
  isLongTerm: boolean;
  estimatedTaxBenefit: number;
  replacementSuggestions: ReplacementSecurity[];
  washSaleRisk: 'none' | 'low' | 'medium' | 'high';
  lastSaleDate?: Date;
  canHarvestNow: boolean;
  harvestAfterDate?: Date;
}

export interface ReplacementSecurity {
  symbol: string;
  name: string;
  correlation: number; // 0-1, how similar to original
  reason: string;
  currentPrice?: number;
  expense Ratio?: number;
}

export interface TaxLossHarvestingSettings {
  minimumLossThreshold: number; // Minimum $ loss to consider
  minimumLossPercent: number; // Minimum % loss to consider
  includeShortTerm: boolean;
  includeLongTerm: boolean;
  taxBracket: number; // User's marginal tax rate (0-1)
  longTermCapitalGainRate: number; // LTCG tax rate (0-1)
  washSaleBuffer: number; // Extra days beyond 30 for safety
  autoReplaceWithSimilar: boolean;
}

export interface HarvestExecutionPlan {
  opportunities: TaxLossHarvestOpportunity[];
  totalUnrealizedLoss: number;
  totalEstimatedTaxBenefit: number;
  trades: HarvestTrade[];
  warnings: string[];
}

export interface HarvestTrade {
  type: 'sell' | 'buy';
  symbol: string;
  assetName: string;
  quantity: number;
  estimatedPrice: number;
  estimatedValue: number;
  reason: string;
  priority: number;
}

class TaxLossHarvestingService {
  private static instance: TaxLossHarvestingService;

  private defaultSettings: TaxLossHarvestingSettings = {
    minimumLossThreshold: 100, // $100 minimum loss
    minimumLossPercent: 5, // 5% minimum loss
    includeShortTerm: true,
    includeLongTerm: true,
    taxBracket: 0.24, // 24% federal bracket
    longTermCapitalGainRate: 0.15, // 15% LTCG rate
    washSaleBuffer: 5, // Extra 5 days for safety (35 total)
    autoReplaceWithSimilar: true,
  };

  // Wash sale window (30 days before and after)
  private readonly WASH_SALE_DAYS = 30;

  private constructor() {}

  static getInstance(): TaxLossHarvestingService {
    if (!TaxLossHarvestingService.instance) {
      TaxLossHarvestingService.instance = new TaxLossHarvestingService();
    }
    return TaxLossHarvestingService.instance;
  }

  /**
   * Identify all tax-loss harvesting opportunities
   */
  async identifyOpportunities(
    settings: Partial<TaxLossHarvestingSettings> = {}
  ): Promise<TaxLossHarvestOpportunity[]> {
    const finalSettings = { ...this.defaultSettings, ...settings };
    const assets = wealthService.getAssets();
    const positions: Position[] = [];

    // Collect all positions
    assets.forEach(asset => {
      if (asset.holdings) {
        positions.push(...asset.holdings);
      } else if (asset.symbol && asset.quantity && asset.purchasePrice) {
        positions.push({
          id: crypto.randomUUID(),
          symbol: asset.symbol,
          quantity: asset.quantity,
          costBasis: asset.purchasePrice,
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

    const opportunities: TaxLossHarvestOpportunity[] = [];

    for (const position of positions) {
      const asset = assets.find(a => a.symbol === position.symbol);
      if (!asset) continue;

      const currentPrice = asset.currentPrice || position.costBasis;
      const currentValue = currentPrice * position.quantity;
      const unrealizedLoss = position.unrealizedPL;
      const unrealizedLossPercent = position.unrealizedPLPercent;

      // Only consider positions with losses
      if (unrealizedLoss >= 0) continue;

      // Check minimum thresholds
      if (Math.abs(unrealizedLoss) < finalSettings.minimumLossThreshold) continue;
      if (Math.abs(unrealizedLossPercent) < finalSettings.minimumLossPercent) continue;

      // Calculate holding period
      const purchaseDate = new Date(position.purchaseDate);
      const now = new Date();
      const daysHeld = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      const isLongTerm = daysHeld > 365;

      // Check if we should include this based on term
      if (isLongTerm && !finalSettings.includeLongTerm) continue;
      if (!isLongTerm && !finalSettings.includeShortTerm) continue;

      // Calculate estimated tax benefit
      const taxRate = isLongTerm
        ? finalSettings.longTermCapitalGainRate
        : finalSettings.taxBracket;
      const estimatedTaxBenefit = Math.abs(unrealizedLoss) * taxRate;

      // Check wash sale risk
      const washSaleAnalysis = this.analyzeWashSaleRisk(position, positions, finalSettings);

      // Get replacement suggestions
      const replacementSuggestions = await this.getReplacementSecurities(
        position.symbol,
        asset.name
      );

      opportunities.push({
        position,
        symbol: position.symbol,
        assetName: asset.name,
        quantity: position.quantity,
        costBasis: position.costBasis,
        currentPrice,
        currentValue,
        unrealizedLoss,
        unrealizedLossPercent,
        purchaseDate,
        daysHeld,
        isLongTerm,
        estimatedTaxBenefit,
        replacementSuggestions,
        washSaleRisk: washSaleAnalysis.risk,
        lastSaleDate: washSaleAnalysis.lastSaleDate,
        canHarvestNow: washSaleAnalysis.canHarvestNow,
        harvestAfterDate: washSaleAnalysis.harvestAfterDate,
      });
    }

    // Sort by estimated tax benefit (highest first)
    opportunities.sort((a, b) => b.estimatedTaxBenefit - a.estimatedTaxBenefit);

    logger.info('Identified tax-loss harvesting opportunities', {
      total: opportunities.length,
      canHarvestNow: opportunities.filter(o => o.canHarvestNow).length,
    });

    return opportunities;
  }

  /**
   * Analyze wash sale risk for a position
   */
  private analyzeWashSaleRisk(
    position: Position,
    allPositions: Position[],
    settings: TaxLossHarvestingSettings
  ): {
    risk: 'none' | 'low' | 'medium' | 'high';
    canHarvestNow: boolean;
    lastSaleDate?: Date;
    harvestAfterDate?: Date;
  } {
    const now = new Date();
    const washSaleWindow = this.WASH_SALE_DAYS + settings.washSaleBuffer;

    // Check if we've bought this security in the last 30 days
    const recentPurchases = allPositions.filter(p =>
      p.symbol === position.symbol &&
      p.id !== position.id
    );

    let lastSaleDate: Date | undefined;
    let risk: 'none' | 'low' | 'medium' | 'high' = 'none';
    let canHarvestNow = true;

    for (const purchase of recentPurchases) {
      const purchaseDate = new Date(purchase.purchaseDate);
      const daysSincePurchase = Math.floor((now.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSincePurchase <= washSaleWindow) {
        risk = 'high';
        canHarvestNow = false;
        lastSaleDate = purchaseDate;
        break;
      } else if (daysSincePurchase <= washSaleWindow + 10) {
        risk = 'medium';
      } else if (daysSincePurchase <= washSaleWindow + 20) {
        risk = 'low';
      }
    }

    const harvestAfterDate = lastSaleDate
      ? new Date(lastSaleDate.getTime() + (washSaleWindow + 1) * 24 * 60 * 60 * 1000)
      : undefined;

    return {
      risk,
      canHarvestNow,
      lastSaleDate,
      harvestAfterDate,
    };
  }

  /**
   * Get replacement security suggestions
   */
  private async getReplacementSecurities(
    symbol: string,
    assetName: string
  ): Promise<ReplacementSecurity[]> {
    const suggestions: ReplacementSecurity[] = [];

    // ETF replacement mappings (simplified - would use real correlation data)
    const etfReplacements: Record<string, ReplacementSecurity[]> = {
      'SPY': [
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', correlation: 0.99, reason: 'Same S&P 500 index, lower fees' },
        { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', correlation: 0.99, reason: 'Same S&P 500 index' },
        { symbol: 'SPLG', name: 'SPDR Portfolio S&P 500 ETF', correlation: 0.99, reason: 'Same S&P 500 index, lowest fees' },
      ],
      'QQQ': [
        { symbol: 'QQQM', name: 'Invesco NASDAQ 100 ETF', correlation: 0.99, reason: 'Same Nasdaq-100 index, lower fees' },
        { symbol: 'ONEQ', name: 'Fidelity Nasdaq Composite ETF', correlation: 0.95, reason: 'Similar tech exposure' },
      ],
      'VTI': [
        { symbol: 'ITOT', name: 'iShares Core S&P Total Market ETF', correlation: 0.99, reason: 'Same total market exposure' },
        { symbol: 'SPTM', name: 'SPDR Portfolio S&P 1500 ETF', correlation: 0.98, reason: 'Similar total market exposure' },
      ],
      'AGG': [
        { symbol: 'BND', name: 'Vanguard Total Bond Market ETF', correlation: 0.98, reason: 'Similar bond market exposure' },
        { symbol: 'IUSB', name: 'iShares Core Total USD Bond ETF', correlation: 0.97, reason: 'Similar bond market exposure' },
      ],
      'VEA': [
        { symbol: 'IEFA', name: 'iShares Core MSCI EAFE ETF', correlation: 0.98, reason: 'Same international developed markets' },
        { symbol: 'SCHF', name: 'Schwab International Equity ETF', correlation: 0.97, reason: 'Similar international exposure' },
      ],
    };

    // Check if we have predefined replacements
    if (etfReplacements[symbol]) {
      suggestions.push(...etfReplacements[symbol]);
    } else {
      // Generic suggestions based on asset type
      if (assetName.toLowerCase().includes('tech') || assetName.toLowerCase().includes('technology')) {
        suggestions.push({
          symbol: 'XLK',
          name: 'Technology Select Sector SPDR Fund',
          correlation: 0.85,
          reason: 'Technology sector exposure',
        });
      } else if (assetName.toLowerCase().includes('growth')) {
        suggestions.push({
          symbol: 'VUG',
          name: 'Vanguard Growth ETF',
          correlation: 0.90,
          reason: 'Growth stock exposure',
        });
      } else if (assetName.toLowerCase().includes('value')) {
        suggestions.push({
          symbol: 'VTV',
          name: 'Vanguard Value ETF',
          correlation: 0.90,
          reason: 'Value stock exposure',
        });
      }
    }

    // Fetch current prices for suggestions
    for (const suggestion of suggestions) {
      try {
        const quote = await wealthMarketDataService.getQuote(suggestion.symbol);
        suggestion.currentPrice = quote.price;
      } catch (error) {
        logger.debug('Failed to fetch replacement security price', { symbol: suggestion.symbol });
      }
    }

    return suggestions;
  }

  /**
   * Generate execution plan for tax-loss harvesting
   */
  async generateExecutionPlan(
    opportunities: TaxLossHarvestOpportunity[],
    settings: Partial<TaxLossHarvestingSettings> = {}
  ): Promise<HarvestExecutionPlan> {
    const finalSettings = { ...this.defaultSettings, ...settings };
    const trades: HarvestTrade[] = [];
    const warnings: string[] = [];

    // Filter to only harvestable opportunities
    const harvestable = opportunities.filter(o => o.canHarvestNow);

    if (harvestable.length === 0) {
      warnings.push('No opportunities can be harvested now due to wash-sale restrictions');
    }

    for (const opp of harvestable) {
      // Sell the position at a loss
      trades.push({
        type: 'sell',
        symbol: opp.symbol,
        assetName: opp.assetName,
        quantity: opp.quantity,
        estimatedPrice: opp.currentPrice,
        estimatedValue: opp.currentValue,
        reason: `Harvest $${Math.abs(opp.unrealizedLoss).toFixed(2)} loss for $${opp.estimatedTaxBenefit.toFixed(2)} tax benefit`,
        priority: Math.floor(opp.estimatedTaxBenefit / 100),
      });

      // Buy replacement security if auto-replace enabled
      if (finalSettings.autoReplaceWithSimilar && opp.replacementSuggestions.length > 0) {
        const replacement = opp.replacementSuggestions[0]; // Use highest correlation
        const replacementPrice = replacement.currentPrice || opp.currentPrice;
        const replacementQuantity = Math.floor(opp.currentValue / replacementPrice);

        if (replacementQuantity > 0) {
          trades.push({
            type: 'buy',
            symbol: replacement.symbol,
            assetName: replacement.name,
            quantity: replacementQuantity,
            estimatedPrice: replacementPrice,
            estimatedValue: replacementQuantity * replacementPrice,
            reason: `Replace ${opp.symbol} with similar exposure (${replacement.correlation * 100}% correlation)`,
            priority: Math.floor(opp.estimatedTaxBenefit / 100),
          });
        }
      }
    }

    const totalUnrealizedLoss = harvestable.reduce((sum, o) => sum + Math.abs(o.unrealizedLoss), 0);
    const totalEstimatedTaxBenefit = harvestable.reduce((sum, o) => sum + o.estimatedTaxBenefit, 0);

    logger.info('Generated tax-loss harvesting execution plan', {
      opportunities: harvestable.length,
      totalUnrealizedLoss,
      totalEstimatedTaxBenefit,
      trades: trades.length,
    });

    return {
      opportunities: harvestable,
      totalUnrealizedLoss,
      totalEstimatedTaxBenefit,
      trades: trades.sort((a, b) => b.priority - a.priority),
      warnings,
    };
  }

  /**
   * Execute tax-loss harvesting trades (simulation)
   */
  async executeHarvest(plan: HarvestExecutionPlan): Promise<{ success: boolean; executedTrades: number }> {
    // In a real implementation, this would:
    // 1. Connect to broker API
    // 2. Submit sell orders first
    // 3. Wait for settlement
    // 4. Submit buy orders for replacements
    // 5. Track wash-sale dates

    logger.info('Executing tax-loss harvest', { trades: plan.trades.length });

    // Simulate execution
    return {
      success: true,
      executedTrades: plan.trades.length,
    };
  }

  /**
   * Calculate annual tax-loss harvesting potential
   */
  async calculateAnnualPotential(settings: Partial<TaxLossHarvestingSettings> = {}): Promise<{
    totalOpportunities: number;
    totalPotentialLoss: number;
    totalPotentialTaxBenefit: number;
    averageOpportunitySize: number;
  }> {
    const opportunities = await this.identifyOpportunities(settings);
    const totalPotentialLoss = opportunities.reduce((sum, o) => sum + Math.abs(o.unrealizedLoss), 0);
    const totalPotentialTaxBenefit = opportunities.reduce((sum, o) => sum + o.estimatedTaxBenefit, 0);

    return {
      totalOpportunities: opportunities.length,
      totalPotentialLoss,
      totalPotentialTaxBenefit,
      averageOpportunitySize: opportunities.length > 0 ? totalPotentialTaxBenefit / opportunities.length : 0,
    };
  }
}

export const taxLossHarvestingService = TaxLossHarvestingService.getInstance();
