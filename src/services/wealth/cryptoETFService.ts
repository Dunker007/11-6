/**
 * cryptoETFService.ts
 *
 * PURPOSE:
 * Service for tracking cryptocurrency and ETF holdings, prices, and performance.
 * Provides portfolio tracking, price updates, and analytics for crypto and ETF investments.
 *
 * FEATURES:
 * ✅ Crypto holdings tracking (BTC, ETH, SOL, ADA, DOT, MATIC, LINK, AVAX, ATOM, UNI)
 * ✅ ETF holdings tracking (SPY, QQQ, VOO, VTI, IVV, ARKK, VGT, XLK, SOXX, SMH)
 * ✅ Simulated price updates
 * ✅ Portfolio value calculation
 * ✅ Profit/Loss tracking
 * ✅ Performance analytics
 * ✅ LocalStorage persistence
 */

import { logger } from '../logging/loggerService';

export interface CryptoHolding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number; // Price per unit when purchased
  currentPrice: number;
  value: number; // quantity * currentPrice
  profitLoss: number;
  profitLossPercent: number;
  purchaseDate: Date;
}

export interface ETFHolding {
  id: string;
  symbol: string;
  name: string;
  shares: number;
  costBasis: number;
  currentPrice: number;
  value: number;
  profitLoss: number;
  profitLossPercent: number;
  purchaseDate: Date;
  category: 'tech' | 'broad-market' | 'growth' | 'semiconductor' | 'other';
}

export interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  cryptoValue: number;
  etfValue: number;
  cryptoCount: number;
  etfCount: number;
}

// Crypto prices (simulated - would be from API in production)
const CRYPTO_PRICES: Record<string, { name: string; price: number }> = {
  BTC: { name: 'Bitcoin', price: 43250 },
  ETH: { name: 'Ethereum', price: 2280 },
  SOL: { name: 'Solana', price: 105 },
  ADA: { name: 'Cardano', price: 0.52 },
  DOT: { name: 'Polkadot', price: 7.20 },
  MATIC: { name: 'Polygon', price: 0.85 },
  LINK: { name: 'Chainlink', price: 15.40 },
  AVAX: { name: 'Avalanche', price: 36.50 },
  ATOM: { name: 'Cosmos', price: 10.20 },
  UNI: { name: 'Uniswap', price: 6.80 },
};

// ETF prices (simulated - would be from API in production)
const ETF_PRICES: Record<string, { name: string; price: number; category: ETFHolding['category'] }> = {
  SPY: { name: 'SPDR S&P 500', price: 478.50, category: 'broad-market' },
  QQQ: { name: 'Invesco QQQ', price: 395.20, category: 'tech' },
  VOO: { name: 'Vanguard S&P 500', price: 440.80, category: 'broad-market' },
  VTI: { name: 'Vanguard Total Stock Market', price: 235.60, category: 'broad-market' },
  IVV: { name: 'iShares Core S&P 500', price: 478.30, category: 'broad-market' },
  ARKK: { name: 'ARK Innovation', price: 47.20, category: 'growth' },
  VGT: { name: 'Vanguard Info Tech', price: 485.90, category: 'tech' },
  XLK: { name: 'Technology Select Sector', price: 195.40, category: 'tech' },
  SOXX: { name: 'iShares Semiconductor', price: 498.70, category: 'semiconductor' },
  SMH: { name: 'VanEck Semiconductor', price: 245.30, category: 'semiconductor' },
};

class CryptoETFService {
  private cryptoHoldings: CryptoHolding[] = [];
  private etfHoldings: ETFHolding[] = [];
  private storageKey = 'crypto-etf-holdings';

  constructor() {
    this.loadFromStorage();
    this.startPriceUpdates();
  }

  /**
   * Load holdings from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.cryptoHoldings = data.crypto?.map((h: any) => ({
          ...h,
          purchaseDate: new Date(h.purchaseDate),
        })) || [];
        this.etfHoldings = data.etf?.map((h: any) => ({
          ...h,
          purchaseDate: new Date(h.purchaseDate),
        })) || [];

        // Update current prices and recalculate
        this.updateAllPrices();
      }
    } catch (error) {
      logger.error('Failed to load crypto/ETF holdings', { error });
    }
  }

  /**
   * Save holdings to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        crypto: this.cryptoHoldings,
        etf: this.etfHoldings,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save crypto/ETF holdings', { error });
    }
  }

  /**
   * Start simulated price updates
   */
  private startPriceUpdates(): void {
    // Update prices every 30 seconds
    setInterval(() => {
      this.updateAllPrices();
    }, 30000);
  }

  /**
   * Update all current prices (simulated)
   */
  private updateAllPrices(): void {
    // Update crypto holdings
    this.cryptoHoldings = this.cryptoHoldings.map(holding => {
      const priceData = CRYPTO_PRICES[holding.symbol];
      if (!priceData) return holding;

      // Simulate small price fluctuation (+/- 2%)
      const fluctuation = 1 + (Math.random() * 0.04 - 0.02);
      const currentPrice = priceData.price * fluctuation;
      const value = holding.quantity * currentPrice;
      const invested = holding.quantity * holding.costBasis;
      const profitLoss = value - invested;
      const profitLossPercent = (profitLoss / invested) * 100;

      return {
        ...holding,
        currentPrice,
        value,
        profitLoss,
        profitLossPercent,
      };
    });

    // Update ETF holdings
    this.etfHoldings = this.etfHoldings.map(holding => {
      const priceData = ETF_PRICES[holding.symbol];
      if (!priceData) return holding;

      // Simulate small price fluctuation (+/- 1%)
      const fluctuation = 1 + (Math.random() * 0.02 - 0.01);
      const currentPrice = priceData.price * fluctuation;
      const value = holding.shares * currentPrice;
      const invested = holding.shares * holding.costBasis;
      const profitLoss = value - invested;
      const profitLossPercent = (profitLoss / invested) * 100;

      return {
        ...holding,
        currentPrice,
        value,
        profitLoss,
        profitLossPercent,
      };
    });

    this.saveToStorage();
  }

