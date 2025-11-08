import { memo, useMemo } from 'react';
import { LucideIcon } from 'lucide-react';
import '../../styles/TechIcons.css';

interface TechIconProps {
  icon: LucideIcon;
  size?: number;
  variant?: 'default' | 'hexagon' | 'circle' | 'circuit';
  glow?: 'cyan' | 'violet' | 'amber' | 'green' | 'yellow' | 'red' | 'none';
  animated?: boolean;
  active?: boolean;
  className?: string;
}

const TechIcon = memo(function TechIcon({ 
  icon: Icon, 
  size = 20, 
  variant = 'default',
  glow = 'cyan',
  animated = false,
  active = false,
  className = ''
}: TechIconProps) {
  // Memoize wrapper classes to avoid recomputation on every render
  const wrapperClasses = useMemo(() => [
    'tech-icon-wrapper',
    `variant-${variant}`,
    glow !== 'none' && `glow-${glow}`,
    animated && 'animated',
    active && 'active',
    className
  ].filter(Boolean).join(' '), [variant, glow, animated, active, className]);

  return (
    <div className={wrapperClasses}>
      {/* Hexagonal frame overlay */}
      {variant === 'hexagon' && (
        <div className="hex-frame">
          <svg className="hex-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polygon 
              points="50 1, 95 25, 95 75, 50 99, 5 75, 5 25" 
              className="hex-border"
            />
            <polygon 
              points="50 1, 95 25, 95 75, 50 99, 5 75, 5 25" 
              className="hex-fill"
            />
          </svg>
          {/* Corner accent lines */}
          <div className="hex-corners">
            <span className="corner corner-tl"></span>
            <span className="corner corner-tr"></span>
            <span className="corner corner-bl"></span>
            <span className="corner corner-br"></span>
          </div>
        </div>
      )}

      {/* Circuit pattern overlay */}
      {variant === 'circuit' && (
        <div className="circuit-pattern">
          <svg className="circuit-svg" viewBox="0 0 100 100">
            <path d="M0,50 L20,50 L30,40 L40,60 L50,50 L60,50" className="circuit-line" />
            <path d="M50,0 L50,20 L40,30 L60,40 L50,50" className="circuit-line" />
            <circle cx="50" cy="50" r="3" className="circuit-node" />
            <circle cx="20" cy="50" r="2" className="circuit-node" />
            <circle cx="50" cy="20" r="2" className="circuit-node" />
          </svg>
        </div>
      )}

      {/* The actual icon */}
      <Icon 
        size={typeof size === 'number' ? size : 24} 
        className="tech-icon-svg"
        strokeWidth={1.5}
      />

      {/* Scan line effect */}
      {animated && <div className="scan-line"></div>}

      {/* Particle effects */}
      {animated && (
        <div className="particles">
          <span className="particle particle-1"></span>
          <span className="particle particle-2"></span>
          <span className="particle particle-3"></span>
        </div>
      )}

      {/* Pulse ring for active state */}
      {active && <div className="pulse-ring"></div>}
    </div>
  );
});

export default TechIcon;

