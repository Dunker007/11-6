import { memo, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';
import '../../styles/shared/LoadingState.css';

interface LoadingStateProps {
  message?: string;
  spinnerSize?: number;
  className?: string;
  fullHeight?: boolean;
}

const LoadingState = memo(function LoadingState({ 
  message = 'Loading...',
  spinnerSize = 20,
  className = '',
  fullHeight = true
}: LoadingStateProps) {
  return (
    <div 
      className={`loading-state slide-up-fade ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: fullHeight ? '100%' : 'auto',
        color: 'var(--text-muted)',
        gap: '0.75rem',
      }}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size={spinnerSize} />
      <span>{message}</span>
    </div>
  );
});

export default LoadingState;

