/**
 * userPreferencesService.ts
 *
 * PURPOSE:
 * Comprehensive user preferences and settings management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserPreferences {
  // General
  general: {
    theme: 'dark' | 'light' | 'auto';
    language: string;
    timezone: string;
    currency: string;
    dateFormat: string;
  };

  // Notifications
  notifications: {
    desktop: boolean;
    email: boolean;
    frequency: 'real-time' | 'hourly' | 'daily';
    revenue: boolean;
    errors: boolean;
    updates: boolean;
    workflows: boolean;
  };

  // AI Behavior
  ai: {
    aggressiveness: 'conservative' | 'balanced' | 'aggressive';
    autoApprove: boolean;
    learningEnabled: boolean;
    contentTone: 'professional' | 'casual' | 'friendly' | 'technical';
    maxCostPerDay: number;
  };

  // Privacy
  privacy: {
    analyticsSharing: boolean;
    errorReporting: boolean;
    usageData: boolean;
    thirdPartyIntegrations: boolean;
  };

  // Performance
  performance: {
    autoRefreshInterval: number; // seconds
    cacheEnabled: boolean;
    backgroundTasks: boolean;
    maxConcurrentRequests: number;
  };

  // Accessibility
  accessibility: {
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    reducedMotion: boolean;
    screenReaderOptimized: boolean;
  };
}

const DEFAULT_PREFERENCES: UserPreferences = {
  general: {
    theme: 'dark',
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
  },
  notifications: {
    desktop: true,
    email: false,
    frequency: 'real-time',
    revenue: true,
    errors: true,
    updates: true,
    workflows: true,
  },
  ai: {
    aggressiveness: 'balanced',
    autoApprove: false,
    learningEnabled: true,
    contentTone: 'professional',
    maxCostPerDay: 10,
  },
  privacy: {
    analyticsSharing: false,
    errorReporting: true,
    usageData: false,
    thirdPartyIntegrations: true,
  },
  performance: {
    autoRefreshInterval: 30,
    cacheEnabled: true,
    backgroundTasks: true,
    maxConcurrentRequests: 5,
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reducedMotion: false,
    screenReaderOptimized: false,
  },
};

interface PreferencesState {
  preferences: UserPreferences;
  updatePreferences: <K extends keyof UserPreferences>(
    category: K,
    updates: Partial<UserPreferences[K]>
  ) => void;
  resetPreferences: () => void;
  exportPreferences: () => string;
  importPreferences: (data: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      preferences: DEFAULT_PREFERENCES,

      updatePreferences: (category, updates) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [category]: { ...state.preferences[category], ...updates },
          },
        }));
      },

      resetPreferences: () => {
        set({ preferences: DEFAULT_PREFERENCES });
      },

      exportPreferences: (): string => {
        const state = get();
        return JSON.stringify(state.preferences, null, 2);
      },

      importPreferences: (data: string) => {
        try {
          const imported = JSON.parse(data) as UserPreferences;
          set({ preferences: { ...DEFAULT_PREFERENCES, ...imported } });
        } catch (error) {
          console.error('Failed to import preferences:', error);
        }
      },
    }),
    {
      name: 'dlx-preferences',
      version: 1,
    }
  )
);
