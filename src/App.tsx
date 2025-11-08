import { useState, Component, ErrorInfo, ReactNode, useEffect, useCallback } from 'react';
import LeftPanel from './components/AppShell/LeftPanel';
import CenterPanel from './components/AppShell/CenterPanel';
import RightPanel from './components/AppShell/RightPanel';
import VibeBar from './components/VibeBar/VibeBar';
import CommandPalette from './components/CommandPalette/CommandPalette';
import AIChat from './components/AIChat/AIChat';
import UpdateNotification from './components/UpdateNotification/UpdateNotification';
import AboutDialog from './components/About/AboutDialog';
import AIOSInterface from './components/AIOS/AIOSInterface';
import NotificationCenter from './components/Notifications/NotificationCenter'; // Import NotificationCenter
import TechIcon from './components/Icons/TechIcon';
import { ICON_MAP } from './components/Icons/IconSet';
import { registerCommands } from './services/command/registerCommands';
import { errorLogger } from './services/errors/errorLogger';
import { errorContext } from './services/errors/errorContext';
import { aiServiceBridge } from './services/ai/aiServiceBridge';
import { useProjectStore } from './services/project/projectStore';
import { registerAllAgents } from './services/agent/registerAgents'; // Import agent registration
import { guardianAgent } from './services/agent/agents/guardian'; // Import Guardian agent
import './services/theme/themeService'; // Initialize theme on import
import './styles/index.css';
import './styles/themes.css';
import './styles/animations.css';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './styles/DesktopWidgets.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to error capture system
    errorLogger.logFromError('react', error, 'critical', {
      componentStack: errorInfo.componentStack ?? undefined,
      activeFile: useProjectStore.getState().activeProject?.activeFile ?? undefined,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorCount: this.state.errorCount + 1 });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '2rem',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          gap: '1rem',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Error Loading Application</h1>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--panel-bg)',
                border: '1px solid var(--panel-border)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            Reload Application
          </button>
          </div>
          <details style={{ marginTop: '2rem', maxWidth: '800px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>Error Details</summary>
            <pre style={{
              background: 'var(--bg-secondary)',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.875rem',
            }}>
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

type AppWorkflow = 'create' | 'build' | 'deploy' | 'monitor' | 'monetize' | 'mission-control';

function App() {
  const [osMode, setOsMode] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<AppWorkflow>('monitor');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isAIChatMinimized, setIsAIChatMinimized] = useState(true);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false); // State for NotificationCenter
  
  const activeProjectRoot = useProjectStore(state => state.activeProjectRoot);

  const registerAppCommands = useCallback((leftPanelHandlers: any) => {
    if (leftPanelHandlers) {
      registerCommands({
        onWorkflowChange: setActiveWorkflow,
        ...leftPanelHandlers,
      });
    }
  }, [setActiveWorkflow]);

  // Register all AI agents on startup
  useEffect(() => {
    registerAllAgents();
    guardianAgent.start();

    return () => {
      guardianAgent.stop();
    };
  }, []);

  // Project Indexing Effect
  useEffect(() => {
    if (activeProjectRoot) {
      console.log('Active project root changed, starting indexing:', activeProjectRoot);
      aiServiceBridge.startIndexing(activeProjectRoot).catch(console.error);
    } else {
      aiServiceBridge.stopIndexing().catch(console.error);
    }

    // Cleanup on component unmount
    return () => {
      aiServiceBridge.stopIndexing().catch(console.error);
    };
  }, [activeProjectRoot]);

  // Update error context when workflow changes
  useEffect(() => {
    errorContext.setWorkflow(activeWorkflow);
  }, [activeWorkflow]);

  useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          // Cmd+K on Mac, Ctrl+K on Windows/Linux
          if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setShowCommandPalette(true);
          }
          // Cmd+Shift+A or Ctrl+Shift+A for AI Chat
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            setIsAIChatMinimized((prev) => !prev);
          }
          // Cmd+Shift+O or Ctrl+Shift+O for OS Mode
          if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'O') {
            e.preventDefault();
            setOsMode((prev) => !prev);
          }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, []);

      // Listen for menu events
      useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).menu) {
          const menu = (window as any).menu;
          
          menu.onAbout(() => {
            setShowAboutDialog(true);
          });

          menu.onShortcuts(() => {
            setShowCommandPalette(true);
          });

          // Listen for update available events
          if ((window as any).updater) {
            const updater = (window as any).updater;
            updater.onAvailable(() => {
              setShowUpdateNotification(true);
            });
            updater.onDownloaded(() => {
              setShowUpdateNotification(true);
            });
          }
        }
      }, []);

  return (
    <ErrorBoundary>
      {osMode ? (
        // AI OS Mode - Full screen takeover
        <AIOSInterface onExit={() => setOsMode(false)} />
      ) : (
        // Regular IDE Mode
        <>
          <div 
            className={`app-shell ${osMode ? 'os-mode' : ''} ${activeWorkflow === 'monitor' ? 'monitor-mode' : ''}`}
          >
            <LeftPanel 
              activeWorkflow={activeWorkflow} 
              onWorkflowChange={setActiveWorkflow}
              onHandlersReady={registerAppCommands}
              onOpenNotifications={() => setShowNotificationCenter(true)} // Pass handler
            />
            <CenterPanel activeWorkflow={activeWorkflow} onWorkflowChange={setActiveWorkflow} />
            <RightPanel />
            <VibeBar />
            <CommandPalette 
              isOpen={showCommandPalette}
              onClose={() => setShowCommandPalette(false)}
            />
            <AIChat 
              isMinimized={isAIChatMinimized}
              onToggleMinimize={() => setIsAIChatMinimized((prev) => !prev)}
            />
            {showUpdateNotification && (
              <UpdateNotification
                onClose={() => setShowUpdateNotification(false)}
              />
            )}
            <AboutDialog
              isOpen={showAboutDialog}
              onClose={() => setShowAboutDialog(false)}
            />
            <NotificationCenter 
              isOpen={showNotificationCenter}
              onClose={() => setShowNotificationCenter(false)}
            />
          </div>

          {/* Floating OS Mode Toggle Button */}
          <button
            className="os-mode-toggle-btn"
            onClick={() => setOsMode(true)}
            title="Enter AI OS Mode (⌘⇧O)"
          >
            <TechIcon 
              icon={ICON_MAP.osMode}
              size={20}
              glow="cyan"
              animated={true}
            />
            <span>OS Mode</span>
          </button>
        </>
      )}
    </ErrorBoundary>
  );
}

export default App;
