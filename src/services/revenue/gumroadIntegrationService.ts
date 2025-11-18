/**
 * gumroadIntegrationService.ts
 *
 * Gumroad integration for digital product sales tracking and automation.
 * Track sales, manage products, analyze performance, handle affiliates.
 *
 * FEATURES:
 * ✅ Sales tracking (demo mode)
 * ✅ Product management
 * ✅ Affiliate tracking
 * ✅ License key generation
 * ✅ Customer management
 * ✅ Revenue analytics
 * ✅ Refund handling
 * ✅ Discount codes
 * ✅ Product variants
 * ✅ Webhook integration
 *
 * NOTE: Demo mode - simulates Gumroad API.
 * In production, use Gumroad API with access token.
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';
import { credentialVaultService } from '../credentials/credentialVaultService';

export interface GumroadProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  url: string;
  thumbnail?: string;
  customFields?: Record<string, string>;
  variants?: ProductVariant[];
  published: boolean;
  sales: number;
  revenue: number;
  createdAt: Date;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  maxPurchaseCount?: number;
}

export interface GumroadSale {
  id: string;
  productId: string;
  productName: string;
  price: number;
  currency: string;
  customerEmail: string;
  customerName?: string;
  affiliateId?: string;
  affiliateRevenue?: number;
  licenseKey?: string;
  refunded: boolean;
  chargedBack: boolean;
  timestamp: Date;
  variants?: string[];
  customFields?: Record<string, any>;
}

export interface GumroadAffiliate {
  id: string;
  email: string;
  referralCode: string;
  sales: number;
  revenue: number;
  commission: number; // Percentage
  totalEarned: number;
  joinedAt: Date;
}

export interface GumroadDiscountCode {
  id: string;
  code: string;
  productIds: string[]; // Empty = all products
  amountOff?: number; // Fixed amount
  percentOff?: number; // Percentage
  maxUses?: number;
  uses: number;
  active: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export interface GumroadAnalytics {
  totalSales: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
  refundRate: number;
  topProducts: { productId: string; name: string; sales: number; revenue: number }[];
  topAffiliates: { affiliateId: string; email: string; sales: number; earned: number }[];
  revenueByDay: { date: string; revenue: number }[];
}

class GumroadIntegrationService {
  private products: Map<string, GumroadProduct> = new Map();
  private sales: GumroadSale[] = [];
  private affiliates: Map<string, GumroadAffiliate> = new Map();
  private discountCodes: Map<string, GumroadDiscountCode> = new Map();
  private accessToken: string | null = null;

  /**
   * Initialize with Gumroad access token
   */
  initialize(accessToken: string) {
    this.accessToken = accessToken;
    logger.info('Gumroad integration initialized (demo mode)');
  }

  /**
   * Check if Gumroad is connected
   */
  isConnected(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Connect from credential vault
   */
  connectFromVault(): boolean {
    const creds = credentialVaultService.getCredentials('gumroad');

    if (creds && creds.credentials.accessToken) {
      this.initialize(creds.credentials.accessToken);
      logger.info('Gumroad auto-initialized from credential vault');
      return true;
    }

    logger.warn('Gumroad credentials not found in vault - using demo mode');
    return false;
  }

  /**
   * Get connection status
   */
  getStatus(): { connected: boolean; hasCredentials: boolean; message: string } {
    const hasVaultCreds = credentialVaultService.hasCredentials('gumroad');
    const isConnected = this.isConnected();

    if (isConnected && hasVaultCreds) {
      return {
        connected: true,
        hasCredentials: true,
        message: 'Connected to Gumroad',
      };
    } else if (hasVaultCreds && !isConnected) {
      return {
        connected: false,
        hasCredentials: true,
        message: 'Credentials available - click to connect',
      };
    } else {
      return {
        connected: false,
        hasCredentials: false,
        message: 'Demo mode - configure credentials in vault to connect',
      };
    }
  }

  /**
   * Create product
   */
  async createProduct(productData: {
    name: string;
    description: string;
    price: number;
    currency?: string;
    variants?: ProductVariant[];
    customFields?: Record<string, string>;
  }): Promise<GumroadProduct> {
    logger.info('Creating Gumroad product', { name: productData.name });

    try {
      if (!this.accessToken) {
        throw new Error('Gumroad access token not configured');
      }

      // DEMO MODE: Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      const product: GumroadProduct = {
        id: crypto.randomUUID(),
        name: productData.name,
        description: productData.description,
        price: productData.price,
        currency: productData.currency || 'USD',
        url: `https://gumroad.com/l/${productData.name.toLowerCase().replace(/\s+/g, '-')}`,
        variants: productData.variants,
        customFields: productData.customFields,
        published: true,
        sales: 0,
        revenue: 0,
        createdAt: new Date(),
      };

      this.products.set(product.id, product);

      activityService.addActivity({
        type: 'automation',
        action: 'Gumroad Product Created',
        description: `Created product: ${product.name}`,
        metadata: {
          productId: product.id,
          price: product.price,
        },
      });

      logger.info('Gumroad product created', { id: product.id, name: product.name });

      return product;
    } catch (error) {
      logger.error('Failed to create Gumroad product', { error: error as Error });
      throw error;
    }
  }

  /**
   * Process sale webhook
   */
  async processSale(saleData: Partial<GumroadSale>): Promise<GumroadSale> {
    logger.info('Processing Gumroad sale', { productId: saleData.productId });

    try {
      const sale: GumroadSale = {
        id: saleData.id || crypto.randomUUID(),
        productId: saleData.productId!,
        productName: saleData.productName || 'Unknown Product',
        price: saleData.price || 0,
        currency: saleData.currency || 'USD',
        customerEmail: saleData.customerEmail || 'customer@example.com',
        customerName: saleData.customerName,
        affiliateId: saleData.affiliateId,
        affiliateRevenue: saleData.affiliateRevenue,
        licenseKey: this.generateLicenseKey(),
        refunded: false,
        chargedBack: false,
        timestamp: saleData.timestamp || new Date(),
        variants: saleData.variants,
        customFields: saleData.customFields,
      };

      // Update product stats
      const product = this.products.get(sale.productId);
      if (product) {
        product.sales++;
        product.revenue += sale.price;
      }

      // Update affiliate stats
      if (sale.affiliateId) {
        this.updateAffiliateStats(sale);
      }

      this.sales.push(sale);

      activityService.addActivity({
        type: 'automation',
        action: 'Gumroad Sale Processed',
        description: `Sale: ${sale.productName} - $${sale.price}`,
        metadata: {
          saleId: sale.id,
          productId: sale.productId,
          price: sale.price,
        },
      });

      logger.info('Gumroad sale processed', {
        id: sale.id,
        product: sale.productName,
        price: sale.price,
      });

      // TODO: Send license key email
      // TODO: Send purchase confirmation

      return sale;
    } catch (error) {
      logger.error('Failed to process Gumroad sale', { error: error as Error });
      throw error;
    }
  }

  /**
   * Generate license key
   */
  private generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 4;
    const segmentLength = 4;

    const key = Array.from({ length: segments }, () => {
      return Array.from({ length: segmentLength }, () =>
        chars[Math.floor(Math.random() * chars.length)]
      ).join('');
    }).join('-');

    return key;
  }

  /**
   * Update affiliate stats
   */
  private updateAffiliateStats(sale: GumroadSale) {
    if (!sale.affiliateId) return;

    let affiliate = this.affiliates.get(sale.affiliateId);

    if (!affiliate) {
      // Create new affiliate
      affiliate = {
        id: sale.affiliateId,
        email: 'affiliate@example.com',
        referralCode: sale.affiliateId,
        sales: 0,
        revenue: 0,
        commission: 30, // 30% default
        totalEarned: 0,
        joinedAt: new Date(),
      };
      this.affiliates.set(affiliate.id, affiliate);
    }

    affiliate.sales++;
    affiliate.revenue += sale.price;

    const earned = (sale.price * affiliate.commission) / 100;
    affiliate.totalEarned += earned;

    logger.info('Affiliate stats updated', {
      affiliateId: affiliate.id,
      sales: affiliate.sales,
      earned: affiliate.totalEarned,
    });
  }

  /**
   * Create affiliate
   */
  async createAffiliate(email: string, commission: number = 30): Promise<GumroadAffiliate> {
    const affiliate: GumroadAffiliate = {
      id: crypto.randomUUID(),
      email,
      referralCode: this.generateReferralCode(),
      sales: 0,
      revenue: 0,
      commission,
      totalEarned: 0,
      joinedAt: new Date(),
    };

    this.affiliates.set(affiliate.id, affiliate);

    logger.info('Affiliate created', { id: affiliate.id, email, commission });

    return affiliate;
  }

  /**
   * Generate referral code
   */
  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Create discount code
   */
  async createDiscountCode(codeData: {
    code: string;
    productIds?: string[];
    amountOff?: number;
    percentOff?: number;
    maxUses?: number;
    expiresAt?: Date;
  }): Promise<GumroadDiscountCode> {
    const discount: GumroadDiscountCode = {
      id: crypto.randomUUID(),
      code: codeData.code.toUpperCase(),
      productIds: codeData.productIds || [],
      amountOff: codeData.amountOff,
      percentOff: codeData.percentOff,
      maxUses: codeData.maxUses,
      uses: 0,
      active: true,
      expiresAt: codeData.expiresAt,
      createdAt: new Date(),
    };

    this.discountCodes.set(discount.code, discount);

    logger.info('Discount code created', { code: discount.code });

    return discount;
  }

  /**
   * Process refund
   */
  async processRefund(saleId: string): Promise<boolean> {
    const sale = this.sales.find(s => s.id === saleId);

    if (!sale) {
      throw new Error('Sale not found');
    }

    if (sale.refunded) {
      throw new Error('Sale already refunded');
    }

    sale.refunded = true;

    // Update product stats
    const product = this.products.get(sale.productId);
    if (product) {
      product.sales--;
      product.revenue -= sale.price;
    }

    // Update affiliate stats if applicable
    if (sale.affiliateId) {
      const affiliate = this.affiliates.get(sale.affiliateId);
      if (affiliate) {
        affiliate.sales--;
        affiliate.revenue -= sale.price;
        const earned = (sale.price * affiliate.commission) / 100;
        affiliate.totalEarned -= earned;
      }
    }

    logger.info('Refund processed', { saleId, price: sale.price });

    activityService.addActivity({
      type: 'automation',
      action: 'Gumroad Refund Processed',
      description: `Refund: ${sale.productName} - $${sale.price}`,
      metadata: { saleId, price: sale.price },
    });

    return true;
  }

  /**
   * Get analytics
   */
  getAnalytics(): GumroadAnalytics {
    const totalSales = this.sales.filter(s => !s.refunded).length;
    const totalRevenue = this.sales
      .filter(s => !s.refunded)
      .reduce((sum, s) => sum + s.price, 0);

    const uniqueCustomers = new Set(this.sales.map(s => s.customerEmail)).size;

    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    const refundedSales = this.sales.filter(s => s.refunded).length;
    const refundRate = totalSales > 0 ? (refundedSales / this.sales.length) * 100 : 0;

    // Top products
    const productStats = new Map<string, { name: string; sales: number; revenue: number }>();
    this.sales.filter(s => !s.refunded).forEach(sale => {
      const existing = productStats.get(sale.productId);
      if (existing) {
        existing.sales++;
        existing.revenue += sale.price;
      } else {
        productStats.set(sale.productId, {
          name: sale.productName,
          sales: 1,
          revenue: sale.price,
        });
      }
    });

    const topProducts = Array.from(productStats.entries())
      .map(([productId, stats]) => ({ productId, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top affiliates
    const topAffiliates = Array.from(this.affiliates.values())
      .map(a => ({
        affiliateId: a.id,
        email: a.email,
        sales: a.sales,
        earned: a.totalEarned,
      }))
      .sort((a, b) => b.earned - a.earned)
      .slice(0, 5);

    // Revenue by day (last 30 days)
    const revenueByDay = this.calculateRevenueByDay(30);

    return {
      totalSales,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCustomers: uniqueCustomers,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      refundRate: Math.round(refundRate * 100) / 100,
      topProducts,
      topAffiliates,
      revenueByDay,
    };
  }

  /**
   * Calculate revenue by day
   */
  private calculateRevenueByDay(days: number): { date: string; revenue: number }[] {
    const result: { date: string; revenue: number }[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayRevenue = this.sales
        .filter(s => {
          const saleDate = s.timestamp.toISOString().split('T')[0];
          return saleDate === dateStr && !s.refunded;
        })
        .reduce((sum, s) => sum + s.price, 0);

      result.push({ date: dateStr, revenue: Math.round(dayRevenue * 100) / 100 });
    }

    return result;
  }

  /**
   * Get all products
   */
  getProducts(): GumroadProduct[] {
    return Array.from(this.products.values());
  }

  /**
   * Get all sales
   */
  getSales(productId?: string): GumroadSale[] {
    if (productId) {
      return this.sales.filter(s => s.productId === productId);
    }
    return [...this.sales];
  }

  /**
   * Get all affiliates
   */
  getAffiliates(): GumroadAffiliate[] {
    return Array.from(this.affiliates.values());
  }

  /**
   * Get all discount codes
   */
  getDiscountCodes(): GumroadDiscountCode[] {
    return Array.from(this.discountCodes.values());
  }

  /**
   * Validate discount code
   */
  validateDiscountCode(code: string, productId?: string): {
    valid: boolean;
    discount?: { amountOff?: number; percentOff?: number };
    reason?: string;
  } {
    const discount = this.discountCodes.get(code.toUpperCase());

    if (!discount) {
      return { valid: false, reason: 'Code not found' };
    }

    if (!discount.active) {
      return { valid: false, reason: 'Code inactive' };
    }

    if (discount.expiresAt && discount.expiresAt < new Date()) {
      return { valid: false, reason: 'Code expired' };
    }

    if (discount.maxUses && discount.uses >= discount.maxUses) {
      return { valid: false, reason: 'Code max uses reached' };
    }

    if (productId && discount.productIds.length > 0 && !discount.productIds.includes(productId)) {
      return { valid: false, reason: 'Code not valid for this product' };
    }

    return {
      valid: true,
      discount: {
        amountOff: discount.amountOff,
        percentOff: discount.percentOff,
      },
    };
  }

  /**
   * Simulate sales for testing
   */
  async simulateSale(productId: string, price: number, affiliateId?: string): Promise<GumroadSale> {
    const product = this.products.get(productId);

    return await this.processSale({
      productId,
      productName: product?.name || 'Demo Product',
      price,
      customerEmail: 'customer@example.com',
      affiliateId,
    });
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<GumroadAnalytics> {
    // Initialize
    this.initialize('demo_access_token');

    // Create product
    const product = await this.createProduct({
      name: 'AI Automation Course',
      description: 'Learn to build passive income with AI',
      price: 99,
      variants: [
        { id: 'basic', name: 'Basic', price: 99 },
        { id: 'pro', name: 'Pro', price: 199 },
      ],
    });

    // Create affiliate
    const affiliate = await this.createAffiliate('affiliate@example.com', 30);

    // Create discount code
    await this.createDiscountCode({
      code: 'LAUNCH50',
      percentOff: 50,
      maxUses: 100,
    });

    // Simulate sales
    await this.simulateSale(product.id, 99);
    await this.simulateSale(product.id, 99, affiliate.id);
    await this.simulateSale(product.id, 199);
    await this.simulateSale(product.id, 99);

    return this.getAnalytics();
  }
}

// Export singleton
export const gumroadIntegrationService = new GumroadIntegrationService();

// Auto-initialize from credential vault if available
if (typeof window !== 'undefined') {
  // Delay auto-init to ensure credential vault is loaded
  setTimeout(() => {
    gumroadIntegrationService.connectFromVault();
  }, 100);
}

// Expose to window for testing
if (typeof window !== 'undefined') {
  (window as any).testGumroadIntegration = () => gumroadIntegrationService.quickTest();
  (window as any).gumroadIntegrationService = gumroadIntegrationService;
}
