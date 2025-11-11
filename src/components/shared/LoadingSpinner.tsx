import { memo } from 'react';
import '../../styles/shared/LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner = memo(function LoadingSpinner({ 
  size = 20, 
  className = '' 
}: LoadingSpinnerProps) {
  return (
    <div 
      className={`loading-spinner ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        border: `2px solid rgba(139, 92, 246, 0.3)`,
        borderTopColor: 'var(--violet-500)',
        borderRadius: '50%',
      }}
      aria-label="Loading"
      role="status"
    />
  );
});

export default LoadingSpinner;

