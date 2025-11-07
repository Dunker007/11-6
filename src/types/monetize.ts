export interface RevenueStream {
  id: string;
  name: string;
  type: 'saas' | 'subscription' | 'product' | 'service' | 'affiliate' | 'advertising' | 'other';
  description: string;
  monthlyRevenue: number;
  growthRate: number; // Percentage
  status: 'active' | 'paused' | 'planning';
  createdAt: Date;
  updatedAt: Date;
}

export interface PricingStrategy {
  id: string;
  name: string;
  type: 'freemium' | 'tiered' | 'usage-based' | 'flat-rate' | 'pay-as-you-go' | 'custom';
  description: string;
  tiers?: PricingTier[];
  basePrice?: number;
  unitPrice?: number;
  unitName?: string;
  features: string[];
  recommendedFor: string[];
}

export interface PricingTier {
  name: string;
  price: number;
  features: string[];
  popular?: boolean;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName: string;
  planId: string;
  planName: string;
  price: number;
  billingCycle: 'monthly' | 'yearly' | 'one-time';
  status: 'active' | 'cancelled' | 'paused' | 'expired';
  startDate: Date;
  nextBillingDate?: Date;
  cancelledAt?: Date;
}

export interface RevenueAnalytics {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  annualRecurringRevenue: number;
  averageRevenuePerUser: number;
  churnRate: number;
  customerLifetimeValue: number;
  period: {
    start: Date;
    end: Date;
  };
  byStream: Record<string, number>;
  trends: {
    revenue: number[];
    customers: number[];
    dates: Date[];
  };
}

export interface MonetizationRecommendation {
  type: 'pricing' | 'stream' | 'strategy';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionItems: string[];
}

