import { useState, useEffect } from 'react';
import { devToolsService, type DevTool } from '../services/devToolsService';

function DevToolsManager() {
  const [tools, setTools] = useState<DevTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setLoading(true);
    try {
      const toolList = await devToolsService.checkAllTools();
      setTools(toolList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tools');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async (toolName: string) => {
    setInstalling(toolName);
    setError(null);

    try {
      const result = await devToolsService.installTool(toolName);
      if (result.success) {
        // Reload tools to update status
        await loadTools();
      } else {
        setError(result.error || 'Installation failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed');
    } finally {
      setInstalling(null);
    }
  };

  const categories = ['runtime', 'package-manager', 'editor', 'version-control', 'container', 'other'] as const;
  const categoryLabels: Record<string, string> = {
    runtime: 'Runtime',
    'package-manager': 'Package Managers',
    editor: 'Editors',
    'version-control': 'Version Control',
    container: 'Containers',
    other: 'Other',
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading"></div>
        <span>Loading development tools...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h2>🛠️ Development Tools Manager</h2>
        <p style={{ marginBottom: '1.5rem', color: '#a0a0a0' }}>
          Install and manage development tools automatically
        </p>

        {error && (
          <div style={{
            padding: '1rem',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: '#f87171',
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <button className="button" onClick={loadTools}>
            🔄 Refresh Status
          </button>
        </div>

        {categories.map((category) => {
          const categoryTools = tools.filter((t) => t.category === category);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category} style={{ marginBottom: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#d0d0d0' }}>
                {categoryLabels[category]}
              </h3>
              <div className="info-grid">
                {categoryTools.map((tool) => (
                  <div key={tool.name} className="info-item">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <div>
                        <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{tool.icon}</span>
                        <strong>{tool.displayName}</strong>
                      </div>
                      <span
                        className={`status-badge ${tool.installed ? 'installed' : 'not-installed'}`}
                      >
                        {tool.installed ? '✓ Installed' : '✗ Not Installed'}
                      </span>
                    </div>
                    {tool.installed && tool.version && (
                      <value style={{ fontSize: '0.85rem', color: '#a0a0a0', display: 'block', marginBottom: '0.5rem' }}>
                        Version: {tool.version}
                      </value>
                    )}
                    {!tool.installed && (
                      <button
                        className="button"
                        onClick={() => handleInstall(tool.name)}
                        disabled={installing === tool.name}
                        style={{
                          width: '100%',
                          marginTop: '0.5rem',
                          fontSize: '0.85rem',
                          padding: '0.5rem 1rem',
                        }}
                      >
                        {installing === tool.name ? (
                          <>
                            <span className="loading"></span>
                            Installing...
                          </>
                        ) : (
                          '📥 Install'
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2>ℹ️ Installation Notes</h2>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem', lineHeight: '1.8' }}>
          <li>Installations are fully automated - no user interaction required</li>
          <li>Some tools may require administrator privileges</li>
          <li>After installation, restart your terminal/command prompt to use new tools</li>
          <li>Package managers (npm, yarn, pnpm) are usually installed with Node.js</li>
        </ul>
      </div>
    </div>
  );
}

export default DevToolsManager;

