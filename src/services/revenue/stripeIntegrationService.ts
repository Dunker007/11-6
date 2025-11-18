/**
 * Stripe Integration Service
 *
 * PURPOSE:
 * Stripe webhook integration for revenue tracking and automation.
 * Handles payments, subscriptions, refunds, and disputes automatically.
 *
 * FEATURES:
 * - Webhook event handling (demo mode)
 * - Payment tracking
 * - Subscription management
 * - Refund processing
 * - Dispute handling
 * - Customer management
 * - Revenue analytics
 * - MRR/ARR calculation
 * - Churn tracking
 * - Automated receipts
 *
 * WEBHOOK EVENTS:
 * - payment.succeeded
 * - payment.failed
 * - refund.created
 * - dispute.created
 * - subscription.created
 * - subscription.updated
 * - subscription.cancelled
 * - invoice.paid
 * - invoice.failed
 *
 * COST TIER: Metered (per-transaction fees)
 *
 * USAGE:
 * ```typescript
 * import { stripeIntegrationService } from '@/services/revenue/stripeIntegrationService';
 *
 * // Auto-connects from vault
 * const event = await stripeIntegrationService.processWebhook(webhookData);
 * const metrics = stripeIntegrationService.getMetrics();
 * ```
 */

import { BaseIntegrationService, GoogleOAuthConfig, autoInitializeService } from '../integrations/BaseIntegrationService';
import { logger } from '../logging/loggerService';
import { activityService } from '../activity/activityService';
import { notificationService } from '../notification/notificationService';

export type StripeEventType =
  | 'payment.succeeded'
  | 'payment.failed'
  | 'refund.created'
  | 'dispute.created'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.cancelled'
  | 'invoice.paid'
  | 'invoice.failed';

export interface StripeEvent {
  id: string;
  type: StripeEventType;
  amount: number;
  currency: string;
  customerId: string;
  customerEmail?: string;
  productId?: string;
  subscriptionId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  status: 'processed' | 'pending' | 'failed';
}

export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  totalSpent: number;
  subscriptions: string[];
  paymentCount: number;
  firstPurchase: Date;
  lastPurchase?: Date;
  lifetimeValue: number;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  productId: string;
  status: 'active' | 'past_due' | 'cancelled' | 'unpaid';
  amount: number;
  interval: 'month' | 'year';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAt?: Date;
  createdAt: Date;
}

export interface RevenueMetrics {
  totalRevenue: number;
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  activeSubscriptions: number;
  totalCustomers: number;
  averageRevenuePerCustomer: number;
  churnRate: number; // Percentage
  refundRate: number; // Percentage
}

/**
 * Stripe Integration Service
 * Extends BaseIntegrationService for credential management and OAuth
 */
class StripeIntegrationService extends BaseIntegrationService {
  private events: StripeEvent[] = [];
  private customers: Map<string, StripeCustomer> = new Map();
  private subscriptions: Map<string, StripeSubscription> = new Map();

  // ========================================
  // REQUIRED ABSTRACT METHODS
  // ========================================

  getServiceId(): string {
    return 'stripe';
  }

  getServiceName(): string {
    return 'Stripe';
  }

  getBaseURL(): string {
    return 'https://api.stripe.com/v1';
  }

  getCostTier(): 'free' | 'paid' | 'metered' {
    return 'metered'; // Stripe charges per-transaction fees
  }

  supportsGoogleOAuth(): boolean {
    return false; // Stripe uses its own OAuth/Connect flow
  }

  getGoogleOAuthConfig(): GoogleOAuthConfig | null {
    return null;
  }

  // ========================================
  // STRIPE-SPECIFIC METHODS
  // ========================================

  /**
   * Process webhook event (demo mode)
   */
  async processWebhook(eventData: Partial<StripeEvent>): Promise<StripeEvent> {
    this.logActivity('Processing Stripe webhook', { type: eventData.type });

    try {
      // Validate webhook signature (in production, verify with Stripe)
      if (!this.isConnected()) {
        throw new Error('Stripe webhook secret not configured');
      }

      const event: StripeEvent = {
        id: eventData.id || crypto.randomUUID(),
        type: eventData.type!,
        amount: eventData.amount || 0,
        currency: eventData.currency || 'USD',
        customerId: eventData.customerId || crypto.randomUUID(),
        customerEmail: eventData.customerEmail,
        productId: eventData.productId,
        subscriptionId: eventData.subscriptionId,
        timestamp: eventData.timestamp || new Date(),
        metadata: eventData.metadata,
        status: 'processed',
      };

      // Handle event based on type
      await this.handleEvent(event);

      this.events.push(event);

      activityService.addActivity({
        type: 'automation',
        action: 'stripe_webhook_processed',
        description: `Processed ${event.type} event`,
        metadata: {
          eventId: event.id,
          type: event.type,
          amount: event.amount,
        },
      });

      logger.info('Stripe webhook processed', {
        id: event.id,
        type: event.type,
        amount: event.amount,
      });

      return event;
    } catch (error) {
      logger.error('Stripe webhook processing failed', { error: error as Error });
      throw error;
    }
  }

