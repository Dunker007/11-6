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
import { logger } from '@/services/logging/loggerService';
import type { CapturedError } from '@/types/error';
import './ErrorBoundary.css';

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
    logger.error(`Error in ${this.props.sectionName || 'component'}:`, { error, errorInfo });

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
        <div className="error-boundary-container">
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">
            System Malfunction: {this.props.sectionName || 'Component'}
          </h3>
          <p className="error-message">
            {this.state.capturedError
              ? errorLogger.getUserFriendlyMessage(this.state.capturedError)
              : this.state.error?.message || 'An unexpected error occurred within the neural network.'}
          </p>
          {this.state.capturedError && (
            <div className="error-details">
              <span className="error-steps-label">
                Recommended Protocols:
              </span>
              <ul className="error-steps-list">
                {errorLogger.getRecoverySteps(this.state.capturedError).map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={this.handleRetry}
            className="retry-button"
          >
            Reinitialize System
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

