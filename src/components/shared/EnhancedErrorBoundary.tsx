/**
 * Enhanced Error Boundary
 * Provides better error recovery UI with contextual help and actions
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug, Info, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui';
import '@/styles/ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'app' | 'feature' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorId: string | null;
  copied: boolean;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      copied: false,
    });
    this.props.onReset?.();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = async () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = `
Error ID: ${errorId}
Timestamp: ${new Date().toISOString()}
Message: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorReport);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  getErrorSuggestions = (): string[] => {
    const { error } = this.state;
    const { level = 'component' } = this.props;
    const suggestions: string[] = [];

    if (!error) return suggestions;

    const errorMessage = error.message.toLowerCase();

    // Network errors
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
      suggestions.push('Check your internet connection');
      suggestions.push('Try refreshing the page');
      suggestions.push('The server might be temporarily unavailable');
    }

    // Type errors
    if (errorMessage.includes('undefined') || errorMessage.includes('null')) {
      suggestions.push('Some data might not have loaded yet');
      suggestions.push('Try refreshing to reload all data');
    }

    // Permission errors
    if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
      suggestions.push('Check your permissions in browser settings');
      suggestions.push('Some features require specific permissions');
    }

    // Storage errors
    if (errorMessage.includes('storage') || errorMessage.includes('quota')) {
      suggestions.push('Clear your browser cache and cookies');
      suggestions.push('Free up some disk space');
    }

    // Default suggestions based on level
    if (suggestions.length === 0) {
      if (level === 'app') {
        suggestions.push('Reload the application to reset state');
        suggestions.push('Clear browser cache if problem persists');
        suggestions.push('Check the browser console for more details');
      } else if (level === 'feature') {
        suggestions.push('Try navigating away and back');
        suggestions.push('Refresh the page to reset this feature');
      } else {
        suggestions.push('This component encountered an error');
        suggestions.push('Try refreshing or going back');
      }
    }

    return suggestions;
  };

  render() {
    const { hasError, error, errorId, copied } = this.state;
    const { children, fallback, level = 'component' } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const suggestions = this.getErrorSuggestions();
      const isAppLevel = level === 'app';

      return (
        <div className="enhanced-error-boundary">
          <div className="error-boundary-content">
            {/* Error Icon */}
            <div className="error-icon">
              <AlertTriangle size={64} />
            </div>

            {/* Error Title */}
            <h1 className="error-title">
              {isAppLevel ? 'Application Error' : 'Something went wrong'}
            </h1>

            {/* Error Message */}
            <p className="error-message">
              {error?.message || 'An unexpected error occurred'}
            </p>

            {/* Error ID */}
            {errorId && (
              <div className="error-id">
                <Info size={14} />
                <span>Error ID: {errorId}</span>
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="error-suggestions">
                <h3>What you can try:</h3>
                <ul>
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Actions */}
            <div className="error-actions">
              {!isAppLevel && (
                <Button
                  variant="primary"
                  leftIcon={<RefreshCw size={18} />}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
              )}

              {isAppLevel && (
                <Button
                  variant="primary"
                  leftIcon={<RefreshCw size={18} />}
                  onClick={this.handleReload}
                >
                  Reload App
                </Button>
              )}

              {!isAppLevel && (
                <Button
                  variant="secondary"
                  leftIcon={<Home size={18} />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>
              )}

              <Button
                variant="ghost"
                leftIcon={copied ? <Check size={18} /> : <Copy size={18} />}
                onClick={this.handleCopyError}
                disabled={copied}
              >
                {copied ? 'Copied!' : 'Copy Error Details'}
              </Button>
            </div>

            {/* Developer Details (collapsed) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="error-details">
                <summary>
                  <Bug size={16} />
                  Developer Details
                </summary>
                <div className="error-stack">
                  <pre>{error.stack}</pre>
                  {this.state.errorInfo && (
                    <>
                      <h4>Component Stack:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

// Functional wrapper with hooks for easier use
interface ErrorBoundaryProps {
  children: ReactNode;
  level?: 'app' | 'feature' | 'component';
  fallback?: ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({
  children,
  level = 'component',
  fallback,
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // You can integrate with error logging service here
    console.error('[ErrorBoundary] Error caught:', {
      error,
      errorInfo,
      level,
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <EnhancedErrorBoundary
      level={level}
      fallback={fallback}
      onError={handleError}
    >
      {children}
    </EnhancedErrorBoundary>
  );
};

export default ErrorBoundary;

