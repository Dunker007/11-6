/**
 * App.tsx
 * 
 * PURPOSE:
 * Root application component with error boundary and global UI elements. Provides error
 * handling, update notifications, window controls, and floating agent widgets. Initializes
 * theme service and sets up global error handling.
 * 
 * ARCHITECTURE:
 * Root component that:
 * - Wraps app in error boundary
 * - Displays main content (LLMRevenueCommandCenter)
 * - Shows update notifications
 * - Provides window controls
 * - Renders floating agent widgets (ItorToolbar, InsightsStream)
 * - Initializes theme service
 * - Sets up global error logging
 * 
 * CURRENT STATUS:
 * ✅ Error boundary implementation
 * ✅ Error logging integration
 * ✅ Update notification system
 * ✅ Window controls
 * ✅ Floating agent widgets
 * ✅ Theme initialization
 * ✅ Toast provider
 * 
 * DEPENDENCIES:
 * - errorLogger: Error capture system
 * - useProjectStore: Project state for error context
 * - themeService: Theme initialization
 * - Sub-components: LLMRevenueCommandCenter, UpdateNotification, WindowControls, etc.
 * 
 * STATE MANAGEMENT:
 * - Error boundary state: error, errorCount
 * - Uses Zustand stores via hooks
 * 
 * PERFORMANCE:
 * - Error boundary prevents crashes
 * - Efficient error logging
 * - Lazy component loading
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * // This is the root component, imported in main.tsx
 * import App from './App';
 * 
 * ReactDOM.render(<App />, document.getElementById('root'));
 * ```
 * 
 * RELATED FILES:
 * - src/main.tsx: Application entry point
 * - src/services/errors/errorLogger.ts: Error logging
 * - src/services/theme/themeService.ts: Theme management
 * - src/components/LLMOptimizer/LLMRevenueCommandCenter.tsx: Main content
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Error recovery strategies
 * - Error reporting to external services
 * - Performance monitoring
 * - Analytics integration
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import * as React from 'react';
import LLMRevenueCommandCenter from './components/LLMOptimizer/LLMRevenueCommandCenter';
import UpdateNotification from './components/System/UpdateNotification';
import WindowControls from './components/System/WindowControls';
import ItorToolbar from './components/Agents/ItorToolbar';
import InsightsStream from './components/Agents/InsightsStream';
import KeyboardShortcutsHelp from './components/ui/KeyboardShortcutsHelp';
import { ToastProvider } from './components/ui';
import { errorLogger } from './services/errors/errorLogger';
import { useProjectStore } from './services/project/projectStore';
import './services/theme/themeService'; // Initialize theme on import
import './styles/index.css';
import './styles/themes.css';
import './styles/themes-clean.css'; // Clean modern theme
import './styles/animations.css';
import './styles/App.css'; // App-specific styles
import './styles/WindowControls.css';
import './styles/Agents.css';
import './styles/InsightsStream.css';

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

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Log to error capture system
    errorLogger.logFromError('react', error, 'critical', {
      componentStack: errorInfo.componentStack ?? undefined,
      activeFile: useProjectStore.getState().activeFile ?? undefined,
    });

    // Increment error count to track consecutive errors
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }));
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: this.state.errorCount + 1,
    });
  };

  handleReset = () => {
    // Clear localStorage and reload
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error('Failed to reset application:', error);
      window.location.reload();
    }
  };

  handleReport = () => {
    // Copy error details to clipboard
    const errorDetails = {
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      errorCount: this.state.errorCount,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    };

    const errorText = `Error Report\n\n${JSON.stringify(errorDetails, null, 2)}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(errorText).then(() => {
        alert('Error details copied to clipboard. Please report this issue.');
      }).catch(() => {
        // Fallback: show in alert
        alert(`Error details:\n\n${errorText}`);
      });
    } else {
      // Fallback: show in alert
      alert(`Error details:\n\n${errorText}`);
    }
  };

  getRecoverySuggestions = (): string[] => {
    const suggestions: string[] = [];
    
    if (this.state.errorCount > 2) {
      suggestions.push('Multiple retries failed. Try resetting the application.');
    }
    
    if (this.state.error?.message?.includes('network') || this.state.error?.message?.includes('fetch')) {
      suggestions.push('Check your internet connection and try again.');
    }
    
    if (this.state.error?.message?.includes('memory') || this.state.error?.message?.includes('out of memory')) {
      suggestions.push('Close other applications to free up memory.');
    }
    
    if (this.state.error?.message?.includes('module') || this.state.error?.message?.includes('import')) {
      suggestions.push('Try reloading the application to refresh module cache.');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Try reloading the application.');
      suggestions.push('If the problem persists, reset the application (clears local data).');
    }
    
    return suggestions;
  };

  render() {
    if (this.state.hasError) {
      const suggestions = this.getRecoverySuggestions();
      
      return (
        <div className="error-boundary-container">
          <h1 className="error-boundary-title">
            ⚠️ Application Error
          </h1>
          <p className="error-boundary-message">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          
          {suggestions.length > 0 && (
            <div className="error-boundary-suggestions">
              <h3>Recovery Suggestions:</h3>
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="error-boundary-actions">
            <button
              onClick={this.handleRetry}
              className="error-boundary-button error-boundary-button--primary"
            >
              🔄 Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="error-boundary-button error-boundary-button--secondary"
            >
              🔃 Reload Application
            </button>
            <button
              onClick={this.handleReset}
              className="error-boundary-button error-boundary-button--danger"
            >
              🔄 Reset Application
            </button>
            <button
              onClick={this.handleReport}
              className="error-boundary-button error-boundary-button--secondary"
            >
              📋 Report Error
            </button>
          </div>
          <details className="error-boundary-details">
            <summary>Error Details</summary>
            <pre className="error-boundary-stack">
              {this.state.error?.stack || this.state.error?.message || 'No error details available'}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [showInsights, setShowInsights] = React.useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = React.useState(false);

  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl+Shift+I to toggle insights stream
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        setShowInsights(prev => !prev);
      }

      // ? to show keyboard shortcuts (only when not typing)
      if (!isTyping && e.key === '?' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowKeyboardHelp(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="app-root">
          <div className="title-bar-draggable">
            <WindowControls />
          </div>
          <ItorToolbar />
          <LLMRevenueCommandCenter />
          <UpdateNotification />
          {showInsights && (
            <div className="app-insights-overlay">
              <InsightsStream
                maxHeight="500px"
                showHeader={true}
                onClose={() => setShowInsights(false)}
              />
            </div>
          )}
          <KeyboardShortcutsHelp
            isOpen={showKeyboardHelp}
            onClose={() => setShowKeyboardHelp(false)}
          />
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
