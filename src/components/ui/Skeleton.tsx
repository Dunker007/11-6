/**
 * Skeleton Loading Components
 * Provides placeholder elements while content is loading
 */

import { CSSProperties, memo } from 'react';
import '../../styles/ui/Skeleton.css';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  animation?: 'pulse' | 'wave' | 'none';
  className?: string;
  style?: CSSProperties;
}

/**
 * Basic Skeleton component for loading states
 */
export const Skeleton = memo(function Skeleton({
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse',
  className = '',
  style = {},
}: SkeletonProps) {
  const skeletonStyle: CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    ...style,
  };

  return (
    <div
      className={`skeleton skeleton--${variant} skeleton--${animation} ${className}`}
      style={skeletonStyle}
      aria-busy="true"
      aria-live="polite"
    />
  );
});

/**
 * Skeleton Text component - simulates text lines
 */
export const SkeletonText = memo(function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  className = '',
}: {
  lines?: number;
  lastLineWidth?: string;
  className?: string;
}) {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={16}
        />
      ))}
    </div>
  );
});

/**
 * Skeleton Card component - simulates card layout
 */
export const SkeletonCard = memo(function SkeletonCard({
  hasImage = true,
  hasTitle = true,
  hasDescription = true,
  className = '',
}: {
  hasImage?: boolean;
  hasTitle?: boolean;
  hasDescription?: boolean;
  className?: string;
}) {
  return (
    <div className={`skeleton-card ${className}`}>
      {hasImage && (
        <Skeleton
          variant="rounded"
          width="100%"
          height={200}
          className="skeleton-card__image"
        />
      )}
      <div className="skeleton-card__content">
        {hasTitle && (
          <Skeleton variant="text" width="70%" height={24} />
        )}
        {hasDescription && (
          <SkeletonText lines={2} lastLineWidth="40%" />
        )}
      </div>
    </div>
  );
});

/**
 * Skeleton List component - simulates list of items
 */
export const SkeletonList = memo(function SkeletonList({
  count = 5,
  itemHeight = 60,
  hasAvatar = false,
  className = '',
}: {
  count?: number;
  itemHeight?: number;
  hasAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={`skeleton-list ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-list__item" style={{ height: itemHeight }}>
          {hasAvatar && (
            <Skeleton
              variant="circular"
              width={40}
              height={40}
              className="skeleton-list__avatar"
            />
          )}
          <div className="skeleton-list__content">
            <Skeleton variant="text" width="60%" height={16} />
            <Skeleton variant="text" width="40%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
});

/**
 * Skeleton Table component - simulates table rows
 */
export const SkeletonTable = memo(function SkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`skeleton-table ${className}`}>
      {/* Header */}
      <div className="skeleton-table__header">
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={`header-${colIndex}`} variant="text" height={16} />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="skeleton-table__row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height={14} />
          ))}
        </div>
      ))}
    </div>
  );
});

/**
 * Skeleton Dashboard component - simulates dashboard layout
 */
export const SkeletonDashboard = memo(function SkeletonDashboard({
  className = '',
}: {
  className?: string;
}) {
  return (
    <div className={`skeleton-dashboard ${className}`}>
      {/* Header */}
      <div className="skeleton-dashboard__header">
        <Skeleton variant="text" width="30%" height={32} />
        <Skeleton variant="rounded" width={120} height={40} />
      </div>
      
      {/* Stat Cards */}
      <div className="skeleton-dashboard__stats">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton-dashboard__stat-card">
            <Skeleton variant="text" width="50%" height={14} />
            <Skeleton variant="text" width="70%" height={28} />
            <Skeleton variant="text" width="40%" height={12} />
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="skeleton-dashboard__content">
        <div className="skeleton-dashboard__main">
          <Skeleton variant="rounded" width="100%" height={400} />
        </div>
        <div className="skeleton-dashboard__sidebar">
          <Skeleton variant="rounded" width="100%" height={200} />
          <Skeleton variant="rounded" width="100%" height={200} />
        </div>
      </div>
    </div>
  );
});

/**
 * Skeleton Activity Item component - specific for activity feed
 */
export const SkeletonActivityItem = memo(function SkeletonActivityItem() {
  return (
    <div className="skeleton-activity-item">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="skeleton-activity-item__content">
        <Skeleton variant="text" width="70%" height={16} />
        <Skeleton variant="text" width="90%" height={14} />
        <Skeleton variant="text" width="30%" height={12} />
      </div>
    </div>
  );
});

/**
 * Skeleton Transaction Item component - specific for transaction lists
 */
export const SkeletonTransactionItem = memo(function SkeletonTransactionItem() {
  return (
    <div className="skeleton-transaction-item">
      <div className="skeleton-transaction-item__icon">
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <div className="skeleton-transaction-item__content">
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="40%" height={12} />
      </div>
      <div className="skeleton-transaction-item__amount">
        <Skeleton variant="text" width={80} height={18} />
      </div>
    </div>
  );
});

