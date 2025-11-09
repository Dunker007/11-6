import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Zap, TrendingUp, BarChart3, Settings, AlertCircle, DollarSign, TrendingDown, PieChart, Target, Sparkles, Code, Bitcoin, Lightbulb, MoreHorizontal } from 'lucide-react';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';
import { useLLMStore } from '@/services/ai/llmStore';
import { useFinancialStore } from '@/services/backoffice/financialStore';
import ConnectionStatus from './ConnectionStatus';
import HardwareProfiler from './HardwareProfiler';
import ModelCatalog from './ModelCatalog';
import BenchmarkRunner from './BenchmarkRunner';
import SystemHealth from './SystemHealth';
import { FINANCIAL_CONSTANTS } from '@/utils/constants';
import '../../styles/LLMOptimizer.css';
import '../../styles/LayoutMockups.css';

// Lazy load heavy components
const IdeaLab = lazy(() => import('./IdeaLab'));
const CryptoLab = lazy(() => import('./CryptoLab/CryptoLab'));
const WealthLab = lazy(() => import('./WealthLab/WealthLab'));
const VibedEd = lazy(() => import('./VibedEd/VibedEd'));

type TabType = 'llm' | 'revenue' | 'vibed-ed' | 'crypto-lab' | 'wealth-lab' | 'idea-lab' | 'tbd';

