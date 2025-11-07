import '../styles/LeftPanel.css';
import { useState } from 'react';
import APIKeyManager from '../APIKeyManager/APIKeyManager';

interface LeftPanelProps {
  activeWorkflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize';
  onWorkflowChange: (workflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize') => void;
}

const workflows = [
  { id: 'create' as const, name: 'Create', icon: '💡' },
  { id: 'build' as const, name: 'Build', icon: '⚡' },
  { id: 'deploy' as const, name: 'Deploy', icon: '🚀' },
  { id: 'monitor' as const, name: 'Monitor', icon: '📊' },
  { id: 'monetize' as const, name: 'Monetize', icon: '💰' },
];

function LeftPanel({ activeWorkflow, onWorkflowChange }: LeftPanelProps) {
  const [showAPIKeyManager, setShowAPIKeyManager] = useState(false);

  return (
    <>
      <div className="left-panel">
        <div className="panel-header">
          <div className="logo-container">
            <img src="/vibdee-logo.svg" alt="VibDee" className="logo" />
            <span className="app-name">DLX Studios</span>
          </div>
        </div>
        
        <nav className="workflow-nav">
          <div className="nav-label">Workflows</div>
          {workflows.map((workflow) => (
            <button
              key={workflow.id}
              className={`workflow-item ${activeWorkflow === workflow.id ? 'active' : ''}`}
              onClick={() => onWorkflowChange(workflow.id)}
            >
              <span className="workflow-icon">{workflow.icon}</span>
              <span className="workflow-name">{workflow.name}</span>
            </button>
          ))}
        </nav>

        <div className="quick-labs">
          <div className="nav-label">Quick Labs</div>
          <div className="labs-grid">
            <button className="lab-item">🧠 Mind Map</button>
            <button className="lab-item">🔍 Code Review</button>
            <button className="lab-item">🤖 Agent Forge</button>
            <button className="lab-item">📝 Creator</button>
          </div>
        </div>

        <div className="command-palette-trigger">
          <button className="cmd-k-button">
            <span>⌘</span>
            <span>K</span>
          </button>
          <span className="cmd-k-label">Command Palette</span>
        </div>

        <div className="settings-section">
          <button 
            className="settings-button"
            onClick={() => setShowAPIKeyManager(true)}
          >
            ⚙️ API Keys
          </button>
        </div>
      </div>

      {showAPIKeyManager && (
        <APIKeyManager onClose={() => setShowAPIKeyManager(false)} />
      )}
    </>
  );
}

export default LeftPanel;

