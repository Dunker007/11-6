import '../../styles/LeftPanel.css';
import '../../styles/Modal.css';
import { useState } from 'react';
import APIKeyManager from '../APIKeyManager/APIKeyManager';
import DevToolsManager from '../DevTools/DevToolsManager';
import GitHubPanel from '../GitHub/GitHubPanel';
import MonitorLayoutManager from '../MonitorLayout/MonitorLayoutManager';
import ByteBotPanel from '../Automation/ByteBotPanel';

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
  const [showDevTools, setShowDevTools] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [showMonitorLayouts, setShowMonitorLayouts] = useState(false);
  const [showByteBot, setShowByteBot] = useState(false);

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
          <button 
            className="settings-button"
            onClick={() => setShowDevTools(true)}
          >
            🔧 Dev Tools
          </button>
          <button 
            className="settings-button"
            onClick={() => setShowGitHub(true)}
          >
            🐙 GitHub
          </button>
          <button 
            className="settings-button"
            onClick={() => setShowMonitorLayouts(true)}
          >
            🖥️ Monitors
          </button>
          <button 
            className="settings-button"
            onClick={() => setShowByteBot(true)}
          >
            🤖 ByteBot
          </button>
        </div>
      </div>

      {showAPIKeyManager && (
        <APIKeyManager onClose={() => setShowAPIKeyManager(false)} />
      )}

      {showDevTools && (
        <div className="modal-overlay" onClick={() => setShowDevTools(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Dev Tools Manager</h2>
              <button className="modal-close" onClick={() => setShowDevTools(false)}>×</button>
            </div>
            <DevToolsManager />
          </div>
        </div>
      )}

      {showGitHub && (
        <div className="modal-overlay" onClick={() => setShowGitHub(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>GitHub</h2>
              <button className="modal-close" onClick={() => setShowGitHub(false)}>×</button>
            </div>
            <GitHubPanel />
          </div>
        </div>
      )}

      {showMonitorLayouts && (
        <div className="modal-overlay" onClick={() => setShowMonitorLayouts(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Monitor Layouts</h2>
              <button className="modal-close" onClick={() => setShowMonitorLayouts(false)}>×</button>
            </div>
            <MonitorLayoutManager />
          </div>
        </div>
      )}

      {showByteBot && (
        <div className="modal-overlay" onClick={() => setShowByteBot(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ByteBot Automation</h2>
              <button className="modal-close" onClick={() => setShowByteBot(false)}>×</button>
            </div>
            <ByteBotPanel />
          </div>
        </div>
      )}
    </>
  );
}

export default LeftPanel;

