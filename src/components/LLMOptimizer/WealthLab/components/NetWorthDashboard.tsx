import { useState, useMemo, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { exportService } from '@/services/wealth/exportService';
import { useToast } from '@/components/ui';
import { TrendingUp, TrendingDown, Download, Calendar } from 'lucide-react';

export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | '5Y' | 'ALL';

const NetWorthDashboard = memo(function NetWorthDashboard() {
  const netWorth = useWealthStore((state) => state.netWorth);
  const netWorthHistory = useWealthStore((state) => state.netWorthHistory);
  const { showToast } = useToast();
  const [period, setPeriod] = useState<TimePeriod>('1Y');
  const [comparePeriod, setComparePeriod] = useState<boolean>(false);

  const filteredHistory = useMemo(() => {
    if (!netWorthHistory.length) return [];
    
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1D':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '1W':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '1M':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case '5Y':
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      case 'ALL':
        return netWorthHistory;
    }
    
    return netWorthHistory.filter(h => h.date >= startDate && h.date <= endDate);
  }, [netWorthHistory, period]);

  const comparisonHistory = useMemo(() => {
    if (!comparePeriod || !filteredHistory.length) return null;
    
    const periodDays = filteredHistory.length > 0 
      ? Math.floor((filteredHistory[filteredHistory.length - 1].date.getTime() - filteredHistory[0].date.getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    
    const comparisonStart = new Date(filteredHistory[0].date);
    comparisonStart.setDate(comparisonStart.getDate() - periodDays);
    const comparisonEnd = new Date(filteredHistory[0].date);
    
    return netWorthHistory.filter(h => h.date >= comparisonStart && h.date <= comparisonEnd);
  }, [filteredHistory, comparePeriod, netWorthHistory]);

  const netWorthChange = useMemo(() => {
    if (!netWorth || filteredHistory.length < 2) return { amount: 0, percentage: 0 };
    const previous = filteredHistory[0];
    const current = filteredHistory[filteredHistory.length - 1];
    const change = current.netWorth - previous.netWorth;
    const percentage = previous.netWorth > 0 ? (change / previous.netWorth) * 100 : 0;
    return { amount: change, percentage };
  }, [netWorth, filteredHistory]);

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
    if (filteredHistory.length === 0) return null;
    const maxNetWorth = Math.max(...filteredHistory.map((h) => h.netWorth));
    const minNetWorth = Math.min(...filteredHistory.map((h) => h.netWorth));
    const range = maxNetWorth - minNetWorth || 1;
    
    const points = filteredHistory
      .map((h, idx) => {
        const dataLength = filteredHistory.length;
        const x = dataLength === 1 
          ? 400 
          : (idx / (dataLength - 1)) * 800;
        const y = 200 - ((h.netWorth - minNetWorth) / range) * 200;
        return `${x},${y}`;
      })
      .join(' ');
    
    const comparisonPoints = comparisonHistory && comparisonHistory.length > 0
      ? comparisonHistory
          .map((h, idx) => {
            const dataLength = comparisonHistory.length;
            const x = dataLength === 1 
              ? 400 
              : (idx / (dataLength - 1)) * 800;
            const y = 200 - ((h.netWorth - minNetWorth) / range) * 200;
            return `${x},${y}`;
          })
          .join(' ')
      : null;
    
    return { points, comparisonPoints, maxNetWorth, minNetWorth, range };
  }, [filteredHistory, comparisonHistory]);

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

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const blob = await exportService.export({
        format,
        type: 'net_worth_history',
        startDate: filteredHistory[0]?.date,
        endDate: filteredHistory[filteredHistory.length - 1]?.date,
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `net-worth-history-${period}-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      showToast({
        variant: 'error',
        title: 'Export failed',
        message: 'Failed to export data. Please try again.',
      });
    }
  };

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
      {/* Header with Controls */}
      <div className="net-worth-header">
        <div className="net-worth-title-section">
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
        
        <div className="net-worth-controls">
          <div className="period-selector-group">
            <Calendar size={16} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as TimePeriod)}
              className="period-selector"
            >
              <option value="1D">1 Day</option>
              <option value="1W">1 Week</option>
              <option value="1M">1 Month</option>
              <option value="3M">3 Months</option>
              <option value="6M">6 Months</option>
              <option value="1Y">1 Year</option>
              <option value="5Y">5 Years</option>
              <option value="ALL">All Time</option>
            </select>
          </div>
          
          <label className="compare-toggle">
            <input
              type="checkbox"
              checked={comparePeriod}
              onChange={(e) => setComparePeriod(e.target.checked)}
            />
            <span>Compare</span>
          </label>
          
          <div className="export-dropdown">
            <button className="export-button" title="Export">
              <Download size={16} />
            </button>
            <div className="export-menu">
              <button onClick={() => handleExport('csv')}>Export as CSV</button>
              <button onClick={() => handleExport('excel')}>Export as Excel</button>
              <button onClick={() => handleExport('pdf')}>Export as PDF</button>
            </div>
          </div>
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

      {/* Enhanced Historical Chart */}
      {chartData && (
        <div className="net-worth-chart">
          <h3>Net Worth History - {period}</h3>
          <div className="chart-container">
            <svg width="100%" height="300" viewBox="0 0 800 300" className="net-worth-chart-svg">
              <defs>
                <linearGradient id="netWorthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--violet-500)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--violet-500)" stopOpacity="0" />
                </linearGradient>
                {comparePeriod && (
                  <linearGradient id="comparisonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--cyan-500)" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="var(--cyan-500)" stopOpacity="0" />
                  </linearGradient>
                )}
              </defs>
              
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={`grid-${i}`}>
                  <line
                    x1="0"
                    y1={(i * 300) / 4}
                    x2="800"
                    y2={(i * 300) / 4}
                    stroke="rgba(139, 92, 246, 0.1)"
                    strokeWidth="1"
                  />
                  <text
                    x="10"
                    y={(i * 300) / 4 + 5}
                    fill="rgba(255, 255, 255, 0.5)"
                    fontSize="10"
                  >
                    ${((chartData.maxNetWorth - (chartData.range * i / 4)) / 1000).toFixed(0)}k
                  </text>
                </g>
              ))}
              
              {/* Comparison area (if enabled) */}
              {comparePeriod && chartData.comparisonPoints && (
                <>
                  <polygon
                    points={`0,300 ${chartData.comparisonPoints} 800,300`}
                    fill="url(#comparisonGradient)"
                  />
                  <polyline
                    points={chartData.comparisonPoints}
                    fill="none"
                    stroke="var(--cyan-500)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.7"
                  />
                </>
              )}
              
              {/* Current period area and line */}
              <polygon
                points={`0,300 ${chartData.points} 800,300`}
                fill="url(#netWorthGradient)"
              />
              <polyline
                points={chartData.points}
                fill="none"
                stroke="var(--violet-500)"
                strokeWidth="3"
              />
              
              {/* Data points */}
              {filteredHistory.map((h, idx) => {
                const dataLength = filteredHistory.length;
                const x = dataLength === 1 ? 400 : (idx / (dataLength - 1)) * 800;
                const y = 300 - ((h.netWorth - chartData.minNetWorth) / chartData.range) * 300;
                return (
                  <circle
                    key={idx}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="var(--violet-500)"
                    className="chart-point"
                    data-date={h.date.toISOString().split('T')[0]}
                    data-value={h.netWorth}
                  />
                );
              })}
            </svg>
          </div>
          {comparePeriod && (
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color current"></div>
                <span>Current Period</span>
              </div>
              <div className="legend-item">
                <div className="legend-color comparison"></div>
                <span>Previous Period</span>
              </div>
            </div>
          )}
        </div>
      )}

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
    </div>
  );
});

export default NetWorthDashboard;
