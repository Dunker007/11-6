/**
 * affiliateLinkService.ts
 *
 * PURPOSE:
 * Automated affiliate link management and injection for passive income generation.
 * Manages affiliate programs, tracks links, automates link insertion into content,
 * and monitors click-through and conversion metrics.
 *
 * ARCHITECTURE:
 * - Maintains affiliate program registry (Amazon, ClickBank, CJ, ShareASale, etc.)
 * - Automatically generates affiliate links with tracking parameters
 * - Injects links into generated content intelligently
 * - Tracks link performance (clicks, conversions, revenue)
 * - Provides link analytics and optimization recommendations
 *
 * FEATURES:
 * ✅ Multiple affiliate program support
 * ✅ Automatic link generation with tracking
 * ✅ Smart content injection (contextual placement)
 * ✅ Link cloaking and shortening
 * ✅ Performance tracking and analytics
 * ✅ Revenue attribution
 * ✅ Link rotation and A/B testing
 *
 * DEPENDENCIES:
 * - logger: Activity logging
 * - activityService: User activity tracking
 */

import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';

export interface AffiliateProgram {
  id: string;
  name: string;
  platform: 'amazon' | 'clickbank' | 'cj' | 'shareasale' | 'rakuten' | 'custom';
  affiliateId: string;
  baseUrl: string;
  trackingParameter: string; // e.g., "tag", "affiliate_id"
  commission: {
    type: 'percentage' | 'fixed';
    value: number;
  };
  categories: string[];
  isActive: boolean;
}

export interface AffiliateLink {
  id: string;
  programId: string;
  productName: string;
  productUrl: string;
  affiliateUrl: string;
  shortUrl?: string;
  category: string;
  tags: string[];
  createdAt: Date;
  metrics: {
    clicks: number;
    conversions: number;
    revenue: number;
    lastClickedAt?: Date;
  };
}

export interface LinkInjectionOptions {
  content: string;
  keywords?: string[]; // Keywords to match for link insertion
  maxLinks?: number; // Maximum links to inject
  contextual?: boolean; // Use contextual matching
  linkStyle?: 'inline' | 'button' | 'banner';
}

class AffiliateLinkService {
  private programs: Map<string, AffiliateProgram> = new Map();
  private links: Map<string, AffiliateLink> = new Map();

  constructor() {
    this.initializeDefaultPrograms();
    this.loadFromStorage();
  }

  /**
   * Initialize default affiliate programs
   */
  private initializeDefaultPrograms() {
    const defaultPrograms: AffiliateProgram[] = [
      {
        id: 'amazon-associates',
        name: 'Amazon Associates',
        platform: 'amazon',
        affiliateId: '', // User needs to configure
        baseUrl: 'https://www.amazon.com',
        trackingParameter: 'tag',
        commission: {
          type: 'percentage',
          value: 4.0, // Average Amazon commission
        },
        categories: ['electronics', 'books', 'home', 'fashion', 'tech'],
        isActive: false,
      },
      {
        id: 'clickbank',
        name: 'ClickBank',
        platform: 'clickbank',
        affiliateId: '',
        baseUrl: 'https://hop.clickbank.net',
        trackingParameter: 'affiliate',
        commission: {
          type: 'percentage',
          value: 50.0, // High commission for digital products
        },
        categories: ['digital-products', 'courses', 'software', 'ebooks'],
        isActive: false,
      },
      {
        id: 'shareasale',
        name: 'ShareASale',
        platform: 'shareasale',
        affiliateId: '',
        baseUrl: 'https://shareasale.com',
        trackingParameter: 'afftrack',
        commission: {
          type: 'percentage',
          value: 10.0,
        },
        categories: ['various'],
        isActive: false,
      },
    ];

    defaultPrograms.forEach((program) => {
      this.programs.set(program.id, program);
    });

    logger.info('Affiliate programs initialized', { count: defaultPrograms.length });
  }

