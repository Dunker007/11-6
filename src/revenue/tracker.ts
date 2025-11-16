/**
 * Revenue Tracking System
 * Monitor affiliate earnings, conversions, and performance metrics
 */

export interface AffiliateClick {
  id: string;
  affiliateId: string;
  productId: string;
  productName: string;
  clickUrl: string;
  timestamp: number;
  userAgent: string;
  referrer?: string;
  sessionId: string;
}

export interface AffiliateConversion {
  id: string;
  clickId: string;
  affiliateId: string;
  productId: string;
  productName: string;
  commission: number;
  orderValue: number;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface RevenueMetrics {
  totalClicks: number;
  totalConversions: number;
  totalCommission: number;
  conversionRate: number;
  averageOrderValue: number;
  topPerformingProducts: Array<{
    productId: string;
    productName: string;
    clicks: number;
    conversions: number;
    commission: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    clicks: number;
    conversions: number;
    commission: number;
  }>;
}

/**
 * Revenue Tracker
 * Tracks affiliate marketing performance and earnings
 */
export class RevenueTracker {
  private clicks: AffiliateClick[] = [];
  private conversions: AffiliateConversion[] = [];
  private storageKey = 'vibed-ed-revenue';

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Track an affiliate click
   */
  trackClick(click: Omit<AffiliateClick, 'id' | 'timestamp'>): string {
    const clickId = `click_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const clickData: AffiliateClick = {
      ...click,
      id: clickId,
      timestamp: Date.now()
    };

    this.clicks.push(clickData);
    this.saveToStorage();

    console.log('Affiliate click tracked:', clickData);
    return clickId;
  }

  /**
   * Track an affiliate conversion
   */
  trackConversion(conversion: Omit<AffiliateConversion, 'id' | 'timestamp'>): void {
    const conversionData: AffiliateConversion = {
      ...conversion,
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    this.conversions.push(conversionData);
    this.saveToStorage();

    console.log('Affiliate conversion tracked:', conversionData);
  }

  /**
   * Get comprehensive revenue metrics
   */
  getMetrics(): RevenueMetrics {
    const totalClicks = this.clicks.length;
    const totalConversions = this.conversions.length;
    const approvedConversions = this.conversions.filter(c => c.status === 'approved');
    const totalCommission = approvedConversions.reduce((sum, c) => sum + c.commission, 0);
    const totalOrderValue = approvedConversions.reduce((sum, c) => sum + c.orderValue, 0);

    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const averageOrderValue = approvedConversions.length > 0 ? totalOrderValue / approvedConversions.length : 0;

    // Top performing products
    const productStats = new Map<string, {
      productId: string;
      productName: string;
      clicks: number;
      conversions: number;
      commission: number;
    }>();

    // Count clicks per product
    this.clicks.forEach(click => {
      const existing = productStats.get(click.productId) || {
        productId: click.productId,
        productName: click.productName,
        clicks: 0,
        conversions: 0,
        commission: 0
      };
      existing.clicks++;
      productStats.set(click.productId, existing);
    });

    // Count conversions per product
    this.conversions.forEach(conversion => {
      const existing = productStats.get(conversion.productId);
      if (existing) {
        existing.conversions++;
        if (conversion.status === 'approved') {
          existing.commission += conversion.commission;
        }
      }
    });

    const topPerformingProducts = Array.from(productStats.values())
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 5);

    // Monthly revenue breakdown
    const monthlyData = new Map<string, {
      clicks: number;
      conversions: number;
      commission: number;
    }>();

    this.clicks.forEach(click => {
      const month = new Date(click.timestamp).toISOString().slice(0, 7); // YYYY-MM
      const existing = monthlyData.get(month) || { clicks: 0, conversions: 0, commission: 0 };
      existing.clicks++;
      monthlyData.set(month, existing);
    });

    this.conversions.forEach(conversion => {
      const month = new Date(conversion.timestamp).toISOString().slice(0, 7);
      const existing = monthlyData.get(month) || { clicks: 0, conversions: 0, commission: 0 };
      existing.conversions++;
      if (conversion.status === 'approved') {
        existing.commission += conversion.commission;
      }
      monthlyData.set(month, existing);
    });

    const monthlyRevenue = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12);

    return {
      totalClicks,
      totalConversions,
      totalCommission,
      conversionRate,
      averageOrderValue,
      topPerformingProducts,
      monthlyRevenue
    };
  }

  /**
   * Get recent activity
   */
  getRecentActivity(limit = 10): Array<AffiliateClick | AffiliateConversion> {
    const allActivity = [
      ...this.clicks.map(click => ({ ...click, type: 'click' as const })),
      ...this.conversions.map(conv => ({ ...conv, type: 'conversion' as const }))
    ];

    return allActivity
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Export data for external analysis
   */
  exportData(): {
    clicks: AffiliateClick[];
    conversions: AffiliateConversion[];
    metrics: RevenueMetrics;
  } {
    return {
      clicks: this.clicks,
      conversions: this.conversions,
      metrics: this.getMetrics()
    };
  }

  /**
   * Clear all data (for testing/reset)
   */
  clearData(): void {
    this.clicks = [];
    this.conversions = [];
    this.saveToStorage();
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.clicks = data.clicks || [];
        this.conversions = data.conversions || [];
      }
    } catch (error) {
      console.error('Failed to load revenue data from storage:', error);
    }
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        clicks: this.clicks,
        conversions: this.conversions,
        lastUpdated: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save revenue data to storage:', error);
    }
  }
}

/**
 * Global Revenue Tracker Instance
 */
export const revenueTracker = new RevenueTracker();
