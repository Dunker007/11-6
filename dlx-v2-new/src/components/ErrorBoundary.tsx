/**
 * Error Boundary
 * Graceful error handling for production
 */

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../services/foundation/logger';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to send this to an error tracking service
    if (import.meta.env.PROD) {
      // Example: Send to Sentry, LogRocket, etc.
      console.error('Production error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-cyber-darker flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-cyber-dark border border-red-500/30 rounded-lg p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-red-400">
                  Something Went Wrong
                </h1>
                <p className="text-gray-400">
                  Don't worry, your data is safe. Try reloading the page.
                </p>
              </div>
            </div>

            {this.state.error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <h3 className="font-semibold text-red-400 mb-2">Error Details:</h3>
                <p className="text-sm text-red-300 font-mono mb-2">
                  {this.state.error.message}
                </p>

                {import.meta.env.DEV && this.state.error.stack && (
                  <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-400 mb-2">
                      Stack Trace
                    </summary>
                    <pre className="overflow-x-auto whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-6 py-3 bg-cyber-primary text-cyber-darker font-bold rounded-lg hover:bg-cyber-primary/90 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-6 py-3 bg-cyber-dark border border-cyber-primary/30 rounded-lg hover:border-cyber-primary/50 transition-colors"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> If this keeps happening, try clearing your browser data or check the browser console for more details.
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
