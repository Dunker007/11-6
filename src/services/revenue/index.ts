/**
 * Revenue Services Index
 * Central export point for all revenue-related services
 */

// ⭐ UNIFIED AGGREGATOR - THE KEYSTONE ⭐
// Use this for aggregated revenue across ALL sources
export { unifiedRevenueAggregator } from './unifiedRevenueAggregator';
export type {
  AggregatedRevenueMetrics,
  RevenueBreakdown,
} from './unifiedRevenueAggregator';

// Individual Revenue Services
export { stripeIntegrationService } from './stripeIntegrationService';
export { gumroadIntegrationService } from './gumroadIntegrationService';
export { multiCurrencyService } from './multiCurrencyService';
export { taxReportingService} from './taxReportingService';
export { unifiedRevenueService } from './unifiedRevenueService'; // Legacy - prefer unifiedRevenueAggregator

// Types
export type { StripeEvent, StripeCustomer, StripeSubscription, RevenueMetrics } from './stripeIntegrationService';
export type { GumroadProduct, GumroadSale, GumroadAffiliate, GumroadAnalytics } from './gumroadIntegrationService';
