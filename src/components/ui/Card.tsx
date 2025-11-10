import React, { HTMLAttributes, ReactNode } from 'react';
import '../../styles/ui/Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'flat' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  children: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'elevated',
  padding = 'md',
  hover = false,
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
