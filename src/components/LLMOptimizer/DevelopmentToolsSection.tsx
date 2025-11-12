import { useState, useEffect, useMemo } from 'react';
import { Wrench, RefreshCw, CheckCircle, X, AlertCircle, Download } from 'lucide-react';
import { useDevToolsStore } from '@/services/devtools/toolStore';
import { DEV_TOOLS } from '@/services/devtools/toolRegistry';
import '../../styles/DevToolsManager.css';
import '../../styles/LLMOptimizer.css';

function DevelopmentToolsSection() {
  const { tools, updateInfo, isLoading, isCheckingUpdates, checkAllTools, checkToolUpdates } =
    useDevToolsStore();
  const [isDetectingDevTools, setIsDetectingDevTools] = useState(false);

  useEffect(() => {
    const loadDevTools = async () => {
      setIsDetectingDevTools(true);
      try {
        await checkAllTools();
      } finally {
        setIsDetectingDevTools(false);
      }
    };
    loadDevTools();
  }, [checkAllTools]);

  const toolStatusMap = useMemo(() => {
    const map = new Map<string, typeof tools[0]>();
    tools.forEach((result) => map.set(result.tool.id, result));
    return map;
  }, [tools]);

  const handleCheckUpdates = async () => {
    await checkToolUpdates();
  };

  return (
    <div className="dev-tools-section-horizontal">
      <div className="dev-tools-header">
        <div className="dev-tools-title">
          <Wrench size={18} />
          <h4>Development Tools</h4>
        </div>
        <div className="dev-tools-actions">
          <button
            className="check-updates-btn"
            onClick={handleCheckUpdates}
            disabled={isCheckingUpdates || isLoading}
            title="Check for updates"
          >
            {isCheckingUpdates ? (
              <>
                <RefreshCw size={14} className="spinning" />
                Checking...
              </>
            ) : (
              <>
                <Download size={14} />
                Check Updates
              </>
            )}
          </button>
          <button
            className="hp-action-button subtle"
            onClick={async () => {
              setIsDetectingDevTools(true);
              try {
                await checkAllTools();
              } finally {
                setIsDetectingDevTools(false);
              }
            }}
            disabled={isDetectingDevTools || isLoading}
            title="Refresh dev tools detection"
          >
            <RefreshCw size={14} className={isDetectingDevTools ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="tools-horizontal-container">
        {DEV_TOOLS.map((tool) => {
          const toolStatus = toolStatusMap.get(tool.id);
          const isInstalled = toolStatus?.isInstalled || false;
          const version = toolStatus?.version;
          const toolUpdateInfo = updateInfo.get(tool.id);
          const hasUpdate = toolUpdateInfo?.hasUpdate || false;

          return (
            <div
              key={tool.id}
              className={`tool-card ${isInstalled ? 'installed' : ''}`}
            >
              <div className="tool-header">
                <h3>{tool.name}</h3>
                <span className={`status-badge ${isInstalled ? 'installed' : 'missing'}`}>
                  {isInstalled ? (
                    <CheckCircle size={12} />
                  ) : (
                    <X size={12} />
                  )}
                  {isInstalled ? 'Installed' : 'Missing'}
                </span>
              </div>
              <p className="tool-description">{tool.description}</p>
              {isInstalled && version && (
                <div className="tool-version">
                  <span className="tool-version-label">Version:</span>
                  <span className="tool-version-value">{version}</span>
                </div>
              )}
              {hasUpdate && toolUpdateInfo && (
                <div className="update-badge" title={`Update available: ${toolUpdateInfo.latestVersion}`}>
                  <AlertCircle size={12} />
                  Update: {toolUpdateInfo.latestVersion}
                </div>
              )}
              {!hasUpdate && isInstalled && toolUpdateInfo && (
                <div className="update-badge up-to-date" title="Up to date">
                  <CheckCircle size={12} />
                  Up to date
                </div>
              )}
              {tool.website && (
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tool-link"
                >
                  Website
                </a>
              )}
              {toolStatus?.error && (
                <div className="tool-error">{toolStatus.error}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DevelopmentToolsSection;

