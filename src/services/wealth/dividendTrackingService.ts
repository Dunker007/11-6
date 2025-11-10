/**
 * Dividend Tracking Service
 * 
 * Tracks dividend payments, calculates yields, and provides dividend calendar
 * Similar to Sharesight's dividend tracking features
 */

import { wealthMarketDataService } from './marketDataService';
import { wealthService } from './wealthService';
import type { Asset, DividendPayment, Position } from '@/types/wealth';

export interface DividendSummary {
  totalDividends: number;
  qualifiedDividends: number;
  nonQualifiedDividends: number;
  taxWithheld: number;
  dividendYield: number; // Overall portfolio dividend yield
  yieldOnCost: number; // Yield based on purchase price
}

export interface DividendCalendarEntry {
  date: Date;
  symbol: string;
  assetName: string;
  amount: number;
  totalAmount: number; // Total for position
  quantity: number;
  exDividendDate: Date;
  paymentDate: Date;
  qualified?: boolean;
}

class DividendTrackingService {
  private static instance: DividendTrackingService;
  private dividendCache: Map<string, DividendPayment[]> = new Map();
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  static getInstance(): DividendTrackingService {
    if (!DividendTrackingService.instance) {
      DividendTrackingService.instance = new DividendTrackingService();
    }
    return DividendTrackingService.instance;
  }

  /**
   * Get dividend history for an asset
   */
  async getDividendHistory(assetId: string, startDate?: Date, endDate?: Date): Promise<DividendPayment[]> {
    const asset = wealthService.getAsset(assetId);
    if (!asset || !asset.symbol) {
      return [];
    }

    // Check cache first
    const cacheKey = `${assetId}_${startDate?.getTime()}_${endDate?.getTime()}`;
    const cached = this.dividendCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from market data service
    const dividends = await wealthMarketDataService.getDividendHistory(
      asset.symbol,
      startDate,
      endDate
    );

    // Update asset IDs and quantities
    const positions = asset.holdings || [];
    const enrichedDividends = dividends.map(div => {
      // Find position quantity at ex-dividend date
      const position = positions.find(p => 
        p.symbol === div.symbol && 
        (!div.exDividendDate || p.purchaseDate <= div.exDividendDate)
      );

      return {
        ...div,
        assetId,
        quantity: position?.quantity || asset.quantity || 0,
        totalAmount: div.amount * (position?.quantity || asset.quantity || 0),
      };
    });

    // Cache results
    this.dividendCache.set(cacheKey, enrichedDividends);
    setTimeout(() => this.dividendCache.delete(cacheKey), this.CACHE_TTL);

    // Update asset's dividend history
    if (enrichedDividends.length > 0) {
      const updatedAsset: Asset = {
        ...asset,
        dividendHistory: enrichedDividends,
        dividendYield: this.calculateDividendYield(asset, enrichedDividends),
      };
      wealthService.updateAsset(assetId, updatedAsset);
    }

    return enrichedDividends;
  }

  /**
   * Calculate dividend yield for an asset
   */
  calculateDividendYield(asset: Asset, dividends?: DividendPayment[]): number {
    const dividendHistory = dividends || asset.dividendHistory || [];
    if (dividendHistory.length === 0 || !asset.currentPrice) {
      return 0;
    }

    // Calculate annual dividend (sum of last 12 months or annualize recent dividends)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentDividends = dividendHistory.filter(d => d.exDividendDate >= oneYearAgo);
    const totalAnnualDividend = recentDividends.reduce((sum, d) => sum + d.amount, 0);

    // Annualize if less than 12 months of data
    if (recentDividends.length > 0) {
      const oldestDividend = recentDividends[recentDividends.length - 1];
      const monthsOfData = (Date.now() - oldestDividend.exDividendDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOfData > 0 && monthsOfData < 12) {
        const annualizedDividend = totalAnnualDividend * (12 / monthsOfData);
        return (annualizedDividend / asset.currentPrice) * 100;
      }
    }

    return (totalAnnualDividend / asset.currentPrice) * 100;
  }

