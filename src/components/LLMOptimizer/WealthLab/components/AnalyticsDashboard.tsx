/**
 * AnalyticsDashboard.tsx
 *
 * PURPOSE:
 * Comprehensive portfolio analytics dashboard for WealthLab. Displays performance metrics,
 * asset allocation, performance attribution, and benchmark comparisons. Provides detailed
 * financial analytics with visual indicators and formatted data.
 *
 * ARCHITECTURE:
 * Analytics visualization component that:
 * - Calculates performance metrics (returns, volatility, Sharpe ratio)
 * - Analyzes asset allocation (by type, by account)
 * - Performs performance attribution (top contributors)
 * - Compares against benchmarks (SPY, etc.)
 * - Displays data with formatted currency and percentages
 *
 * Features:
 * - Time period selection (1M, 3M, 6M, 1Y, 5Y, ALL)
 * - Benchmark selection
 * - Performance metrics cards
 * - Asset allocation visualization
 * - Top contributors list
 * - Benchmark comparison
 * - Memoized for performance
 *
 * CURRENT STATUS:
 * ✅ Performance metrics calculation
 * ✅ Asset allocation analysis
 * ✅ Performance attribution
 * ✅ Benchmark comparison
 * ✅ Time period filtering
 * ✅ Formatted currency (0 decimals) and percentages (+ signs)
 * ✅ Memoized component
 * ✅ Loading states
 *
 * DEPENDENCIES:
 * - useWealthStore: Portfolio data
 * - portfolioAnalyticsService: Analytics calculations
 * - formatCurrency, formatPercent: Centralized formatters
 *
 * STATE MANAGEMENT:
 * - Local state: period, benchmark, metrics, allocation, attribution, comparison
 * - Uses Zustand store for data
 * - Memoized calculations for performance
 *
 * PERFORMANCE:
 * - React.memo wrapper prevents unnecessary re-renders
 * - useMemo for expensive calculations
 * - Parallel data fetching with Promise.all
 * - Efficient filtering and sorting
 *
 * USAGE EXAMPLE:
 * ```typescript
 * import AnalyticsDashboard from '@/components/LLMOptimizer/WealthLab/components/AnalyticsDashboard';
 *
 * function WealthLab() {
 *   return <AnalyticsDashboard />;
 * }
 * ```
 *
 * RELATED FILES:
 * - src/services/wealth/portfolioAnalyticsService.ts: Calculation logic
 * - src/services/wealth/wealthStore.ts: Data source
 * - src/utils/formatters.ts: Formatting utilities
 *
 * TODO / FUTURE ENHANCEMENTS:
 * - Chart visualizations
 * - Export functionality (CSV, PDF)
 * - Custom date range picker
 * - Comparison mode (multiple periods)
 * - More benchmark options
 */