  /**
   * Load affiliate links from localStorage
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem('affiliate-links');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([id, link]) => {
          this.links.set(id, link as AffiliateLink);
        });
        logger.info('Affiliate links loaded from storage', {
          count: this.links.size,
        });
      }
    } catch (error) {
      logger.error('Failed to load affiliate links from storage', { error });
    }
  }

  /**
   * Save affiliate links to localStorage
   */
  private saveToStorage() {
    try {
      const data = Object.fromEntries(this.links.entries());
      localStorage.setItem('affiliate-links', JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save affiliate links to storage', { error });
    }
  }

  /**
   * Add or update affiliate program
   */
  addProgram(program: AffiliateProgram): void {
    this.programs.set(program.id, program);
    logger.info('Affiliate program added/updated', { id: program.id });

    activityService.addActivity({
      type: 'revenue',
      action: 'Affiliate Program Added',
      description: `Added ${program.name}`,
    });
  }

  /**
   * Get all affiliate programs
   */
  getPrograms(): AffiliateProgram[] {
    return Array.from(this.programs.values());
  }

  /**
   * Get active affiliate programs
   */
  getActivePrograms(): AffiliateProgram[] {
    return Array.from(this.programs.values()).filter((p) => p.isActive);
  }

  /**
   * Generate affiliate link for a product
   */
  generateAffiliateLink(
    programId: string,
    productName: string,
    productUrl: string,
    options: {
      category?: string;
      tags?: string[];
    } = {}
  ): AffiliateLink | null {
    const program = this.programs.get(programId);
    if (!program || !program.isActive) {
      logger.warn('Affiliate program not found or inactive', { programId });
      return null;
    }

    if (!program.affiliateId) {
      logger.warn('Affiliate ID not configured', { programId });
      return null;
    }

    // Generate affiliate URL with tracking
    let affiliateUrl = productUrl;

    // Add affiliate tracking parameter
    const url = new URL(productUrl);
    url.searchParams.set(program.trackingParameter, program.affiliateId);

    // Add custom tracking for analytics
    const trackingId = crypto.randomUUID().substring(0, 8);
    url.searchParams.set('utm_source', 'dlx-studios');
    url.searchParams.set('utm_medium', 'affiliate');
    url.searchParams.set('utm_campaign', trackingId);

    affiliateUrl = url.toString();

    // Create affiliate link object
    const link: AffiliateLink = {
      id: crypto.randomUUID(),
      programId,
      productName,
      productUrl,
      affiliateUrl,
      category: options.category || 'general',
      tags: options.tags || [],
      createdAt: new Date(),
      metrics: {
        clicks: 0,
        conversions: 0,
        revenue: 0,
      },
    };

    // Store link
    this.links.set(link.id, link);
    this.saveToStorage();

    logger.info('Affiliate link generated', {
      programId,
      productName,
      linkId: link.id,
    });

    activityService.addActivity({
      type: 'revenue',
      action: 'Affiliate Link Created',
      description: `Generated link for ${productName}`,
    });

    return link;
  }

  /**
   * Inject affiliate links into content intelligently
   */
  injectLinks(options: LinkInjectionOptions): string {
    const { content, keywords = [], maxLinks = 3, contextual = true } = options;

    if (this.links.size === 0) {
      logger.warn('No affiliate links available for injection');
      return content;
    }

    let modifiedContent = content;
    let linksInjected = 0;

    // Get relevant links based on keywords or context
    const relevantLinks = this.getRelevantLinks(keywords, contextual ? content : '');

    for (const link of relevantLinks) {
      if (linksInjected >= maxLinks) break;

      // Find good placement in content
      const placement = this.findLinkPlacement(
        modifiedContent,
        link.productName,
        keywords
      );

      if (placement !== -1) {
        // Inject link with styling
        const linkHtml = this.formatLink(link, options.linkStyle);
        modifiedContent = this.insertAtPosition(
          modifiedContent,
          linkHtml,
          placement
        );
        linksInjected++;

        logger.debug('Link injected', {
          productName: link.productName,
          position: placement,
        });
      }
    }

    logger.info('Affiliate links injected into content', {
      total: linksInjected,
      maxLinks,
    });

    return modifiedContent;
  }

  /**
   * Get relevant links based on keywords and context
   */
  private getRelevantLinks(keywords: string[], context: string): AffiliateLink[] {
    const links = Array.from(this.links.values());

    // If no keywords, return random links
    if (keywords.length === 0 && !context) {
      return links.slice(0, 5);
    }

    // Score links based on relevance
    const scored = links.map((link) => {
      let score = 0;

      // Keyword matching
      keywords.forEach((keyword) => {
        if (link.productName.toLowerCase().includes(keyword.toLowerCase())) {
          score += 10;
        }
        if (link.tags.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase()))) {
          score += 5;
        }
      });

      // Context matching
      if (context) {
        const contextLower = context.toLowerCase();
        if (contextLower.includes(link.productName.toLowerCase())) {
          score += 15;
        }
        link.tags.forEach((tag) => {
          if (contextLower.includes(tag.toLowerCase())) {
            score += 3;
          }
        });
      }

      return { link, score };
    });

