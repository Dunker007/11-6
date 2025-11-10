import { ButtonHTMLAttributes, forwardRef } from 'react';
import { LucideIcon } from 'lucide-react';
import '../../styles/ui/Button.css';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'ui-button';
    const variantClass = `ui-button--${variant}`;
    const sizeClass = `ui-button--${size}`;
    const widthClass = fullWidth ? 'ui-button--full-width' : '';
    const loadingClass = isLoading ? 'ui-button--loading' : '';
    const disabledClass = disabled || isLoading ? 'ui-button--disabled' : '';

    const classes = [
      baseClasses,
      variantClass,
      sizeClass,
      widthClass,
      loadingClass,
      disabledClass,
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
        {isLoading && (
          <span className="ui-button__spinner" aria-hidden="true">
            <svg
              className="ui-button__spinner-svg"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="ui-button__spinner-circle"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray="32"
                strokeDashoffset="32"
              >
                <animate
                  attributeName="stroke-dasharray"
                  dur="2s"
                  values="0 32;16 16;0 32;0 32"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="stroke-dashoffset"
                  dur="2s"
                  values="0;-16;-32;-32"
                  repeatCount="indefinite"
                />
              </circle>
            </svg>
          </span>
        )}
        {!isLoading && LeftIcon && (
          <LeftIcon className="ui-button__icon ui-button__icon--left" size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
        )}
        {children && <span className="ui-button__content">{children}</span>}
        {!isLoading && RightIcon && (
          <RightIcon className="ui-button__icon ui-button__icon--right" size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

