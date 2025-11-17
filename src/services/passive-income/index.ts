/**
 * Passive Income Services - Main Export
 *
 * Complete passive income automation system integrating:
 * - Automated content generation using LLM providers
 * - Affiliate link management and optimization
 * - Revenue tracking and analytics
 * - 24/7 automation scheduling
 *
 * USAGE:
 * ```typescript
 * import {
 *   contentGenerationService,
 *   affiliateLinkService,
 *   revenueTrackingService,
 *   automationScheduler
 * } from '@/services/passive-income';
 *
 * // Generate content
 * const template = contentGenerationService.getTemplates()[0];
 * const content = await contentGenerationService.generateContent({
 *   template,
 *   variables: { topic: 'AI automation', wordCount: '800' }
 * });
 *
 * // Create affiliate link
 * const link = affiliateLinkService.generateAffiliateLink(
 *   'amazon-associates',
 *   'Product Name',
 *   'https://amazon.com/product'
 * );
 *
 * // Track revenue
 * await revenueTrackingService.addRevenue('affiliate', 25.50, 'Amazon commission');
 *
 * // Schedule automation
 * automationScheduler.start();
 * ```
 */

export { contentGenerationService } from './contentGenerationService';
export type {
  ContentTemplate,
  GeneratedContent,
  ContentGenerationOptions,
} from './contentGenerationService';

export { affiliateLinkService } from './affiliateLinkService';
export type {
  AffiliateProgram,
  AffiliateLink,
  LinkInjectionOptions,
} from './affiliateLinkService';

export { revenueTrackingService } from './revenueTrackingService';
export type {
  RevenueSource,
  RevenueEntry,
  RevenueGoal,
  RevenueForecast,
  WebhookConfig,
} from './revenueTrackingService';

export { automationScheduler } from './automationScheduler';
export type {
  ScheduledTask,
  TaskPriority,
  TaskStatus,
  TaskHistory,
} from './automationScheduler';
