import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import './CyberButton.css';

export interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  glowEffect?: boolean;
}

export const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      glowEffect = true,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const classes = [
      'cyber-button',
      `cyber-button--${variant}`,
      `cyber-button--${size}`,
      fullWidth && 'cyber-button--full-width',
      glowEffect && 'cyber-button--glow',
      isLoading && 'cyber-button--loading',
      disabled && 'cyber-button--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        <span className="cyber-button__bg"></span>
        <span className="cyber-button__border"></span>
        <span className="cyber-button__content">
          {isLoading && (
            <span className="cyber-button__spinner">
              <span className="cyber-spinner"></span>
            </span>
          )}
          {!isLoading && leftIcon && (
            <span className="cyber-button__icon cyber-button__icon--left">
              {leftIcon}
            </span>
          )}
          <span className="cyber-button__text">{children}</span>
          {!isLoading && rightIcon && (
            <span className="cyber-button__icon cyber-button__icon--right">
              {rightIcon}
            </span>
          )}
        </span>
        <span className="cyber-button__glow"></span>
      </button>
    );
  }
);

CyberButton.displayName = 'CyberButton';

export default CyberButton;
