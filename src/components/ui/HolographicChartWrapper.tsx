import { ReactNode, CSSProperties } from 'react';

/**
 * HolographicChartWrapper Component
 *
 * A HUD-style wrapper for chart visualizations with:
 * - Glowing border effects
 * - Glassmorphic background
 * - Animated scanlines
 * - Corner accents
 * - Title and subtitle support
 */

export interface HolographicChartWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  showCorners?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function HolographicChartWrapper({
  children,
  title,
  subtitle,
  variant = 'primary',
  showCorners = true,
  className = '',
  style = {},
}: HolographicChartWrapperProps) {
  // Determine color based on variant
  const getVariantColor = () => {
    switch (variant) {
      case 'primary':
        return 'var(--color-accent-cyan-500)';
      case 'success':
        return 'var(--color-success)';
      case 'warning':
        return 'var(--color-warning)';
      case 'error':
        return 'var(--color-error)';
      case 'info':
        return 'var(--color-accent-magenta-500)';
      default:
        return 'var(--color-accent-cyan-500)';
    }
  };

  // Determine glow based on variant
  const getVariantGlow = () => {
    switch (variant) {
      case 'primary':
        return 'var(--glow-h-cyan)';
      case 'success':
        return 'var(--shadow-glow-success)';
      case 'warning':
        return 'var(--shadow-glow-warning)';
      case 'error':
        return 'var(--shadow-glow-error)';
      case 'info':
        return 'var(--glow-h-magenta)';
      default:
        return 'var(--glow-h-cyan)';
    }
  };

  const containerStyle: CSSProperties = {
    position: 'relative',
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: `1px solid ${getVariantColor()}`,
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--spacing-4)',
    overflow: 'hidden',
    boxShadow: getVariantGlow(),
    ...style,
  };

  const topBarStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '2px',
    background: 'var(--gradient-h-border)',
    backgroundSize: '200% 100%',
    animation: 'holo-border-glow 8s linear infinite',
  };

  const scanlineStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'var(--gradient-h-scanline)',
    animation: 'holo-scanline 6s linear infinite',
    opacity: 0.05,
    pointerEvents: 'none',
  };

  const cornerStyle: CSSProperties = {
    position: 'absolute',
    width: '16px',
    height: '16px',
    border: `2px solid ${getVariantColor()}`,
    boxShadow: getVariantGlow(),
    zIndex: 2,
  };

  const topLeftCornerStyle: CSSProperties = {
    ...cornerStyle,
    top: 0,
    left: 0,
    borderRight: 'none',
    borderBottom: 'none',
  };

  const topRightCornerStyle: CSSProperties = {
    ...cornerStyle,
    top: 0,
    right: 0,
    borderLeft: 'none',
    borderBottom: 'none',
  };

  const bottomLeftCornerStyle: CSSProperties = {
    ...cornerStyle,
    bottom: 0,
    left: 0,
    borderRight: 'none',
    borderTop: 'none',
  };

  const bottomRightCornerStyle: CSSProperties = {
    ...cornerStyle,
    bottom: 0,
    right: 0,
    borderLeft: 'none',
    borderTop: 'none',
  };

  const contentStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
  };

  const headerStyle: CSSProperties = {
    marginBottom: 'var(--spacing-3)',
  };

  const titleStyle: CSSProperties = {
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'var(--font-weight-bold)',
    color: getVariantColor(),
    textShadow: getVariantGlow(),
    marginBottom: subtitle ? 'var(--spacing-1)' : 0,
  };

  const subtitleStyle: CSSProperties = {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    fontWeight: 'var(--font-weight-medium)',
  };

  return (
    <div className={`holographic-chart-wrapper ${className}`} style={containerStyle}>
      <div style={topBarStyle} />
      <div style={scanlineStyle} />
      {showCorners && (
        <>
          <div style={topLeftCornerStyle} />
          <div style={topRightCornerStyle} />
          <div style={bottomLeftCornerStyle} />
          <div style={bottomRightCornerStyle} />
        </>
      )}
      <div style={contentStyle}>
        {(title || subtitle) && (
          <div style={headerStyle}>
            {title && <div style={titleStyle}>{title}</div>}
            {subtitle && <div style={subtitleStyle}>{subtitle}</div>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