  /**
   * Handle specific event types
   */
  private async handleEvent(event: StripeEvent): Promise<void> {
    switch (event.type) {
      case 'payment.succeeded':
        await this.handlePaymentSucceeded(event);
        break;

      case 'payment.failed':
        await this.handlePaymentFailed(event);
        break;

      case 'refund.created':
        await this.handleRefund(event);
        break;

      case 'dispute.created':
        await this.handleDispute(event);
        break;

      case 'subscription.created':
        await this.handleSubscriptionCreated(event);
        break;

      case 'subscription.updated':
        await this.handleSubscriptionUpdated(event);
        break;

      case 'subscription.cancelled':
        await this.handleSubscriptionCancelled(event);
        break;

      case 'invoice.paid':
        await this.handleInvoicePaid(event);
        break;

      case 'invoice.failed':
        await this.handleInvoiceFailed(event);
        break;

      default:
        logger.warn('Unknown Stripe event type', { type: event.type });
    }
  }

  /**
   * Handle payment succeeded
   */
  private async handlePaymentSucceeded(event: StripeEvent): Promise<void> {
    // Update or create customer
    let customer = this.customers.get(event.customerId);

    if (!customer) {
      customer = {
        id: event.customerId,
        email: event.customerEmail || 'unknown@example.com',
        totalSpent: 0,
        subscriptions: [],
        paymentCount: 0,
        firstPurchase: event.timestamp,
        lifetimeValue: 0,
      };
      this.customers.set(event.customerId, customer);
    }

    customer.totalSpent += event.amount;
    customer.paymentCount++;
    customer.lastPurchase = event.timestamp;
    customer.lifetimeValue += event.amount;

    logger.info('Payment succeeded', {
      customerId: event.customerId,
      amount: event.amount,
    });

    // Send receipt notification
    notificationService.show({
      title: 'Payment Received',
      message: `Payment of $${(event.amount / 100).toFixed(2)} received from ${customer?.email || event.customerId}`,
      type: 'success',
      duration: 5000,
    });

    // Log for email integration (to be implemented with SendGrid/AWS SES)
    logger.info('[Email] Would send payment receipt', {
      to: customer?.email,
      amount: event.amount,
      customerId: event.customerId,
    });
  }

  /**
   * Handle payment failed
   */
  private async handlePaymentFailed(event: StripeEvent): Promise<void> {
    const customer = this.customers.get(event.customerId);

    logger.warn('Payment failed', {
      customerId: event.customerId,
      amount: event.amount,
    });

    // Send payment failure notification
    notificationService.show({
      title: 'Payment Failed',
      message: `Payment of $${(event.amount / 100).toFixed(2)} failed for ${customer?.email || event.customerId}`,
      type: 'error',
      duration: 8000,
    });

    // Log email notification
    logger.warn('[Email] Would send payment failure notification', {
      to: customer?.email,
      amount: event.amount,
      customerId: event.customerId,
    });

    // Retry logic - log for future implementation
    logger.info('[Retry] Would schedule payment retry for customerId', {
      customerId: event.customerId,
      retryAttempt: 1,
      nextRetryDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });
  }

  /**
   * Handle refund
   */
  private async handleRefund(event: StripeEvent): Promise<void> {
    const customer = this.customers.get(event.customerId);

    if (customer) {
      customer.totalSpent -= event.amount;
      customer.lifetimeValue -= event.amount;
    }

    logger.info('Refund processed', {
      customerId: event.customerId,
      amount: event.amount,
    });

    // Send refund confirmation notification
    notificationService.show({
      title: 'Refund Processed',
      message: `Refund of $${(event.amount / 100).toFixed(2)} processed for ${customer?.email || event.customerId}`,
      type: 'info',
      duration: 5000,
    });

    // Log email notification
    logger.info('[Email] Would send refund confirmation', {
      to: customer?.email,
      amount: event.amount,
      customerId: event.customerId,
    });
  }

