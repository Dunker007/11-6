import { useState, useEffect } from 'react';
import { useDevToolsStore } from '../../services/devtools/toolStore';
import { DEV_TOOLS } from '../../services/devtools/toolRegistry';
import type { DevTool } from '../../services/devtools/toolRegistry';
import '../../styles/DevToolsManager.css';

function DevToolsManager() {
  const { tools, isLoading, checkAllTools, installTool, getToolsByCategory } = useDevToolsStore();
  const [selectedCategory, setSelectedCategory] = useState<DevTool['category'] | 'all'>('all');

  useEffect(() => {
    checkAllTools();
  }, []);

  const categories: Array<{ id: DevTool['category'] | 'all'; name: string; icon: string }> = [
    { id: 'all', name: 'All Tools', icon: '🔧' },
    { id: 'version-control', name: 'Version Control', icon: '📦' },
    { id: 'runtime', name: 'Runtimes', icon: '⚡' },
    { id: 'package-manager', name: 'Package Managers', icon: '📚' },
    { id: 'container', name: 'Containers', icon: '🐳' },
    { id: 'build-tool', name: 'Build Tools', icon: '🔨' },
    { id: 'testing', name: 'Testing', icon: '🧪' },
    { id: 'linting', name: 'Linting', icon: '✨' },
  ];

  const filteredTools = selectedCategory === 'all' 
    ? DEV_TOOLS 
    : getToolsByCategory(selectedCategory);

  const handleInstall = async (tool: DevTool) => {
    await installTool(tool);
  };

  return (
    <div className="dev-tools-manager">
      <div className="manager-header">
        <h2>Dev Tools Manager</h2>
        <button onClick={() => checkAllTools()} className="refresh-btn" disabled={isLoading}>
          {isLoading ? '🔄 Checking...' : '↻ Refresh'}
        </button>
      </div>

      <div className="category-filter">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="tools-grid">
        {filteredTools.map((tool) => {
          const toolStatus = tools.find((t) => t.tool.id === tool.id);
          const isInstalled = toolStatus?.isInstalled || false;
          const version = toolStatus?.version;

          return (
            <div key={tool.id} className={`tool-card ${isInstalled ? 'installed' : ''}`}>
              <div className="tool-header">
                <h3>{tool.name}</h3>
                <span className={`status-badge ${isInstalled ? 'installed' : 'missing'}`}>
                  {isInstalled ? '✓ Installed' : '○ Not Installed'}
                </span>
              </div>
              <p className="tool-description">{tool.description}</p>
              {isInstalled && version && (
                <div className="tool-version">Version: {version}</div>
              )}
              {tool.website && (
                <a href={tool.website} target="_blank" rel="noopener noreferrer" className="tool-link">
                  🌐 Website
                </a>
              )}
              {!isInstalled && tool.installCommand && (
                <button
                  className="install-btn"
                  onClick={() => handleInstall(tool)}
                  disabled={isLoading}
                >
                  📥 Install
                </button>
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

export default DevToolsManager;

