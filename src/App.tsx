import { Component, ErrorInfo, ReactNode } from 'react';
import LLMRevenueCommandCenter from './components/LLMOptimizer/LLMRevenueCommandCenter';
import UpdateNotification from './components/System/UpdateNotification';
import { errorLogger } from './services/errors/errorLogger';
import { useProjectStore } from './services/project/projectStore';
import './services/theme/themeService'; // Initialize theme on import
import './styles/index.css';
import './styles/themes.css';
import './styles/animations.css';

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

  render() {
    if (this.state.hasError) {
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
            gap: '1rem',
          }}
        >
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
            ⚠️ Error Loading Application
          </h1>
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
            <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>
              Error Details
            </summary>
            <pre
              style={{
                background: 'var(--bg-secondary)',
                padding: '1rem',
                borderRadius: '0.5rem',
                overflow: 'auto',
                fontSize: '0.875rem',
              }}
            >
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
  return (
    <ErrorBoundary>
      <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
        <LLMRevenueCommandCenter />
        <UpdateNotification />
      </div>
    </ErrorBoundary>
  );
}

export default App;
