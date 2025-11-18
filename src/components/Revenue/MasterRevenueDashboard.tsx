/**
 * Master Revenue Dashboard
 *
 * PURPOSE:
 * Unified dashboard showing ALL revenue sources across DLX Studios.
 * Single source of truth for revenue tracking, analytics, and reporting.
 *
 * FEATURES:
 * ✅ Aggregated metrics from all sources
 * ✅ Real-time revenue tracking
 * ✅ Source breakdown with percentages
 * ✅ Time-based analytics
 * ✅ Health monitoring
 * ✅ Export capabilities
 * ✅ Growth trends
 */

import { useState, useEffect } from 'react';
import {
  unifiedRevenueAggregator,
  AggregatedRevenueMetrics,
  RevenueBreakdown,
} from '@/services/revenue/unifiedRevenueAggregator';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import '@/styles/MasterRevenueDashboard.css';

export function MasterRevenueDashboard() {
  const [metrics, setMetrics] = useState<AggregatedRevenueMetrics | null>(null);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds if enabled
    let interval: NodeJS.Timeout | null = null;
    if (autoRefresh) {
      interval = setInterval(loadData, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const loadData = () => {
    try {
      setIsLoading(true);
      const metricsData = unifiedRevenueAggregator.getAggregatedMetrics();
      const breakdownData = unifiedRevenueAggregator.getRevenueBreakdown();
      const health = unifiedRevenueAggregator.getHealthStatus();

      setMetrics(metricsData);
      setBreakdown(breakdownData);
      setHealthStatus(health);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load revenue data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = unifiedRevenueAggregator.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const json = unifiedRevenueAggregator.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="health-icon healthy" size={20} />;
      case 'warning':
        return <AlertCircle className="health-icon warning" size={20} />;
      default:
        return <AlertCircle className="health-icon error" size={20} />;
    }
  };

  const getSourceColor = (source: string): string => {
    const colors: Record<string, string> = {
      affiliate: '#8b5cf6',
      passiveIncome: '#06b6d4',
      idleComputing: '#10b981',
      stripe: '#6366f1',
      gumroad: '#ec4899',
      other: '#64748b',
    };
    return colors[source] || '#64748b';
  };

  if (isLoading && !metrics) {
    return (
      <div className="master-revenue-dashboard loading">
        <div className="loading-spinner">
          <RefreshCw className="spin" size={32} />
          <p>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="master-revenue-dashboard error">
        <AlertCircle size={48} />
        <p>Failed to load revenue data</p>
        <button onClick={loadData} className="retry-button">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="master-revenue-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>
            <DollarSign size={32} className="icon-glow" />
            Master Revenue Dashboard
          </h1>
          <p className="subtitle">Unified view of all revenue sources</p>
        </div>
        <div className="header-right">
          <div className="header-meta">
            <Clock size={16} />
            <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`auto-refresh-toggle ${autoRefresh ? 'active' : ''}`}
            title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
          >
            <RefreshCw size={16} className={autoRefresh ? 'spin-slow' : ''} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </button>
          <button onClick={loadData} className="refresh-button">
            <RefreshCw size={16} />
            Refresh
          </button>
          <div className="export-buttons">
            <button onClick={handleExportCSV} className="export-button">
              <Download size={16} />
              CSV
            </button>
            <button onClick={handleExportJSON} className="export-button">
              <Download size={16} />
              JSON
            </button>
          </div>
        </div>
      </div>

      {/* Health Status Banner */}
      {healthStatus && (
        <div className={`health-banner ${healthStatus.overall}`}>
          {getHealthIcon(healthStatus.overall)}
          <div className="health-content">
            <span className="health-label">System Health:</span>
            <span className="health-value">{healthStatus.overall.toUpperCase()}</span>
            <span className="health-detail">
              {healthStatus.sources.filter((s: any) => s.status === 'active').length} of{' '}
              {healthStatus.sources.length} sources active
            </span>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">{formatCurrency(metrics.totalRevenue)}</span>
            <span className="metric-subtitle">All-time earnings</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Activity size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Transactions</span>
            <span className="metric-value">{formatNumber(metrics.totalTransactions)}</span>
            <span className="metric-subtitle">
              Avg: {formatCurrency(metrics.averageTransactionValue)}
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Monthly Growth</span>
            <span className={`metric-value ${metrics.growth.monthly >= 0 ? 'positive' : 'negative'}`}>
              {metrics.growth.monthly >= 0 ? '+' : ''}
              {metrics.growth.monthly.toFixed(1)}%
            </span>
            <span className="metric-subtitle">vs last month</span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <BarChart3 size={24} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Active Sources</span>
            <span className="metric-value">
              {metrics.topSources.filter(s => s.revenue > 0).length}
            </span>
            <span className="metric-subtitle">generating revenue</span>
          </div>
        </div>
      </div>

      {/* Period Breakdown */}
      <div className="period-section">
        <h2>Revenue by Period</h2>
        <div className="period-grid">
          <div className="period-card">
            <span className="period-label">Today</span>
            <span className="period-value">{formatCurrency(metrics.byPeriod.today)}</span>
          </div>
          <div className="period-card">
            <span className="period-label">This Week</span>
            <span className="period-value">{formatCurrency(metrics.byPeriod.week)}</span>
          </div>
          <div className="period-card">
            <span className="period-label">This Month</span>
            <span className="period-value">{formatCurrency(metrics.byPeriod.month)}</span>
          </div>
          <div className="period-card">
            <span className="period-label">This Year</span>
            <span className="period-value">{formatCurrency(metrics.byPeriod.year)}</span>
          </div>
        </div>
      </div>

      {/* Source Breakdown */}
      <div className="sources-section">
        <h2>Revenue by Source</h2>
        <div className="sources-grid">
          {breakdown.map((source) => (
            <div key={source.source} className="source-card">
              <div className="source-header">
                <div
                  className="source-indicator"
                  style={{ backgroundColor: getSourceColor(source.source) }}
                />
                <div className="source-info">
                  <h3>{source.description}</h3>
                  <span className={`source-status ${source.isActive ? 'active' : 'inactive'}`}>
                    {source.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="source-metrics">
                <div className="source-revenue">
                  <span className="revenue-label">Revenue</span>
                  <span className="revenue-value">{formatCurrency(source.revenue)}</span>
                </div>
                <div className="source-stats">
                  <div className="stat">
                    <span className="stat-label">Transactions</span>
                    <span className="stat-value">{formatNumber(source.transactions)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Avg Value</span>
                    <span className="stat-value">{formatCurrency(source.averageValue)}</span>
                  </div>
                </div>
              </div>
              <div className="source-percentage">
                <div
                  className="percentage-bar"
                  style={{
                    width: `${metrics.totalRevenue > 0 ? (source.revenue / metrics.totalRevenue) * 100 : 0}%`,
                    backgroundColor: getSourceColor(source.source),
                  }}
                />
                <span className="percentage-text">
                  {metrics.totalRevenue > 0
                    ? ((source.revenue / metrics.totalRevenue) * 100).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Sources Chart */}
      <div className="top-sources-section">
        <h2>Top Revenue Sources</h2>
        <div className="top-sources-chart">
          {metrics.topSources.map((source, index) => (
            <div key={source.source} className="chart-bar">
              <div className="bar-header">
                <span className="bar-rank">#{index + 1}</span>
                <span className="bar-label">{source.source}</span>
                <span className="bar-value">{formatCurrency(source.revenue)}</span>
              </div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{
                    width: `${source.percentage}%`,
                    backgroundColor: getSourceColor(source.source),
                  }}
                >
                  <span className="bar-percentage">{source.percentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Health Status Details */}
      {healthStatus && (
        <div className="health-section">
          <h2>Source Health Status</h2>
          <div className="health-list">
            {healthStatus.sources.map((source: any) => (
              <div key={source.name} className={`health-item ${source.status}`}>
                <div className="health-item-header">
                  <span className="health-item-name">{source.name}</span>
                  <span className={`health-item-badge ${source.status}`}>
                    {source.status.toUpperCase()}
                  </span>
                </div>
                <p className="health-item-message">{source.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MasterRevenueDashboard;
