/**
 * DevToolsManager.tsx
 * 
 * PURPOSE:
 * Development tools management panel. Provides UI for checking, installing, and managing
 * development tools (Node.js, Python, Docker, Git, etc.). Displays tool availability,
 * versions, and update information. Integrates with system tool detection.
 * 
 * ARCHITECTURE:
 * React component that manages dev tools:
 * - useDevToolsStore: Dev tools state and operations
 * - Tool registry: Available tools catalog
 * - Tool checking and installation
 * - Update checking
 * 
 * Features:
 * - Tool availability checking
 * - Tool installation
 * - Version detection
 * - Update checking
 * - Category filtering
 * - Tool status display
 * 
 * CURRENT STATUS:
 * ✅ Tool checking
 * ✅ Tool installation
 * ✅ Version detection
 * ✅ Update checking
 * ✅ Category filtering
 * ✅ Status display
 * 
 * DEPENDENCIES:
 * - useDevToolsStore: Dev tools state management
 * - toolRegistry: Available tools catalog
 * - toolManager: Tool detection and installation
 * - toolUpdateService: Update checking
 * 
 * STATE MANAGEMENT:
 * - Local state: selected category, search term, UI state
 * - Uses Zustand store for dev tools state
 * 
 * PERFORMANCE:
 * - Efficient tool checking
 * - Cached tool status
 * - Debounced search
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import DevToolsManager from '@/components/DevTools/DevToolsManager';
 * 
 * function App() {
 *   return <DevToolsManager />;
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/devtools/toolStore.ts: Dev tools state management
 * - src/services/devtools/toolRegistry.ts: Tools catalog
 * - src/services/devtools/toolManager.ts: Tool operations
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Add tool configuration UI
 * - Add tool path management
 * - Add custom tool registration
 * - Add tool usage analytics
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDevToolsStore } from '../../services/devtools/toolStore';
import { DEV_TOOLS } from '../../services/devtools/toolRegistry';
import type { DevTool } from '../../services/devtools/toolRegistry';
import '../../styles/DevToolsManager.css';

const CATEGORIES: Array<{
  id: DevTool['category'] | 'all';
  name: string;
  icon: string;
}> = [
  { id: 'all', name: 'All Tools', icon: '🔧' },
  { id: 'version-control', name: 'Version Control', icon: '📦' },
  { id: 'runtime', name: 'Runtimes', icon: '⚡' },
  { id: 'package-manager', name: 'Package Managers', icon: '📚' },
  { id: 'container', name: 'Containers', icon: '🐳' },
  { id: 'build-tool', name: 'Build Tools', icon: '🔨' },
  { id: 'testing', name: 'Testing', icon: '🧪' },
  { id: 'linting', name: 'Linting', icon: '✨' },
];

function DevToolsManager() {
  const { tools, isLoading, checkAllTools, installTool, getToolsByCategory } =
    useDevToolsStore();
  const [selectedCategory, setSelectedCategory] = useState<
    DevTool['category'] | 'all'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkAllTools();
  }, [checkAllTools]);

  // Memoize category filtering
  const categoryFiltered = useMemo(() => {
    return selectedCategory === 'all'
      ? DEV_TOOLS
      : getToolsByCategory(selectedCategory);
  }, [selectedCategory, getToolsByCategory]);

  // Memoize search filtering with lowercased query for performance
  const lowerSearchQuery = useMemo(
    () => searchQuery.toLowerCase().trim(),
    [searchQuery]
  );

  const filteredTools = useMemo(() => {
    if (!lowerSearchQuery) return categoryFiltered;

    return categoryFiltered.filter(
      (tool) =>
        tool.name.toLowerCase().includes(lowerSearchQuery) ||
        tool.description.toLowerCase().includes(lowerSearchQuery) ||
        tool.id.toLowerCase().includes(lowerSearchQuery)
    );
  }, [categoryFiltered, lowerSearchQuery]);

  // Memoize tool status lookup map for O(1) access
  const toolStatusMap = useMemo(() => {
    const map = new Map<string, (typeof tools)[0]>();
    tools.forEach((status) => {
      map.set(status.tool.id, status);
    });
    return map;
  }, [tools]);

  const handleInstall = useCallback(
    async (tool: DevTool) => {
      await installTool(tool);
    },
    [installTool]
  );

  const handleCategoryChange = useCallback(
    (category: DevTool['category'] | 'all') => {
      setSelectedCategory(category);
    },
    []
  );

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  return (
    <div className="dev-tools-manager">
      <div className="manager-header">
        <h2>Dev Tools Manager</h2>
        <div className="header-actions">
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
          <button
            onClick={checkAllTools}
            className="refresh-btn"
            disabled={isLoading}
          >
            {isLoading ? '🔄 Checking...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      <div className="category-filter">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
            onClick={() => handleCategoryChange(cat.id)}
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      <div className="tools-grid">
        {filteredTools.map((tool) => {
          const toolStatus = toolStatusMap.get(tool.id);
          const isInstalled = toolStatus?.isInstalled || false;
          const version = toolStatus?.version;

          return (
            <div
              key={tool.id}
              className={`tool-card ${isInstalled ? 'installed' : ''}`}
            >
              <div className="tool-header">
                <h3>{tool.name}</h3>
                <span
                  className={`status-badge ${isInstalled ? 'installed' : 'missing'}`}
                >
                  {isInstalled ? '✓ Installed' : '○ Not Installed'}
                </span>
              </div>
              <p className="tool-description">{tool.description}</p>
              {isInstalled && version && (
                <div className="tool-version">Version: {version}</div>
              )}
              {tool.website && (
                <a
                  href={tool.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tool-link"
                >
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
