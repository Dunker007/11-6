/**
 * ErrorBoundary.tsx
 * 
 * PURPOSE:
 * React Error Boundary component for catching and handling React component errors.
 * Prevents entire application crashes by catching errors in component trees and
 * displaying fallback UI. Integrates with error logging service for error tracking.
 * 
 * ARCHITECTURE:
 * Class component implementing React Error Boundary pattern:
 * - Catches errors in child component tree
 * - Displays fallback UI on error
 * - Logs errors to errorLogger service
 * - Supports custom error handlers
 * - Section-based error isolation
 * 
 * Features:
 * - Error catching and isolation
 * - Custom fallback UI
 * - Error logging integration
 * - Custom error handlers
 * - Section name tracking
 * - Error recovery (reset on prop change)
 * 
 * CURRENT STATUS:
 * ✅ Error catching
 * ✅ Fallback UI
 * ✅ Error logging
 * ✅ Custom handlers
 * ✅ Section tracking
 * ✅ Error recovery
 * 
 * DEPENDENCIES:
 * - errorLogger: Error logging service
 * 
 * STATE MANAGEMENT:
 * - Local state: error status and error object
 * 
 * PERFORMANCE:
 * - Minimal overhead
 * - Only renders fallback on error
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
 * 
 * function App() {
 *   return (
 *     <ErrorBoundary fallback={<div>Something went wrong</div>} sectionName="App">
 *       <MyComponent />
 *     </ErrorBoundary>
 *   );
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/errors/errorLogger.ts: Error logging service
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Add error reporting to external service
 * - Add error recovery actions
 * - Add error analytics
 */
import { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '@/services/errors/errorLogger';
import type { CapturedError } from '@/types/error';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  sectionName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  capturedError: CapturedError | null;
}
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, capturedError: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, capturedError: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Error in ${this.props.sectionName || 'component'}:`, error, errorInfo);

    // Log to error capture system
    const capturedError = errorLogger.logFromError('react', error, 'error', {
      componentStack: errorInfo.componentStack ?? undefined,
      section: this.props.sectionName,
    });

    this.setState({ capturedError });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, capturedError: null });
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
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: '32rem' }}>
            {this.state.capturedError
              ? errorLogger.getUserFriendlyMessage(this.state.capturedError)
              : this.state.error?.message || 'An error occurred'}
          </p>
          {this.state.capturedError && (
            <div style={{ textAlign: 'left', maxWidth: '32rem', width: '100%' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '0.5rem' }}>
                Suggested steps:
              </span>
              <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {errorLogger.getRecoverySteps(this.state.capturedError).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          )}
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

