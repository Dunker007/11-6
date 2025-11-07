import { useState } from 'react';

function CommandCenterMockup() {
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);
  const [toolsDrawerOpen, setToolsDrawerOpen] = useState(false);
  const [quickLabsOpen, setQuickLabsOpen] = useState(false);

  const workflows = [
    { id: 'create', name: 'Create', icon: '⚡', stats: '3 templates', color: 'violet' },
    { id: 'build', name: 'Build', icon: '🔨', stats: '2 active files', color: 'cyan' },
    { id: 'deploy', name: 'Deploy', icon: '🚀', stats: 'Ready', color: 'amber' },
    { id: 'monitor', name: 'Monitor', icon: '📊', stats: 'All systems go', color: 'green' },
    { id: 'monetize', name: 'Monetize', icon: '💰', stats: '$0 MRR', color: 'emerald' },
  ];

  const toolCategories = [
    { id: 'dev', name: 'Development', icon: '💻', tools: ['Git', 'DevTools', 'LLM Status'] },
    { id: 'auto', name: 'Automation', icon: '🤖', tools: ['Agent Forge', 'Creator', 'Mind Map'] },
    { id: 'analytics', name: 'Analytics', icon: '📈', tools: ['Health', 'Financial', 'Performance'] },
  ];

  const quickLabs = [
    { id: 'mindmap', name: 'Mind Map', icon: '🧠' },
    { id: 'codereview', name: 'Code Review', icon: '👀' },
    { id: 'agentforge', name: 'Agent Forge', icon: '🔮' },
    { id: 'creator', name: 'Creator', icon: '✍️' },
  ];

  const contextFiles = ['App.tsx', 'VibeEditor.tsx', 'themeService.ts'];
  const collaborators = [
    { name: 'You', color: '#8b5cf6' },
    { name: 'Vibed Ed', color: '#06b6d4' },
  ];

  return (
    <div className="command-center-mockup">
      {/* Top Bar - Context Awareness */}
      <div className="cc-top-bar">
        <div className="cc-context-indicator">
          <div className="context-badge">
            <span className="context-icon">🧠</span>
            <span>AI tracking {contextFiles.length} files</span>
          </div>
          {contextFiles.map((file) => (
            <div key={file} className="context-file">
              {file}
            </div>
          ))}
        </div>

        <div className="cc-status-indicators">
          <div className="status-badge security">
            <span>🛡️</span>
            <span>Security: Pass</span>
          </div>
          <div className="status-badge collab">
            <span>👥</span>
            <span>{collaborators.length} online</span>
          </div>
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="cc-main-grid">
        {/* Collapsible Tools Drawer */}
        <div className={`cc-tools-drawer ${toolsDrawerOpen ? 'open' : 'closed'}`}>
          <button
            className="drawer-toggle"
            onClick={() => setToolsDrawerOpen(!toolsDrawerOpen)}
          >
            {toolsDrawerOpen ? '◀' : '▶'}
          </button>

          {toolsDrawerOpen && (
            <div className="drawer-content">
              <h4>Tools</h4>
              {toolCategories.map((category) => (
                <div key={category.id} className="tool-category">
                  <div className="category-header">
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </div>
                  <div className="tool-list">
                    {category.tools.map((tool) => (
                      <div key={tool} className="tool-item">
                        {tool}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!toolsDrawerOpen && (
            <div className="drawer-icons">
              {toolCategories.map((category) => (
                <div
                  key={category.id}
                  className="tool-icon"
                  title={category.name}
                >
                  {category.icon}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workflow Cards Grid */}
        <div className="cc-workflows-grid">
          {expandedWorkflow ? (
            <div className="workflow-expanded">
              <div className="expanded-header">
                <h3>{workflows.find((w) => w.id === expandedWorkflow)?.name}</h3>
                <button
                  className="collapse-btn"
                  onClick={() => setExpandedWorkflow(null)}
                >
                  ✕
                </button>
              </div>
              <div className="expanded-content">
                <p>Full workflow panel would be displayed here...</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Click ✕ to collapse and return to grid view
                </p>
              </div>
            </div>
          ) : (
            <>
              {workflows.map((workflow) => (
                <div
                  key={workflow.id}
                  className={`workflow-card ${workflow.color}`}
                  onClick={() => setExpandedWorkflow(workflow.id)}
                >
                  <div className="workflow-icon">{workflow.icon}</div>
                  <h4>{workflow.name}</h4>
                  <p className="workflow-stats">{workflow.stats}</p>
                  <div className="workflow-actions">
                    <button className="action-dot">•</button>
                    <button className="action-dot">•</button>
                    <button className="action-dot">•</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Quick Labs Dock */}
      <div className={`cc-quick-labs-dock ${quickLabsOpen ? 'open' : 'closed'}`}>
        <button
          className="dock-toggle"
          onClick={() => setQuickLabsOpen(!quickLabsOpen)}
        >
          {quickLabsOpen ? 'Hide Quick Labs ▼' : 'Show Quick Labs ▲'}
        </button>

        {quickLabsOpen && (
          <div className="dock-content">
            {quickLabs.map((lab) => (
              <div key={lab.id} className="quick-lab-item">
                <span className="lab-icon">{lab.icon}</span>
                <span className="lab-name">{lab.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating AI Chat */}
      <div className="cc-floating-ai">
        <div className="ai-bubble">
          <span>💬</span>
          <span className="ai-indicator"></span>
        </div>
      </div>

      {/* Feature Labels */}
      <div className="feature-labels">
        <div className="feature-label" style={{ top: '20px', right: '20px' }}>
          <span className="label-tag">Context-Aware AI</span>
          <span className="label-arrow">↗</span>
        </div>
        <div className="feature-label" style={{ bottom: '100px', left: '20px' }}>
          <span className="label-tag">Quick Labs Dock</span>
          <span className="label-arrow">↙</span>
        </div>
        <div className="feature-label" style={{ bottom: '20px', right: '20px' }}>
          <span className="label-tag">Always-On AI Chat</span>
          <span className="label-arrow">↘</span>
        </div>
      </div>
    </div>
  );
}

export default CommandCenterMockup;