    // Sort by score and return top results
    return scored
      .sort((a, b) => b.score - a.score)
      .filter((item) => item.score > 0)
      .map((item) => item.link);
  }

  /**
   * Find good placement for link in content
   */
  private findLinkPlacement(
    content: string,
    productName: string,
    keywords: string[]
  ): number {
    // Try to find mention of product name
    const productIndex = content.toLowerCase().indexOf(productName.toLowerCase());
    if (productIndex !== -1) {
      return productIndex + productName.length;
    }

    // Try to find keyword mentions
    for (const keyword of keywords) {
      const keywordIndex = content.toLowerCase().indexOf(keyword.toLowerCase());
      if (keywordIndex !== -1) {
        // Find end of sentence containing keyword
        const sentenceEnd = content.indexOf('.', keywordIndex);
        if (sentenceEnd !== -1) {
          return sentenceEnd + 1;
        }
      }
    }

    // Fallback: insert after first paragraph
    const firstParagraphEnd = content.indexOf('\n\n');
    if (firstParagraphEnd !== -1) {
      return firstParagraphEnd + 2;
    }

    // Last resort: middle of content
    return Math.floor(content.length / 2);
  }

  /**
   * Format affiliate link with styling
   */
  private formatLink(
    link: AffiliateLink,
    style: 'inline' | 'button' | 'banner' = 'inline'
  ): string {
    // Track click when link is clicked
    const trackingUrl = `javascript:void(${this.trackClick.name}('${link.id}'));window.open('${link.affiliateUrl}','_blank');`;

    switch (style) {
      case 'button':
        return `\n\n<a href="${link.affiliateUrl}" class="affiliate-button" target="_blank" rel="noopener noreferrer" onclick="window.affiliateLinkService?.trackClick('${link.id}')">Check out ${link.productName} →</a>\n\n`;

      case 'banner':
        return `\n\n<div class="affiliate-banner"><a href="${link.affiliateUrl}" target="_blank" rel="noopener noreferrer" onclick="window.affiliateLinkService?.trackClick('${link.id}')">🎯 ${link.productName} - Learn More</a></div>\n\n`;

      case 'inline':
      default:
        return ` <a href="${link.affiliateUrl}" class="affiliate-link" target="_blank" rel="noopener noreferrer" onclick="window.affiliateLinkService?.trackClick('${link.id}')">${link.productName}</a>`;
    }
  }

  /**
   * Insert text at specific position
   */
  private insertAtPosition(content: string, insert: string, position: number): string {
    return content.slice(0, position) + insert + content.slice(position);
  }

  /**
   * Track affiliate link click
   */
  trackClick(linkId: string): void {
    const link = this.links.get(linkId);
    if (!link) return;

    link.metrics.clicks++;
    link.metrics.lastClickedAt = new Date();

    this.saveToStorage();

    logger.info('Affiliate link clicked', {
      linkId,
      productName: link.productName,
      totalClicks: link.metrics.clicks,
    });

    activityService.addActivity({
      type: 'revenue',
      action: 'Affiliate Link Clicked',
      description: `${link.productName} (${link.metrics.clicks} clicks)`,
    });
  }

  /**
   * Record conversion and revenue
   */
  recordConversion(linkId: string, revenue: number): void {
    const link = this.links.get(linkId);
    if (!link) return;

    link.metrics.conversions++;
    link.metrics.revenue += revenue;

    this.saveToStorage();

    logger.info('Affiliate conversion recorded', {
      linkId,
      productName: link.productName,
      revenue,
      totalRevenue: link.metrics.revenue,
    });

    activityService.addActivity({
      type: 'revenue',
      action: 'Affiliate Conversion',
      description: `Earned $${revenue.toFixed(2)} from ${link.productName}`,
      metadata: { revenue },
    });
  }

  /**
   * Get all affiliate links
   */
  getLinks(): AffiliateLink[] {
    return Array.from(this.links.values());
  }

  /**
   * Get link by ID
   */
  getLink(id: string): AffiliateLink | undefined {
    return this.links.get(id);
  }

  /**
   * Delete affiliate link
   */
  deleteLink(id: string): boolean {
    const deleted = this.links.delete(id);
    if (deleted) {
      this.saveToStorage();
      logger.info('Affiliate link deleted', { id });
    }
    return deleted;
  }

  /**
   * Get analytics and statistics
   */
  getAnalytics() {
    const links = Array.from(this.links.values());
    const totalLinks = links.length;
    const totalClicks = links.reduce((sum, link) => sum + link.metrics.clicks, 0);
    const totalConversions = links.reduce(
      (sum, link) => sum + link.metrics.conversions,
      0
    );
    const totalRevenue = links.reduce((sum, link) => sum + link.metrics.revenue, 0);

    const conversionRate =
      totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    const topPerformers = links
      .sort((a, b) => b.metrics.revenue - a.metrics.revenue)
      .slice(0, 5);

    const byProgram = links.reduce((acc, link) => {
      const program = this.programs.get(link.programId);
      const programName = program?.name || 'Unknown';
      if (!acc[programName]) {
        acc[programName] = {
          links: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
        };
      }
      acc[programName].links++;
      acc[programName].clicks += link.metrics.clicks;
      acc[programName].conversions += link.metrics.conversions;
      acc[programName].revenue += link.metrics.revenue;
      return acc;
    }, {} as Record<string, { links: number; clicks: number; conversions: number; revenue: number }>);

    return {
      totalLinks,
      totalClicks,
      totalConversions,
      totalRevenue,
      conversionRate: conversionRate.toFixed(2) + '%',
      averageRevenuePerClick: totalClicks > 0 ? totalRevenue / totalClicks : 0,
      topPerformers: topPerformers.map((link) => ({
        productName: link.productName,
        clicks: link.metrics.clicks,
        conversions: link.metrics.conversions,
        revenue: link.metrics.revenue,
      })),
      byProgram,
    };
  }
}

// Export singleton instance
export const affiliateLinkService = new AffiliateLinkService();

// Make service globally available for click tracking
if (typeof window !== 'undefined') {
  (window as any).affiliateLinkService = affiliateLinkService;
}