  /**
   * Add crypto holding
   */
  addCryptoHolding(symbol: string, quantity: number, costBasis: number, purchaseDate?: Date): CryptoHolding {
    const priceData = CRYPTO_PRICES[symbol];
    if (!priceData) {
      throw new Error(`Unknown cryptocurrency: ${symbol}`);
    }

    const currentPrice = priceData.price;
    const value = quantity * currentPrice;
    const invested = quantity * costBasis;
    const profitLoss = value - invested;
    const profitLossPercent = (profitLoss / invested) * 100;

    const holding: CryptoHolding = {
      id: crypto.randomUUID(),
      symbol,
      name: priceData.name,
      quantity,
      costBasis,
      currentPrice,
      value,
      profitLoss,
      profitLossPercent,
      purchaseDate: purchaseDate || new Date(),
    };

    this.cryptoHoldings.push(holding);
    this.saveToStorage();

    logger.info('Crypto holding added', { symbol, quantity });
    return holding;
  }

  /**
   * Add ETF holding
   */
  addETFHolding(symbol: string, shares: number, costBasis: number, purchaseDate?: Date): ETFHolding {
    const priceData = ETF_PRICES[symbol];
    if (!priceData) {
      throw new Error(`Unknown ETF: ${symbol}`);
    }

    const currentPrice = priceData.price;
    const value = shares * currentPrice;
    const invested = shares * costBasis;
    const profitLoss = value - invested;
    const profitLossPercent = (profitLoss / invested) * 100;

    const holding: ETFHolding = {
      id: crypto.randomUUID(),
      symbol,
      name: priceData.name,
      shares,
      costBasis,
      currentPrice,
      value,
      profitLoss,
      profitLossPercent,
      purchaseDate: purchaseDate || new Date(),
      category: priceData.category,
    };

    this.etfHoldings.push(holding);
    this.saveToStorage();

    logger.info('ETF holding added', { symbol, shares });
    return holding;
  }

  /**
   * Delete crypto holding
   */
  deleteCryptoHolding(id: string): boolean {
    const index = this.cryptoHoldings.findIndex(h => h.id === id);
    if (index !== -1) {
      this.cryptoHoldings.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Delete ETF holding
   */
  deleteETFHolding(id: string): boolean {
    const index = this.etfHoldings.findIndex(h => h.id === id);
    if (index !== -1) {
      this.etfHoldings.splice(index, 1);
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Get all crypto holdings
   */
  getCryptoHoldings(): CryptoHolding[] {
    return [...this.cryptoHoldings];
  }

  /**
   * Get all ETF holdings
   */
  getETFHoldings(): ETFHolding[] {
    return [...this.etfHoldings];
  }

  /**
   * Get portfolio summary
   */
  getPortfolioSummary(): PortfolioSummary {
    const cryptoValue = this.cryptoHoldings.reduce((sum, h) => sum + h.value, 0);
    const etfValue = this.etfHoldings.reduce((sum, h) => sum + h.value, 0);
    const totalValue = cryptoValue + etfValue;

    const cryptoInvested = this.cryptoHoldings.reduce((sum, h) => sum + (h.quantity * h.costBasis), 0);
    const etfInvested = this.etfHoldings.reduce((sum, h) => sum + (h.shares * h.costBasis), 0);
    const totalInvested = cryptoInvested + etfInvested;

    const totalProfitLoss = totalValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPercent,
      cryptoValue,
      etfValue,
      cryptoCount: this.cryptoHoldings.length,
      etfCount: this.etfHoldings.length,
    };
  }

  /**
   * Get available cryptocurrencies
   */
  getAvailableCryptos(): Array<{ symbol: string; name: string; price: number }> {
    return Object.entries(CRYPTO_PRICES).map(([symbol, data]) => ({
      symbol,
      ...data,
    }));
  }

  /**
   * Get available ETFs
   */
  getAvailableETFs(): Array<{ symbol: string; name: string; price: number; category: ETFHolding['category'] }> {
    return Object.entries(ETF_PRICES).map(([symbol, data]) => ({
      symbol,
      ...data,
    }));
  }

  /**
   * Get current price for symbol
   */
  getCurrentPrice(symbol: string, type: 'crypto' | 'etf'): number | null {
    if (type === 'crypto') {
      return CRYPTO_PRICES[symbol]?.price || null;
    } else {
      return ETF_PRICES[symbol]?.price || null;
    }
  }

  /**
   * Clear all holdings (for testing)
   */
  clearAllHoldings(): void {
    this.cryptoHoldings = [];
    this.etfHoldings = [];
    this.saveToStorage();
    logger.warn('All crypto/ETF holdings cleared');
  }
}

// Export singleton
export const cryptoETFService = new CryptoETFService();

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).cryptoETFService = cryptoETFService;
}
