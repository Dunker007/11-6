import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from '@/components/Icons/icons';
import '../../styles/ui/Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  holographic?: boolean; // New prop: Enable holographic styling
  glowColor?: 'cyan' | 'magenta' | 'amber' | 'violet'; // New prop: Glow color for holographic mode
}

/**
 * Styled text input with optional label, helper text, icons, and validation state.
 *
 * @param props - Input configuration including label, adornments, and aria hints.
 * @param ref - Forwarded ref to the underlying input element.
 * @returns Controlled input element wrapped with UI affordances.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      holographic = false, // Destructure new prop
      glowColor = 'cyan', // Destructure new prop
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const baseClasses = 'ui-input-wrapper';
    const widthClass = fullWidth ? 'ui-input-wrapper--full-width' : '';
    const errorClass = hasError ? 'ui-input-wrapper--error' : '';
    const holographicClass = holographic ? `ui-input-wrapper--holographic ui-input-wrapper--holographic-${glowColor}` : ''; // New class

    const wrapperClasses = [
      baseClasses,
      widthClass,
      errorClass,
      holographicClass, // Add new class
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="ui-input-label">
            {label}
          </label>
        )}
        <div className="ui-input-container">
          {leftIcon && (
            <span className="ui-input-icon ui-input-icon--left" aria-hidden="true">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`ui-input ${leftIcon ? 'ui-input--has-left-icon' : ''} ${rightIcon ? 'ui-input--has-right-icon' : ''}`}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          {rightIcon && (
            <span className="ui-input-icon ui-input-icon--right" aria-hidden="true">
              {rightIcon}
            </span>
          )}
          {hasError && (
            <span className="ui-input-error-icon" aria-hidden="true">
              <AlertCircle size={18} />
            </span>
          )}
        </div>
        {error && (
          <span id={`${inputId}-error`} className="ui-input-error" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={`${inputId}-helper`} className="ui-input-helper">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  holographic?: boolean; // New prop: Enable holographic styling
  glowColor?: 'cyan' | 'magenta' | 'amber' | 'violet'; // New prop: Glow color for holographic mode
}

/**
 * Styled textarea with label, helper text, validation messaging, and resize controls.
 *
 * @param props - Textarea configuration including label, helper text, and resize behaviour.
 * @param ref - Forwarded ref to the textarea element.
 * @returns Controlled textarea element with consistent styling.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = false,
      resize = 'vertical',
      holographic = false, // Destructure new prop
      glowColor = 'cyan', // Destructure new prop
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!error;
    const baseClasses = 'ui-input-wrapper';
    const widthClass = fullWidth ? 'ui-input-wrapper--full-width' : '';
    const errorClass = hasError ? 'ui-input-wrapper--error' : '';
    const holographicClass = holographic ? `ui-input-wrapper--holographic ui-input-wrapper--holographic-${glowColor}` : ''; // New class

    const wrapperClasses = [
      baseClasses,
      widthClass,
      errorClass,
      holographicClass, // Add new class
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={textareaId} className="ui-input-label">
            {label}
          </label>
        )}
        <div className="ui-input-container">
          <textarea
            ref={ref}
            id={textareaId}
            className={`ui-textarea ui-textarea--resize-${resize}`}
            aria-invalid={hasError}
            aria-describedby={
              error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
            }
            {...props}
          />
          {hasError && (
            <span className="ui-input-error-icon" aria-hidden="true">
              <AlertCircle size={18} />
            </span>
          )}
        </div>
        {error && (
          <span id={`${textareaId}-error`} className="ui-input-error" role="alert">
            {error}
          </span>
        )}
        {helperText && !error && (
          <span id={`${textareaId}-helper`} className="ui-input-helper">
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

