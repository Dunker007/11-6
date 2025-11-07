import type { PricingStrategy, MonetizationRecommendation } from '@/types/monetize';

const PRICING_STRATEGIES: PricingStrategy[] = [
  {
    id: 'freemium',
    name: 'Freemium',
    type: 'freemium',
    description: 'Free tier with premium features',
    tiers: [
      {
        name: 'Free',
        price: 0,
        features: ['Basic features', 'Limited usage', 'Community support'],
      },
      {
        name: 'Pro',
        price: 29,
        features: ['All features', 'Unlimited usage', 'Priority support'],
        popular: true,
      },
      {
        name: 'Enterprise',
        price: 99,
        features: ['Everything in Pro', 'Custom integrations', 'Dedicated support'],
      },
    ],
    features: ['Free tier', 'Upgrade path', 'Viral growth'],
    recommendedFor: ['SaaS products', 'Developer tools', 'B2C applications'],
  },
  {
    id: 'tiered',
    name: 'Tiered Pricing',
    type: 'tiered',
    description: 'Multiple pricing tiers with different feature sets',
    tiers: [
      {
        name: 'Starter',
        price: 9,
        features: ['Basic features', 'Up to 10 users'],
      },
      {
        name: 'Professional',
        price: 49,
        features: ['Advanced features', 'Up to 100 users', 'API access'],
        popular: true,
      },
      {
        name: 'Enterprise',
        price: 199,
        features: ['All features', 'Unlimited users', 'Custom solutions'],
      },
    ],
    features: ['Clear value tiers', 'Scalable pricing', 'Feature gating'],
    recommendedFor: ['B2B SaaS', 'Team tools', 'Business software'],
  },
  {
    id: 'usage-based',
    name: 'Usage-Based',
    type: 'usage-based',
    description: 'Pay for what you use',
    basePrice: 0,
    unitPrice: 0.01,
    unitName: 'API call',
    features: ['Pay per use', 'No upfront cost', 'Scales with usage'],
    recommendedFor: ['APIs', 'Cloud services', 'Infrastructure'],
  },
  {
    id: 'flat-rate',
    name: 'Flat Rate',
    type: 'flat-rate',
    description: 'Simple single price',
    basePrice: 49,
    features: ['Simple pricing', 'Predictable costs', 'All features included'],
    recommendedFor: ['Simple products', 'One-time purchases', 'Small businesses'],
  },
];

export class PricingService {
  private static instance: PricingService;

  private constructor() {}

  static getInstance(): PricingService {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  getAllStrategies(): PricingStrategy[] {
    return PRICING_STRATEGIES;
  }

  getStrategyById(id: string): PricingStrategy | null {
    return PRICING_STRATEGIES.find((s) => s.id === id) || null;
  }

  getStrategiesByType(type: PricingStrategy['type']): PricingStrategy[] {
    return PRICING_STRATEGIES.filter((s) => s.type === type);
  }

  generateRecommendations(
    projectType: string,
    _currentRevenue?: number,
    _userCount?: number
  ): MonetizationRecommendation[] {
    const recommendations: MonetizationRecommendation[] = [];

    // Recommend freemium for developer tools
    if (projectType.toLowerCase().includes('dev') || projectType.toLowerCase().includes('tool')) {
      recommendations.push({
        type: 'strategy',
        title: 'Consider Freemium Model',
        description: 'Developer tools benefit from freemium models that drive adoption',
        impact: 'high',
        actionItems: [
          'Create a free tier with core functionality',
          'Add premium features for power users',
          'Implement upgrade prompts at key moments',
        ],
      });
    }

    // Recommend tiered pricing for B2B
    if (projectType.toLowerCase().includes('business') || projectType.toLowerCase().includes('enterprise')) {
      recommendations.push({
        type: 'strategy',
        title: 'Implement Tiered Pricing',
        description: 'B2B customers expect clear pricing tiers with feature differentiation',
        impact: 'high',
        actionItems: [
          'Create 3-4 pricing tiers',
          'Clearly differentiate features between tiers',
          'Make the middle tier most attractive',
        ],
      });
    }

    // Recommend usage-based for APIs
    if (projectType.toLowerCase().includes('api') || projectType.toLowerCase().includes('service')) {
      recommendations.push({
        type: 'strategy',
        title: 'Usage-Based Pricing',
        description: 'APIs work well with pay-per-use models',
        impact: 'medium',
        actionItems: [
          'Set competitive per-unit pricing',
          'Offer volume discounts',
          'Provide usage dashboards',
        ],
      });
    }

    return recommendations;
  }

  calculateRevenue(
    strategy: PricingStrategy,
    customerCount: number,
    averageUsage?: number
  ): number {
    if (strategy.type === 'usage-based' && strategy.unitPrice && averageUsage) {
      return (strategy.basePrice || 0) + strategy.unitPrice * averageUsage * customerCount;
    }

    if (strategy.tiers && strategy.tiers.length > 0) {
      // Assume customers are distributed across tiers (simplified)
      const avgPrice = strategy.tiers.reduce((sum, tier) => sum + tier.price, 0) / strategy.tiers.length;
      return avgPrice * customerCount;
    }

    if (strategy.basePrice) {
      return strategy.basePrice * customerCount;
    }

    return 0;
  }
}

export const pricingService = PricingService.getInstance();

