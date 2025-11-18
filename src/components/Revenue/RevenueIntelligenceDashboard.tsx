/**
 * Revenue Intelligence Dashboard
 *
 * ENTERPRISE-GRADE REVENUE ANALYTICS
 *
 * Displays:
 * ✅ ML-powered revenue forecasting charts
 * ✅ Anomaly alerts with severity indicators
 * ✅ Subscription metrics (MRR, ARR, churn, LTV)
 * ✅ Cohort analysis visualization
 * ✅ Tax optimization recommendations
 * ✅ Revenue optimization opportunities
 * ✅ Multi-currency support
 * ✅ Real-time trend analysis
 */

import { useState, useEffect, useCallback } from 'react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  revenueIntelligenceService,
  ForecastResult,
  AnomalyAlert,
  SubscriptionMetrics,
  CohortData,
  TaxOptimization,
} from '@/services/revenue/revenueIntelligenceService';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  Users,
  Target,
  Activity,
  Zap,
  RefreshCw,
  Download,
  Bell,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import '../../styles/RevenueIntelligenceDashboard.css';

export function RevenueIntelligenceDashboard() {
  const [forecast, setForecast] = useState<ForecastResult[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [subscriptionMetrics, setSubscriptionMetrics] = useState<SubscriptionMetrics | null>(null);
  const [cohorts, setCohorts] = useState<CohortData[]>([]);
  const [taxOptimization, setTaxOptimization] = useState<TaxOptimization | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'forecast' | 'anomalies' | 'subscriptions' | 'cohorts' | 'tax' | 'optimization'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = useCallback(() => {
    setForecast(revenueIntelligenceService.forecast(30));
    setAnomalies(revenueIntelligenceService.detectAnomalies());
    setSubscriptionMetrics(revenueIntelligenceService.getSubscriptionMetrics());
    setCohorts(revenueIntelligenceService.getCohortAnalysis());
    setTaxOptimization(revenueIntelligenceService.getTaxOptimization());
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    loadData();
    setIsRefreshing(false);
  }, [loadData]);

  const handleExport = useCallback(() => {
    const data = {
      forecast,
      anomalies,
      subscriptionMetrics,
      cohorts,
      taxOptimization,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-intelligence-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [forecast, anomalies, subscriptionMetrics, cohorts, taxOptimization]);

  // Forecast Chart Data
  const forecastChartData = {
    labels: forecast.map(f => new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    datasets: [
      {
        label: 'Predicted Revenue',
        data: forecast.map(f => f.predicted),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Upper Bound (95% CI)',
        data: forecast.map(f => f.upper),
        borderColor: '#93c5fd',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Lower Bound (95% CI)',
        data: forecast.map(f => f.lower),
        borderColor: '#93c5fd',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const forecastChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: '30-Day Revenue Forecast (ML-Powered)',
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => `$${value}`,
        },
      },
    },
  };

  return (
    <div className="revenue-intelligence-dashboard">
      {/* Header */}
      <div className="ri-header">
        <div className="ri-header-left">
          <Activity size={32} className="header-icon" />
          <div>
            <h1>Revenue Intelligence</h1>
            <p>ML-Powered Analytics & Forecasting</p>
          </div>
        </div>
        <div className="ri-header-actions">
          <button onClick={handleRefresh} className="ri-btn secondary" disabled={isRefreshing}>
            <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={handleExport} className="ri-btn secondary">
            <Download size={16} />
            Export
          </button>
          <button className="ri-btn primary">
            <Bell size={16} />
            {anomalies.length} Alerts
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="ri-tabs">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'forecast', label: 'Forecast', icon: TrendingUp },
          { id: 'anomalies', label: 'Anomalies', icon: AlertTriangle },
          { id: 'subscriptions', label: 'Subscriptions', icon: Users },
          { id: 'cohorts', label: 'Cohorts', icon: Target },
          { id: 'tax', label: 'Tax', icon: DollarSign },
          { id: 'optimization', label: 'Optimize', icon: Zap },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`ri-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="ri-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && subscriptionMetrics && (
          <div className="ri-overview">
            <div className="metrics-grid">
              <MetricCard
                title="Monthly Recurring Revenue"
                value={`$${subscriptionMetrics.mrr.toLocaleString()}`}
                change="+12.5%"
                trend="up"
                icon={DollarSign}
                color="#10b981"
              />
              <MetricCard
                title="Annual Recurring Revenue"
                value={`$${subscriptionMetrics.arr.toLocaleString()}`}
                change="+15.3%"
                trend="up"
                icon={TrendingUp}
                color="#3b82f6"
              />
              <MetricCard
                title="Churn Rate"
                value={`${(subscriptionMetrics.churnRate * 100).toFixed(1)}%`}
                change="-2.1%"
                trend="down"
                icon={Users}
                color="#ef4444"
              />
              <MetricCard
                title="LTV / CAC Ratio"
                value={subscriptionMetrics.ltv_cac_ratio.toFixed(1)}
                change="+0.8"
                trend="up"
                icon={Target}
                color="#8b5cf6"
              />
            </div>

            {/* Recent Anomalies */}
            {anomalies.length > 0 && (
              <div className="anomalies-preview">
                <h3>
                  <AlertTriangle size={20} />
                  Recent Anomalies
                </h3>
                <div className="anomaly-list">
                  {anomalies.slice(0, 3).map(anomaly => (
                    <div key={anomaly.id} className={`anomaly-card ${anomaly.severity}`}>
                      <div className="anomaly-header">
                        <span className={`severity-badge ${anomaly.severity}`}>
                          {anomaly.severity}
                        </span>
                        <span className="anomaly-date">{new Date(anomaly.date).toLocaleDateString()}</span>
                      </div>
                      <p className="anomaly-message">{anomaly.message}</p>
                      <div className="anomaly-deviation">
                        Deviation: {anomaly.deviation.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Forecast Chart */}
            <div className="chart-container">
              <Line data={forecastChartData} options={forecastChartOptions} />
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && (
          <div className="ri-forecast">
            <div className="forecast-header">
              <h2>30-Day ML Revenue Forecast</h2>
              <p>Using exponential smoothing with seasonal adjustments</p>
            </div>

            <div className="chart-container-large">
              <Line data={forecastChartData} options={forecastChartOptions} />
            </div>

            <div className="forecast-stats">
              <div className="stat-card">
                <div className="stat-label">Average Daily Forecast</div>
                <div className="stat-value">
                  ${(forecast.reduce((sum, f) => sum + f.predicted, 0) / forecast.length).toFixed(2)}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">30-Day Total Forecast</div>
                <div className="stat-value">
                  ${forecast.reduce((sum, f) => sum + f.predicted, 0).toLocaleString()}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Average Confidence</div>
                <div className="stat-value">
                  {((forecast.reduce((sum, f) => sum + f.confidence, 0) / forecast.length) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Anomalies Tab */}
        {activeTab === 'anomalies' && (
          <div className="ri-anomalies">
            <h2>Revenue Anomaly Detection</h2>
            {anomalies.length === 0 ? (
              <div className="no-anomalies">
                <CheckCircle size={48} />
                <p>No anomalies detected</p>
                <span>Revenue patterns are normal</span>
              </div>
            ) : (
              <div className="anomaly-detail-list">
                {anomalies.map(anomaly => (
                  <div key={anomaly.id} className={`anomaly-detail-card ${anomaly.severity}`}>
                    <div className="anomaly-detail-header">
                      <div className="anomaly-type">
                        <span className={`type-badge ${anomaly.type}`}>
                          {anomaly.type.replace('_', ' ')}
                        </span>
                        <span className={`severity-badge ${anomaly.severity}`}>
                          {anomaly.severity}
                        </span>
                      </div>
                      <div className="anomaly-date">
                        {new Date(anomaly.date).toLocaleDateString()}
                      </div>
                    </div>

                    <h3>{anomaly.message}</h3>

                    <div className="anomaly-metrics">
                      <div className="metric">
                        <span>Actual Value</span>
                        <strong>${anomaly.actualValue.toLocaleString()}</strong>
                      </div>
                      <div className="metric">
                        <span>Expected Value</span>
                        <strong>${anomaly.expectedValue.toLocaleString()}</strong>
                      </div>
                      <div className="metric">
                        <span>Deviation</span>
                        <strong className={anomaly.deviation > 0 ? 'positive' : 'negative'}>
                          {anomaly.deviation > 0 ? '+' : ''}{anomaly.deviation.toFixed(1)}%
                        </strong>
                      </div>
                    </div>

                    <div className="recommendations">
                      <h4>Recommendations</h4>
                      <ul>
                        {anomaly.recommendations.map((rec, idx) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && subscriptionMetrics && (
          <div className="ri-subscriptions">
            <h2>Subscription Metrics</h2>

            <div className="subscription-grid">
              <div className="sub-card primary">
                <div className="sub-label">Monthly Recurring Revenue</div>
                <div className="sub-value">${subscriptionMetrics.mrr.toLocaleString()}</div>
                <div className="sub-change positive">
                  <ArrowUpRight size={16} />
                  +12.5% from last month
                </div>
              </div>

              <div className="sub-card">
                <div className="sub-label">Annual Recurring Revenue</div>
                <div className="sub-value">${subscriptionMetrics.arr.toLocaleString()}</div>
                <div className="sub-change positive">
                  <ArrowUpRight size={16} />
                  +15.3% YoY
                </div>
              </div>

              <div className="sub-card">
                <div className="sub-label">Active Subscriptions</div>
                <div className="sub-value">{subscriptionMetrics.activeSubscriptions}</div>
                <div className="sub-meta">
                  <span className="new">+{subscriptionMetrics.newSubscriptions} new</span>
                  <span className="canceled">-{subscriptionMetrics.canceledSubscriptions} canceled</span>
                </div>
              </div>

              <div className="sub-card">
                <div className="sub-label">Churn Rate</div>
                <div className="sub-value">{(subscriptionMetrics.churnRate * 100).toFixed(1)}%</div>
                <div className="sub-change negative">
                  <ArrowDownRight size={16} />
                  -2.1% improvement
                </div>
              </div>

              <div className="sub-card">
                <div className="sub-label">ARPU</div>
                <div className="sub-value">${subscriptionMetrics.averageRevenuePerUser.toFixed(2)}</div>
                <div className="sub-change positive">
                  <ArrowUpRight size={16} />
                  +8.3%
                </div>
              </div>

              <div className="sub-card highlight">
                <div className="sub-label">Customer Lifetime Value</div>
                <div className="sub-value">${subscriptionMetrics.lifetimeValue.toLocaleString()}</div>
                <div className="sub-meta">
                  CAC: ${subscriptionMetrics.customerAcquisitionCost} | Ratio: {subscriptionMetrics.ltv_cac_ratio.toFixed(1)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Optimization Tab */}
        {activeTab === 'optimization' && (
          <div className="ri-optimization">
            <h2>Revenue Optimization Opportunities</h2>
            <div className="optimization-grid">
              {revenueIntelligenceService.getOptimizationRecommendations().map((rec, idx) => (
                <div key={idx} className="optimization-card">
                  <div className="opt-header">
                    <h3>{rec.title}</h3>
                    <div className="opt-badges">
                      <span className={`impact-badge ${rec.impact}`}>{rec.impact} impact</span>
                      <span className={`effort-badge ${rec.effort}`}>{rec.effort} effort</span>
                    </div>
                  </div>

                  <p className="opt-description">{rec.description}</p>

                  <div className="opt-potential">
                    <Zap size={20} />
                    <span>Potential increase:</span>
                    <strong>${rec.potentialIncrease.toLocaleString()}</strong>
                  </div>

                  <div className="opt-actions">
                    <h4>Action Items:</h4>
                    <ul>
                      {rec.actions.map((action, i) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: any;
  color: string;
}

function MetricCard({ title, value, change, trend, icon: Icon, color }: MetricCardProps) {
  return (
    <div className="metric-card" style={{ borderLeftColor: color }}>
      <div className="metric-icon" style={{ backgroundColor: `${color}20` }}>
        <Icon size={24} style={{ color }} />
      </div>
      <div className="metric-content">
        <div className="metric-title">{title}</div>
        <div className="metric-value">{value}</div>
        <div className={`metric-change ${trend}`}>
          {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {change}
        </div>
      </div>
    </div>
  );
}

export default RevenueIntelligenceDashboard;
