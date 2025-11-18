/**
 * Preferences Enforcement Service
 *
 * PURPOSE:
 * Enforces user preferences throughout the application.
 * Bridges the gap between preference storage and actual app behavior.
 *
 * INTEGRATIONS:
 * - Theme system (dark/light/auto)
 * - Notification system
 * - AI behavior (tone, cost limits, auto-approval)
 * - Performance settings (auto-refresh, cache, concurrent requests)
 * - Accessibility (font size, contrast, motion)
 *
 * This service is the KEY to making all 29 preferences actually work.
 */

import { UserPreferences } from './userPreferencesService';
import { logger } from '../logging/loggerService';

class PreferencesEnforcementService {
  private currentPreferences: UserPreferences | null = null;
  private observers: Array<(prefs: UserPreferences) => void> = [];

  /**
   * Initialize and enforce preferences
   */
  initialize(preferences: UserPreferences): void {
    this.currentPreferences = preferences;
    this.enforceAll(preferences);
    logger.info('Preferences enforcement service initialized');
  }

  /**
   * Update and enforce preferences when they change
   */
  update(preferences: UserPreferences): void {
    const previous = this.currentPreferences;
    this.currentPreferences = preferences;

    // Enforce changed preferences
    this.enforceAll(preferences);

    // Notify observers
    this.notifyObservers(preferences);

    logger.debug('Preferences updated and enforced', {
      themeChanged: previous?.general.theme !== preferences.general.theme,
      aiChanged: previous?.ai.aggressiveness !== preferences.ai.aggressiveness,
    });
  }

  /**
   * Add observer for preference changes
   */
  addObserver(callback: (prefs: UserPreferences) => void): () => void {
    this.observers.push(callback);

    // Return unsubscribe function
    return () => {
      this.observers = this.observers.filter(cb => cb !== callback);
    };
  }

  /**
   * Notify all observers
   */
  private notifyObservers(preferences: UserPreferences): void {
    this.observers.forEach(callback => {
      try {
        callback(preferences);
      } catch (error) {
        logger.error('Observer callback failed', { error });
      }
    });
  }

  /**
   * Enforce ALL preferences
   */
  private enforceAll(preferences: UserPreferences): void {
    this.enforceGeneral(preferences.general);
    this.enforceNotifications(preferences.notifications);
    this.enforceAI(preferences.ai);
    this.enforcePrivacy(preferences.privacy);
    this.enforcePerformance(preferences.performance);
    this.enforceAccessibility(preferences.accessibility);
  }

  // ========================================
  // GENERAL PREFERENCES
  // ========================================

  /**
   * Enforce general preferences (theme, language, currency, etc.)
   */
  private enforceGeneral(general: UserPreferences['general']): void {
    // 1. Theme
    this.applyTheme(general.theme);

    // 2. Language (would integrate with i18n library)
    document.documentElement.lang = general.language;

    // 3. Currency (stored for formatters)
    localStorage.setItem('dlx-currency', general.currency);

    // 4. Date format (stored for formatters)
    localStorage.setItem('dlx-dateFormat', general.dateFormat);

    logger.debug('General preferences enforced', general);
  }