  /**
   * Handle dispute
   */
  private async handleDispute(event: StripeEvent): Promise<void> {
    const customer = this.customers.get(event.customerId);

    logger.warn('Dispute created', {
      customerId: event.customerId,
      amount: event.amount,
    });

    // Alert admin via notification
    notificationService.show({
      title: '⚠️ Payment Dispute',
      message: `Dispute filed for $${(event.amount / 100).toFixed(2)} by ${customer?.email || event.customerId}`,
      type: 'warning',
      duration: 10000,
    });

    // Log admin alert
    logger.error('[Admin Alert] Payment dispute created', {
      customerId: event.customerId,
      customerEmail: customer?.email,
      amount: event.amount,
      priority: 'high',
      actionRequired: 'Review and respond within 7 days',
    });

    // Log evidence gathering (to be implemented with Stripe API)
    logger.info('[Dispute] Would gather evidence', {
      customerId: event.customerId,
      evidenceNeeded: ['invoice', 'shipping_tracking', 'customer_communication'],
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    });
  }

  /**
   * Handle subscription created
   */
  private async handleSubscriptionCreated(event: StripeEvent): Promise<void> {
    if (!event.subscriptionId) return;

    const subscription: StripeSubscription = {
      id: event.subscriptionId,
      customerId: event.customerId,
      productId: event.productId || 'unknown',
      status: 'active',
      amount: event.amount,
      interval: event.metadata?.interval || 'month',
      currentPeriodStart: event.timestamp,
      currentPeriodEnd: this.calculatePeriodEnd(event.timestamp, event.metadata?.interval || 'month'),
      createdAt: event.timestamp,
    };

    this.subscriptions.set(subscription.id, subscription);

    // Update customer
    const customer = this.customers.get(event.customerId);
    if (customer) {
      customer.subscriptions.push(subscription.id);
    }

    logger.info('Subscription created', {
      subscriptionId: subscription.id,
      customerId: event.customerId,
      amount: event.amount,
    });

    // Send welcome notification
    notificationService.show({
      title: '🎉 New Subscription',
      message: `${customer?.email || event.customerId} subscribed for $${(event.amount / 100).toFixed(2)}/${subscription.interval}`,
      type: 'success',
      duration: 5000,
    });

    // Log welcome email
    logger.info('[Email] Would send welcome email', {
      to: customer?.email,
      subscriptionId: subscription.id,
      amount: event.amount,
      interval: subscription.interval,
      template: 'subscription_welcome',
    });
  }

  /**
   * Handle subscription updated
   */
  private async handleSubscriptionUpdated(event: StripeEvent): Promise<void> {
    if (!event.subscriptionId) return;

    const subscription = this.subscriptions.get(event.subscriptionId);
    if (subscription) {
      subscription.status = event.metadata?.status || subscription.status;
      subscription.amount = event.amount;

      logger.info('Subscription updated', {
        subscriptionId: subscription.id,
        status: subscription.status,
      });
    }
  }

  /**
   * Handle subscription cancelled
   */
  private async handleSubscriptionCancelled(event: StripeEvent): Promise<void> {
    if (!event.subscriptionId) return;

    const subscription = this.subscriptions.get(event.subscriptionId);
    if (subscription) {
      subscription.status = 'cancelled';
      subscription.cancelAt = event.timestamp;

      const customer = this.customers.get(subscription.customerId);

      logger.info('Subscription cancelled', {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
      });

      // Send cancellation confirmation notification
      notificationService.show({
        title: 'Subscription Cancelled',
        message: `Subscription cancelled for ${customer?.email || subscription.customerId}`,
        type: 'info',
        duration: 5000,
      });

      // Log cancellation email
      logger.info('[Email] Would send cancellation confirmation', {
        to: customer?.email,
        subscriptionId: subscription.id,
        template: 'subscription_cancelled',
      });

      // Log feedback request
      logger.info('[Feedback] Would request cancellation feedback', {
        customerId: subscription.customerId,
        subscriptionId: subscription.id,
        feedbackUrl: `/feedback/cancellation/${subscription.id}`,
      });
    }
  }

  /**
   * Handle invoice paid
   */
  private async handleInvoicePaid(event: StripeEvent): Promise<void> {
    const customer = this.customers.get(event.customerId);

    logger.info('Invoice paid', {
      customerId: event.customerId,
      amount: event.amount,
    });

    // Update customer spend
    await this.handlePaymentSucceeded(event);

    // Log invoice receipt (payment receipt already sent by handlePaymentSucceeded)
    logger.info('[Email] Would send invoice receipt', {
      to: customer?.email,
      amount: event.amount,
      invoiceId: event.metadata?.invoiceId,
      template: 'invoice_receipt',
    });
  }

