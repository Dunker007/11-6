import React, { HTMLAttributes, ReactNode } from 'react';
import { HolographicPanel } from './HolographicPanel';
import '../../styles/ui/Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  holographic?: boolean;
  float?: boolean;
  corners?: boolean;
  scanline?: boolean;
  glowVariant?: 'primary' | 'secondary' | 'accent' | 'warning';
  glowIntensity?: 'none' | 'low' | 'medium' | 'high';
  children: ReactNode;
}

/**
 * Styled surface component with variant, padding, and hover affordances.
 *
 * @param props - Visual configuration and standard div props.
 * @returns Decorative container for grouping UI content.
 */
export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'md',
  hover = false,
  holographic = false,
  float = false,
  corners = false,
  scanline = false,
  glowVariant = 'primary',
  glowIntensity = 'medium',
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'ui-card';
  const variantClass = `ui-card--${variant}`;
  const paddingClass = `ui-card--padding-${padding}`;
  const hoverClass = hover ? 'ui-card--hover' : '';
  const holographicClass = holographic ? 'ui-card--holographic' : '';

  const classes = [
    baseClasses,
    variantClass,
    paddingClass,
    hoverClass,
    holographicClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // If holographic mode is enabled, wrap in HolographicPanel
  if (holographic) {
    const { onClick, onMouseEnter, onMouseLeave, ...restProps } = props as any;
    return (
      <HolographicPanel
        variant={glowVariant}
        glowIntensity={glowIntensity}
        float={float}
        corners={corners}
        scanline={scanline}
        className={classes}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        {...restProps}
      >
        {children}
      </HolographicPanel>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Structural header region within a `Card` for titles or actions.
 *
 * @param props - Header content and optional styling classes.
 * @returns Card header wrapper.
 */
export const CardHeader: React.FC<CardHeaderProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`ui-card__header ${className}`} {...props}>
      {children}
    </div>
  );
};

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Main content container inside a `Card`.
 *
 * @param props - Body content and styling overrides.
 * @returns Card body wrapper.
 */
export const CardBody: React.FC<CardBodyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`ui-card__body ${className}`} {...props}>
      {children}
    </div>
  );
};

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Footer region for supplemental actions or metadata within a `Card`.
 *
 * @param props - Footer content and styling overrides.
 * @returns Card footer wrapper.
 */
export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`ui-card__footer ${className}`} {...props}>
      {children}
    </div>
  );
};
