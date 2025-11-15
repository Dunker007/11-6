/**
 * Tax Reporting Service
 * 
 * Tracks tax lots, calculates realized/unrealized gains, and generates tax reports
 * Supports FIFO, LIFO, and specific identification methods
 * Similar to Sharesight's tax reporting features
 */

import { wealthService } from './wealthService';
import type { TaxLot } from '@/types/wealth';

export type TaxLotMethod = 'FIFO' | 'LIFO' | 'SPECIFIC_ID';

export interface RealizedGain {
  id: string;
  assetId: string;
  symbol: string;
  saleDate: Date;
  salePrice: number;
  quantity: number;
  costBasis: number;
  proceeds: number;
  realizedGain: number;
  realizedGainPercent: number;
  holdingPeriod: number; // Days
  isLongTerm: boolean; // > 1 year
  taxLotIds: string[]; // Which tax lots were used
}

export interface UnrealizedGain {
  assetId: string;
  symbol: string;
  quantity: number;
  costBasis: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  holdingPeriod: number; // Average days held
  isLongTerm: boolean; // Average > 1 year
}

export interface TaxReport {
  year: number;
  realizedGains: RealizedGain[];
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netRealizedGains: number;
  longTermGains: number;
  shortTermGains: number;
  longTermLosses: number;
  shortTermLosses: number;
  washSales: number; // Wash sale disallowed losses
  byAsset: Record<string, {
    realizedGains: number;
    realizedLosses: number;
    netGains: number;
  }>;
}

export interface TaxLotSale {
  assetId: string;
  symbol: string;
  saleDate: Date;
  salePrice: number;
  quantity: number;
  method: TaxLotMethod;
  specificLotIds?: string[]; // For SPECIFIC_ID method
}

class TaxReportingService {
  private static instance: TaxReportingService;
  private taxLots: Map<string, TaxLot[]> = new Map(); // assetId -> tax lots
  private realizedGains: Map<string, RealizedGain[]> = new Map(); // year -> gains
  private defaultMethod: TaxLotMethod = 'FIFO';

  private constructor() {
    this.loadTaxLots();
  }

  static getInstance(): TaxReportingService {
    if (!TaxReportingService.instance) {
      TaxReportingService.instance = new TaxReportingService();
    }
    return TaxReportingService.instance;
  }

  /**
   * Load tax lots from assets
   */
  private loadTaxLots(): void {
    const assets = wealthService.getAssets();
    assets.forEach(asset => {
      if (asset.taxLots && asset.taxLots.length > 0) {
        this.taxLots.set(asset.id, asset.taxLots);
      }
    });
  }

  /**
   * Set default tax lot method
   */
  setDefaultMethod(method: TaxLotMethod): void {
    this.defaultMethod = method;
  }

  /**
   * Get default tax lot method
   */
  getDefaultMethod(): TaxLotMethod {
    return this.defaultMethod;
  }

