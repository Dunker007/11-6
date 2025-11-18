/**
 * Revenue Services Index
 * Central export point for all revenue-related services
 */

export { stripeIntegrationService } from './stripeIntegrationService';
export { gumroadIntegrationService } from './gumroadIntegrationService';
export { multiCurrencyService } from './multiCurrencyService';
export { taxReportingService} from './taxReportingService';

export type { StripeEvent, StripeCustomer, StripeSubscription, RevenueMetrics } from './stripeIntegrationService';
export type { GumroadProduct, GumroadSale, GumroadAffiliate, GumroadAnalytics } from './gumroadIntegrationService';
