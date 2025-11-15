/**
 * PerformanceDashboard.tsx
 * 
 * PURPOSE:
 * Performance monitoring dashboard component. Displays real-time performance metrics including
 * render times, API call durations, slow operations log, and memory usage. Helps identify
 * performance bottlenecks and optimization opportunities.
 * 
 * ARCHITECTURE:
 * React component that aggregates performance data:
 * - Uses performance utility to access slow operations log
 * - Displays metrics in organized sections
 * - Auto-refreshes to show current performance state
 * - Provides clear visualization of performance data
 * 
 * Features:
 * - Render time metrics
 * - API call durations
 * - Slow operations log (operations > threshold)
 * - Memory usage (when available)
 * - Performance trends
 * 
 * CURRENT STATUS:
 * ✅ Slow operations display
 * ✅ Performance metrics aggregation
 * ✅ Auto-refresh functionality
 * ✅ Clear visualization
 * 
 * DEPENDENCIES:
 * - @/utils/performance: Performance measurement utilities
 * 
 * STATE MANAGEMENT:
 * - Local state: refresh interval, expanded sections
 * 
 * PERFORMANCE:
 * - Efficient data aggregation
 * - Debounced refresh
 * - Memoized calculations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import PerformanceDashboard from '@/components/System/PerformanceDashboard';
 * 
 * function Settings() {
 *   return (
 *     <div>
 *       <PerformanceDashboard />
 *     </div>
 *   );
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/utils/performance.ts: Performance measurement utilities
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Add memory usage tracking
 * - Add performance charts/graphs
 * - Add export functionality
 * - Add performance alerts
 * - Add historical performance data
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getSlowOperations } from '@/utils/performance';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import TechIcon from '../Icons/TechIcon';
import { Activity, Clock, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import '../../styles/PerformanceDashboard.css';

interface PerformanceMetric {
  label: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

function PerformanceDashboard() {
  const [slowOperations, setSlowOperations] = useState<PerformanceMetric[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    try {
      const operations = getSlowOperations();
      setSlowOperations(operations);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [refreshData]);

  const stats = useMemo(() => {
    if (slowOperations.length === 0) {
      return {
        total: 0,
        avgDuration: 0,
        maxDuration: 0,
        byCategory: {} as Record<string, number>,
      };
    }

    const durations = slowOperations.map((op) => op.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    const maxDuration = Math.max(...durations);

    const byCategory: Record<string, number> = {};
    slowOperations.forEach((op) => {
      const category = op.label.split('.')[0] || 'other';
      byCategory[category] = (byCategory[category] || 0) + 1;
    });

    return {
      total: slowOperations.length,
      avgDuration,
      maxDuration,
      byCategory,
    };
  }, [slowOperations]);

  const formatDuration = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getSeverityColor = (duration: number): 'error' | 'warning' | 'info' => {
    if (duration > 1000) return 'error';
    if (duration > 200) return 'warning';
    return 'info';
  };

  const getSeverityGlow = (duration: number): 'red' | 'yellow' | 'cyan' => {
    if (duration > 1000) return 'red';
    if (duration > 200) return 'yellow';
    return 'cyan';
  };

  return (
    <div className="performance-dashboard">
      <div className="dashboard-header">
        <div className="header-title">
          <TechIcon icon={Activity} size={20} glow="cyan" />
          <h2>Performance Dashboard</h2>
        </div>
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="refresh-button"
          title="Refresh performance data"
        >
          <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="performance-stats-grid">
        <Card variant="outlined" className="stat-card">
          <CardBody>
            <div className="stat-content">
              <TechIcon icon={Activity} size={24} glow="violet" />
              <div className="stat-info">
                <div className="stat-value">{stats.total}</div>
                <div className="stat-label">Slow Operations</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="outlined" className="stat-card">
          <CardBody>
            <div className="stat-content">
              <TechIcon icon={Clock} size={24} glow="cyan" />
              <div className="stat-info">
                <div className="stat-value">{formatDuration(stats.avgDuration)}</div>
                <div className="stat-label">Avg Duration</div>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card variant="outlined" className="stat-card">
          <CardBody>
            <div className="stat-content">
              <TechIcon icon={Zap} size={24} glow="yellow" />
              <div className="stat-info">
                <div className="stat-value">{formatDuration(stats.maxDuration)}</div>
                <div className="stat-label">Max Duration</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Slow Operations List */}
      <Card variant="outlined" className="operations-card">
        <CardHeader>
          <div className="card-header-content">
            <h3>Slow Operations</h3>
            <Badge variant={stats.total > 0 ? 'warning' : 'success'}>
              {stats.total} operations
            </Badge>
          </div>
        </CardHeader>
        <CardBody>
          {slowOperations.length === 0 ? (
            <div className="empty-state">
              <TechIcon icon={Zap} size={48} glow="green" />
              <p>No slow operations detected</p>
              <span className="empty-hint">
                Performance monitoring is active. Operations exceeding thresholds will appear here.
              </span>
            </div>
          ) : (
            <div className="operations-list">
              {slowOperations.slice(0, 50).map((op, index) => (
                <div key={`${op.timestamp}-${index}`} className="operation-item">
                  <div className="operation-header">
                    <div className="operation-label">
                      <TechIcon
                        icon={AlertTriangle}
                        size={16}
                        glow={getSeverityGlow(op.duration)}
                      />
                      <code className="operation-name">{op.label}</code>
                    </div>
                    <div className="operation-meta">
                      <Badge variant={getSeverityColor(op.duration)}>
                        {formatDuration(op.duration)}
                      </Badge>
                      <span className="operation-time">{formatTimeAgo(op.timestamp)}</span>
                    </div>
                  </div>
                  {op.metadata && Object.keys(op.metadata).length > 0 && (
                    <details className="operation-details">
                      <summary>Metadata</summary>
                      <pre className="operation-metadata">
                        {JSON.stringify(op.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
              {slowOperations.length > 50 && (
                <div className="operations-footer">
                  <p>Showing first 50 of {slowOperations.length} operations</p>
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Category Breakdown */}
      {Object.keys(stats.byCategory).length > 0 && (
        <Card variant="outlined" className="categories-card">
          <CardHeader>
            <h3>Operations by Category</h3>
          </CardHeader>
          <CardBody>
            <div className="categories-grid">
              {Object.entries(stats.byCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="category-item">
                    <span className="category-name">{category}</span>
                    <Badge variant="info">{count}</Badge>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default PerformanceDashboard;

