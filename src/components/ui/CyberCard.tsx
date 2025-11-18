import React, { HTMLAttributes, forwardRef } from 'react';
import './CyberCard.css';

export interface CyberCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'solid' | 'outline';
  glow?: boolean;
  hoverEffect?: boolean;
  neonBorder?: boolean;
  gridPattern?: boolean;
  cornerAccents?: boolean;
  clickable?: boolean;
}

export const CyberCard = forwardRef<HTMLDivElement, CyberCardProps>(
  (
    {
      variant = 'default',
      glow = false,
      hoverEffect = true,
      neonBorder = true,
      gridPattern = false,
      cornerAccents = false,
      clickable = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const classes = [
      'cyber-card',
      `cyber-card--${variant}`,
      glow && 'cyber-card--glow',
      hoverEffect && 'cyber-card--hover',
      neonBorder && 'cyber-card--neon-border',
      gridPattern && 'cyber-card--grid-pattern',
      cornerAccents && 'cyber-card--corner-accents',
      clickable && 'cyber-card--clickable',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {cornerAccents && (
          <>
            <span className="cyber-card__corner cyber-card__corner--tl"></span>
            <span className="cyber-card__corner cyber-card__corner--tr"></span>
            <span className="cyber-card__corner cyber-card__corner--bl"></span>
            <span className="cyber-card__corner cyber-card__corner--br"></span>
          </>
        )}
        {gridPattern && <div className="cyber-card__grid"></div>}
        <div className="cyber-card__content">{children}</div>
        {glow && <div className="cyber-card__glow"></div>}
      </div>
    );
  }
);

CyberCard.displayName = 'CyberCard';

export default CyberCard;
