import { create } from 'zustand';
import { revenueService } from './revenueService';
import { pricingService } from './pricingService';
import type { RevenueStream, Subscription, RevenueAnalytics, PricingStrategy, MonetizationRecommendation } from '@/types/monetize';

interface MonetizeStore {
  // State
  revenueStreams: RevenueStream[];
  subscriptions: Subscription[];
  analytics: RevenueAnalytics | null;
  pricingStrategies: PricingStrategy[];
  recommendations: MonetizationRecommendation[];
  selectedPeriod: { start: Date; end: Date };
  isLoading: boolean;
  error: string | null;

  // Actions
  loadRevenueStreams: () => void;
  loadSubscriptions: () => void;
  loadPricingStrategies: () => void;
  addRevenueStream: (stream: Omit<RevenueStream, 'id' | 'createdAt' | 'updatedAt'>) => RevenueStream;
  updateRevenueStream: (id: string, updates: Partial<RevenueStream>) => RevenueStream | null;
  deleteRevenueStream: (id: string) => boolean;
  addSubscription: (subscription: Omit<Subscription, 'id' | 'startDate'> & { startDate?: Date }) => Subscription;
  cancelSubscription: (id: string) => boolean;
  getAnalytics: (startDate: Date, endDate: Date) => RevenueAnalytics;
  generateRecommendations: (projectType: string, currentRevenue?: number, userCount?: number) => void;
  setPeriod: (start: Date, end: Date) => void;
  refresh: () => void;
}

export const useMonetizeStore = create<MonetizeStore>((set, get) => ({
  revenueStreams: [],
  subscriptions: [],
  analytics: null,
  pricingStrategies: [],
  recommendations: [],
  selectedPeriod: {
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(),
  },
  isLoading: false,
  error: null,

  loadRevenueStreams: () => {
    const streams = revenueService.getRevenueStreams();
    set({ revenueStreams: streams });
  },

  loadSubscriptions: () => {
    const subs = revenueService.getSubscriptions();
    set({ subscriptions: subs });
  },

  loadPricingStrategies: () => {
    const strategies = pricingService.getAllStrategies();
    set({ pricingStrategies: strategies });
  },

  addRevenueStream: (stream) => {
    const newStream = revenueService.addRevenueStream(stream);
    get().loadRevenueStreams();
    get().refresh();
    return newStream;
  },

  updateRevenueStream: (id, updates) => {
    const updated = revenueService.updateRevenueStream(id, updates);
    if (updated) {
      get().loadRevenueStreams();
      get().refresh();
    }
    return updated;
  },

  deleteRevenueStream: (id) => {
    const deleted = revenueService.deleteRevenueStream(id);
    if (deleted) {
      get().loadRevenueStreams();
      get().refresh();
    }
    return deleted;
  },

  addSubscription: (subscription) => {
    const newSub = revenueService.addSubscription(subscription);
    get().loadSubscriptions();
    get().refresh();
    return newSub;
  },

  cancelSubscription: (id) => {
    const cancelled = revenueService.cancelSubscription(id);
    if (cancelled) {
      get().loadSubscriptions();
      get().refresh();
    }
    return cancelled;
  },

  getAnalytics: (startDate, endDate) => {
    return revenueService.getAnalytics(startDate, endDate);
  },

  generateRecommendations: (projectType, currentRevenue, userCount) => {
    const recommendations = pricingService.generateRecommendations(projectType, currentRevenue, userCount);
    set({ recommendations });
  },

  setPeriod: (start, end) => {
    set({ selectedPeriod: { start, end } });
    get().refresh();
  },

  refresh: () => {
    const { selectedPeriod } = get();
    set({ isLoading: true });
    try {
      get().loadRevenueStreams();
      get().loadSubscriptions();
      const analytics = get().getAnalytics(selectedPeriod.start, selectedPeriod.end);
      set({ analytics, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },
}));