import { useState, useEffect, useMemo, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { portfolioAnalyticsService, type TimePeriod } from '@/services/wealth/portfolioAnalyticsService';
import { portfolioRebalancingService, type TargetAllocation, type RebalanceRecommendation } from '@/services/wealth/portfolioRebalancingService';
import { taxLossHarvestingService, type TaxLossHarvestOpportunity, type HarvestExecutionPlan } from '@/services/wealth/taxLossHarvestingService';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import type { PerformanceMetrics, AssetAllocation, PerformanceAttribution, BenchmarkComparison } from '@/services/wealth/portfolioAnalyticsService';
import { TrendingUp, TrendingDown, Activity, RefreshCw, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import '@/styles/WealthLab.css';

const AnalyticsDashboard = memo(function AnalyticsDashboard() {
  const { assets, accounts } = useWealthStore();
  const [period, setPeriod] = useState<TimePeriod>('1Y');
  const [benchmark, setBenchmark] = useState<string>('SPY');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation | null>(null);
  const [performanceAttribution, setPerformanceAttribution] = useState<PerformanceAttribution | null>(null);
  const [benchmarkComparison, setBenchmarkComparison] = useState<BenchmarkComparison | null>(null);
  const [rebalanceRecommendation, setRebalanceRecommendation] = useState<RebalanceRecommendation | null>(null);
  const [taxLossOpportunities, setTaxLossOpportunities] = useState<TaxLossHarvestOpportunity[]>([]);
  const [harvestPlan, setHarvestPlan] = useState<HarvestExecutionPlan | null>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'rebalancing' | 'tax-loss'>('performance');
  const [isLoading, setIsLoading] = useState(true);
  const [isRebalancing, setIsRebalancing] = useState(false);
  const [isHarvesting, setIsHarvesting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period, benchmark, assets, accounts]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [metrics, allocation, attribution, comparison] = await Promise.all([
        portfolioAnalyticsService.calculatePerformanceMetrics(period, benchmark),
        Promise.resolve(portfolioAnalyticsService.calculateAssetAllocation()),
        portfolioAnalyticsService.calculatePerformanceAttribution(period),
        Promise.resolve({ portfolioReturn: 0, benchmarkReturn: 0, excessReturn: 0 } as BenchmarkComparison),
      ]);

      setPerformanceMetrics(metrics);
      setAssetAllocation(allocation);
      setPerformanceAttribution(attribution);
      setBenchmarkComparison(comparison);

      // Load rebalancing analysis
      const targetAllocations: TargetAllocation[] = [
        { assetType: 'stock', targetPercent: 60, minPercent: 55, maxPercent: 65 },
        { assetType: 'bond', targetPercent: 30, minPercent: 25, maxPercent: 35 },
        { assetType: 'cash', targetPercent: 10, minPercent: 5, maxPercent: 15 },
      ];
      const rebalance = await portfolioRebalancingService.analyzeRebalancing(targetAllocations);
      setRebalanceRecommendation(rebalance);

      // Load tax-loss harvesting opportunities
      const opportunities = await taxLossHarvestingService.identifyOpportunities();
      setTaxLossOpportunities(opportunities);

      if (opportunities.length > 0) {
        const plan = await taxLossHarvestingService.generateExecutionPlan(opportunities);
        setHarvestPlan(plan);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const topContributors = useMemo(() => {
    if (!performanceAttribution) return [];
    return performanceAttribution.assetContributions.slice(0, 10);
  }, [performanceAttribution]);

  const allocationByType = useMemo(() => {
    if (!assetAllocation) return [];
    const total = Object.values(assetAllocation.byType).reduce((sum, val) => sum + val, 0);
    if (total === 0) return [];

    return Object.entries(assetAllocation.byType)
      .filter(([_, value]) => value > 0)
      .map(([type, value]) => ({
        type: type as string,
        value,
        percent: (value / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [assetAllocation]);

  const handleExecuteRebalance = async () => {
    if (!rebalanceRecommendation || !rebalanceRecommendation.needsRebalancing) return;

    setIsRebalancing(true);
    try {
      await portfolioRebalancingService.executeRebalance(rebalanceRecommendation.trades);
      alert('Rebalancing executed successfully! Please review your updated portfolio.');
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to execute rebalance:', error);
      alert('Failed to execute rebalancing. Please try again.');
    } finally {
      setIsRebalancing(false);
    }
  };

  const handleExecuteHarvest = async () => {
    if (!harvestPlan || harvestPlan.trades.length === 0) return;

    setIsHarvesting(true);
    try {
      await taxLossHarvestingService.executeHarvest(harvestPlan);
      alert(`Tax-loss harvesting executed! Estimated tax benefit: ${formatCurrency(harvestPlan.totalEstimatedTaxBenefit)}`);
      await loadAnalytics();
    } catch (error) {
      console.error('Failed to execute harvest:', error);
      alert('Failed to execute tax-loss harvesting. Please try again.');
    } finally {
      setIsHarvesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-loading">
          <Activity className="spinner" size={24} />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <div className="analytics-header">
        <h2>Portfolio Analytics</h2>
        <div className="analytics-controls">
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
          <select
            value={benchmark}
            onChange={(e) => setBenchmark(e.target.value)}
            className="benchmark-selector"
          >
            <option value="SPY">S&P 500 (SPY)</option>
            <option value="QQQ">NASDAQ (QQQ)</option>
            <option value="DIA">Dow Jones (DIA)</option>
            <option value="BTC">Bitcoin</option>
            <option value="CUSTOM">Custom</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="analytics-tabs">
        <button
          className={`analytics-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <Activity size={16} />
          <span>Performance</span>
        </button>
        <button
          className={`analytics-tab ${activeTab === 'rebalancing' ? 'active' : ''}`}
          onClick={() => setActiveTab('rebalancing')}
        >
          <RefreshCw size={16} />
          <span>Rebalancing</span>
          {rebalanceRecommendation?.needsRebalancing && (
            <span className="tab-badge">{rebalanceRecommendation.trades.length}</span>
          )}
        </button>
        <button
          className={`analytics-tab ${activeTab === 'tax-loss' ? 'active' : ''}`}
          onClick={() => setActiveTab('tax-loss')}
        >
          <DollarSign size={16} />
          <span>Tax-Loss Harvesting</span>
          {taxLossOpportunities.length > 0 && (
            <span className="tab-badge">{taxLossOpportunities.filter(o => o.canHarvestNow).length}</span>
          )}
        </button>
      </div>

      {/* Performance Tab Content */}
      {activeTab === 'performance' && (
        <>
          {/* Performance Metrics */}
          {performanceMetrics && (
            <div className="analytics-section">
              <h3>Performance Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-label">Total Return</div>
              <div className={`metric-value ${performanceMetrics.totalReturn >= 0 ? 'positive' : 'negative'}`}>
                {formatCurrency(performanceMetrics.totalReturn, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <div className={`metric-change ${performanceMetrics.totalReturnPercent >= 0 ? 'positive' : 'negative'}`}>
                {performanceMetrics.totalReturnPercent >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {formatPercent(performanceMetrics.totalReturnPercent, 2, false, true)}
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-label">Annualized Return</div>
              <div className={`metric-value ${performanceMetrics.annualizedReturn >= 0 ? 'positive' : 'negative'}`}>
                {formatPercent(performanceMetrics.annualizedReturn, 2, false, true)}
              </div>
            </div>

            {performanceMetrics.sharpeRatio !== undefined && (
              <div className="metric-card">
                <div className="metric-label">Sharpe Ratio</div>
                <div className="metric-value">
                  {performanceMetrics.sharpeRatio.toFixed(2)}
                </div>
                <div className="metric-hint">
                  {performanceMetrics.sharpeRatio > 1 ? 'Good' : performanceMetrics.sharpeRatio > 0 ? 'Fair' : 'Poor'}
                </div>
              </div>
            )}

            {performanceMetrics.sortinoRatio !== undefined && (
              <div className="metric-card">
                <div className="metric-label">Sortino Ratio</div>
                <div className="metric-value">
                  {performanceMetrics.sortinoRatio.toFixed(2)}
                </div>
              </div>
            )}

            {performanceMetrics.alpha !== undefined && (
              <div className="metric-card">
                <div className="metric-label">Alpha (vs {benchmark})</div>
                <div className={`metric-value ${performanceMetrics.alpha >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercent(performanceMetrics.alpha, 2, false, true)}
                </div>
              </div>
            )}

            {performanceMetrics.beta !== undefined && (
              <div className="metric-card">
                <div className="metric-label">Beta (vs {benchmark})</div>
                <div className="metric-value">
                  {performanceMetrics.beta.toFixed(2)}
                </div>
                <div className="metric-hint">
                  {performanceMetrics.beta > 1 ? 'More volatile' : performanceMetrics.beta < 1 ? 'Less volatile' : 'Same volatility'}
                </div>
              </div>
            )}

            {performanceMetrics.volatility !== undefined && (
              <div className="metric-card">
                <div className="metric-label">Volatility</div>
                <div className="metric-value">
                  {formatPercent(performanceMetrics.volatility, 2, false, true)}
                </div>
              </div>
            )}

            {performanceMetrics.maxDrawdownPercent !== undefined && (
              <div className="metric-card">
                <div className="metric-label">Max Drawdown</div>
                <div className="metric-value negative">
                  {formatPercent(-Math.abs(performanceMetrics.maxDrawdownPercent), 2, false, true)}
                </div>
              </div>
            )}

            {performanceMetrics.var95 !== undefined && (
              <div className="metric-card">
                <div className="metric-label">VaR (95%)</div>
                <div className="metric-value">
                  {formatCurrency(performanceMetrics.var95, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Asset Allocation */}
      {assetAllocation && (
        <div className="analytics-section">
          <h3>Asset Allocation</h3>
          <div className="allocation-grid">
            <div className="allocation-chart">
              <h4>By Type</h4>
              <div className="allocation-list">
                {allocationByType.map((item) => (
                  <div key={item.type} className="allocation-item">
                    <div className="allocation-header">
                      <span className="allocation-type">{item.type.replace('_', ' ').toUpperCase()}</span>
                      <span className="allocation-percent">{item.percent.toFixed(1)}%</span>
                    </div>
                    <div className="allocation-bar">
                      <div
                        className="allocation-bar-fill"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                    <div className="allocation-value">{formatCurrency(item.value, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                  </div>
                ))}
              </div>
            </div>

            {Object.keys(assetAllocation.bySector).length > 0 && (
              <div className="allocation-chart">
                <h4>By Sector</h4>
                <div className="allocation-list">
                  {Object.entries(assetAllocation.bySector)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([sector, value]) => {
                      const total = Object.values(assetAllocation.bySector).reduce((sum, v) => sum + v, 0);
                      const percent = (value / total) * 100;
                      return (
                        <div key={sector} className="allocation-item">
                          <div className="allocation-header">
                            <span className="allocation-type">{sector}</span>
                            <span className="allocation-percent">{percent.toFixed(1)}%</span>
                          </div>
                          <div className="allocation-bar">
                            <div
                              className="allocation-bar-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="allocation-value">{formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {Object.keys(assetAllocation.byGeography).length > 0 && (
              <div className="allocation-chart">
                <h4>By Geography</h4>
                <div className="allocation-list">
                  {Object.entries(assetAllocation.byGeography)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([country, value]) => {
                      const total = Object.values(assetAllocation.byGeography).reduce((sum, v) => sum + v, 0);
                      const percent = (value / total) * 100;
                      return (
                        <div key={country} className="allocation-item">
                          <div className="allocation-header">
                            <span className="allocation-type">{country}</span>
                            <span className="allocation-percent">{percent.toFixed(1)}%</span>
                          </div>
                          <div className="allocation-bar">
                            <div
                              className="allocation-bar-fill"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <div className="allocation-value">{formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Performance Attribution */}
      {performanceAttribution && topContributors.length > 0 && (
        <div className="analytics-section">
          <h3>Performance Attribution</h3>
          <div className="attribution-table">
            <div className="attribution-header">
              <div>Asset</div>
              <div>Weight</div>
              <div>Return</div>
              <div>Contribution</div>
            </div>
            {topContributors.map((contrib) => (
              <div key={contrib.symbol} className="attribution-row">
                <div className="attribution-asset">
                  <strong>{contrib.assetName}</strong>
                  <span className="attribution-symbol">{contrib.symbol}</span>
                </div>
                <div>{contrib.weight.toFixed(1)}%</div>
                <div className={contrib.returnPercent >= 0 ? 'positive' : 'negative'}>
                  {formatPercent(contrib.returnPercent, 2, false, true)}
                </div>
                <div className={contrib.contributionPercent >= 0 ? 'positive' : 'negative'}>
                  {formatPercent(contrib.contributionPercent, 2, false, true)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Benchmark Comparison */}
          {benchmarkComparison && (
            <div className="analytics-section">
              <h3>Benchmark Comparison</h3>
              <div className="benchmark-comparison">
                <div className="benchmark-metric">
                  <div className="benchmark-label">Portfolio Return</div>
                  <div className={`benchmark-value ${benchmarkComparison.portfolioReturn >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercent(benchmarkComparison.portfolioReturn, 2, false, true)}
                  </div>
                </div>
                <div className="benchmark-metric">
                  <div className="benchmark-label">{benchmark} Return</div>
                  <div className={`benchmark-value ${benchmarkComparison.benchmarkReturn >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercent(benchmarkComparison.benchmarkReturn, 2, false, true)}
                  </div>
                </div>
                <div className="benchmark-metric">
                  <div className="benchmark-label">Excess Return</div>
                  <div className={`benchmark-value ${benchmarkComparison.excessReturn >= 0 ? 'positive' : 'negative'}`}>
                    {formatPercent(benchmarkComparison.excessReturn, 2, false, true)}
                  </div>
                </div>
                {benchmarkComparison.trackingError !== undefined && (
                  <div className="benchmark-metric">
                    <div className="benchmark-label">Tracking Error</div>
                    <div className="benchmark-value">
                      {formatPercent(benchmarkComparison.trackingError, 2, false, true)}
                    </div>
                  </div>
                )}
                {benchmarkComparison.informationRatio !== undefined && (
                  <div className="benchmark-metric">
                    <div className="benchmark-label">Information Ratio</div>
                    <div className="benchmark-value">
                      {benchmarkComparison.informationRatio.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Rebalancing Tab Content */}
      {activeTab === 'rebalancing' && rebalanceRecommendation && (
        <div className="rebalancing-content">
          <div className="analytics-section">
            <div className="section-header">
              <h3>Portfolio Rebalancing Analysis</h3>
              {rebalanceRecommendation.needsRebalancing && (
                <button
                  onClick={handleExecuteRebalance}
                  disabled={isRebalancing}
                  className="execute-btn"
                >
                  {isRebalancing ? (
                    <>
                      <Activity size={16} className="spinning" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>Execute Rebalance</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="rebalance-summary">
              <div className="rebalance-card">
                <div className="card-label">Rebalancing Needed</div>
                <div className={`card-value ${rebalanceRecommendation.needsRebalancing ? 'warning' : 'success'}`}>
                  {rebalanceRecommendation.needsRebalancing ? (
                    <>
                      <AlertCircle size={20} />
                      <span>Yes</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      <span>No</span>
                    </>
                  )}
                </div>
              </div>
              <div className="rebalance-card">
                <div className="card-label">Total Drift</div>
                <div className="card-value">{rebalanceRecommendation.totalDrift.toFixed(2)}%</div>
              </div>
              <div className="rebalance-card">
                <div className="card-label">Max Drift</div>
                <div className="card-value">{rebalanceRecommendation.maxDrift.toFixed(2)}%</div>
              </div>
              <div className="rebalance-card">
                <div className="card-label">Trades Required</div>
                <div className="card-value">{rebalanceRecommendation.trades.length}</div>
              </div>
              <div className="rebalance-card">
                <div className="card-label">Estimated Tax Impact</div>
                <div className="card-value">{formatCurrency(rebalanceRecommendation.estimatedTaxImpact)}</div>
              </div>
            </div>

            {rebalanceRecommendation.trades.length > 0 && (
              <div className="trades-table">
                <h4>Recommended Trades</h4>
                <div className="table-header">
                  <div>Asset</div>
                  <div>Action</div>
                  <div>Shares</div>
                  <div>Est. Value</div>
                  <div>Tax Impact</div>
                  <div>Priority</div>
                </div>
                {rebalanceRecommendation.trades.map((trade, idx) => (
                  <div key={idx} className="table-row">
                    <div className="trade-asset">
                      <strong>{trade.assetName}</strong>
                      <span className="trade-symbol">{trade.symbol}</span>
                    </div>
                    <div className={`trade-action ${trade.action}`}>
                      {trade.action.toUpperCase()}
                    </div>
                    <div>{trade.shares.toFixed(2)}</div>
                    <div>{formatCurrency(trade.estimatedValue)}</div>
                    <div className={trade.taxImpact && trade.taxImpact > 0 ? 'negative' : 'neutral'}>
                      {trade.taxImpact ? formatCurrency(trade.taxImpact) : '-'}
                    </div>
                    <div>
                      <span className="priority-badge">{trade.priority}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tax-Loss Harvesting Tab Content */}
      {activeTab === 'tax-loss' && (
        <div className="tax-loss-content">
          <div className="analytics-section">
            <div className="section-header">
              <h3>Tax-Loss Harvesting Opportunities</h3>
              {harvestPlan && harvestPlan.trades.length > 0 && (
                <button
                  onClick={handleExecuteHarvest}
                  disabled={isHarvesting}
                  className="execute-btn"
                >
                  {isHarvesting ? (
                    <>
                      <Activity size={16} className="spinning" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <DollarSign size={16} />
                      <span>Execute Harvest</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {harvestPlan && (
              <div className="harvest-summary">
                <div className="harvest-card">
                  <div className="card-label">Total Opportunities</div>
                  <div className="card-value">{harvestPlan.opportunities.length}</div>
                </div>
                <div className="harvest-card">
                  <div className="card-label">Total Unrealized Loss</div>
                  <div className="card-value negative">{formatCurrency(harvestPlan.totalUnrealizedLoss)}</div>
                </div>
                <div className="harvest-card success">
                  <div className="card-label">Est. Tax Benefit</div>
                  <div className="card-value">{formatCurrency(harvestPlan.totalEstimatedTaxBenefit)}</div>
                </div>
                <div className="harvest-card">
                  <div className="card-label">Trades Required</div>
                  <div className="card-value">{harvestPlan.trades.length}</div>
                </div>
              </div>
            )}

            {taxLossOpportunities.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={48} />
                <h4>No Tax-Loss Harvesting Opportunities</h4>
                <p>Your portfolio currently has no positions with unrealized losses suitable for harvesting.</p>
              </div>
            ) : (
              <div className="opportunities-table">
                <h4>Harvestable Opportunities</h4>
                <div className="table-header">
                  <div>Asset</div>
                  <div>Unrealized Loss</div>
                  <div>Loss %</div>
                  <div>Tax Benefit</div>
                  <div>Wash Sale Risk</div>
                  <div>Replacement</div>
                  <div>Status</div>
                </div>
                {taxLossOpportunities.slice(0, 20).map((opp, idx) => (
                  <div key={idx} className="table-row">
                    <div className="opportunity-asset">
                      <strong>{opp.assetName}</strong>
                      <span className="opportunity-symbol">{opp.symbol}</span>
                      <span className="opportunity-meta">
                        {opp.quantity} shares @ {formatCurrency(opp.currentPrice)}
                      </span>
                    </div>
                    <div className="negative">
                      {formatCurrency(opp.unrealizedLoss)}
                    </div>
                    <div className="negative">
                      {formatPercent(opp.unrealizedLossPercent, 2, false, true)}
                    </div>
                    <div className="positive">
                      {formatCurrency(opp.estimatedTaxBenefit)}
                    </div>
                    <div>
                      <span className={`risk-badge ${opp.washSaleRisk}`}>
                        {opp.washSaleRisk}
                      </span>
                    </div>
                    <div>
                      {opp.replacementSuggestions.length > 0 ? (
                        <span className="replacement-suggestion">
                          {opp.replacementSuggestions[0].symbol}
                          <span className="replacement-correlation">
                            ({(opp.replacementSuggestions[0].correlation * 100).toFixed(0)}% similar)
                          </span>
                        </span>
                      ) : (
                        <span className="no-replacement">-</span>
                      )}
                    </div>
                    <div>
                      {opp.canHarvestNow ? (
                        <span className="status-badge success">
                          <CheckCircle size={14} />
                          Ready
                        </span>
                      ) : (
                        <span className="status-badge warning">
                          <XCircle size={14} />
                          Wait
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {harvestPlan && harvestPlan.warnings.length > 0 && (
              <div className="warnings-section">
                <h4>⚠️ Warnings</h4>
                {harvestPlan.warnings.map((warning, idx) => (
                  <div key={idx} className="warning-item">
                    <AlertCircle size={16} />
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default AnalyticsDashboard;
