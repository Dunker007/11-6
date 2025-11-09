import { useMemo, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { WEALTH_CONSTANTS } from '@/utils/constants';

const NetWorthDashboard = memo(function NetWorthDashboard() {
  const netWorth = useWealthStore((state) => state.netWorth);
  const netWorthHistory = useWealthStore((state) => state.netWorthHistory);

  const netWorthChange = useMemo(() => {
    if (!netWorth || netWorthHistory.length < 2) return { amount: 0, percentage: 0 };
    const previous = netWorthHistory[netWorthHistory.length - 2];
    const change = netWorth.netWorth - previous.netWorth;
    const percentage = previous.netWorth > 0 ? (change / previous.netWorth) * 100 : 0;
    return { amount: change, percentage };
  }, [netWorth, netWorthHistory]);

  const ytdChange = useMemo(() => {
    if (!netWorth || netWorthHistory.length === 0) return { amount: 0, percentage: 0 };
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    const yearStartNetWorth = netWorthHistory.find((h) => h.date >= yearStart);
    if (!yearStartNetWorth) return { amount: 0, percentage: 0 };
    const change = netWorth.netWorth - yearStartNetWorth.netWorth;
    const percentage = yearStartNetWorth.netWorth > 0 ? (change / yearStartNetWorth.netWorth) * 100 : 0;
    return { amount: change, percentage };
  }, [netWorth, netWorthHistory]);

  const chartData = useMemo(() => {
    if (netWorthHistory.length === 0) return null;
    const slicedHistory = netWorthHistory.slice(-WEALTH_CONSTANTS.NET_WORTH_CHART_POINTS);
    const maxNetWorth = Math.max(...slicedHistory.map((h) => h.netWorth));
    const minNetWorth = Math.min(...slicedHistory.map((h) => h.netWorth));
    const range = maxNetWorth - minNetWorth || 1;
    
    const points = slicedHistory
      .map((h, idx) => {
        const dataLength = slicedHistory.length;
        const x = dataLength === 1 
          ? 400 
          : (idx / (dataLength - 1)) * 800;
        const y = 200 - ((h.netWorth - minNetWorth) / range) * 200;
        return `${x},${y}`;
      })
      .join(' ');
    
    return { points, maxNetWorth, minNetWorth, range };
  }, [netWorthHistory]);

  const assetBreakdown = useMemo(() => {
    if (!netWorth) return [];
    return Object.entries(netWorth.breakdown.assets)
      .filter(([_, value]) => value > 0)
      .sort(([_, a], [__, b]) => b - a)
      .map(([type, value]) => ({
        type,
        value,
        percentage: (value / netWorth.totalAssets) * 100,
      }));
  }, [netWorth]);

  const liabilityBreakdown = useMemo(() => {
    if (!netWorth || netWorth.totalLiabilities === 0) return [];
    return Object.entries(netWorth.breakdown.liabilities)
      .filter(([_, value]) => value > 0)
      .sort(([_, a], [__, b]) => b - a)
      .map(([type, value]) => ({
        type,
        value,
        percentage: (value / netWorth.totalLiabilities) * 100,
      }));
  }, [netWorth]);

  if (!netWorth) {
    return (
      <div className="net-worth-dashboard">
        <div className="net-worth-empty">
          <p>No net worth data available</p>
          <p className="empty-hint">Add accounts and assets to calculate your net worth</p>
        </div>
      </div>
    );
  }

  return (
    <div className="net-worth-dashboard">
      {/* Total Net Worth */}
      <div className="net-worth-header">
        <div className="net-worth-label">Net Worth</div>
        <div className="net-worth-value">${netWorth.netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        <div className={`net-worth-change ${netWorthChange.amount >= 0 ? 'positive' : 'negative'}`}>
          {netWorthChange.amount >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span>
            ${Math.abs(netWorthChange.amount).toLocaleString()} ({netWorthChange.percentage >= 0 ? '+' : ''}
            {netWorthChange.percentage.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="net-worth-stats">
        <div className="net-worth-stat">
          <div className="stat-label">Total Assets</div>
          <div className="stat-value">${netWorth.totalAssets.toLocaleString()}</div>
        </div>
        <div className="net-worth-stat">
          <div className="stat-label">Total Liabilities</div>
          <div className="stat-value">${netWorth.totalLiabilities.toLocaleString()}</div>
        </div>
        <div className="net-worth-stat">
          <div className="stat-label">YTD Change</div>
          <div className={`stat-value ${ytdChange.amount >= 0 ? 'positive' : 'negative'}`}>
            {ytdChange.amount >= 0 ? '+' : ''}${ytdChange.amount.toLocaleString()} ({ytdChange.percentage >= 0 ? '+' : ''}
            {ytdChange.percentage.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Asset Breakdown */}
      <div className="asset-breakdown">
        <h3>Asset Breakdown</h3>
        <div className="breakdown-list">
          {assetBreakdown.map(({ type, value, percentage }) => (
            <div key={type} className="breakdown-item">
              <div className="breakdown-header">
                <span className="breakdown-type">{type.replace('_', ' ').toUpperCase()}</span>
                <span className="breakdown-value">${value.toLocaleString()}</span>
              </div>
              <div className="breakdown-bar">
                <div
                  className="breakdown-bar-fill"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="breakdown-percentage">{percentage.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Liability Breakdown */}
      {liabilityBreakdown.length > 0 && (
        <div className="liability-breakdown">
          <h3>Liability Breakdown</h3>
          <div className="breakdown-list">
            {liabilityBreakdown.map(({ type, value, percentage }) => (
              <div key={type} className="breakdown-item">
                <div className="breakdown-header">
                  <span className="breakdown-type">{type.replace('_', ' ').toUpperCase()}</span>
                  <span className="breakdown-value">${value.toLocaleString()}</span>
                </div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-bar-fill liability"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="breakdown-percentage">{percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Chart (Simple SVG) */}
      {chartData && (
        <div className="net-worth-chart">
          <h3>Net Worth History</h3>
          <div className="chart-container">
            <svg width="100%" height="200" viewBox="0 0 800 200">
              <defs>
                <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--violet-500)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--violet-500)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid lines */}
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
              {/* Net worth area and line */}
              <polygon
                points={`0,200 ${chartData.points} 800,200`}
                fill="url(#netWorthGradient)"
              />
              <polyline
                points={chartData.points}
                fill="none"
                stroke="var(--violet-500)"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
});

export default NetWorthDashboard;
