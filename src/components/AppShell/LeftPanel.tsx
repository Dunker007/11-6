import '../../styles/LeftPanel.css';
import '../../styles/Modal.css';
import { useState, useCallback, useMemo, useEffect } from 'react';
import APIKeyManager from '../APIKeyManager/APIKeyManager';
import DevToolsManager from '../DevTools/DevToolsManager';
import GitHubPanel from '../GitHub/GitHubPanel';
import MonitorLayoutManager from '../MonitorLayout/MonitorLayoutManager';
import ByteBotPanel from '../Automation/ByteBotPanel';
import BackOffice from '../BackOffice/BackOffice';
import MindMap from '../QuickLabs/MindMap';
import CodeReview from '../QuickLabs/CodeReview';
import AgentForge from '../QuickLabs/AgentForge';
import Creator from '../QuickLabs/Creator';
import LayoutPlayground from '../LayoutPlayground/LayoutPlayground';
import ProgramRunner from '../ProgramRunner/ProgramRunner';
import ErrorConsole from '../ErrorConsole/ErrorConsole';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import { errorLogger } from '../../services/errors/errorLogger';
import { errorConsoleShortcut } from '../../services/errors/errorConsoleShortcut';
import { AlertCircle } from 'lucide-react';

interface LeftPanelProps {
  activeWorkflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize';
  onWorkflowChange: (workflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize') => void;
  handlersRef?: React.MutableRefObject<{
    onOpenAPIKeys: () => void;
    onOpenDevTools: () => void;
    onOpenGitHub: () => void;
    onOpenMonitorLayouts: () => void;
    onOpenByteBot: () => void;
    onOpenBackOffice: () => void;
    onOpenMindMap: () => void;
    onOpenCodeReview: () => void;
    onOpenAgentForge: () => void;
    onOpenCreator: () => void;
  } | null>;
}

const WORKFLOWS = [
  { id: 'create' as const, name: 'Create', iconName: 'create' as const },
  { id: 'build' as const, name: 'Build', iconName: 'build' as const },
  { id: 'deploy' as const, name: 'Deploy', iconName: 'deploy' as const },
  { id: 'monitor' as const, name: 'Monitor', iconName: 'monitor' as const },
  { id: 'monetize' as const, name: 'Monetize', iconName: 'monetize' as const },
] as const;

function LeftPanel({ activeWorkflow, onWorkflowChange, handlersRef }: LeftPanelProps) {
  const [showAPIKeyManager, setShowAPIKeyManager] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [showMonitorLayouts, setShowMonitorLayouts] = useState(false);
  const [showByteBot, setShowByteBot] = useState(false);
  const [showBackOffice, setShowBackOffice] = useState(false);
  const [showLayoutPlayground, setShowLayoutPlayground] = useState(false);
  const [showProgramRunner, setShowProgramRunner] = useState(false);
  const [showErrorConsole, setShowErrorConsole] = useState(false);
  const [activeQuickLab, setActiveQuickLab] = useState<'mindmap' | 'codereview' | 'agentforge' | 'creator' | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [hasNewErrors, setHasNewErrors] = useState(false);

  // Subscribe to error updates
  useEffect(() => {
    const updateErrorCount = () => {
      const stats = errorLogger.getStats();
      const newCount = stats.bySeverity.critical + stats.bySeverity.error;
      if (newCount > errorCount) {
        setHasNewErrors(true);
        setTimeout(() => setHasNewErrors(false), 5000); // Clear pulse after 5s
      }
      setErrorCount(newCount);
    };

    updateErrorCount();
    const unsubscribe = errorLogger.subscribe(updateErrorCount);
    return unsubscribe;
  }, []);

  // Activate keyboard shortcut for error console
  useEffect(() => {
    errorConsoleShortcut.activate(() => setShowErrorConsole(prev => !prev));
    return () => errorConsoleShortcut.deactivate();
  }, []);

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
    openLayoutPlayground: () => setShowLayoutPlayground(true),
    closeLayoutPlayground: () => setShowLayoutPlayground(false),
    openProgramRunner: () => setShowProgramRunner(true),
    closeProgramRunner: () => setShowProgramRunner(false),
  }), []);

  // Expose handlers for command palette
  useEffect(() => {
    if (handlersRef) {
      handlersRef.current = {
        onOpenAPIKeys: modalHandlers.openAPIKeyManager,
        onOpenDevTools: modalHandlers.openDevTools,
        onOpenGitHub: modalHandlers.openGitHub,
        onOpenMonitorLayouts: modalHandlers.openMonitorLayouts,
        onOpenByteBot: modalHandlers.openByteBot,
        onOpenBackOffice: modalHandlers.openBackOffice,
        onOpenMindMap: () => setActiveQuickLab('mindmap'),
        onOpenCodeReview: () => setActiveQuickLab('codereview'),
        onOpenAgentForge: () => setActiveQuickLab('agentforge'),
        onOpenCreator: () => setActiveQuickLab('creator'),
      };
    }
  }, [handlersRef, modalHandlers]);

  const handleQuickLabClick = useCallback((lab: 'mindmap' | 'codereview' | 'agentforge' | 'creator') => {
    setActiveQuickLab(lab === activeQuickLab ? null : lab);
  }, [activeQuickLab]);

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
              <TechIcon 
                icon={ICON_MAP[workflow.iconName]}
                size={18}
                variant="default"
                glow="cyan"
                active={activeWorkflow === workflow.id}
                className="workflow-icon"
              />
              <span className="workflow-name">{workflow.name}</span>
            </button>
          ))}
        </nav>

        <div className="quick-labs">
          <div className="nav-label">Quick Labs</div>
          <div className="labs-grid">
            <button
              className={`lab-item ${activeQuickLab === 'mindmap' ? 'active' : ''}`}
              onClick={() => handleQuickLabClick('mindmap')}
            >
              <TechIcon icon={ICON_MAP.mindmap} size={14} glow="violet" />
              <span>Mind Map</span>
            </button>
            <button
              className={`lab-item ${activeQuickLab === 'codereview' ? 'active' : ''}`}
              onClick={() => handleQuickLabClick('codereview')}
            >
              <TechIcon icon={ICON_MAP.codereview} size={14} glow="violet" />
              <span>Code Review</span>
            </button>
            <button
              className={`lab-item ${activeQuickLab === 'agentforge' ? 'active' : ''}`}
              onClick={() => handleQuickLabClick('agentforge')}
            >
              <TechIcon icon={ICON_MAP.agentforge} size={14} glow="violet" />
              <span>Agent Forge</span>
            </button>
            <button
              className={`lab-item ${activeQuickLab === 'creator' ? 'active' : ''}`}
              onClick={() => handleQuickLabClick('creator')}
            >
              <TechIcon icon={ICON_MAP.creator} size={14} glow="violet" />
              <span>Creator</span>
            </button>
          </div>
        </div>

        <div className="command-palette-trigger">
          <TechIcon icon={ICON_MAP.commandPalette} size={16} glow="cyan" />
          <button className="cmd-k-button">
            <span>⌘</span>
            <span>K</span>
          </button>
          <span className="cmd-k-label">Command</span>
        </div>

        <div className="settings-section">
          <button 
            className="settings-button"
            onClick={modalHandlers.openAPIKeyManager}
          >
            <TechIcon icon={ICON_MAP.apikeys} size={16} glow="cyan" />
            <span>API Keys</span>
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openDevTools}
          >
            <TechIcon icon={ICON_MAP.devtools} size={16} glow="cyan" />
            <span>Dev Tools</span>
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openGitHub}
          >
            <TechIcon icon={ICON_MAP.github} size={16} glow="cyan" />
            <span>GitHub</span>
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openMonitorLayouts}
          >
            <TechIcon icon={ICON_MAP.monitors} size={16} glow="cyan" />
            <span>Monitors</span>
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openByteBot}
          >
            <TechIcon icon={ICON_MAP.bytebot} size={16} glow="cyan" />
            <span>ByteBot</span>
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openBackOffice}
          >
            <TechIcon icon={ICON_MAP.backoffice} size={16} glow="cyan" />
            <span>Back Office</span>
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openLayoutPlayground}
          >
            <TechIcon icon={ICON_MAP.layoutPlayground} size={16} glow="violet" />
            <span>Layout Playground</span>
          </button>
          <button 
            className="settings-button"
            onClick={modalHandlers.openProgramRunner}
          >
            <TechIcon icon={ICON_MAP.programRunner} size={16} glow="cyan" />
            <span>Program Runner</span>
          </button>
        </div>

        {/* Error Console Badge */}
        <div className="error-badge-container">
          <button
            className={`error-badge-btn ${hasNewErrors ? 'pulse' : ''}`}
            onClick={() => setShowErrorConsole(true)}
            title="Error Console"
          >
            <TechIcon 
              icon={AlertCircle}
              size={20}
              variant="default"
              glow={errorCount > 0 ? 'red' : undefined}
            />
            {errorCount > 0 && (
              <span className="error-badge-count">{errorCount}</span>
            )}
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

      {activeQuickLab && (
        <div className="modal-overlay" onClick={() => setActiveQuickLab(null)}>
          <div className="modal-content quicklab-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {activeQuickLab === 'mindmap' && 'Mind Map'}
                {activeQuickLab === 'codereview' && 'Code Review'}
                {activeQuickLab === 'agentforge' && 'Agent Forge'}
                {activeQuickLab === 'creator' && 'Creator'}
              </h2>
              <button className="modal-close" onClick={() => setActiveQuickLab(null)}>×</button>
            </div>
            <div className="quicklab-content">
              {activeQuickLab === 'mindmap' && <MindMap />}
              {activeQuickLab === 'codereview' && <CodeReview />}
              {activeQuickLab === 'agentforge' && <AgentForge />}
              {activeQuickLab === 'creator' && <Creator />}
            </div>
          </div>
        </div>
      )}

          {showLayoutPlayground && (
            <div className="modal-overlay" onClick={modalHandlers.closeLayoutPlayground}>
              <div className="modal-content layout-playground-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Layout Playground</h2>
                  <button className="modal-close" onClick={modalHandlers.closeLayoutPlayground}>×</button>
                </div>
                <div className="layout-playground-content">
                  <LayoutPlayground />
                </div>
              </div>
            </div>
          )}

          {showProgramRunner && (
            <div className="modal-overlay" onClick={modalHandlers.closeProgramRunner}>
              <div className="modal-content program-runner-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Program Runner</h2>
                  <button className="modal-close" onClick={modalHandlers.closeProgramRunner}>×</button>
                </div>
                <div className="program-runner-content">
                  <ProgramRunner />
                </div>
              </div>
            </div>
          )}

          {/* Error Console */}
          <ErrorConsole 
            isOpen={showErrorConsole}
            onClose={() => setShowErrorConsole(false)}
          />
    </>
  );
}

export default LeftPanel;