  /**
   * Handle invoice failed
   */
  private async handleInvoiceFailed(event: StripeEvent): Promise<void> {
    const customer = this.customers.get(event.customerId);

    logger.warn('Invoice payment failed', {
      customerId: event.customerId,
      amount: event.amount,
    });

    // Send payment retry notification
    notificationService.show({
      title: 'Invoice Payment Failed',
      message: `Invoice payment of $${(event.amount / 100).toFixed(2)} failed for ${customer?.email || event.customerId}`,
      type: 'error',
      duration: 8000,
    });

    // Log payment retry email
    logger.warn('[Email] Would send payment retry notification', {
      to: customer?.email,
      amount: event.amount,
      invoiceId: event.metadata?.invoiceId,
      retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    });

    // Update subscription status to past_due if applicable
    if (event.subscriptionId) {
      const subscription = this.subscriptions.get(event.subscriptionId);
      if (subscription) {
        subscription.status = 'past_due';
        logger.warn('[Subscription] Updated status to past_due', {
          subscriptionId: subscription.id,
          customerId: event.customerId,
        });
      }
    }
  }

  /**
   * Calculate subscription period end
   */
  private calculatePeriodEnd(start: Date, interval: 'month' | 'year'): Date {
    const end = new Date(start);

    if (interval === 'month') {
      end.setMonth(end.getMonth() + 1);
    } else {
      end.setFullYear(end.getFullYear() + 1);
    }

    return end;
  }

  /**
   * Get revenue metrics
   */
  getMetrics(): RevenueMetrics {
    const totalRevenue = this.events
      .filter(e => e.type === 'payment.succeeded' || e.type === 'invoice.paid')
      .reduce((sum, e) => sum + e.amount, 0);

    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(s => s.status === 'active');

    const mrr = activeSubscriptions
      .filter(s => s.interval === 'month')
      .reduce((sum, s) => sum + s.amount, 0);

    const arr = mrr * 12 + activeSubscriptions
      .filter(s => s.interval === 'year')
      .reduce((sum, s) => sum + s.amount, 0);

    const totalCustomers = this.customers.size;

    const averageRevenuePerCustomer = totalCustomers > 0
      ? totalRevenue / totalCustomers
      : 0;

    const totalRefunds = this.events
      .filter(e => e.type === 'refund.created')
      .reduce((sum, e) => sum + e.amount, 0);

    const refundRate = totalRevenue > 0
      ? (totalRefunds / totalRevenue) * 100
      : 0;

    const cancelledSubs = Array.from(this.subscriptions.values())
      .filter(s => s.status === 'cancelled').length;

    const totalSubs = this.subscriptions.size;

    const churnRate = totalSubs > 0
      ? (cancelledSubs / totalSubs) * 100
      : 0;

    return {
      totalRevenue,
      mrr,
      arr,
      activeSubscriptions: activeSubscriptions.length,
      totalCustomers,
      averageRevenuePerCustomer: Math.round(averageRevenuePerCustomer * 100) / 100,
      churnRate: Math.round(churnRate * 100) / 100,
      refundRate: Math.round(refundRate * 100) / 100,
    };
  }

  /**
   * Get all events
   */
  getEvents(limit?: number): StripeEvent[] {
    const events = [...this.events].sort((a, b) =>
      b.timestamp.getTime() - a.timestamp.getTime()
    );

    return limit ? events.slice(0, limit) : events;
  }

  /**
   * Get customer details
   */
  getCustomer(customerId: string): StripeCustomer | undefined {
    return this.customers.get(customerId);
  }

  /**
   * Get all customers
   */
  getCustomers(): StripeCustomer[] {
    return Array.from(this.customers.values());
  }

  /**
   * Get subscription details
   */
  getSubscription(subscriptionId: string): StripeSubscription | undefined {
    return this.subscriptions.get(subscriptionId);
  }

  /**
   * Get all subscriptions
   */
  getSubscriptions(status?: StripeSubscription['status']): StripeSubscription[] {
    const subs = Array.from(this.subscriptions.values());

    if (status) {
      return subs.filter(s => s.status === status);
    }

    return subs;
  }

  /**
   * Simulate webhook events for testing
   */
  async simulateEvent(type: StripeEventType, amount: number = 2999): Promise<StripeEvent> {
    return await this.processWebhook({
      type,
      amount,
      currency: 'USD',
      customerEmail: 'demo@example.com',
      productId: 'prod_demo',
      metadata: { interval: 'month' },
    });
  }

  /**
   * Quick test method
   */
  async quickTest(): Promise<RevenueMetrics> {
    // Initialize
    this.setCredentials({ secretKey: 'demo_webhook_secret' });

    // Simulate events
    await this.simulateEvent('payment.succeeded', 4999);
    await this.simulateEvent('subscription.created', 2999);
    await this.simulateEvent('invoice.paid', 2999);
    await this.simulateEvent('payment.succeeded', 9999);

    return this.getMetrics();
  }
}

// Export singleton
export const stripeIntegrationService = new StripeIntegrationService();

// Auto-initialize from credential vault
autoInitializeService(stripeIntegrationService);
