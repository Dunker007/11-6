/**
 * PreferencesProvider
 *
 * PURPOSE:
 * Top-level provider that initializes and enforces user preferences.
 * Should wrap the entire app to ensure preferences are applied on load.
 *
 * USAGE:
 * ```typescript
 * <PreferencesProvider>
 *   <App />
 * </PreferencesProvider>
 * ```
 */

import { useEffect, ReactNode } from 'react';
import { usePreferencesStore } from '../../services/settings/userPreferencesService';
import { preferencesEnforcementService } from '../../services/settings/preferencesEnforcementService';
import { logger } from '../../services/logging/loggerService';

interface PreferencesProviderProps {
  children: ReactNode;
}

export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const { preferences } = usePreferencesStore();

  // Initialize preferences on mount
  useEffect(() => {
    logger.info('PreferencesProvider: Initializing preferences');
    preferencesEnforcementService.initialize(preferences);
  }, []);

  // Enforce preferences whenever they change
  useEffect(() => {
    logger.debug('PreferencesProvider: Preferences changed, enforcing');
    preferencesEnforcementService.update(preferences);
  }, [preferences]);

  return <>{children}</>;
}

export default PreferencesProvider;
