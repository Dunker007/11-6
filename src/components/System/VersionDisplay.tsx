import { useEffect, useState, useCallback, useMemo } from 'react';
import { useVersionStore } from '../../services/system/versionStore';
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
    if (typeof window === 'undefined' || !(window as any).updater) {
      return;
    }

    setIsCheckingUpdate(true);
    try {
      await (window as any).updater.check();
    } catch (error) {
      // Error logging handled by errorLogger service
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to check for updates:', error);
      }
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  const formattedBuildDate = useMemo(() => {
    return appVersion?.buildDate?.toLocaleDateString() ?? null;
  }, [appVersion?.buildDate]);

  const hasUpdater = useMemo(() => {
    return typeof window !== 'undefined' && (window as any).updater;
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

