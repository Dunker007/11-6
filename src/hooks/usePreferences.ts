/**
 * usePreferences Hook
 *
 * PURPOSE:
 * React hook that integrates preferences store with enforcement service.
 * Automatically enforces preferences when they change.
 *
 * USAGE:
 * ```typescript
 * const { preferences, updatePreferences, enforcement } = usePreferences();
 *
 * // Update theme - automatically applied to DOM
 * updatePreferences('general', { theme: 'dark' });
 *
 * // Check if notifications should be sent
 * if (enforcement.shouldNotify('revenue')) {
 *   enforcement.sendDesktopNotification('New revenue!');
 * }
 *
 * // Get AI configuration
 * const aiConfig = enforcement.getAIConfig();
 * ```
 */

import { useEffect } from 'react';
import { usePreferencesStore, UserPreferences } from '../services/settings/userPreferencesService';
import { preferencesEnforcementService } from '../services/settings/preferencesEnforcementService';

export function usePreferences() {
  const store = usePreferencesStore();

  // Initialize enforcement service on mount
  useEffect(() => {
    if (!preferencesEnforcementService.isInitialized()) {
      preferencesEnforcementService.initialize(store.preferences);
    }
  }, []);

  // Enforce preferences whenever they change
  useEffect(() => {
    preferencesEnforcementService.update(store.preferences);
  }, [store.preferences]);

  // Wrap updatePreferences to ensure enforcement
  const updatePreferences = <K extends keyof UserPreferences>(
    category: K,
    updates: Partial<UserPreferences[K]>
  ) => {
    store.updatePreferences(category, updates);
    // Enforcement happens automatically via useEffect above
  };

  return {
    preferences: store.preferences,
    updatePreferences,
    resetPreferences: store.resetPreferences,
    exportPreferences: store.exportPreferences,
    importPreferences: store.importPreferences,
    enforcement: preferencesEnforcementService,
  };
}

/**
 * Hook to get AI configuration from preferences
 */
export function useAIConfig() {
  const { preferences, enforcement } = usePreferences();

  return {
    aggressiveness: preferences.ai.aggressiveness,
    autoApprove: preferences.ai.autoApprove,
    learningEnabled: preferences.ai.learningEnabled,
    contentTone: preferences.ai.contentTone,
    maxCostPerDay: preferences.ai.maxCostPerDay,
    shouldAutoApprove: () => enforcement.shouldAutoApproveAI(),
    getContentTone: () => enforcement.getAIContentTone(),
    getMaxCostPerDay: () => enforcement.getMaxAICostPerDay(),
  };
}

/**
 * Hook to get performance configuration from preferences
 */
export function usePerformanceConfig() {
  const { preferences, enforcement } = usePreferences();

  return {
    autoRefreshInterval: preferences.performance.autoRefreshInterval,
    cacheEnabled: preferences.performance.cacheEnabled,
    backgroundTasks: preferences.performance.backgroundTasks,
    maxConcurrentRequests: preferences.performance.maxConcurrentRequests,
    getAutoRefreshIntervalMs: () => enforcement.getAutoRefreshInterval(),
    isCacheEnabled: () => enforcement.isCacheEnabled(),
    areBackgroundTasksEnabled: () => enforcement.areBackgroundTasksEnabled(),
  };
}

/**
 * Hook to get notification configuration from preferences
 */
export function useNotificationConfig() {
  const { preferences, enforcement } = usePreferences();

  return {
    desktop: preferences.notifications.desktop,
    email: preferences.notifications.email,
    frequency: preferences.notifications.frequency,
    revenue: preferences.notifications.revenue,
    errors: preferences.notifications.errors,
    updates: preferences.notifications.updates,
    workflows: preferences.notifications.workflows,
    shouldNotify: (type: 'desktop' | 'email' | 'revenue' | 'errors' | 'updates' | 'workflows') =>
      enforcement.shouldNotify(type),
    sendDesktopNotification: (title: string, options?: NotificationOptions) =>
      enforcement.sendDesktopNotification(title, options),
  };
}

/**
 * Hook to get accessibility configuration from preferences
 */
export function useAccessibilityConfig() {
  const { preferences, enforcement } = usePreferences();

  return {
    fontSize: preferences.accessibility.fontSize,
    highContrast: preferences.accessibility.highContrast,
    reducedMotion: preferences.accessibility.reducedMotion,
    screenReaderOptimized: preferences.accessibility.screenReaderOptimized,
    isReducedMotion: () => enforcement.isReducedMotion(),
    isHighContrast: () => enforcement.isHighContrast(),
  };
}
