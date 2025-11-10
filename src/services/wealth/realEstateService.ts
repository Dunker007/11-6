/**
 * Real Estate Service
 * 
 * Integrates with Zillow API for property value tracking
 * Tracks rental income, expenses, and ROI calculations
 */

import type { RealEstateAsset } from '@/types/wealth';

const ZILLOW_API_BASE = 'https://api.bridgedataoutput.com/api/v2'; // Zillow API endpoint
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

interface ZillowPropertyData {
  zpid: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipcode: string;
  };
  zestimate: {
    amount: number;
    lastUpdated: string;
  };
  rentZestimate?: {
    amount: number;
    lastUpdated: string;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class RealEstateService {
  private static instance: RealEstateService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private apiKey: string | null = null;

  private constructor() {
    this.loadApiKey();
  }

  static getInstance(): RealEstateService {
    if (!RealEstateService.instance) {
      RealEstateService.instance = new RealEstateService();
    }
    return RealEstateService.instance;
  }

  private loadApiKey(): void {
    // In real implementation, would load from API key service
    // For now, check localStorage or environment
    try {
      const stored = localStorage.getItem('zillow_api_key');
      if (stored) {
        this.apiKey = stored;
      }
    } catch (error) {
      console.error('Failed to load Zillow API key:', error);
    }
  }

  /**
   * Set Zillow API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    try {
      localStorage.setItem('zillow_api_key', apiKey);
    } catch (error) {
      console.error('Failed to save Zillow API key:', error);
    }
  }

  /**
   * Get property data from Zillow
   */
  async getPropertyData(address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<ZillowPropertyData | null> {
    if (!this.apiKey) {
      console.warn('Zillow API key not configured');
      return null;
    }

    const cacheKey = `zillow_${address.street}_${address.city}_${address.state}_${address.zipCode}`;
    const cached = this.getCached<ZillowPropertyData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Zillow API call (simplified - actual API structure may differ)
      const query = `${address.street}, ${address.city}, ${address.state} ${address.zipCode}`;
      const url = `${ZILLOW_API_BASE}/zestimate?address=${encodeURIComponent(query)}&zws-id=${this.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform Zillow response to our format
      const propertyData: ZillowPropertyData = {
        zpid: data.zpid || '',
        address: {
          street: address.street,
          city: address.city,
          state: address.state,
          zipcode: address.zipCode,
        },
        zestimate: {
          amount: data.zestimate?.amount || 0,
          lastUpdated: data.zestimate?.lastUpdated || new Date().toISOString(),
        },
        rentZestimate: data.rentzestimate ? {
          amount: data.rentzestimate.amount || 0,
          lastUpdated: data.rentzestimate.lastUpdated || new Date().toISOString(),
        } : undefined,
      };

      this.setCache(cacheKey, propertyData);
      return propertyData;
    } catch (error) {
      console.error('Failed to fetch Zillow property data:', error);
      return null;
    }
  }

  /**
   * Update real estate asset with current Zillow estimate
   */
  async updatePropertyValue(asset: RealEstateAsset): Promise<RealEstateAsset> {
    const propertyData = await this.getPropertyData(asset.address);
    
    if (propertyData) {
      asset.currentEstimatedValue = propertyData.zestimate.amount;
      
      if (propertyData.rentZestimate && !asset.rentalIncome) {
        asset.rentalIncome = {
          monthly: propertyData.rentZestimate.amount,
          annual: propertyData.rentZestimate.amount * 12,
        };
      }
    }

    // Calculate ROI
    this.calculateROI(asset);

    return asset;
  }

  /**
   * Calculate ROI metrics for a property
   */
  calculateROI(asset: RealEstateAsset): void {
    if (!asset.rentalIncome || !asset.expenses) {
      return;
    }

    const netOperatingIncome = asset.rentalIncome.annual - 
      (asset.expenses.propertyTaxes + 
       asset.expenses.insurance + 
       asset.expenses.maintenance + 
       (asset.expenses.management || 0) + 
       (asset.expenses.utilities || 0) + 
       (asset.expenses.hoa || 0));

    // Cash-on-cash return (if mortgaged)
    if (asset.mortgage) {
      const cashInvested = asset.purchasePrice - (asset.mortgage.principal - asset.mortgage.remainingBalance);
      const cashFlow = netOperatingIncome - (asset.mortgage.monthlyPayment * 12);
      asset.roi = {
        cashOnCash: cashInvested > 0 ? (cashFlow / cashInvested) * 100 : 0,
        capRate: asset.currentEstimatedValue > 0 ? (netOperatingIncome / asset.currentEstimatedValue) * 100 : 0,
        totalReturn: asset.currentEstimatedValue > 0 
          ? ((asset.currentEstimatedValue - asset.purchasePrice + netOperatingIncome) / asset.purchasePrice) * 100 
          : 0,
      };
    } else {
      // No mortgage - simpler calculations
      asset.roi = {
        cashOnCash: 0,
        capRate: asset.currentEstimatedValue > 0 ? (netOperatingIncome / asset.currentEstimatedValue) * 100 : 0,
        totalReturn: asset.currentEstimatedValue > 0 
          ? ((asset.currentEstimatedValue - asset.purchasePrice + netOperatingIncome) / asset.purchasePrice) * 100 
          : 0,
      };
    }
  }

  /**
   * Search for properties by address
   */
  async searchProperties(query: string): Promise<Array<{
    zpid: string;
    address: string;
    zestimate: number;
  }>> {
    if (!this.apiKey) {
      return [];
    }

    try {
      const url = `${ZILLOW_API_BASE}/search?q=${encodeURIComponent(query)}&zws-id=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform search results
      return (data.results || []).map((result: any) => ({
        zpid: result.zpid,
        address: result.address?.full || '',
        zestimate: result.zestimate?.amount || 0,
      }));
    } catch (error) {
      console.error('Failed to search Zillow properties:', error);
      return [];
    }
  }

  /**
   * Get property history (price changes over time)
   */
  async getPropertyHistory(zpid: string): Promise<Array<{
    date: Date;
    value: number;
    change?: number;
  }>> {
    if (!this.apiKey) {
      return [];
    }

    const cacheKey = `zillow_history_${zpid}`;
    const cached = this.getCached<Array<{ date: Date; value: number; change?: number }>>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${ZILLOW_API_BASE}/zestimate_history?zpid=${zpid}&zws-id=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Zillow API error: ${response.status}`);
      }

      const data = await response.json();
      
      const history = (data.history || []).map((entry: any, index: number) => ({
        date: new Date(entry.date),
        value: entry.value || 0,
        change: index > 0 ? entry.value - data.history[index - 1].value : undefined,
      }));

      this.setCache(cacheKey, history);
      return history;
    } catch (error) {
      console.error('Failed to fetch Zillow property history:', error);
      return [];
    }
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const age = Date.now() - entry.timestamp;
    if (age > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const realEstateService = RealEstateService.getInstance();

