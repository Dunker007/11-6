import { ReactNode, CSSProperties, HTMLAttributes } from 'react';

/**
 * HolographicPanel Component
 * 
 * Glassmorphic floating panel with HUD-style aesthetics:
 * - Backdrop blur with glassmorphism
 * - Animated border glow (rotating gradient)
 * - Hexagonal corner accents
 * - Optional floating animation with 3D tilt
 * - Multiple glow color variants
 */

export interface HolographicPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'warning' | 'success' | 'error';
  glowIntensity?: 'none' | 'low' | 'medium' | 'high';
  float?: boolean;
  corners?: boolean;
  scanline?: boolean;
  style?: CSSProperties;
}

export function HolographicPanel({
  children,
  variant = 'primary',
  glowIntensity = 'medium',
  float = false,
  corners = false,
  scanline = false,
  className = '',
  style = {},
  ...props
}: HolographicPanelProps) {
  // Determine glow and border colors based on variant
  const variantStyles = {
    primary: {
      borderColor: 'rgba(139, 92, 246, 0.4)',
      glowColor: 'var(--glow-primary)',
      glowColorIntense: 'var(--glow-primary-intense)',
    },
    secondary: {
      borderColor: 'rgba(6, 182, 212, 0.4)',
      glowColor: 'var(--glow-accent-cyan)',
      glowColorIntense: 'var(--glow-accent-cyan-intense)',
    },
    accent: {
      borderColor: 'rgba(217, 70, 239, 0.4)',
      glowColor: 'var(--glow-accent-magenta)',
      glowColorIntense: 'var(--glow-accent-magenta-intense)',
    },
    warning: {
      borderColor: 'rgba(245, 158, 11, 0.4)',
      glowColor: 'var(--glow-accent-amber)',
      glowColorIntense: 'var(--glow-accent-amber-intense)',
    },
    success: {
      borderColor: 'rgba(16, 185, 129, 0.4)',
      glowColor: '0 0 10px rgba(16, 185, 129, 0.4)',
      glowColorIntense: '0 0 20px rgba(16, 185, 129, 0.6)',
    },
    error: {
      borderColor: 'rgba(239, 68, 68, 0.4)',
      glowColor: '0 0 10px rgba(239, 68, 68, 0.4)',
      glowColorIntense: '0 0 20px rgba(239, 68, 68, 0.6)',
    },
  };

  const currentVariant = variantStyles[variant];

  // Determine box-shadow based on glow intensity
  const getGlowShadow = () => {
    switch (glowIntensity) {
      case 'none':
        return 'none';
      case 'low':
        return `${currentVariant.glowColor}, 0 8px 32px rgba(0, 0, 0, 0.3)`;
      case 'medium':
        return `${currentVariant.glowColor}, 0 8px 32px rgba(0, 0, 0, 0.4)`;
      case 'high':
        return `${currentVariant.glowColorIntense}, 0 12px 40px rgba(0, 0, 0, 0.5)`;
      default:
        return currentVariant.glowColor;
    }
  };

  const panelStyle: CSSProperties = {
    position: 'relative',
    background: 'var(--color-bg-glass-light)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: `1px solid ${currentVariant.borderColor}`,
    borderRadius: 'var(--radius-lg)',
    boxShadow: getGlowShadow(),
    overflow: 'hidden',
    ...style,
  };

  // Build class names
  const classes = [
    'holographic-panel',
    float && 'holo-float',
    scanline && 'holo-scanline',
    corners && 'holo-corners',
    props.onClick && 'holo-interactive',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} style={panelStyle} {...props}>
      {/* Rotating border gradient (visible on hover) */}
      <div
        style={{
          position: 'absolute',
          top: '-2px',
          left: '-2px',
          right: '-2px',
          bottom: '-2px',
          background: 'var(--gradient-border-cyan-magenta)',
          borderRadius: 'var(--radius-lg)',
          opacity: 0,
          zIndex: -1,
          transition: 'opacity var(--duration-base)',
          animation: 'rotate-border 3s linear infinite',
        }}
        className="panel-border-glow"
      />

      {/* Corner brackets for HUD effect */}
      {corners && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '20px',
              height: '20px',
              borderTop: `2px solid ${currentVariant.borderColor}`,
              borderLeft: `2px solid ${currentVariant.borderColor}`,
              borderRadius: '4px 0 0 0',
              boxShadow: `0 0 5px ${currentVariant.borderColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '20px',
              height: '20px',
              borderTop: `2px solid ${currentVariant.borderColor}`,
              borderRight: `2px solid ${currentVariant.borderColor}`,
              borderRadius: '0 4px 0 0',
              boxShadow: `0 0 5px ${currentVariant.borderColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '20px',
              height: '20px',
              borderBottom: `2px solid ${currentVariant.borderColor}`,
              borderLeft: `2px solid ${currentVariant.borderColor}`,
              borderRadius: '0 0 0 4px',
              boxShadow: `0 0 5px ${currentVariant.borderColor}`,
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '20px',
              height: '20px',
              borderBottom: `2px solid ${currentVariant.borderColor}`,
              borderRight: `2px solid ${currentVariant.borderColor}`,
              borderRadius: '0 0 4px 0',
              boxShadow: `0 0 5px ${currentVariant.borderColor}`,
            }}
          />
        </>
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

export default HolographicPanel;