  /**
   * Create tax lot from purchase
   */
  createTaxLot(
    assetId: string,
    quantity: number,
    purchasePrice: number,
    purchaseDate: Date
  ): TaxLot {
    const taxLot: TaxLot = {
      id: crypto.randomUUID(),
      assetId,
      quantity,
      purchasePrice,
      purchaseDate,
      holdingPeriod: Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)),
      isLongTerm: (Date.now() - purchaseDate.getTime()) > 365 * 24 * 60 * 60 * 1000,
    };

    // Add to asset
    const asset = wealthService.getAsset(assetId);
    if (asset) {
      const taxLots = asset.taxLots || [];
      taxLots.push(taxLot);
      wealthService.updateAsset(assetId, { taxLots });

      // Update local cache
      this.taxLots.set(assetId, taxLots);
    }

    return taxLot;
  }

  /**
   * Record a sale and calculate realized gains
   */
  recordSale(sale: TaxLotSale): RealizedGain {
    const asset = wealthService.getAsset(sale.assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${sale.assetId}`);
    }

    const taxLots = this.taxLots.get(sale.assetId) || [];
    if (taxLots.length === 0) {
      throw new Error(`No tax lots found for asset: ${sale.assetId}`);
    }

    // Select tax lots based on method
    const selectedLots = this.selectTaxLots(taxLots, sale.quantity, sale.method, sale.specificLotIds || []);

    // Calculate realized gain
    const totalCostBasis = selectedLots.reduce((sum, lot) => sum + (lot.purchasePrice * lot.quantity), 0);
    const proceeds = sale.salePrice * sale.quantity;
    const realizedGain = proceeds - totalCostBasis;
    const realizedGainPercent = totalCostBasis > 0 ? (realizedGain / totalCostBasis) * 100 : 0;

    // Calculate average holding period
    const totalDays = selectedLots.reduce((sum, lot) => {
      const days = Math.floor((sale.saleDate.getTime() - lot.purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + (days * lot.quantity);
    }, 0);
    const averageHoldingPeriod = totalDays / sale.quantity;
    const isLongTerm = averageHoldingPeriod > 365;

    // Update tax lots (mark as sold)
    selectedLots.forEach(lot => {
      lot.saleDate = sale.saleDate;
      lot.salePrice = sale.salePrice;
      lot.realizedGain = (sale.salePrice - lot.purchasePrice) * lot.quantity;
      lot.realizedGainPercent = lot.purchasePrice > 0 
        ? ((sale.salePrice - lot.purchasePrice) / lot.purchasePrice) * 100 
        : 0;
      lot.holdingPeriod = Math.floor((sale.saleDate.getTime() - lot.purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
      lot.isLongTerm = lot.holdingPeriod > 365;
    });

    // Create realized gain record
    const realizedGainRecord: RealizedGain = {
      id: crypto.randomUUID(),
      assetId: sale.assetId,
      symbol: sale.symbol,
      saleDate: sale.saleDate,
      salePrice: sale.salePrice,
      quantity: sale.quantity,
      costBasis: totalCostBasis,
      proceeds,
      realizedGain,
      realizedGainPercent,
      holdingPeriod: averageHoldingPeriod,
      isLongTerm,
      taxLotIds: selectedLots.map(lot => lot.id),
    };

    // Store realized gain
    const year = sale.saleDate.getFullYear();
    const yearGains = this.realizedGains.get(year.toString()) || [];
    yearGains.push(realizedGainRecord);
    this.realizedGains.set(year.toString(), yearGains);

    // Update asset
    wealthService.updateAsset(sale.assetId, { taxLots });

    return realizedGainRecord;
  }

  /**
   * Select tax lots based on method
   */
  private selectTaxLots(
    taxLots: TaxLot[],
    quantity: number,
    method: TaxLotMethod,
    specificLotIds: string[]
  ): TaxLot[] {
    const availableLots = taxLots.filter(lot => !lot.saleDate);
    
    if (method === 'SPECIFIC_ID' && specificLotIds.length > 0) {
      // Use specific lots
      const selected: TaxLot[] = [];
      let remaining = quantity;
      
      for (const lotId of specificLotIds) {
        if (remaining <= 0) break;
        const lot = availableLots.find(l => l.id === lotId);
        if (lot) {
          const useQuantity = Math.min(lot.quantity, remaining);
          selected.push({ ...lot, quantity: useQuantity });
          remaining -= useQuantity;
        }
      }
      
      if (remaining > 0) {
        throw new Error(`Insufficient quantity in specified lots. Need ${quantity}, got ${quantity - remaining}`);
      }
      
      return selected;
    }

    // Sort by purchase date
    const sorted = [...availableLots].sort((a, b) => {
      if (method === 'FIFO') {
        return a.purchaseDate.getTime() - b.purchaseDate.getTime(); // Oldest first
      } else {
        return b.purchaseDate.getTime() - a.purchaseDate.getTime(); // Newest first (LIFO)
      }
    });

    // Select lots to cover quantity
    const selected: TaxLot[] = [];
    let remaining = quantity;

    for (const lot of sorted) {
      if (remaining <= 0) break;
      const useQuantity = Math.min(lot.quantity, remaining);
      selected.push({ ...lot, quantity: useQuantity });
      remaining -= useQuantity;
    }

    if (remaining > 0) {
      throw new Error(`Insufficient tax lots. Need ${quantity}, got ${quantity - remaining}`);
    }

    return selected;
  }

  /**
   * Calculate unrealized gains for all assets
   */
  calculateUnrealizedGains(): UnrealizedGain[] {
    const assets = wealthService.getAssets();
    const unrealized: UnrealizedGain[] = [];

    assets.forEach(asset => {
      if (!asset.symbol || !asset.currentPrice) return;

      const taxLots = this.taxLots.get(asset.id) || [];
      const unsoldLots = taxLots.filter(lot => !lot.saleDate);

      if (unsoldLots.length === 0) return;

      const totalQuantity = unsoldLots.reduce((sum, lot) => sum + lot.quantity, 0);
      const totalCostBasis = unsoldLots.reduce((sum, lot) => sum + (lot.purchasePrice * lot.quantity), 0);
      const currentValue = asset.currentPrice * totalQuantity;
      const unrealizedGain = currentValue - totalCostBasis;
      const unrealizedGainPercent = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0;

      // Calculate average holding period
      const totalDays = unsoldLots.reduce((sum, lot) => {
        const days = Math.floor((Date.now() - lot.purchaseDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + (days * lot.quantity);
      }, 0);
      const averageHoldingPeriod = totalDays / totalQuantity;
      const isLongTerm = averageHoldingPeriod > 365;

      unrealized.push({
        assetId: asset.id,
        symbol: asset.symbol,
        quantity: totalQuantity,
        costBasis: totalCostBasis,
        currentValue,
        unrealizedGain,
        unrealizedGainPercent,
        holdingPeriod: averageHoldingPeriod,
        isLongTerm,
      });
    });

    return unrealized;
  }

  /**
   * Generate tax report for a year
   */
  generateTaxReport(year: number): TaxReport {
    const realizedGains = this.realizedGains.get(year.toString()) || [];

    let totalRealizedGains = 0;
    let totalRealizedLosses = 0;
    let longTermGains = 0;
    let shortTermGains = 0;
    let longTermLosses = 0;
    let shortTermLosses = 0;
    const byAsset: Record<string, {
      realizedGains: number;
      realizedLosses: number;
      netGains: number;
    }> = {};

    realizedGains.forEach(gain => {
      const amount = gain.realizedGain;
      
      if (amount > 0) {
        totalRealizedGains += amount;
        if (gain.isLongTerm) {
          longTermGains += amount;
        } else {
          shortTermGains += amount;
        }
      } else {
        totalRealizedLosses += Math.abs(amount);
        if (gain.isLongTerm) {
          longTermLosses += Math.abs(amount);
        } else {
          shortTermLosses += Math.abs(amount);
        }
      }

      // Group by asset
      if (!byAsset[gain.symbol]) {
        byAsset[gain.symbol] = {
          realizedGains: 0,
          realizedLosses: 0,
          netGains: 0,
        };
      }

      if (amount > 0) {
        byAsset[gain.symbol].realizedGains += amount;
      } else {
        byAsset[gain.symbol].realizedLosses += Math.abs(amount);
      }
      byAsset[gain.symbol].netGains += amount;
    });

    return {
      year,
      realizedGains,
      totalRealizedGains,
      totalRealizedLosses,
      netRealizedGains: totalRealizedGains - totalRealizedLosses,
      longTermGains,
      shortTermGains,
      longTermLosses,
      shortTermLosses,
      washSales: 0, // Would need to detect wash sales
      byAsset,
    };
  }

  /**
   * Generate 1099-B style report
   */
  generate1099BReport(year: number): Array<{
    description: string;
    dateAcquired: Date;
    dateSold: Date;
    proceeds: number;
    costBasis: number;
    gainLoss: number;
    shortTerm: boolean;
  }> {
    const realizedGains = this.realizedGains.get(year.toString()) || [];
    const report: Array<{
      description: string;
      dateAcquired: Date;
      dateSold: Date;
      proceeds: number;
      costBasis: number;
      gainLoss: number;
      shortTerm: boolean;
    }> = [];

    realizedGains.forEach(gain => {
      const asset = wealthService.getAsset(gain.assetId);
      if (!asset) return;

      // Get earliest purchase date from tax lots
      const taxLots = this.taxLots.get(gain.assetId) || [];
      const usedLots = taxLots.filter(lot => gain.taxLotIds.includes(lot.id));
      const earliestDate = usedLots.length > 0
        ? new Date(Math.min(...usedLots.map(lot => lot.purchaseDate.getTime())))
        : gain.saleDate;

      report.push({
        description: `${gain.quantity} shares of ${asset.name} (${gain.symbol})`,
        dateAcquired: earliestDate,
        dateSold: gain.saleDate,
        proceeds: gain.proceeds,
        costBasis: gain.costBasis,
        gainLoss: gain.realizedGain,
        shortTerm: !gain.isLongTerm,
      });
    });

    return report.sort((a, b) => a.dateSold.getTime() - b.dateSold.getTime());
  }

  /**
   * Suggest tax-loss harvesting opportunities
   */
  suggestTaxLossHarvesting(): Array<{
    assetId: string;
    symbol: string;
    currentLoss: number;
    currentLossPercent: number;
    suggestedAction: string;
  }> {
    const unrealized = this.calculateUnrealizedGains();
    const opportunities: Array<{
      assetId: string;
      symbol: string;
      currentLoss: number;
      currentLossPercent: number;
      suggestedAction: string;
    }> = [];

    unrealized.forEach(gain => {
      if (gain.unrealizedGain < 0 && !gain.isLongTerm) {
        // Short-term loss - good for harvesting
        opportunities.push({
          assetId: gain.assetId,
          symbol: gain.symbol,
          currentLoss: Math.abs(gain.unrealizedGain),
          currentLossPercent: Math.abs(gain.unrealizedGainPercent),
          suggestedAction: `Consider selling to realize ${Math.abs(gain.unrealizedGain).toFixed(2)} loss`,
        });
      }
    });

    return opportunities.sort((a, b) => b.currentLoss - a.currentLoss);
  }

  /**
   * Get realized gains for a year
   */
  getRealizedGains(year: number): RealizedGain[] {
    return this.realizedGains.get(year.toString()) || [];
  }

  /**
   * Clear tax data (for testing/reset)
   */
  clearTaxData(): void {
    this.taxLots.clear();
    this.realizedGains.clear();
  }
}

export const taxReportingService = TaxReportingService.getInstance();

