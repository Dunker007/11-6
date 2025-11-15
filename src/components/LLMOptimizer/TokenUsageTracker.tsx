import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useFinancialStore } from '@/services/backoffice/financialStore';
import { tokenTrackingService } from '@/services/ai/tokenTrackingService';
import '../../styles/LLMOptimizer.css';

const TokenUsageTracker = () => {
  const { expenses } = useFinancialStore();
  const [dateRange, setDateRange] = useState<'daily' | 'weekly' | 'monthly'>('monthly');

  // Filter API costs
  const apiCosts = useMemo(() => {
    if (!expenses) return [];
    return expenses.filter((exp) => exp.category === 'api_costs');
  }, [expenses]);

  // Get real token usage data from tracking service
  const tokenUsage = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const usage = tokenTrackingService.getTotalUsage(startDate, now);
    return {
      tokens: usage.tokens,
      cost: usage.cost || 0,
    };
  }, [dateRange]);

  // Get stats by provider for breakdown
  const providerStats = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case 'daily':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return tokenTrackingService.getStatsByProvider(startDate, now);
  }, [dateRange]);

  // Combine provider stats with expense-based costs
  const costsByProvider = useMemo(() => {
    const providerMap: Record<string, number> = {};
    
    // Add expense-based costs
    apiCosts.forEach((exp) => {
      const provider = exp.description?.toLowerCase().includes('gemini')
        ? 'Gemini'
        : exp.description?.toLowerCase().includes('openai')
        ? 'OpenAI'
        : exp.description?.toLowerCase().includes('anthropic')
        ? 'Anthropic'
        : 'Other';
      providerMap[provider] = (providerMap[provider] || 0) + exp.amount;
    });

    // Add token-based costs (if available)
    providerStats.forEach((stat) => {
      const providerName = stat.provider.charAt(0).toUpperCase() + stat.provider.slice(1);
      providerMap[providerName] = (providerMap[providerName] || 0) + stat.totalCost;
    });

    return Object.entries(providerMap).map(([name, amount]) => ({ name, amount }));
  }, [apiCosts, providerStats]);

  // Calculate total cost including token-based costs
  const totalCost = useMemo(() => {
    const expenseCost = apiCosts.reduce((sum, exp) => sum + exp.amount, 0);
    const tokenCost = providerStats.reduce((sum, stat) => sum + stat.totalCost, 0);
    return expenseCost + tokenCost;
  }, [apiCosts, providerStats]);

  if (tokenUsage.tokens === 0 && costsByProvider.length === 0) {
    return (
      <div className="token-usage-card">
        <div className="card-header">
          <DollarSign size={18} />
          <h3>Token Usage & Costs</h3>
        </div>
        <div className="card-content">
          <p className="empty-message">No token usage data available. Token tracking will appear here when API calls are made.</p>
        </div>
      </div>
    );
  }

  // Calculate pie chart angles for cost breakdown
  const pieData = useMemo(() => {
    if (costsByProvider.length === 0) return [];
    const total = costsByProvider.reduce((sum, p) => sum + p.amount, 0);
    let currentAngle = 0;
    return costsByProvider.map((provider) => {
      const percentage = (provider.amount / total) * 100;
      const angle = (provider.amount / total) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return {
        ...provider,
        percentage,
        angle,
        startAngle,
      };
    });
  }, [costsByProvider]);

  const colors = ['var(--violet-500)', 'var(--cyan-500)', 'var(--amber-500)', 'var(--emerald-500)', 'var(--red-500)'];

  return (
    <div className="token-usage-card">
      <div className="card-header">
        <div className="header-left">
          <DollarSign size={18} />
          <h3>Token Usage & Costs</h3>
        </div>
        <div className="date-range-selector">
          {(['daily', 'weekly', 'monthly'] as const).map((range) => (
            <button
              key={range}
              className={`range-btn ${dateRange === range ? 'active' : ''}`}
              onClick={() => setDateRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card-content">
        <div className="usage-summary">
          <div className="summary-card">
            <div className="summary-icon">
              <TrendingUp size={20} />
            </div>
            <div className="summary-info">
              <div className="summary-label">Tokens Used</div>
              <div className="summary-value-large">
                {tokenUsage.tokens.toLocaleString()}
              </div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">
              <DollarSign size={20} />
            </div>
            <div className="summary-info">
              <div className="summary-label">Total Cost</div>
              <div className="summary-value-large">
                ${totalCost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {costsByProvider.length > 0 && (
          <div className="cost-breakdown">
            <h4>Cost Breakdown by Provider</h4>
            <div className="breakdown-content">
              <div className="pie-chart-container">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="var(--bg-tertiary)"
                    strokeWidth="40"
                  />
                  {pieData.map((item, index) => {
                    const startAngleRad = (item.startAngle - 90) * (Math.PI / 180);
                    const endAngleRad = (item.startAngle + item.angle - 90) * (Math.PI / 180);
                    const x1 = 100 + 80 * Math.cos(startAngleRad);
                    const y1 = 100 + 80 * Math.sin(startAngleRad);
                    const x2 = 100 + 80 * Math.cos(endAngleRad);
                    const y2 = 100 + 80 * Math.sin(endAngleRad);
                    const largeArc = item.angle > 180 ? 1 : 0;

                    return (
                      <path
                        key={item.name}
                        d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={colors[index % colors.length]}
                        opacity="0.8"
                      />
                    );
                  })}
                </svg>
              </div>
              <div className="breakdown-legend">
                {pieData.map((item, index) => (
                  <div key={item.name} className="legend-item">
                    <div
                      className="legend-color"
                      style={{ background: colors[index % colors.length] }}
                    />
                    <div className="legend-info">
                      <span className="legend-name">{item.name}</span>
                      <span className="legend-value">
                        ${item.amount.toFixed(2)} ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenUsageTracker;

