import { Component, ErrorInfo, ReactNode } from 'react';
import LLMRevenueCommandCenter from './components/LLMOptimizer/LLMRevenueCommandCenter';
import UpdateNotification from './components/System/UpdateNotification';
import WindowControls from './components/System/WindowControls';
import ItorToolbar from './components/Agents/ItorToolbar';
import { ToastProvider } from './components/ui';
import { errorLogger } from './services/errors/errorLogger';
import { useProjectStore } from './services/project/projectStore';
import './services/theme/themeService'; // Initialize theme on import
import './styles/index.css';
import './styles/themes.css';
import './styles/animations.css';
import './styles/WindowControls.css';
import './styles/Agents.css';

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
      activeFile:
        useProjectStore.getState().activeProject?.activeFile ?? undefined,
    });
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
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '2rem',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            gap: '1.5rem',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            ⚠️ Application Error
          </h1>
          <p style={{ marginBottom: '0.5rem', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '600px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          
          {suggestions.length > 0 && (
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              maxWidth: '600px',
              width: '100%'
            }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                Recovery Suggestions:
              </h3>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--text-secondary)' }}>
                {suggestions.map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem' }}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--accent-primary)',
                border: 'none',
                borderRadius: '0.5rem',
                color: 'white',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🔄 Try Again
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
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              🔃 Reload Application
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid rgba(255, 82, 82, 0.3)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 82, 82, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 82, 82, 0.3)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              🔄 Reset Application
            </button>
            <button
              onClick={this.handleReport}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--panel-border)',
                borderRadius: '0.5rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              📋 Report Error
            </button>
          </div>
          <details style={{ marginTop: '1rem', maxWidth: '800px', width: '100%' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
              Error Details
            </summary>
            <pre
              style={{
                background: 'var(--bg-secondary)',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                maxHeight: '400px',
              }}
            >
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
  return (
    <ToastProvider>
      <ErrorBoundary>
        <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative', background: 'var(--bg-primary-gradient)' }}>
          <div className="title-bar-draggable">
            <WindowControls />
          </div>
          <ItorToolbar />
          <LLMRevenueCommandCenter />
          <UpdateNotification />
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
