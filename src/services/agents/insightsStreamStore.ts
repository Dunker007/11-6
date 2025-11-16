/**
 * Insights Stream Store
 * Chronological timeline of agent activities and system events
 */

import { create } from 'zustand';
import type { Insight, InsightType } from '@/types/insights';

interface InsightsStreamState {
  insights: Insight[];
  maxInsights: number;
  addInsight: (insight: Omit<Insight, 'timestamp'>) => void;
  clearInsights: () => void;
  clearInsightsByType: (type: InsightType) => void;
  getInsightsByAgent: (agent: Insight['agent']) => Insight[];
  getInsightsByType: (type: InsightType) => Insight[];
}

export const insightsStreamStore = create<InsightsStreamState>((set, get) => ({
  insights: [],
  maxInsights: 1000, // Keep last 1000 insights

  addInsight: (newInsight) => {
    const insight: Insight = {
      ...newInsight,
      timestamp: new Date(),
    };

    set((state) => {
      const updated = [...state.insights, insight];
      // Keep only the most recent insights
      const trimmed = updated.slice(-state.maxInsights);
      return { insights: trimmed };
    });
  },

  clearInsights: () => set({ insights: [] }),

  clearInsightsByType: (type) => set((state) => ({
    insights: state.insights.filter(i => i.type !== type),
  })),

  getInsightsByAgent: (agent) => {
    return get().insights.filter(i => i.agent === agent);
  },

  getInsightsByType: (type) => {
    return get().insights.filter(i => i.type === type);
  },
}));

// Export a hook for React components
export const useInsightsStreamStore = insightsStreamStore;

