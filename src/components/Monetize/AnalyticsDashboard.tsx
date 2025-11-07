import { useEffect, useMemo } from 'react';
import { useMonetizeStore } from '../../services/monetize/monetizeStore';
import '../../styles/MonetizeWorkflow.css';

function AnalyticsDashboard() {
  const { analytics, recommendations, generateRecommendations, selectedPeriod, refresh } = useMonetizeStore();

  useEffect(() => {
    refresh();
    generateRecommendations('SaaS Product');
  }, [refresh, generateRecommendations]);

  const formatCurrency = useMemo(
    () => (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    },
    []
  );

  if (!analytics) {
    return (
      <div className="analytics-dashboard">
        <div className="empty-state">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h3>Revenue Analytics</h3>
        <div className="period-selector">
          <span>
            {selectedPeriod.start.toLocaleDateString()} - {selectedPeriod.end.toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">{formatCurrency(analytics.totalRevenue)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Monthly Recurring Revenue</div>
          <div className="metric-value">{formatCurrency(analytics.monthlyRecurringRevenue)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Annual Recurring Revenue</div>
          <div className="metric-value">{formatCurrency(analytics.annualRecurringRevenue)}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Average Revenue Per User</div>
          <div className="metric-value">{formatCurrency(analytics.averageRevenuePerUser)}</div>
        </div>
      </div>

      <div className="revenue-breakdown">
        <h4>Revenue by Stream</h4>
        <div className="breakdown-list">
          {Object.entries(analytics.byStream)
            .sort(([, a], [, b]) => b - a)
            .map(([stream, amount]) => (
              <div key={stream} className="breakdown-item">
                <span className="breakdown-label">{stream}</span>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill"
                    style={{
                      width: `${(amount / analytics.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
                <span className="breakdown-value">{formatCurrency(amount)}</span>
              </div>
            ))}
        </div>
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations">
          <h4>Monetization Recommendations</h4>
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={`recommendation-card ${rec.impact}`}>
                <div className="recommendation-header">
                  <h5>{rec.title}</h5>
                  <span className={`impact-badge ${rec.impact}`}>{rec.impact} impact</span>
                </div>
                <p>{rec.description}</p>
                <div className="action-items">
                  <strong>Action Items:</strong>
                  <ul>
                    {rec.actionItems.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsDashboard;

