/**
 * Settings Services - Unified Exports
 *
 * Central export for all settings and preferences services.
 */

// User Preferences
export { usePreferencesStore } from './userPreferencesService';
export type { UserPreferences } from './userPreferencesService';

// Preferences Enforcement
export { preferencesEnforcementService } from './preferencesEnforcementService';

// React Hooks
export {
  usePreferences,
  useAIConfig,
  usePerformanceConfig,
  useNotificationConfig,
  useAccessibilityConfig,
} from '../../hooks/usePreferences';

// Provider Component
export { PreferencesProvider } from '../../components/Providers/PreferencesProvider';
