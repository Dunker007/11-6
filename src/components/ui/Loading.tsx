import React, { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import '../../styles/ui/Loading.css';

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse';
  text?: string;
  fullScreen?: boolean;
  children?: ReactNode;
}

/**
 * Flexible loading indicator supporting spinner, dots, and pulse variants with optional text.
 *
 * @param props - Loading configuration including variant, size, and layout options.
 * @returns Loading indicator element or fullscreen overlay.
 */
export const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  children,
}) => {
  const sizeClasses = {
    sm: 'ui-loading--sm',
    md: 'ui-loading--md',
    lg: 'ui-loading--lg',
  };

  const variantClasses = {
    spinner: 'ui-loading--spinner',
    dots: 'ui-loading--dots',
    pulse: 'ui-loading--pulse',
  };

  const classes = [
    'ui-loading',
    sizeClasses[size],
    variantClasses[variant],
    fullScreen && 'ui-loading--full-screen',
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <div className={classes}>
      {variant === 'spinner' && (
        <Loader2 className="ui-loading__spinner" size={size === 'sm' ? 20 : size === 'lg' ? 32 : 24} />
      )}
      {variant === 'dots' && (
        <div className="ui-loading__dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      )}
      {variant === 'pulse' && <div className="ui-loading__pulse" />}
      {text && <div className="ui-loading__text">{text}</div>}
      {children}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="ui-loading-overlay">
        {content}
      </div>
    );
  }

  return content;
};

/**
 * Skeleton placeholder block for loading states.
 *
 * @param props - Width, height, and class overrides for the skeleton.
 * @returns Skeleton div with animated shimmer.
 */
export const LoadingSkeleton: React.FC<{
  width?: string;
  height?: string;
  className?: string;
}> = ({ width = '100%', height = '1rem', className = '' }) => {
  return (
    <div
      className={`ui-loading-skeleton ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

