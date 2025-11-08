import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { errorLogger } from './services/errors/errorLogger';
import { consoleInterceptor } from './services/errors/consoleInterceptor';
import './styles/index.css';

// Initialize error capture system
console.log('🔍 Error Capture System: Initializing...');

// Activate console interceptor
consoleInterceptor.activate();

// Global error handler
window.onerror = (message, source, lineno, colno, error) => {
  errorLogger.logError(
    'runtime',
    typeof message === 'string' ? message : 'Unknown error',
    'error',
    {
      stack: error?.stack,
      name: error?.name,
      url: source,
      componentStack: `at line ${lineno}:${colno}`,
    }
  );
  
  // Return false to let the error propagate to default handler
  return false;
};

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason;
  
  errorLogger.logError(
    'runtime',
    error?.message || String(event.reason),
    'error',
    {
      stack: error?.stack,
      name: error?.name || 'UnhandledPromiseRejection',
    }
  );
});

// Resource loading errors
window.addEventListener('error', (event) => {
  if (event.target !== window) {
    const target = event.target as HTMLElement;
    const tagName = target.tagName?.toLowerCase();
    
    if (tagName === 'img' || tagName === 'script' || tagName === 'link') {
      errorLogger.logError(
        'network',
        `Failed to load resource: ${tagName}`,
        'warning',
        {
          url: (target as any).src || (target as any).href,
        }
      );
    }
  }
}, true);

console.log('✅ Error Capture System: Active');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

