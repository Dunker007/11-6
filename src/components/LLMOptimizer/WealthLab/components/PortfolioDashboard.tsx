import { useEffect, useMemo, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { Card, CardHeader, CardBody } from '@/components/ui';

const PortfolioDashboard = memo(function PortfolioDashboard() {
  const {
    netWorthHistory,
    portfolios,
    selectedPortfolioId,
    loadPortfolios,
    updatePortfolioPerformance,
  } = useWealthStore();

  useEffect(() => {
    loadPortfolios();
  }, [loadPortfolios]);

  const selectedPortfolio = useMemo(() => {
    if (!selectedPortfolioId) return portfolios[0] || null;
    return portfolios.find(p => p.id === selectedPortfolioId) || null;
  }, [portfolios, selectedPortfolioId]);

  const portfolioValue = useMemo(() => {
    if (!selectedPortfolio) return 0;
    return selectedPortfolio.holdings.reduce((sum, pos) => {
      return sum + (pos.costBasis + pos.unrealizedPL / pos.quantity) * pos.quantity;
    }, 0);
  }, [selectedPortfolio]);

  const dailyChange = useMemo(() => {
    if (!selectedPortfolio) return { amount: 0, percent: 0 };
    return {
      amount: selectedPortfolio.performance.totalReturn,
      percent: selectedPortfolio.performance.totalReturnPercent,
    };
  }, [selectedPortfolio]);

  const bestPerformer = useMemo(() => {
    if (!selectedPortfolio || selectedPortfolio.holdings.length === 0) return null;
    return [...selectedPortfolio.holdings].sort((a, b) => b.unrealizedPLPercent - a.unrealizedPLPercent)[0];
  }, [selectedPortfolio]);

  const worstPerformer = useMemo(() => {
    if (!selectedPortfolio || selectedPortfolio.holdings.length === 0) return null;
    return [...selectedPortfolio.holdings].sort((a, b) => a.unrealizedPLPercent - b.unrealizedPLPercent)[0];
  }, [selectedPortfolio]);

  const cryptoAllocation = useMemo(() => {
    if (!selectedPortfolio) return 0;
    return selectedPortfolio.allocation.crypto || 0;
  }, [selectedPortfolio]);

  const chartData = useMemo(() => {
    if (netWorthHistory.length === 0) return null;
    const slicedHistory = netWorthHistory.slice(-30);
    const maxNetWorth = Math.max(...slicedHistory.map(h => h.netWorth));
    const minNetWorth = Math.min(...slicedHistory.map(h => h.netWorth));
    const range = maxNetWorth - minNetWorth || 1;
    
    const points = slicedHistory
      .map((h, idx) => {
        const dataLength = slicedHistory.length;
        const x = dataLength === 1 ? 400 : (idx / (dataLength - 1)) * 800;
        const y = 200 - ((h.netWorth - minNetWorth) / range) * 200;
        return `${x},${y}`;
      })
      .join(' ');
    
    return { points, maxNetWorth, minNetWorth, range };
  }, [netWorthHistory]);

  const assetBreakdown = useMemo(() => {
    if (!selectedPortfolio) return [];
    return Object.entries(selectedPortfolio.allocation)
      .filter(([_, value]) => value > 0)
      .sort(([_, a], [__, b]) => b - a)
      .map(([type, value]) => ({
        type,
        value,
        percentage: value,
      }));
  }, [selectedPortfolio]);

  useEffect(() => {
    if (selectedPortfolioId) {
      updatePortfolioPerformance(selectedPortfolioId);
    }
  }, [selectedPortfolioId, updatePortfolioPerformance]);

  if (!selectedPortfolio) {
    return (
      <div className="portfolio-dashboard">
        <Card>
          <CardBody>
            <div className="portfolio-empty">
              <p>No portfolio selected</p>
              <p className="empty-hint">Create a portfolio to get started</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="portfolio-dashboard">
      {/* Net Worth Summary */}
      <Card>
        <CardHeader>
          <h2>Portfolio Value</h2>
        </CardHeader>
        <CardBody>
          <div className="portfolio-header">
            <div className="portfolio-value">${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className={`portfolio-change ${dailyChange.amount >= 0 ? 'positive' : 'negative'}`}>
              {dailyChange.amount >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              <span>
                ${Math.abs(dailyChange.amount).toLocaleString()} ({dailyChange.percent >= 0 ? '+' : ''}
                {dailyChange.percent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Quick Stats Grid */}
      <div className="portfolio-stats-grid">
        <Card>
          <CardBody>
            <div className="stat-label">Total Portfolio Value</div>
            <div className="stat-value">${portfolioValue.toLocaleString()}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="stat-label">Daily Change</div>
            <div className={`stat-value ${dailyChange.amount >= 0 ? 'positive' : 'negative'}`}>
              {dailyChange.amount >= 0 ? '+' : ''}${dailyChange.amount.toLocaleString()} ({dailyChange.percent >= 0 ? '+' : ''}
              {dailyChange.percent.toFixed(2)}%)
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="stat-label">Best Performer</div>
            <div className="stat-value">
              {bestPerformer ? `${bestPerformer.symbol}: +${bestPerformer.unrealizedPLPercent.toFixed(2)}%` : 'N/A'}
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="stat-label">Worst Performer</div>
            <div className="stat-value">
              {worstPerformer ? `${worstPerformer.symbol}: ${worstPerformer.unrealizedPLPercent.toFixed(2)}%` : 'N/A'}
            </div>
          </CardBody>
        </Card>
        <Card className="crypto-highlight">
          <CardBody>
            <div className="stat-label">Crypto Allocation</div>
            <div className="stat-value crypto">{cryptoAllocation.toFixed(1)}%</div>
            <div className="stat-hint">Target: 25%</div>
          </CardBody>
        </Card>
      </div>

      {/* Performance Chart */}
      {chartData && (
        <Card>
          <CardHeader>
            <h3>Performance History</h3>
          </CardHeader>
          <CardBody>
            <div className="chart-container">
              <svg width="100%" height="200" viewBox="0 0 800 200">
                <defs>
                  <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--violet-500)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--violet-500)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3, 4].map((i) => (
                  <line
                    key={`grid-${i}`}
                    x1="0"
                    y1={(i * 200) / 4}
                    x2="800"
                    y2={(i * 200) / 4}
                    stroke="rgba(139, 92, 246, 0.1)"
                    strokeWidth="1"
                  />
                ))}
                <polygon
                  points={`0,200 ${chartData.points} 800,200`}
                  fill="url(#portfolioGradient)"
                />
                <polyline
                  points={chartData.points}
                  fill="none"
                  stroke="var(--violet-500)"
                  strokeWidth="2"
                />
              </svg>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Asset Allocation */}
      <Card>
        <CardHeader>
          <h3>
            <PieChart size={20} />
            Asset Allocation
          </h3>
        </CardHeader>
        <CardBody>
          <div className="allocation-list">
            {assetBreakdown.map(({ type, percentage }) => (
              <div key={type} className="allocation-item">
                <div className="allocation-header">
                  <span className="allocation-type">{type.replace('_', ' ').toUpperCase()}</span>
                  <span className="allocation-percentage">{percentage.toFixed(1)}%</span>
                </div>
                <div className="allocation-bar">
                  <div
                    className="allocation-bar-fill"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
});

export default PortfolioDashboard;

