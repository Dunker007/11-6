import type { RevenueStream, Subscription, RevenueAnalytics } from '@/types/monetize';

const REVENUE_STREAMS_KEY = 'dlx_revenue_streams';
const SUBSCRIPTIONS_KEY = 'dlx_subscriptions';

export class RevenueService {
  private static instance: RevenueService;
  private revenueStreams: Map<string, RevenueStream> = new Map();
  private subscriptions: Map<string, Subscription> = new Map();

  private constructor() {
    this.loadData();
  }

  static getInstance(): RevenueService {
    if (!RevenueService.instance) {
      RevenueService.instance = new RevenueService();
    }
    return RevenueService.instance;
  }

  private loadData(): void {
    try {
      const streamsData = localStorage.getItem(REVENUE_STREAMS_KEY);
      if (streamsData) {
        const streams: RevenueStream[] = JSON.parse(streamsData);
        streams.forEach((stream) => {
          stream.createdAt = new Date(stream.createdAt);
          stream.updatedAt = new Date(stream.updatedAt);
          this.revenueStreams.set(stream.id, stream);
        });
      }

      const subsData = localStorage.getItem(SUBSCRIPTIONS_KEY);
      if (subsData) {
        const subs: Subscription[] = JSON.parse(subsData);
        subs.forEach((sub) => {
          sub.startDate = new Date(sub.startDate);
          if (sub.nextBillingDate) sub.nextBillingDate = new Date(sub.nextBillingDate);
          if (sub.cancelledAt) sub.cancelledAt = new Date(sub.cancelledAt);
          this.subscriptions.set(sub.id, sub);
        });
      }
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    }
  }

  private saveData(): void {
    try {
      localStorage.setItem(REVENUE_STREAMS_KEY, JSON.stringify(Array.from(this.revenueStreams.values())));
      localStorage.setItem(SUBSCRIPTIONS_KEY, JSON.stringify(Array.from(this.subscriptions.values())));
    } catch (error) {
      console.error('Failed to save revenue data:', error);
    }
  }

  // Revenue Streams
  addRevenueStream(stream: Omit<RevenueStream, 'id' | 'createdAt' | 'updatedAt'>): RevenueStream {
    const newStream: RevenueStream = {
      ...stream,
      id: crypto.randomUUID(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.revenueStreams.set(newStream.id, newStream);
    this.saveData();
    return newStream;
  }

  getRevenueStreams(): RevenueStream[] {
    return Array.from(this.revenueStreams.values());
  }

  updateRevenueStream(id: string, updates: Partial<RevenueStream>): RevenueStream | null {
    const stream = this.revenueStreams.get(id);
    if (!stream) return null;

    const updated: RevenueStream = {
      ...stream,
      ...updates,
      updatedAt: new Date(),
    };
    this.revenueStreams.set(id, updated);
    this.saveData();
    return updated;
  }

  deleteRevenueStream(id: string): boolean {
    const deleted = this.revenueStreams.delete(id);
    if (deleted) this.saveData();
    return deleted;
  }

  // Subscriptions
  addSubscription(subscription: Omit<Subscription, 'id' | 'startDate'> & { startDate?: Date }): Subscription {
    const newSub: Subscription = {
      ...subscription,
      id: crypto.randomUUID(),
      startDate: subscription.startDate || new Date(),
      nextBillingDate: this.calculateNextBillingDate(subscription.billingCycle, subscription.startDate || new Date()),
    };
    this.subscriptions.set(newSub.id, newSub);
    this.saveData();
    return newSub;
  }

  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  getActiveSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values()).filter((sub) => sub.status === 'active');
  }

  cancelSubscription(id: string): boolean {
    const sub = this.subscriptions.get(id);
    if (!sub) return false;

    sub.status = 'cancelled';
    sub.cancelledAt = new Date();
    this.saveData();
    return true;
  }

  private calculateNextBillingDate(cycle: Subscription['billingCycle'], startDate: Date): Date {
    const next = new Date(startDate);
    if (cycle === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    } else if (cycle === 'yearly') {
      next.setFullYear(next.getFullYear() + 1);
    }
    return next;
  }

  // Analytics
  getAnalytics(startDate: Date, endDate: Date): RevenueAnalytics {
    const streams = this.getRevenueStreams();
    const activeSubs = this.getActiveSubscriptions();

    const totalRevenue = streams.reduce((sum, s) => sum + s.monthlyRevenue, 0);
    const mrr = activeSubs.reduce((sum, s) => {
      if (s.billingCycle === 'monthly') return sum + s.price;
      if (s.billingCycle === 'yearly') return sum + s.price / 12;
      return sum;
    }, 0);
    const arr = mrr * 12;

    const byStream: Record<string, number> = {};
    streams.forEach((s) => {
      byStream[s.type] = (byStream[s.type] || 0) + s.monthlyRevenue;
    });

    // Calculate trends (simplified - would use actual historical data)
    const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const trends = {
      revenue: Array.from({ length: months }, () => totalRevenue),
      customers: Array.from({ length: months }, () => activeSubs.length),
      dates: Array.from({ length: months }, (_, i) => {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);
        return date;
      }),
    };

    return {
      totalRevenue,
      monthlyRecurringRevenue: mrr,
      annualRecurringRevenue: arr,
      averageRevenuePerUser: activeSubs.length > 0 ? mrr / activeSubs.length : 0,
      churnRate: 0, // Would calculate from historical data
      customerLifetimeValue: 0, // Would calculate from historical data
      period: { start: startDate, end: endDate },
      byStream,
      trends,
    };
  }
}

export const revenueService = RevenueService.getInstance();

