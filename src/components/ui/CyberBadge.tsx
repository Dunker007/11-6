import React from 'react';
import './CyberBadge.css';

export interface CyberBadgeProps {
    variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    label: string;
    icon?: React.ReactNode;
    glow?: boolean;
    className?: string;
}

export const CyberBadge: React.FC<CyberBadgeProps> = ({
    variant = 'default',
    size = 'md',
    label,
    icon,
    glow = false,
    className = '',
}) => {
    const classes = [
        'cyber-badge',
        `cyber-badge--${variant}`,
        `cyber-badge--${size}`,
        glow && 'cyber-badge--glow',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <span className={classes}>
            {icon && <span className="cyber-badge__icon">{icon}</span>}
            <span className="cyber-badge__label">{label}</span>
            {glow && <span className="cyber-badge__glow"></span>}
        </span>
    );
};

export default CyberBadge;
