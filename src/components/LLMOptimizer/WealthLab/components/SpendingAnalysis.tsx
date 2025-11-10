import { useMemo, useState, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { wealthService } from '@/services/wealth/wealthService';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { BudgetCategory } from '@/types/wealth';
import '@/styles/WealthLab.css';

interface SpendingAnalysisProps {
  month: number;
  year: number;
}

type TimePeriod = '3M' | '6M' | '1Y' | 'ALL';

interface TrendData {
  month: string;
  total: number;
  previousTotal?: number;
  change?: number;
  changePercent?: number;
}

interface CategoryTrend {
  category: BudgetCategory;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
}

interface ForecastData {
  month: string;
  forecasted: number;
  confidence: number;
}

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#14b8a6'];

const SpendingAnalysis = memo(function SpendingAnalysis({ month, year }: SpendingAnalysisProps) {
  const transactions = useWealthStore((state) => state.transactions);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('6M');
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | 'all'>('all');

  // Calculate trend data
  const trendData = useMemo(() => {
    const periods = timePeriod === '3M' ? 3 : timePeriod === '6M' ? 6 : timePeriod === '1Y' ? 12 : 24;
    const trends: TrendData[] = [];

    for (let i = periods - 1; i >= 0; i--) {
      const targetDate = new Date(year, month - 1 - i, 1);
      const targetMonth = targetDate.getMonth() + 1;
      const targetYear = targetDate.getFullYear();
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const monthTransactions = transactions.filter(
        (tx) => tx.date >= startDate && tx.date <= endDate && tx.type === 'expense'
      );

      const total = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      const prevDate = new Date(targetYear, targetMonth - 2, 1);
      const prevEndDate = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59);
      const prevTransactions = transactions.filter(
        (tx) => tx.date >= prevDate && tx.date <= prevEndDate && tx.type === 'expense'
      );
      const previousTotal = prevTransactions.reduce((sum, tx) => sum + tx.amount, 0);

      const change = total - previousTotal;
      const changePercent = previousTotal > 0 ? (change / previousTotal) * 100 : 0;

      trends.push({
        month: targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total,
        previousTotal: i > 0 ? previousTotal : undefined,
        change: i > 0 ? change : undefined,
        changePercent: i > 0 ? changePercent : undefined,
      });
    }

    return trends;
  }, [transactions, month, year, timePeriod]);

  // Current month analysis
  const currentAnalysis = useMemo(() => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const monthTransactions = transactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate && tx.type === 'expense'
    );

    const byCategory: Record<BudgetCategory, number> = {
      housing: 0,
      food: 0,
      transportation: 0,
      utilities: 0,
      healthcare: 0,
      entertainment: 0,
      shopping: 0,
      personal_care: 0,
      education: 0,
      travel: 0,
      debt_payment: 0,
      savings: 0,
      investments: 0,
      insurance: 0,
      gifts: 0,
      charity: 0,
      other: 0,
    };

    monthTransactions.forEach((tx) => {
      byCategory[tx.category] = (byCategory[tx.category] || 0) + tx.amount;
    });

    const total = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    const topCategories = Object.entries(byCategory)
      .filter(([_, amount]) => amount > 0)
      .sort(([_, a], [__, b]) => b - a)
      .slice(0, 8)
      .map(([cat, amount]) => ({
        name: cat.replace('_', ' ').toUpperCase(),
        value: amount,
        category: cat as BudgetCategory,
      }));

    return { total, byCategory, topCategories };
  }, [transactions, month, year]);

  // Category trends (comparing current month to previous month)
  const categoryTrends = useMemo(() => {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const currentTransactions = transactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate && tx.type === 'expense'
    );

    const prevStartDate = new Date(year, month - 2, 1);
    const prevEndDate = new Date(year, month - 1, 0, 23, 59, 59);
    const prevTransactions = transactions.filter(
      (tx) => tx.date >= prevStartDate && tx.date <= prevEndDate && tx.type === 'expense'
    );

    const currentByCategory: Record<BudgetCategory, number> = {
      housing: 0,
      food: 0,
      transportation: 0,
      utilities: 0,
      healthcare: 0,
      entertainment: 0,
      shopping: 0,
      personal_care: 0,
      education: 0,
      travel: 0,
      debt_payment: 0,
      savings: 0,
      investments: 0,
      insurance: 0,
      gifts: 0,
      charity: 0,
      other: 0,
    };

    const prevByCategory: Record<BudgetCategory, number> = {
      housing: 0,
      food: 0,
      transportation: 0,
      utilities: 0,
      healthcare: 0,
      entertainment: 0,
      shopping: 0,
      personal_care: 0,
      education: 0,
      travel: 0,
      debt_payment: 0,
      savings: 0,
      investments: 0,
      insurance: 0,
      gifts: 0,
      charity: 0,
      other: 0,
    };

    currentTransactions.forEach((tx) => {
      currentByCategory[tx.category] = (currentByCategory[tx.category] || 0) + tx.amount;
    });

    prevTransactions.forEach((tx) => {
      prevByCategory[tx.category] = (prevByCategory[tx.category] || 0) + tx.amount;
    });

    const trends: CategoryTrend[] = Object.keys(currentByCategory).map((cat) => {
      const category = cat as BudgetCategory;
      const current = currentByCategory[category];
      const previous = prevByCategory[category];
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : (current > 0 ? 100 : 0);

      return {
        category,
        current,
        previous,
        change,
        changePercent,
      };
    });

    return trends.filter((t) => t.current > 0 || t.previous > 0).sort((a, b) => b.current - a.current);
  }, [transactions, month, year]);

  // Forecast next month spending
  const forecastData = useMemo(() => {
    const periods = 6; // Use last 6 months for forecasting
    const historical: number[] = [];

    for (let i = periods; i >= 1; i--) {
      const targetDate = new Date(year, month - i, 1);
      const targetMonth = targetDate.getMonth() + 1;
      const targetYear = targetDate.getFullYear();
      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

      const monthTransactions = transactions.filter(
        (tx) => tx.date >= startDate && tx.date <= endDate && tx.type === 'expense'
      );

      const total = monthTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      historical.push(total);
    }

    // Simple moving average forecast
    const avg = historical.reduce((sum, val) => sum + val, 0) / historical.length;
    const variance = historical.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / historical.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / avg) * 100));

    const nextMonth = new Date(year, month, 1);
    const forecast: ForecastData[] = [
      {
        month: nextMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        forecasted: avg,
        confidence: Math.round(confidence),
      },
    ];

    return forecast;
  }, [transactions, month, year]);

  // Budget vs Actual
  const budgetVsActual = useMemo(() => {
    const budgetData = wealthService.getBudgetVsActual(month, year);
    return Object.entries(budgetData).map(([category, data]) => ({
      category: category.replace('_', ' ').toUpperCase(),
      budgeted: data.budgeted,
      actual: data.actual,
      remaining: data.remaining,
      percentUsed: data.percentUsed,
    })).filter((item) => item.budgeted > 0 || item.actual > 0);
  }, [month, year]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const currentTotal = currentAnalysis.total;
  const previousTotal = trendData[trendData.length - 2]?.total || 0;
  const totalChange = currentTotal - previousTotal;
  const totalChangePercent = previousTotal > 0 ? (totalChange / previousTotal) * 100 : 0;

  return (
    <div className="spending-analysis">
      <div className="spending-analysis-header">
        <h3>Spending Analysis</h3>
        <div className="analysis-controls">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="period-selector"
          >
            <option value="3M">Last 3 Months</option>
            <option value="6M">Last 6 Months</option>
            <option value="1Y">Last Year</option>
            <option value="ALL">All Time</option>
          </select>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as BudgetCategory | 'all')}
            className="category-selector"
          >
            <option value="all">All Categories</option>
            {Object.keys(currentAnalysis.byCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat.replace('_', ' ').toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="spending-summary-cards">
        <div className="summary-card">
          <div className="summary-label">Total Spending</div>
          <div className="summary-value">{formatCurrency(currentTotal)}</div>
          {previousTotal > 0 && (
            <div className={`summary-change ${totalChange >= 0 ? 'negative' : 'positive'}`}>
              {totalChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{Math.abs(totalChangePercent).toFixed(1)}% vs last month</span>
            </div>
          )}
        </div>
        <div className="summary-card">
          <div className="summary-label">Forecasted Next Month</div>
          <div className="summary-value">{formatCurrency(forecastData[0]?.forecasted || 0)}</div>
          <div className="summary-confidence">
            {forecastData[0]?.confidence || 0}% confidence
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Top Category</div>
          <div className="summary-value">
            {currentAnalysis.topCategories[0]?.name || 'N/A'}
          </div>
          <div className="summary-amount">
            {formatCurrency(currentAnalysis.topCategories[0]?.value || 0)}
          </div>
        </div>
      </div>

      {/* Spending Trends Chart */}
      <div className="analysis-chart-section">
        <h4>Spending Trends</h4>
        <div className="svg-chart-container" style={{ width: '100%', height: '300px', position: 'relative' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {Array.from({ length: 5 }).map((_, i) => (
              <line
                key={`grid-${i}`}
                x1="50"
                y1={50 + i * 50}
                x2="750"
                y2={50 + i * 50}
                stroke="var(--bg-tertiary)"
                strokeDasharray="3 3"
                opacity="0.5"
              />
            ))}
            {/* Y-axis labels */}
            {trendData.length > 0 && (() => {
              const maxValue = Math.max(...trendData.map(d => d.total));
              const minValue = Math.min(...trendData.map(d => d.total));
              const range = maxValue - minValue || 1;
              return Array.from({ length: 5 }).map((_, i) => {
                const value = maxValue - (range * i / 4);
                return (
                  <text
                    key={`y-label-${i}`}
                    x="45"
                    y={50 + i * 50 + 5}
                    fill="var(--text-muted)"
                    fontSize="12"
                    textAnchor="end"
                  >
                    {formatCurrency(value)}
                  </text>
                );
              });
            })()}
            {/* Line chart */}
            {trendData.length > 1 && (() => {
              const maxValue = Math.max(...trendData.map(d => d.total));
              const minValue = Math.min(...trendData.map(d => d.total));
              const range = maxValue - minValue || 1;
              const points = trendData.map((d, idx) => {
                const x = 50 + (idx / (trendData.length - 1)) * 700;
                const y = 250 - ((d.total - minValue) / range) * 200;
                return `${x},${y}`;
              }).join(' ');
              return (
                <>
                  <polyline
                    points={points}
                    fill="none"
                    stroke="var(--violet-500)"
                    strokeWidth="2"
                  />
                  {trendData.map((d, idx) => {
                    const x = 50 + (idx / (trendData.length - 1)) * 700;
                    const y = 250 - ((d.total - minValue) / (maxValue - minValue || 1)) * 200;
                    return (
                      <circle
                        key={`dot-${idx}`}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="var(--violet-500)"
                      />
                    );
                  })}
                </>
              );
            })()}
            {/* X-axis labels */}
            {trendData.map((d, idx) => {
              const x = 50 + (idx / (trendData.length - 1 || 1)) * 700;
              return (
                <text
                  key={`x-label-${idx}`}
                  x={x}
                  y="285"
                  fill="var(--text-muted)"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {d.month}
                </text>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Budget vs Actual Chart */}
      {budgetVsActual.length > 0 && (
        <div className="analysis-chart-section">
          <h4>Budget vs Actual</h4>
          <div className="svg-chart-container" style={{ width: '100%', height: '300px', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              {Array.from({ length: 5 }).map((_, i) => (
                <line
                  key={`grid-${i}`}
                  x1="50"
                  y1={50 + i * 50}
                  x2="750"
                  y2={50 + i * 50}
                  stroke="var(--bg-tertiary)"
                  strokeDasharray="3 3"
                  opacity="0.5"
                />
              ))}
              {/* Y-axis labels */}
              {(() => {
                const maxValue = Math.max(...budgetVsActual.flatMap(d => [d.budgeted, d.actual]));
                const range = maxValue || 1;
                return Array.from({ length: 5 }).map((_, i) => {
                  const value = maxValue - (range * i / 4);
                  return (
                    <text
                      key={`y-label-${i}`}
                      x="45"
                      y={50 + i * 50 + 5}
                      fill="var(--text-muted)"
                      fontSize="12"
                      textAnchor="end"
                    >
                      {formatCurrency(value)}
                    </text>
                  );
                });
              })()}
              {/* Bars */}
              {budgetVsActual.map((item, idx) => {
                const maxValue = Math.max(...budgetVsActual.flatMap(d => [d.budgeted, d.actual]));
                const range = maxValue || 1;
                const barWidth = 600 / budgetVsActual.length / 3;
                const x = 100 + (idx * 600 / budgetVsActual.length);
                const budgetHeight = (item.budgeted / range) * 200;
                const actualHeight = (item.actual / range) * 200;
                return (
                  <g key={`bars-${idx}`}>
                    <rect
                      x={x}
                      y={250 - budgetHeight}
                      width={barWidth}
                      height={budgetHeight}
                      fill="var(--violet-500)"
                      opacity="0.7"
                    />
                    <rect
                      x={x + barWidth + 2}
                      y={250 - actualHeight}
                      width={barWidth}
                      height={actualHeight}
                      fill="var(--emerald-500)"
                      opacity="0.7"
                    />
                    <text
                      x={x + barWidth}
                      y="285"
                      fill="var(--text-muted)"
                      fontSize="10"
                      textAnchor="middle"
                      transform={`rotate(-45 ${x + barWidth} 285)`}
                    >
                      {item.category.substring(0, 8)}
                    </text>
                  </g>
                );
              })}
              {/* Legend */}
              <g>
                <rect x="600" y="20" width="15" height="15" fill="var(--violet-500)" opacity="0.7" />
                <text x="620" y="32" fill="var(--text-primary)" fontSize="12">Budgeted</text>
                <rect x="600" y="40" width="15" height="15" fill="var(--emerald-500)" opacity="0.7" />
                <text x="620" y="52" fill="var(--text-primary)" fontSize="12">Actual</text>
              </g>
            </svg>
          </div>
          <div className="budget-vs-actual-list">
            {budgetVsActual.map((item) => (
              <div key={item.category} className="budget-vs-actual-item">
                <div className="budget-item-header">
                  <span className="budget-category-name">{item.category}</span>
                  <span className={`budget-status ${item.percentUsed > 100 ? 'over' : item.percentUsed > 80 ? 'warning' : 'ok'}`}>
                    {item.percentUsed.toFixed(0)}% used
                  </span>
                </div>
                <div className="budget-item-details">
                  <span>Budgeted: {formatCurrency(item.budgeted)}</span>
                  <span>Actual: {formatCurrency(item.actual)}</span>
                  <span className={item.remaining >= 0 ? 'positive' : 'negative'}>
                    Remaining: {formatCurrency(item.remaining)}
                  </span>
                </div>
                <div className="budget-progress-bar">
                  <div
                    className={`budget-progress-fill ${item.percentUsed > 100 ? 'over' : item.percentUsed > 80 ? 'warning' : ''}`}
                    style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
                  />
                  {item.percentUsed > 100 && (
                    <div
                      className="budget-progress-over"
                      style={{ width: `${item.percentUsed - 100}%` }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Distribution */}
      {currentAnalysis.topCategories.length > 0 && (
        <div className="analysis-chart-section">
          <h4>Category Distribution</h4>
          <div className="chart-container-row">
            <div className="svg-chart-container" style={{ width: '100%', height: '300px', position: 'relative' }}>
              <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
                {(() => {
                  const total = currentAnalysis.topCategories.reduce((sum, item) => sum + item.value, 0);
                  let currentAngle = -90;
                  return currentAnalysis.topCategories.map((item, index) => {
                    const percentage = (item.value / total) * 100;
                    const angle = (percentage / 100) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle = endAngle;
                    
                    const startAngleRad = (startAngle * Math.PI) / 180;
                    const endAngleRad = (endAngle * Math.PI) / 180;
                    const radius = 80;
                    const cx = 200;
                    const cy = 150;
                    
                    const x1 = cx + radius * Math.cos(startAngleRad);
                    const y1 = cy + radius * Math.sin(startAngleRad);
                    const x2 = cx + radius * Math.cos(endAngleRad);
                    const y2 = cy + radius * Math.sin(endAngleRad);
                    const largeArcFlag = angle > 180 ? 1 : 0;
                    
                    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                    
                    return (
                      <g key={`slice-${index}`}>
                        <path
                          d={path}
                          fill={COLORS[index % COLORS.length]}
                          stroke="var(--bg-primary)"
                          strokeWidth="2"
                        />
                        <text
                          x={cx + (radius * 1.3) * Math.cos((startAngle + angle / 2) * Math.PI / 180)}
                          y={cy + (radius * 1.3) * Math.sin((startAngle + angle / 2) * Math.PI / 180)}
                          fill="var(--text-primary)"
                          fontSize="11"
                          textAnchor="middle"
                          fontWeight="500"
                        >
                          {percentage.toFixed(0)}%
                        </text>
                      </g>
                    );
                  });
                })()}
                {/* Legend */}
                {currentAnalysis.topCategories.map((item, index) => (
                  <g key={`legend-${index}`}>
                    <rect
                      x="280"
                      y={80 + index * 20}
                      width="12"
                      height="12"
                      fill={COLORS[index % COLORS.length]}
                    />
                    <text
                      x="300"
                      y={90 + index * 20}
                      fill="var(--text-primary)"
                      fontSize="11"
                    >
                      {item.name.substring(0, 15)}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Category Trends */}
      {categoryTrends.length > 0 && (
        <div className="analysis-chart-section">
          <h4>Category Trends (vs Previous Month)</h4>
          <div className="category-trends-list">
            {categoryTrends.slice(0, 10).map((trend) => (
              <div key={trend.category} className="category-trend-item">
                <div className="trend-header">
                  <span className="trend-category">{trend.category.replace('_', ' ').toUpperCase()}</span>
                  <span className="trend-current">{formatCurrency(trend.current)}</span>
                </div>
                <div className="trend-comparison">
                  <span className="trend-previous">Previous: {formatCurrency(trend.previous)}</span>
                  <span className={`trend-change ${trend.change >= 0 ? 'negative' : 'positive'}`}>
                    {trend.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {Math.abs(trend.changePercent).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Categories List */}
      <div className="spending-top-categories">
        <h4>Top Spending Categories</h4>
        <div className="top-categories-list">
          {currentAnalysis.topCategories.map((item, index) => {
            const percentage = (item.value / currentTotal) * 100;
            return (
              <div key={item.category} className="top-category-item">
                <div className="top-category-header">
                  <span className="top-category-name">{item.name}</span>
                  <span className="top-category-amount">{formatCurrency(item.value)}</span>
                </div>
                <div className="top-category-bar">
                  <div
                    className="top-category-bar-fill"
                    style={{ width: `${percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                  />
                </div>
                <div className="top-category-percentage">{percentage.toFixed(1)}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

export default SpendingAnalysis;
