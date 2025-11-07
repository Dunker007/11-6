import '../../styles/LeftPanel.css';
import '../../styles/Modal.css';
import { useState, useCallback, useMemo } from 'react';
import APIKeyManager from '../APIKeyManager/APIKeyManager';
import DevToolsManager from '../DevTools/DevToolsManager';
import GitHubPanel from '../GitHub/GitHubPanel';
import MonitorLayoutManager from '../MonitorLayout/MonitorLayoutManager';
import ByteBotPanel from '../Automation/ByteBotPanel';
import BackOffice from '../BackOffice/BackOffice';

interface LeftPanelProps {
  activeWorkflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize';
  onWorkflowChange: (workflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize') => void;
}

const WORKFLOWS = [
  { id: 'create' as const, name: 'Create', icon: '💡' },
  { id: 'build' as const, name: 'Build', icon: '⚡' },
  { id: 'deploy' as const, name: 'Deploy', icon: '🚀' },
  { id: 'monitor' as const, name: 'Monitor', icon: '📊' },
  { id: 'monetize' as const, name: 'Monetize', icon: '💰' },
] as const;

function LeftPanel({ activeWorkflow, onWorkflowChange }: LeftPanelProps) {
  const [showAPIKeyManager, setShowAPIKeyManager] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [showMonitorLayouts, setShowMonitorLayouts] = useState(false);
  const [showByteBot, setShowByteBot] = useState(false);
  const [showBackOffice, setShowBackOffice] = useState(false);

  // Memoize modal handlers to prevent unnecessary re-renders
  const modalHandlers = useMemo(() => ({
    openAPIKeyManager: () => setShowAPIKeyManager(true),
    closeAPIKeyManager: () => setShowAPIKeyManager(false),
    openDevTools: () => setShowDevTools(true),
    closeDevTools: () => setShowDevTools(false),
    openGitHub: () => setShowGitHub(true),
    closeGitHub: () => setShowGitHub(false),
    openMonitorLayouts: () => setShowMonitorLayouts(true),
    closeMonitorLayouts: () => setShowMonitorLayouts(false),
    openByteBot: () => setShowByteBot(true),
    closeByteBot: () => setShowByteBot(false),
    openBackOffice: () => setShowBackOffice(true),
    closeBackOffice: () => setShowBackOffice(false),
  }), []);

  const handleWorkflowClick = useCallback((workflowId: typeof WORKFLOWS[number]['id']) => {
    onWorkflowChange(workflowId);
  }, [onWorkflowChange]);

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
          {WORKFLOWS.map((workflow) => (
            <button
              key={workflow.id}
              className={`workflow-item ${activeWorkflow === workflow.id ? 'active' : ''}`}
              onClick={() => handleWorkflowClick(workflow.id)}
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
            onClick={modalHandlers.openAPIKeyManager}
          >
            ⚙️ API Keys
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openDevTools}
          >
            🔧 Dev Tools
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openGitHub}
          >
            🐙 GitHub
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openMonitorLayouts}
          >
            🖥️ Monitors
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openByteBot}
          >
            🤖 ByteBot
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openBackOffice}
          >
            📊 Back Office
          </button>
        </div>
      </div>

      {showAPIKeyManager && (
        <APIKeyManager onClose={modalHandlers.closeAPIKeyManager} />
      )}

      {showDevTools && (
        <div className="modal-overlay" onClick={modalHandlers.closeDevTools}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Dev Tools Manager</h2>
              <button className="modal-close" onClick={modalHandlers.closeDevTools}>×</button>
            </div>
            <DevToolsManager />
          </div>
        </div>
      )}

      {showGitHub && (
        <div className="modal-overlay" onClick={modalHandlers.closeGitHub}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>GitHub</h2>
              <button className="modal-close" onClick={modalHandlers.closeGitHub}>×</button>
            </div>
            <GitHubPanel />
          </div>
        </div>
      )}

      {showMonitorLayouts && (
        <div className="modal-overlay" onClick={modalHandlers.closeMonitorLayouts}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Monitor Layouts</h2>
              <button className="modal-close" onClick={modalHandlers.closeMonitorLayouts}>×</button>
            </div>
            <MonitorLayoutManager />
          </div>
        </div>
      )}

      {showByteBot && (
        <div className="modal-overlay" onClick={modalHandlers.closeByteBot}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ByteBot Automation</h2>
              <button className="modal-close" onClick={modalHandlers.closeByteBot}>×</button>
            </div>
            <ByteBotPanel />
          </div>
        </div>
      )}

      {showBackOffice && (
        <div className="modal-overlay" onClick={modalHandlers.closeBackOffice}>
          <div className="modal-content back-office-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Back Office</h2>
              <button className="modal-close" onClick={modalHandlers.closeBackOffice}>×</button>
            </div>
            <BackOffice />
          </div>
        </div>
      )}
    </>
  );
}

export default LeftPanel;