function LLMRevenueCommandCenter() {
  const [activeTab, setActiveTab] = useState<TabType>('llm');
  
  // LLM Store
  const discoverProviders = useLLMStore((state) => state.discoverProviders);
  const models = useLLMStore((state) => state.models);
  
  // Get active model name (use first available model or preferred provider)
  const activeModel = models.length > 0 ? models[0].name : null;
  
  // LLM Optimizer Store
  const detectHardware = useLLMOptimizerStore((state) => state.detectHardware);
  const loadCatalog = useLLMOptimizerStore((state) => state.loadCatalog);
  const runBenchmarks = useLLMOptimizerStore((state) => state.runBenchmarks);
  const modelCatalog = useLLMOptimizerStore((state) => state.modelCatalog);
  const benchmarks = useLLMOptimizerStore((state) => state.benchmarks);
  const isBenchmarking = useLLMOptimizerStore((state) => state.isBenchmarking);
  const benchmarkError = useLLMOptimizerStore((state) => state.benchmarkError);
  
  // Financial Store
  const { income, expenses, summary, refresh: refreshFinancials } = useFinancialStore();
  
  useEffect(() => {
    detectHardware();
    loadCatalog();
    discoverProviders();
    refreshFinancials();
  }, [detectHardware, loadCatalog, discoverProviders, refreshFinancials]);

  // Calculate LLM costs from expenses
  const llmCosts = useMemo(() => {
    if (!expenses || !summary) return { monthly: 0, total: 0 };
    const apiCosts = expenses
      .filter(exp => exp.category === 'api_costs')
      .reduce((sum, exp) => sum + exp.amount, 0);
    return {
      monthly: apiCosts,
      total: summary.byCategory?.expenses?.api_costs || 0,
    };
  }, [expenses, summary]);

  // Calculate revenue metrics
  const revenueMetrics = useMemo(() => {
    if (!summary) {
      return {
        total: 0,
        netProfit: 0,
        roi: 0,
        llmCostPercentage: 0,
      };
    }
    
    const netProfit = summary.profit;
    const llmCostPercentage = summary.totalIncome > 0 
      ? (llmCosts.total / summary.totalIncome) * 100 
      : 0;
    const roi = llmCosts.total > 0 
      ? ((summary.totalIncome / llmCosts.total) * 100) 
      : 0;
    
    return {
      total: summary.totalIncome,
      netProfit,
      roi,
      llmCostPercentage,
    };
  }, [summary, llmCosts]);

  // Get revenue streams with LLM cost attribution
  const revenueStreams = useMemo(() => {
    if (!income) return [];
    
    return income.map(inc => {
      // Estimate LLM cost per revenue stream (simplified - in real app, track this properly)
      const estimatedLLMCost = inc.amount * FINANCIAL_CONSTANTS.ESTIMATED_LLM_COST_PERCENTAGE;
      const roi = estimatedLLMCost > 0 ? (inc.amount / estimatedLLMCost) * 100 : 0;
      
      return {
        name: inc.description || inc.source,
        amount: inc.amount,
        source: inc.source,
        llmCost: estimatedLLMCost,
        roi,
        date: inc.date,
      };
    });
  }, [income]);

  const totalRevenue = revenueMetrics.total;
  const netProfit = revenueMetrics.netProfit;

  // Helper function to get tab display name
  const getTabName = useCallback((tab: TabType): string => {
    const names: Record<TabType, string> = {
      'llm': 'LLM Optimization',
      'revenue': 'Revenue & Monetization',
      'vibed-ed': 'Vibed Ed',
      'crypto-lab': 'Crypto Lab',
      'wealth-lab': 'Wealth Lab',
      'idea-lab': 'Idea Lab',
      'tbd': 'TBD',
    };
    return names[tab];
  }, []);

  // Memoize tab change handler
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    detectHardware();
    loadCatalog();
    discoverProviders();
    refreshFinancials();
  }, [detectHardware, loadCatalog, discoverProviders, refreshFinancials]);

  return (
    <div className="mockup-container llm-revenue-command-center" style={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Top Status Bar */}
      <div className="mockup-top-bar llm-revenue-bar" style={{ position: 'sticky', top: 0, zIndex: 1000, backgroundColor: '#0f172a' }}>
        <div className="tab-selector">
          <button
            className={`tab-btn-large ${activeTab === 'llm' ? 'active' : ''}`}
            onClick={() => handleTabChange('llm')}
          >
            <Zap size={18} />
            <span>LLM Optimization</span>
          </button>
          <button
            className={`tab-btn-large ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => handleTabChange('revenue')}
          >
            <DollarSign size={18} />
            <span>Revenue & Monetization</span>
          </button>
          <button
            className={`tab-btn-large ${activeTab === 'vibed-ed' ? 'active' : ''}`}
            onClick={() => handleTabChange('vibed-ed')}
          >
            <Code size={18} />
            <span>Vibed Ed</span>
          </button>
          <button
            className={`tab-btn-large ${activeTab === 'crypto-lab' ? 'active' : ''}`}
            onClick={() => handleTabChange('crypto-lab')}
          >
            <Bitcoin size={18} />
            <span>Crypto Lab</span>
          </button>
          <button
            className={`tab-btn-large ${activeTab === 'wealth-lab' ? 'active' : ''}`}
            onClick={() => handleTabChange('wealth-lab')}
          >
            <TrendingUp size={18} />
            <span>Wealth Lab</span>
          </button>
          <button
            className={`tab-btn-large ${activeTab === 'idea-lab' ? 'active' : ''}`}
            onClick={() => handleTabChange('idea-lab')}
          >
            <Lightbulb size={18} />
            <span>Idea Lab</span>
          </button>
          <button
            className={`tab-btn-large ${activeTab === 'tbd' ? 'active' : ''}`}
            onClick={() => handleTabChange('tbd')}
          >
            <MoreHorizontal size={18} />
            <span>TBD</span>
          </button>
        </div>
      </div>

      <div className={`mockup-main-layout llm-revenue-layout ${activeTab === 'idea-lab' || activeTab === 'crypto-lab' || activeTab === 'wealth-lab' || activeTab === 'vibed-ed' ? 'full-width-tab' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        {/* Left Panel */}
        <div className="mockup-sidebar left">
          {activeTab === 'idea-lab' || activeTab === 'crypto-lab' || activeTab === 'wealth-lab' || activeTab === 'vibed-ed' ? null : activeTab === 'llm' ? (
            <>
              <div className="sidebar-section">
                <h3>Connection Status</h3>
                <ConnectionStatus />
              </div>
              <div className="sidebar-section">
                <h3>Model Catalog</h3>
                <ModelCatalog entries={modelCatalog || []} />
              </div>
            </>
          ) : activeTab === 'revenue' ? (
            <>
              <div className="sidebar-section">
                <h3>
                  <PieChart size={18} />
                  Revenue Streams
                </h3>
                <div className="revenue-streams-list">
                  {revenueStreams.length > 0 ? (
                    revenueStreams.map((stream, idx) => (
                      <div key={idx} className="revenue-stream-card">
                        <div className="stream-header">
                          <span className="stream-name">{stream.name}</span>
                          <div className="stream-change positive">
                            <TrendingUp size={14} />
                            <span>Active</span>
                          </div>
                        </div>
                        <div className="stream-amount">${stream.amount.toLocaleString()}</div>
                        <div className="stream-cost">
                          <span>Est. LLM Cost: ${stream.llmCost.toFixed(0)}/mo</span>
                          <span className="roi">ROI: {stream.roi.toFixed(0)}%</span>
                        </div>
                        <div className="stream-bar">
                          <div
                            className="stream-bar-fill"
                            style={{ width: `${totalRevenue > 0 ? (stream.amount / totalRevenue) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No revenue streams tracked yet</p>
                      <p className="empty-hint">Add income sources in Back Office</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="sidebar-section">
                <h3>
                  <Target size={18} />
                  Goals
                </h3>
                <div className="goals-list">
                  <div className="goal-item">
                    <div className="goal-label">Monthly Revenue Target</div>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${totalRevenue > 0 ? Math.min((totalRevenue / FINANCIAL_CONSTANTS.MONTHLY_REVENUE_TARGET) * 100, 100) : 0}%` }} />
                      </div>
                      <span>{totalRevenue > 0 ? Math.round((totalRevenue / FINANCIAL_CONSTANTS.MONTHLY_REVENUE_TARGET) * 100) : 0}% (${totalRevenue.toLocaleString()} / $${FINANCIAL_CONSTANTS.MONTHLY_REVENUE_TARGET.toLocaleString()})</span>
                    </div>
                  </div>
                  <div className="goal-item">
                    <div className="goal-label">LLM Cost Target</div>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${llmCosts.monthly > 0 ? Math.min((llmCosts.monthly / FINANCIAL_CONSTANTS.MONTHLY_LLM_COST_TARGET) * 100, 100) : 0}%` }} />
                      </div>
                      <span>{llmCosts.monthly > 0 ? Math.round((llmCosts.monthly / FINANCIAL_CONSTANTS.MONTHLY_LLM_COST_TARGET) * 100) : 0}% (${llmCosts.monthly.toFixed(0)} / $${FINANCIAL_CONSTANTS.MONTHLY_LLM_COST_TARGET})</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Center - Main Dashboard */}
        <div className="mockup-center">
          {activeTab === 'idea-lab' ? (
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading Idea Lab...</div>}>
              <IdeaLab />
            </Suspense>
          ) : activeTab === 'vibed-ed' ? (
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading Vibed Ed...</div>}>
              <VibedEd />
            </Suspense>
          ) : activeTab === 'crypto-lab' ? (
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading Crypto Lab...</div>}>
              <CryptoLab />
            </Suspense>
          ) : activeTab === 'wealth-lab' ? (
            <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>Loading Wealth Lab...</div>}>
              <WealthLab />
            </Suspense>
          ) : activeTab === 'llm' ? (
            <>
              <HardwareProfiler />
              <SystemHealth />
            </>
          ) : activeTab === 'revenue' ? (
            <>
              <div className="dashboard-header">
                <h2>Revenue Dashboard</h2>
                <div className="dashboard-actions">
                  <button className="action-btn" onClick={handleRefresh}>
                    <Settings size={16} />
                    <span>Refresh Data</span>
                  </button>
                </div>
              </div>

              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-icon">
                    <DollarSign size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-label">Total Revenue</div>
                    <div className="metric-value">${totalRevenue.toLocaleString()}</div>
                    <div className="metric-change positive">
                      <TrendingUp size={14} />
                      <span>This period</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <Zap size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-label">LLM Costs</div>
                    <div className="metric-value">${llmCosts.total.toFixed(0)}</div>
                    <div className="metric-change">
                      <span>{revenueMetrics.llmCostPercentage.toFixed(1)}% of revenue</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-label">Net Profit</div>
                    <div className="metric-value">${netProfit.toLocaleString()}</div>
                    <div className={`metric-change ${netProfit > 0 ? 'positive' : ''}`}>
                      {netProfit > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      <span>{summary?.profitMargin?.toFixed(1) || 0}% margin</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <BarChart3 size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-label">ROI</div>
                    <div className="metric-value">{revenueMetrics.roi.toFixed(0)}%</div>
                    <div className="metric-change positive">
                      <TrendingUp size={14} />
                      <span>LLM efficiency</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'var(--text-muted)',
              fontSize: '1.125rem',
              fontWeight: 500
            }}>
              {getTabName(activeTab)}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="mockup-sidebar right">
          {activeTab === 'idea-lab' || activeTab === 'crypto-lab' || activeTab === 'wealth-lab' || activeTab === 'vibed-ed' ? null : activeTab === 'llm' ? (
            <>
              <div className="sidebar-section">
                <h3>Benchmark Runner</h3>
                <BenchmarkRunner 
                  catalog={modelCatalog || []}
                  results={benchmarks || []}
                  isRunning={isBenchmarking}
                  onRun={runBenchmarks}
                  error={benchmarkError || undefined}
                />
              </div>
              <div className="sidebar-section">
                <h3>Cost Analysis</h3>
                <div className="cost-analysis">
                  <div className="cost-item">
                    <div className="cost-label">Current Model</div>
                    <div className="cost-value">{activeModel || 'None selected'}</div>
                  </div>
                  <div className="cost-item">
                    <div className="cost-label">Monthly LLM Cost</div>
                    <div className="cost-value">${llmCosts.monthly.toFixed(0)}</div>
                  </div>
                  <div className="cost-item">
                    <div className="cost-label">Cost % of Revenue</div>
                    <div className="cost-value">{revenueMetrics.llmCostPercentage.toFixed(1)}%</div>
                  </div>
                  {llmCosts.monthly > 0 && (
                    <div className="cost-savings">
                      <AlertCircle size={14} />
                      <span>Optimize model selection to reduce costs</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : activeTab === 'revenue' ? (
            <>
              <div className="sidebar-section">
                <h3>
                  <Sparkles size={18} />
                  AI Insights
                </h3>
                <div className="insights-list">
                  {revenueMetrics.llmCostPercentage > FINANCIAL_CONSTANTS.COST_WARNING_THRESHOLD && (
                    <div className="insight-item">
                      <div className="insight-icon">💡</div>
                      <div className="insight-content">
                        <div className="insight-title">Cost Optimization</div>
                        <div className="insight-text">
                          LLM costs are {revenueMetrics.llmCostPercentage.toFixed(1)}% of revenue. Consider optimizing model selection for non-critical tasks.
                        </div>
                      </div>
                    </div>
                  )}
                  {revenueMetrics.roi > 1000 && (
                    <div className="insight-item">
                      <div className="insight-icon">🎯</div>
                      <div className="insight-content">
                        <div className="insight-title">Excellent ROI</div>
                        <div className="insight-text">
                          Your LLM investment is generating {revenueMetrics.roi.toFixed(0)}% ROI. Great efficiency!
                        </div>
                      </div>
                    </div>
                  )}
                  {activeModel && (
                    <div className="insight-item">
                      <div className="insight-icon">⚡</div>
                      <div className="insight-content">
                        <div className="insight-title">Model Status</div>
                        <div className="insight-text">
                          Currently using {activeModel}. Monitor performance and costs regularly.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="sidebar-section">
                <h3>Quick Actions</h3>
                <div className="quick-actions-list">
                  <button className="quick-action-btn" onClick={() => handleTabChange('llm')}>
                    <TrendingUp size={16} />
                    <span>Optimize LLM Costs</span>
                  </button>
                  <button className="quick-action-btn" onClick={handleRefresh}>
                    <DollarSign size={16} />
                    <span>Refresh Revenue Data</span>
                  </button>
                  <button className="quick-action-btn" onClick={() => window.open('#/back-office', '_blank')}>
                    <BarChart3 size={16} />
                    <span>Open Back Office</span>
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default LLMRevenueCommandCenter;

