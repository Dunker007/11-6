import { useState, Component, ErrorInfo, ReactNode, useEffect, useRef } from 'react';
import LeftPanel from './components/AppShell/LeftPanel';
import CenterPanel from './components/AppShell/CenterPanel';
import RightPanel from './components/AppShell/RightPanel';
import CommandPalette from './components/CommandPalette/CommandPalette';
import AIChat from './components/AIChat/AIChat';
import UpdateNotification from './components/UpdateNotification/UpdateNotification';
import AboutDialog from './components/About/AboutDialog';
import { registerCommands } from './services/command/registerCommands';
import './styles/index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

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
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️ Error Loading Application</h1>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
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
            Reload Application
          </button>
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

function App() {
  const [activeWorkflow, setActiveWorkflow] = useState<'create' | 'build' | 'deploy' | 'monitor' | 'monetize'>('build');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [isAIChatMinimized, setIsAIChatMinimized] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const leftPanelHandlersRef = useRef<{
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
  } | null>(null);

  useEffect(() => {
    // Register commands when handlers are available
    const checkAndRegister = () => {
      if (leftPanelHandlersRef.current) {
        registerCommands({
          onWorkflowChange: setActiveWorkflow,
          ...leftPanelHandlersRef.current,
        });
      }
    };
    
    // Check immediately and after a short delay to ensure handlers are set
    checkAndRegister();
    const timeout = setTimeout(checkAndRegister, 100);
    return () => clearTimeout(timeout);
  }, []);

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
      <div style={{ 
        display: 'flex', 
        height: '100vh',
        width: '100vw',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        overflow: 'hidden'
      }}>
        <LeftPanel 
          activeWorkflow={activeWorkflow} 
          onWorkflowChange={setActiveWorkflow}
          handlersRef={leftPanelHandlersRef}
        />
        <CenterPanel activeWorkflow={activeWorkflow} onWorkflowChange={setActiveWorkflow} />
        <RightPanel />
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
      </div>
    </ErrorBoundary>
  );
}

export default App;
