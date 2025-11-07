import { useEffect } from 'react';
import { useVersionStore } from '../../services/system/versionStore';
import '../../styles/VersionDisplay.css';

function VersionDisplay() {
  const { appVersion, componentVersions, loadAppVersion, loadComponentVersions } = useVersionStore();

  useEffect(() => {
    loadAppVersion();
    loadComponentVersions();
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
      {appVersion.buildDate && (
        <div className="version-meta">
          <span className="version-date">
            Built {appVersion.buildDate.toLocaleDateString()}
          </span>
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