  /**
   * Apply theme to the DOM
   */
  private applyTheme(theme: 'dark' | 'light' | 'auto'): void {
    const root = document.documentElement;

    if (theme === 'auto') {
      // Use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (this.currentPreferences?.general.theme === 'auto') {
          root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      });
    } else {
      root.setAttribute('data-theme', theme);
    }

    // Also update body class for legacy support
    root.classList.remove('dark-theme', 'light-theme');
    root.classList.add(`${theme === 'auto' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme}-theme`);

    logger.debug('Theme applied', { theme });
  }

  // ========================================
  // NOTIFICATION PREFERENCES
  // ========================================

  /**
   * Enforce notification preferences
   */
  private enforceNotifications(notifications: UserPreferences['notifications']): void {
    // Request desktop notification permission if enabled
    if (notifications.desktop && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          logger.info('Notification permission requested', { permission });
        });
      }
    }

    // Store notification preferences for services to check
    localStorage.setItem('dlx-notifications', JSON.stringify(notifications));

    logger.debug('Notification preferences enforced', notifications);
  }

  /**
   * Check if notifications are enabled
   */
  shouldNotify(type: 'desktop' | 'email' | 'revenue' | 'errors' | 'updates' | 'workflows'): boolean {
    if (!this.currentPreferences) return false;

    const notifs = this.currentPreferences.notifications;

    switch (type) {
      case 'desktop':
        return notifs.desktop && Notification.permission === 'granted';
      case 'email':
        return notifs.email;
      case 'revenue':
        return notifs.revenue;
      case 'errors':
        return notifs.errors;
      case 'updates':
        return notifs.updates;
      case 'workflows':
        return notifs.workflows;
      default:
        return false;
    }
  }

  /**
   * Send desktop notification if enabled
   */
  sendDesktopNotification(title: string, options?: NotificationOptions): void {
    if (this.shouldNotify('desktop')) {
      try {
        new Notification(title, options);
      } catch (error) {
        logger.error('Failed to send desktop notification', { error });
      }
    }
  }

  // ========================================
  // AI PREFERENCES
  // ========================================

  /**
   * Enforce AI behavior preferences
   */
  private enforceAI(ai: UserPreferences['ai']): void {
    // Store AI preferences for AI services to check
    localStorage.setItem('dlx-ai-config', JSON.stringify(ai));

    logger.debug('AI preferences enforced', ai);
  }

  /**
   * Get AI configuration
   */
  getAIConfig(): UserPreferences['ai'] | null {
    return this.currentPreferences?.ai || null;
  }

  /**
   * Check if AI action should be auto-approved
   */
  shouldAutoApproveAI(): boolean {
    return this.currentPreferences?.ai.autoApprove || false;
  }

  /**
   * Get AI content tone
   */
  getAIContentTone(): 'professional' | 'casual' | 'friendly' | 'technical' {
    return this.currentPreferences?.ai.contentTone || 'professional';
  }

  /**
   * Get max AI cost per day
   */
  getMaxAICostPerDay(): number {
    return this.currentPreferences?.ai.maxCostPerDay || 10;
  }

  /**
   * Get AI aggressiveness level
   */
  getAIAggressiveness(): 'conservative' | 'balanced' | 'aggressive' {
    return this.currentPreferences?.ai.aggressiveness || 'balanced';
  }

  // ========================================
  // PRIVACY PREFERENCES
  // ========================================

  /**
   * Enforce privacy preferences
   */
  private enforcePrivacy(privacy: UserPreferences['privacy']): void {
    // Store privacy preferences
    localStorage.setItem('dlx-privacy', JSON.stringify(privacy));

    logger.debug('Privacy preferences enforced', privacy);
  }

  /**
   * Check if analytics sharing is enabled
   */
  shouldShareAnalytics(): boolean {
    return this.currentPreferences?.privacy.analyticsSharing || false;
  }

  /**
   * Check if error reporting is enabled
   */
  shouldReportErrors(): boolean {
    return this.currentPreferences?.privacy.errorReporting !== false; // Default true
  }

  /**
   * Check if usage data collection is enabled
   */
  shouldCollectUsageData(): boolean {
    return this.currentPreferences?.privacy.usageData || false;
  }

  // ========================================
  // PERFORMANCE PREFERENCES
  // ========================================

  /**
   * Enforce performance preferences
   */
  private enforcePerformance(performance: UserPreferences['performance']): void {
    // Store performance preferences
    localStorage.setItem('dlx-performance', JSON.stringify(performance));

    logger.debug('Performance preferences enforced', performance);
  }

  /**
   * Get auto-refresh interval in milliseconds
   */
  getAutoRefreshInterval(): number {
    const seconds = this.currentPreferences?.performance.autoRefreshInterval || 30;
    return seconds * 1000; // Convert to milliseconds
  }

  /**
   * Check if cache is enabled
   */
  isCacheEnabled(): boolean {
    return this.currentPreferences?.performance.cacheEnabled !== false; // Default true
  }

  /**
   * Check if background tasks are enabled
   */
  areBackgroundTasksEnabled(): boolean {
    return this.currentPreferences?.performance.backgroundTasks !== false; // Default true
  }

  /**
   * Get max concurrent requests
   */
  getMaxConcurrentRequests(): number {
    return this.currentPreferences?.performance.maxConcurrentRequests || 5;
  }

  // ========================================
  // ACCESSIBILITY PREFERENCES
  // ========================================

  /**
   * Enforce accessibility preferences
   */
  private enforceAccessibility(accessibility: UserPreferences['accessibility']): void {
    const root = document.documentElement;

    // 1. Font Size
    root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
    root.classList.add(`font-size-${accessibility.fontSize}`);
    root.style.setProperty('--base-font-size', this.getFontSizeValue(accessibility.fontSize));

    // 2. High Contrast
    if (accessibility.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // 3. Reduced Motion
    if (accessibility.reducedMotion) {
      root.classList.add('reduce-motion');
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--transition-duration', '0.01ms');
    } else {
      root.classList.remove('reduce-motion');
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // 4. Screen Reader Optimized
    if (accessibility.screenReaderOptimized) {
      root.classList.add('screen-reader-optimized');
    } else {
      root.classList.remove('screen-reader-optimized');
    }

    logger.debug('Accessibility preferences enforced', accessibility);
  }

  /**
   * Get font size CSS value
   */
  private getFontSizeValue(size: 'small' | 'medium' | 'large'): string {
    switch (size) {
      case 'small':
        return '14px';
      case 'medium':
        return '16px';
      case 'large':
        return '18px';
      default:
        return '16px';
    }
  }

  /**
   * Check if reduced motion is enabled
   */
  isReducedMotion(): boolean {
    return this.currentPreferences?.accessibility.reducedMotion || false;
  }

  /**
   * Check if high contrast is enabled
   */
  isHighContrast(): boolean {
    return this.currentPreferences?.accessibility.highContrast || false;
  }

  // ========================================
  // UTILITY METHODS
  // ========================================

  /**
   * Get current preferences
   */
  getCurrentPreferences(): UserPreferences | null {
    return this.currentPreferences;
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.currentPreferences !== null;
  }

  /**
   * Get preference value by path
   */
  getPreference<K extends keyof UserPreferences>(
    category: K,
    key: keyof UserPreferences[K]
  ): any {
    if (!this.currentPreferences) return null;
    return this.currentPreferences[category][key];
  }
}

// Export singleton instance
export const preferencesEnforcementService = new PreferencesEnforcementService();

// Expose to window for testing/debugging
if (typeof window !== 'undefined') {
  (window as any).preferencesEnforcementService = preferencesEnforcementService;
}
