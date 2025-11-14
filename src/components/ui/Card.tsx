import React, { HTMLAttributes, ReactNode } from 'react';
import '../../styles/ui/Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  /** @deprecated holographic mode is no longer supported - use standard variants */
  holographic?: boolean;
  /** @deprecated float is no longer supported */
  float?: boolean;
  /** @deprecated corners is no longer supported */
  corners?: boolean;
  /** @deprecated scanline is no longer supported */
  scanline?: boolean;
  /** @deprecated glowVariant is no longer supported */
  glowVariant?: 'primary' | 'secondary' | 'accent' | 'warning';
  /** @deprecated glowIntensity is no longer supported */
  glowIntensity?: 'none' | 'low' | 'medium' | 'high';
  children: ReactNode;
}

/**
 * Styled surface component with variant, padding, and hover affordances.
 * Clean, modern design with subtle glassmorphism effects.
 *
 * @param props - Visual configuration and standard div props.
 * @returns Decorative container for grouping UI content.
 */
export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'md',
  hover = false,
  // holographic and related props are deprecated but kept for backwards compatibility
  children,
  className = '',
  ...props
}) => {
  const baseClasses = 'ui-card';
  const variantClass = `ui-card--${variant}`;
  const paddingClass = `ui-card--padding-${padding}`;
  const hoverClass = hover ? 'ui-card--hover' : '';

  const classes = [
    baseClasses,
    variantClass,
    paddingClass,
    hoverClass,
    className,
  ]
    .filter(Boolean)
    .join(' ');

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
