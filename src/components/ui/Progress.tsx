import React from 'react';
import '../../styles/ui/Progress.css';

export interface ProgressProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
  className?: string;
}

/**
 * Linear progress indicator with size, variant, and optional labeling.
 *
 * @param props - Progress value, styling, and labeling options.
 * @returns Accessible progress bar element.
 */
export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'primary',
  showLabel = false,
  label,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayLabel = label || (showLabel ? `${Math.round(percentage)}%` : '');

  const classes = [
    'ui-progress',
    `ui-progress--${size}`,
    `ui-progress--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
      {displayLabel && <div className="ui-progress__label">{displayLabel}</div>}
      <div className="ui-progress__track">
        <div
          className="ui-progress__bar"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

