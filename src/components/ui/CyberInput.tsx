import React, { InputHTMLAttributes, forwardRef } from 'react';
import './CyberInput.css';

export interface CyberInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glowEffect?: boolean;
  fullWidth?: boolean;
}

export const CyberInput = forwardRef<HTMLInputElement, CyberInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      glowEffect = true,
      fullWidth = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const containerClasses = [
      'cyber-input-container',
      fullWidth && 'cyber-input-container--full-width',
      error && 'cyber-input-container--error',
    ]
      .filter(Boolean)
      .join(' ');

    const inputClasses = [
      'cyber-input',
      glowEffect && 'cyber-input--glow',
      leftIcon && 'cyber-input--has-left-icon',
      rightIcon && 'cyber-input--has-right-icon',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label className="cyber-input-label" htmlFor={props.id}>
            {label}
          </label>
        )}

        <div className="cyber-input-wrapper">
          {leftIcon && (
            <span className="cyber-input-icon cyber-input-icon--left">
              {leftIcon}
            </span>
          )}

          <input ref={ref} className={inputClasses} {...props} />

          {rightIcon && (
            <span className="cyber-input-icon cyber-input-icon--right">
              {rightIcon}
            </span>
          )}

          <span className="cyber-input-border"></span>
        </div>

        {error && <p className="cyber-input-error">{error}</p>}
        {!error && helperText && (
          <p className="cyber-input-helper">{helperText}</p>
        )}
      </div>
    );
  }
);

CyberInput.displayName = 'CyberInput';

export default CyberInput;