  /**
   * Calculate yield on cost (dividend yield based on purchase price)
   */
  calculateYieldOnCost(asset: Asset, dividends?: DividendPayment[]): number {
    if (!asset.purchasePrice) {
      return 0;
    }

    const dividendHistory = dividends || asset.dividendHistory || [];
    if (dividendHistory.length === 0) {
      return 0;
    }

    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const recentDividends = dividendHistory.filter(d => d.exDividendDate >= oneYearAgo);
    const totalAnnualDividend = recentDividends.reduce((sum, d) => sum + d.amount, 0);

    // Annualize if needed
    if (recentDividends.length > 0) {
      const oldestDividend = recentDividends[recentDividends.length - 1];
      const monthsOfData = (Date.now() - oldestDividend.exDividendDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
      if (monthsOfData > 0 && monthsOfData < 12) {
        const annualizedDividend = totalAnnualDividend * (12 / monthsOfData);
        return (annualizedDividend / asset.purchasePrice) * 100;
      }
    }

    return (totalAnnualDividend / asset.purchasePrice) * 100;
  }

  /**
   * Get dividend calendar (upcoming dividends)
   */
  async getDividendCalendar(startDate?: Date, endDate?: Date): Promise<DividendCalendarEntry[]> {
    const start = startDate || new Date();
    const end = endDate || new Date();
    end.setMonth(end.getMonth() + 3); // Default to 3 months ahead

    const calendar: DividendCalendarEntry[] = [];
    const assets = wealthService.getAssets();

    // Get dividends for all assets with symbols
    const dividendPromises = assets
      .filter(asset => asset.symbol && (asset.type === 'stock' || asset.type === 'etf'))
      .map(async asset => {
        const dividends = await this.getDividendHistory(asset.id, start, end);
        return dividends.map(div => ({
          date: div.paymentDate,
          symbol: div.symbol,
          assetName: asset.name,
          amount: div.amount,
          totalAmount: div.totalAmount,
          quantity: div.quantity,
          exDividendDate: div.exDividendDate,
          paymentDate: div.paymentDate,
          qualified: div.qualified,
        }));
      });

    const allDividends = await Promise.all(dividendPromises);
    calendar.push(...allDividends.flat());

    // Sort by payment date
    return calendar.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
  }

  /**
   * Get dividend summary for portfolio
   */
  async getDividendSummary(startDate?: Date, endDate?: Date): Promise<DividendSummary> {
    const start = startDate || new Date();
    start.setFullYear(start.getFullYear() - 1);
    const end = endDate || new Date();

    const assets = wealthService.getAssets();
    let totalDividends = 0;
    let qualifiedDividends = 0;
    let nonQualifiedDividends = 0;
    let taxWithheld = 0;
    let totalCostBasis = 0;
    let totalCurrentValue = 0;

    for (const asset of assets) {
      if (!asset.symbol || (asset.type !== 'stock' && asset.type !== 'etf')) {
        continue;
      }

      const dividends = await this.getDividendHistory(asset.id, start, end);
      const assetDividends = dividends.reduce((sum, d) => sum + d.totalAmount, 0);
      totalDividends += assetDividends;

      dividends.forEach(div => {
        if (div.taxWithheld) {
          taxWithheld += div.taxWithheld;
        }
        if (div.qualified) {
          qualifiedDividends += div.totalAmount;
        } else {
          nonQualifiedDividends += div.totalAmount;
        }
      });

      if (asset.purchasePrice && asset.quantity) {
        totalCostBasis += asset.purchasePrice * asset.quantity;
      }
      if (asset.currentPrice && asset.quantity) {
        totalCurrentValue += asset.currentPrice * asset.quantity;
      }
    }

    const dividendYield = totalCurrentValue > 0 
      ? (totalDividends / totalCurrentValue) * 100 
      : 0;
    
    const yieldOnCost = totalCostBasis > 0 
      ? (totalDividends / totalCostBasis) * 100 
      : 0;

    return {
      totalDividends,
      qualifiedDividends,
      nonQualifiedDividends,
      taxWithheld,
      dividendYield,
      yieldOnCost,
    };
  }

  /**
   * Track DRIP (Dividend Reinvestment Plan) purchases
   */
  async trackDRIP(
    assetId: string,
    dividendPayment: DividendPayment,
    reinvestmentPrice: number,
    sharesPurchased: number
  ): Promise<Position> {
    const asset = wealthService.getAsset(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Create new position for DRIP purchase
    const newPosition: Position = {
      id: crypto.randomUUID(),
      symbol: dividendPayment.symbol,
      quantity: sharesPurchased,
      costBasis: reinvestmentPrice,
      purchaseDate: dividendPayment.paymentDate,
      unrealizedPL: 0, // Will be calculated when price updates
      unrealizedPLPercent: 0,
      accountId: asset.accountId,
      notes: `DRIP from dividend payment on ${dividendPayment.paymentDate.toLocaleDateString()}`,
    };

    // Add to asset holdings
    const holdings = asset.holdings || [];
    holdings.push(newPosition);
    
    wealthService.updateAsset(assetId, {
      holdings,
    });

    return newPosition;
  }

  /**
   * Get tax-advantaged dividend report
   */
  async getTaxAdvantagedReport(year: number): Promise<{
    qualifiedDividends: number;
    nonQualifiedDividends: number;
    totalDividends: number;
    taxWithheld: number;
    byAsset: Array<{
      symbol: string;
      assetName: string;
      qualifiedDividends: number;
      nonQualifiedDividends: number;
      taxWithheld: number;
    }>;
  }> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const assets = wealthService.getAssets();
    const byAsset: Array<{
      symbol: string;
      assetName: string;
      qualifiedDividends: number;
      nonQualifiedDividends: number;
      taxWithheld: number;
    }> = [];

    let totalQualified = 0;
    let totalNonQualified = 0;
    let totalTaxWithheld = 0;

    for (const asset of assets) {
      if (!asset.symbol || (asset.type !== 'stock' && asset.type !== 'etf')) {
        continue;
      }

      const dividends = await this.getDividendHistory(asset.id, startDate, endDate);
      const qualified = dividends
        .filter(d => d.qualified)
        .reduce((sum, d) => sum + d.totalAmount, 0);
      const nonQualified = dividends
        .filter(d => !d.qualified)
        .reduce((sum, d) => sum + d.totalAmount, 0);
      const withheld = dividends.reduce((sum, d) => sum + (d.taxWithheld || 0), 0);

      if (qualified > 0 || nonQualified > 0) {
        byAsset.push({
          symbol: asset.symbol,
          assetName: asset.name,
          qualifiedDividends: qualified,
          nonQualifiedDividends: nonQualified,
          taxWithheld: withheld,
        });

        totalQualified += qualified;
        totalNonQualified += nonQualified;
        totalTaxWithheld += withheld;
      }
    }

    return {
      qualifiedDividends: totalQualified,
      nonQualifiedDividends: totalNonQualified,
      totalDividends: totalQualified + totalNonQualified,
      taxWithheld: totalTaxWithheld,
      byAsset,
    };
  }

  /**
   * Clear dividend cache
   */
  clearCache(): void {
    this.dividendCache.clear();
  }
}

export const dividendTrackingService = DividendTrackingService.getInstance();

