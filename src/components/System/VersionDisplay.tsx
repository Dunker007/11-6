/**
 * VersionDisplay.tsx
 * 
 * PURPOSE:
 * System version information display component. Shows application version, build date,
 * and component versions. Provides update checking functionality when updater is available.
 * Used in settings and about panels to display version information.
 * 
 * ARCHITECTURE:
 * React component that displays version information:
 * - useVersionStore: Version state management
 * - App version display
 * - Component versions list
 * - Update checking (when available)
 * 
 * Features:
 * - Application version display
 * - Build date display
 * - Component version listing
 * - Update check button (when updater available)
 * - Expandable component list
 * 
 * CURRENT STATUS:
 * ✅ Version display
 * ✅ Build date display
 * ✅ Component versions
 * ✅ Update checking
 * ✅ Expandable details
 * 
 * DEPENDENCIES:
 * - useVersionStore: Version state management
 * - window.updater: Electron updater API (optional)
 * 
 * STATE MANAGEMENT:
 * - Local state: update checking status
 * - Uses Zustand store for version data
 * 
 * PERFORMANCE:
 * - Memoized date formatting
 * - Efficient version loading
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import VersionDisplay from '@/components/System/VersionDisplay';
 * 
 * function Settings() {
 *   return (
 *     <div>
 *       <VersionDisplay />
 *     </div>
 *   );
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/system/versionStore.ts: Version state management
 * - src/services/system/versionService.ts: Version operations
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Add version comparison
 * - Add changelog display
 * - Add update progress indicator
 * - Add auto-update preferences
 */
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useVersionStore } from '../../services/system/versionStore';
import { logger } from '../../services/logging/loggerService';
import { RefreshCw } from 'lucide-react';
import '../../styles/VersionDisplay.css';

function VersionDisplay() {
  const { appVersion, componentVersions, loadAppVersion, loadComponentVersions } = useVersionStore();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  useEffect(() => {
    loadAppVersion();
    loadComponentVersions();
  }, [loadAppVersion, loadComponentVersions]);

  const handleCheckForUpdates = useCallback(async () => {
    if (typeof window === 'undefined' || !window.updater) {
      return;
    }

    setIsCheckingUpdate(true);
    try {
      await window.updater.check();
    } catch (error) {
      logger.error('Failed to check for updates:', { error });
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  const formattedBuildDate = useMemo(() => {
    return appVersion?.buildDate?.toLocaleDateString() ?? null;
  }, [appVersion?.buildDate]);

  const hasUpdater = useMemo(() => {
    return typeof window !== 'undefined' && window.updater !== undefined;
  }, []);

  if (!appVersion) {
    return null;
  }

  return (
    <div className="version-display">
      <div className="version-main">
        <span className="version-label">Version</span>
        <span className="version-number">{appVersion.version}</span>
      </div>
      {formattedBuildDate && (
        <div className="version-meta">
          <span className="version-date">
            Built {formattedBuildDate}
          </span>
          {hasUpdater && (
            <button
              className="version-check-update"
              onClick={handleCheckForUpdates}
              disabled={isCheckingUpdate}
              title="Check for updates"
            >
              <RefreshCw size={12} className={isCheckingUpdate ? 'spinning' : ''} />
            </button>
          )}
        </div>
      )}
      {componentVersions.length > 0 && (
        <div className="version-components">
          <details className="version-details">
            <summary className="version-summary">
              {componentVersions.length} Component{componentVersions.length !== 1 ? 's' : ''}
            </summary>
            <div className="component-list">
              {componentVersions.map((comp) => (
                <div key={comp.componentId} className="component-item">
                  <span className="component-name">{comp.componentName}</span>
                  <span className="component-version">v{comp.version}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default VersionDisplay;

