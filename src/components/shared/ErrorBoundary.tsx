import { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '@/services/errors/errorLogger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reusable Error Boundary Component
 * 
 * Catches React errors in child components and displays a fallback UI.
 * Can be used to wrap specific sections for granular error handling.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.sectionName || 'component'}:`, error, errorInfo);

    // Log to error capture system
    errorLogger.logFromError('react', error, 'error', {
      componentStack: errorInfo.componentStack ?? undefined,
      section: this.props.sectionName,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid rgba(255, 82, 82, 0.3)',
            borderRadius: '0.5rem',
            color: 'var(--text-primary)',
            gap: '1rem',
            minHeight: '200px',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            ⚠️ Error in {this.props.sectionName || 'Component'}
          </h3>
          <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
            {this.state.error?.message || 'An error occurred'}
          </p>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--accent-primary)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

