import { useState, useEffect } from 'react';
import { revenueTracker } from '../revenue/tracker';
import '../styles-new/revenue-dashboard.css';

interface DashboardMetrics {
  totalClicks: number;
  totalConversions: number;
  totalCommission: number;
  conversionRate: number;
  averageOrderValue: number;
  topPerformingProducts: Array<{
    productId: string;
    productName: string;
    clicks: number;
    conversions: number;
    commission: number;
  }>;
  monthlyRevenue: Array<{
    month: string;
    clicks: number;
    conversions: number;
    commission: number;
  }>;
  activeContent: number;
  pendingContent: number;
  publishedContent: number;
}

function RevenueDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadDashboardData();

    // Refresh every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const revenueData = revenueTracker.getMetrics();

      // Mock content metrics for now (would come from content pipeline)
      const contentMetrics = {
        activeContent: 5,
        pendingContent: 2,
        publishedContent: 12
      };

      setMetrics({
        ...revenueData,
        ...contentMetrics
      });
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (isLoading) {
    return (
      <div className="revenue-dashboard">
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="revenue-dashboard">
        <div className="dashboard-error">
          <p>Failed to load revenue data</p>
          <button onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-dashboard">
      <div className="dashboard-header">
        <h2>Revenue Dashboard</h2>
        <div className="dashboard-meta">
          <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
          <button onClick={loadDashboardData} className="refresh-button">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-value">{formatCurrency(metrics.totalCommission)}</div>
          <div className="metric-label">Total Commission</div>
          <div className="metric-trend positive">+12.5%</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{metrics.totalClicks}</div>
          <div className="metric-label">Total Clicks</div>
          <div className="metric-trend positive">+8.2%</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{formatPercentage(metrics.conversionRate)}</div>
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-trend neutral">+0.1%</div>
        </div>

        <div className="metric-card">
          <div className="metric-value">{formatCurrency(metrics.averageOrderValue)}</div>
          <div className="metric-label">Avg Order Value</div>
          <div className="metric-trend positive">+5.7%</div>
        </div>
      </div>

      {/* Content Status Row */}
      <div className="content-status-grid">
        <div className="status-card">
          <div className="status-icon active">📝</div>
          <div className="status-info">
            <div className="status-value">{metrics.activeContent}</div>
            <div className="status-label">Active Content</div>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon pending">⏳</div>
          <div className="status-info">
            <div className="status-value">{metrics.pendingContent}</div>
            <div className="status-label">Pending Review</div>
          </div>
        </div>

        <div className="status-card">
          <div className="status-icon published">🚀</div>
          <div className="status-info">
            <div className="status-value">{metrics.publishedContent}</div>
            <div className="status-label">Published</div>
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="dashboard-section">
        <h3>Top Performing Products</h3>
        <div className="products-table">
          <div className="table-header">
            <div className="col-product">Product</div>
            <div className="col-metric">Clicks</div>
            <div className="col-metric">Conversions</div>
            <div className="col-metric">Commission</div>
          </div>
          {metrics.topPerformingProducts.slice(0, 5).map((product, index) => (
            <div key={product.productId} className="table-row">
              <div className="col-product">
                <span className="product-rank">#{index + 1}</span>
                {product.productName}
              </div>
              <div className="col-metric">{product.clicks}</div>
              <div className="col-metric">{product.conversions}</div>
              <div className="col-metric">{formatCurrency(product.commission)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="dashboard-section">
        <h3>Monthly Revenue Trend</h3>
        <div className="revenue-chart">
          {metrics.monthlyRevenue.slice(-6).map((month) => (
            <div key={month.month} className="chart-bar">
              <div
                className="bar-fill"
                style={{
                  height: `${Math.min((month.commission / 100) * 100, 100)}%`
                }}
              >
                <span className="bar-value">{formatCurrency(month.commission)}</span>
              </div>
              <div className="bar-label">{month.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="dashboard-actions">
        <button className="action-button primary">
          Generate New Content
        </button>
        <button className="action-button secondary">
          Analyze Performance
        </button>
        <button className="action-button secondary">
          Optimize Campaigns
        </button>
      </div>
    </div>
  );
}

export default RevenueDashboard;
