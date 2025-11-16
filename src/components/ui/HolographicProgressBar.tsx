import { CSSProperties } from 'react';

/**
 * HolographicProgressBar Component
 *
 * A sci-fi HUD-style progress bar with:
 * - Animated gradient fill
 * - Glowing border and scanlines
 * - Percentage indicator
 * - Multiple color variants
 */

export interface HolographicProgressBarProps {
  value: number; // 0-100
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function HolographicProgressBar({
  value,
  variant = 'primary',
  size = 'md',
  showLabel = false,
  label,
  animated = true,
  className = '',
  style = {},
}: HolographicProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

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

  // Size mapping
  const getHeight = () => {
    switch (size) {
      case 'sm':
        return '8px';
      case 'md':
        return '12px';
      case 'lg':
        return '16px';
      default:
        return '12px';
    }
  };

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    ...style,
  };

  const trackStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    height: getHeight(),
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(6, 182, 212, 0.3)',
    borderRadius: 'var(--radius-sm)',
    overflow: 'hidden',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
  };

  const fillStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: `${clampedValue}%`,
    background: `linear-gradient(90deg, ${getVariantColor()}, ${getVariantColor()}80)`,
    boxShadow: getVariantGlow(),
    transition: animated ? 'width 0.5s ease-out' : 'none',
    zIndex: 1,
  };

  const scanlineStyle: CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'var(--gradient-h-scanline)',
    animation: animated ? 'holo-scanline 3s linear infinite' : 'none',
    opacity: 0.3,
    pointerEvents: 'none',
    zIndex: 2,
  };

  const labelStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'var(--spacing-1)',
    fontSize: 'var(--font-size-xs)',
    color: getVariantColor(),
    textShadow: getVariantGlow(),
    fontWeight: 'var(--font-weight-medium)',
  };

  return (
    <div className={`holographic-progress ${className}`} style={containerStyle}>
      {showLabel && (
        <div style={labelStyle}>
          {label && <span>{label}</span>}
          <span>{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div style={trackStyle}>
        <div style={fillStyle} />
        <div style={scanlineStyle} />
      </div>
    </div>
  );
}

