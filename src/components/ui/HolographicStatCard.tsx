import { ReactNode, CSSProperties } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * HolographicStatCard Component
 *
 * A HUD-style metric card with:
 * - Large numeric value display
 * - Icon support
 * - Trend indicator (optional)
 * - Glowing border effects
 * - Animated background
 */

export interface HolographicStatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number; // percentage change
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  style?: CSSProperties;
}

export function HolographicStatCard({
  label,
  value,
  icon: Icon,
  trend,
  variant = 'primary',
  size = 'md',
  className = '',
  style = {},
}: HolographicStatCardProps) {
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

  // Size-based padding and font sizes
  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          padding: 'var(--spacing-2)',
          labelSize: 'var(--font-size-xs)',
          valueSize: 'var(--font-size-xl)',
          iconSize: 20,
        };
      case 'md':
        return {
          padding: 'var(--spacing-3)',
          labelSize: 'var(--font-size-sm)',
          valueSize: 'var(--font-size-2xl)',
          iconSize: 24,
        };
      case 'lg':
        return {
          padding: 'var(--spacing-4)',
          labelSize: 'var(--font-size-md)',
          valueSize: 'var(--font-size-3xl)',
          iconSize: 28,
        };
      default:
        return {
          padding: 'var(--spacing-3)',
          labelSize: 'var(--font-size-sm)',
          valueSize: 'var(--font-size-2xl)',
          iconSize: 24,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const containerStyle: CSSProperties = {
    position: 'relative',
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: `1px solid ${getVariantColor()}`,
    borderRadius: 'var(--radius-lg)',
    padding: sizeStyles.padding,
    overflow: 'hidden',
    transition: 'all var(--duration-base) var(--ease-out)',
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
    opacity: 0.1,
    pointerEvents: 'none',
  };

  const contentStyle: CSSProperties = {
    position: 'relative',
    zIndex: 1,
  };

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--spacing-2)',
  };

  const labelStyle: CSSProperties = {
    fontSize: sizeStyles.labelSize,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    fontWeight: 'var(--font-weight-medium)',
  };

  const iconStyle: CSSProperties = {
    color: getVariantColor(),
    filter: `drop-shadow(${getVariantGlow()})`,
  };

  const valueStyle: CSSProperties = {
    fontSize: sizeStyles.valueSize,
    fontWeight: 'var(--font-weight-bold)',
    color: getVariantColor(),
    textShadow: getVariantGlow(),
    fontFamily: 'monospace',
    marginBottom: trend ? 'var(--spacing-1)' : 0,
  };

  const getTrendColor = () => {
    if (!trend) return '';
    if (trend.direction === 'up') return 'var(--color-success)';
    if (trend.direction === 'down') return 'var(--color-error)';
    return 'var(--color-text-muted)';
  };

  const getTrendSymbol = () => {
    if (!trend) return '';
    if (trend.direction === 'up') return '▲';
    if (trend.direction === 'down') return '▼';
    return '●';
  };

  const trendStyle: CSSProperties = {
    fontSize: 'var(--font-size-xs)',
    color: getTrendColor(),
    fontWeight: 'var(--font-weight-medium)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-1)',
  };

  return (
    <div className={`holographic-stat-card ${className}`} style={containerStyle}>
      <div style={topBarStyle} />
      <div style={scanlineStyle} />
      <div style={contentStyle}>
        <div style={headerStyle}>
          <span style={labelStyle}>{label}</span>
          {Icon && <Icon size={sizeStyles.iconSize} style={iconStyle} />}
        </div>
        <div style={valueStyle}>{value}</div>
        {trend && (
          <div style={trendStyle}>
            <span>{getTrendSymbol()}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}

