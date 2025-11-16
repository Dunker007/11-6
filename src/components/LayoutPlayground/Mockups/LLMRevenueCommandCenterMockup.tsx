import { useState } from 'react';
import { Cpu, HardDrive, Zap, TrendingUp, BarChart3, Play, CheckCircle, AlertCircle, DollarSign, TrendingDown, PieChart, Target, Sparkles } from 'lucide-react';
import '../../../styles/LayoutMockups.css';

function LLMRevenueCommandCenterMockup() {
  const [activeProvider, setActiveProvider] = useState<'lm-studio' | 'ollama' | 'gemini'>('lm-studio');
  const [activeModel, setActiveModel] = useState('llama-3.1-8b');
  const [activeTab, setActiveTab] = useState<'llm' | 'revenue'>('llm');

  const providers = [
    { id: 'lm-studio' as const, name: 'LM Studio', status: 'online', models: 5, costPerHour: 0.05 },
    { id: 'ollama' as const, name: 'Ollama', status: 'online', models: 3, costPerHour: 0.02 },
    { id: 'gemini' as const, name: 'Gemini', status: 'offline', models: 0, costPerHour: 0.15 },
  ];

  const models = [
    { name: 'llama-3.1-8b', provider: 'lm-studio', speed: 45, quality: 92, memory: '4.2 GB', costPer1kTokens: 0.001 },
    { name: 'mistral-7b', provider: 'ollama', speed: 52, quality: 88, memory: '4.1 GB', costPer1kTokens: 0.0008 },
    { name: 'codellama-7b', provider: 'ollama', speed: 48, quality: 95, memory: '3.8 GB', costPer1kTokens: 0.0009 },
  ];

  const revenueStreams = [
    { name: 'SaaS Subscriptions', amount: 2450, change: +12.5, trend: 'up', llmCost: 120 },
    { name: 'Affiliate Commissions', amount: 890, change: +8.2, trend: 'up', llmCost: 45 },
    { name: 'Digital Products', amount: 1230, change: -3.1, trend: 'down', llmCost: 80 },
    { name: 'Consulting', amount: 2100, change: +15.3, trend: 'up', llmCost: 150 },
  ];

  const totalRevenue = revenueStreams.reduce((sum, stream) => sum + stream.amount, 0);
  const totalLLMCost = revenueStreams.reduce((sum, stream) => sum + stream.llmCost, 0);
  const netProfit = totalRevenue - totalLLMCost;

  return (
    <div className="mockup-container llm-revenue-command-center">
      {/* Top Status Bar */}
      <div className="mockup-top-bar llm-revenue-bar">
        <div className="tab-selector">
          <button
            className={`tab-btn-large ${activeTab === 'llm' ? 'active' : ''}`}
            onClick={() => setActiveTab('llm')}
          >
            <Zap size={18} />
            <span>LLM Optimization</span>
          </button>
          <button
            className={`tab-btn-large ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <DollarSign size={18} />
            <span>Revenue & Monetization</span>
          </button>
        </div>
        <div className="quick-stats">
          <div className="quick-stat">
            <span className="stat-label">Net Profit</span>
            <span className="stat-value positive">${netProfit.toLocaleString()}</span>
          </div>
          <div className="quick-stat">
            <span className="stat-label">LLM Cost</span>
            <span className="stat-value">${totalLLMCost}/mo</span>
          </div>
          <div className="quick-stat">
            <span className="stat-label">Active Model</span>
            <span className="stat-value">{activeModel}</span>
          </div>
        </div>
      </div>

      <div className="mockup-main-layout llm-revenue-layout">
        {/* Left Panel */}
        <div className="mockup-sidebar left">
          {activeTab === 'llm' ? (
            <>
              <div className="sidebar-section">
                <h3>Model Catalog</h3>
                <div className="model-list">
                  {models.map((model, idx) => (
                    <div
                      key={idx}
                      className={`model-card ${activeModel === model.name ? 'active' : ''}`}
                      onClick={() => setActiveModel(model.name)}
                    >
                      <div className="model-header">
                        <span className="model-name">{model.name}</span>
                        <span className="model-provider">{model.provider}</span>
                      </div>
                      <div className="model-stats">
                        <div className="stat">
                          <TrendingUp size={12} />
                          <span>{model.speed} tok/s</span>
                        </div>
                        <div className="stat">
                          <BarChart3 size={12} />
                          <span>{model.quality}%</span>
                        </div>
                        <div className="stat">
                          <DollarSign size={12} />
                          <span>${model.costPer1kTokens}/1k</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar-section">
                <h3>Providers</h3>
                <div className="provider-list">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      className={`provider-btn ${activeProvider === provider.id ? 'active' : ''} ${provider.status}`}
                      onClick={() => setActiveProvider(provider.id)}
                    >
                      <div className={`status-dot ${provider.status}`} />
                      <span>{provider.name}</span>
                      <span className="provider-cost">${provider.costPerHour}/hr</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-section">
                <h3>
                  <PieChart size={18} />
                  Revenue Streams
                </h3>
                <div className="revenue-streams-list">
                  {revenueStreams.map((stream, idx) => (
                    <div key={idx} className="revenue-stream-card">
                      <div className="stream-header">
                        <span className="stream-name">{stream.name}</span>
                        <div className={`stream-change ${stream.trend}`}>
                          {stream.trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          <span>{Math.abs(stream.change)}%</span>
                        </div>
                      </div>
                      <div className="stream-amount">${stream.amount.toLocaleString()}</div>
                      <div className="stream-cost">
                        <span>LLM Cost: ${stream.llmCost}/mo</span>
                        <span className="roi">ROI: {((stream.amount / stream.llmCost) * 100).toFixed(0)}%</span>
                      </div>
                      <div className="stream-bar">
                        <div
                          className="stream-bar-fill"
                          style={{ width: `${(stream.amount / totalRevenue) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
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
                        <div className="progress-fill" style={{ width: '82%' }} />
                      </div>
                      <span>82% ($6,570 / $8,000)</span>
                    </div>
                  </div>
                  <div className="goal-item">
                    <div className="goal-label">LLM Cost Target</div>
                    <div className="goal-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '95%' }} />
                      </div>
                      <span>95% ($395 / $400)</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Center - Main Dashboard */}
        <div className="mockup-center">
          {activeTab === 'llm' ? (
            <>
              <div className="hardware-profiler">
                <h2>Hardware Profile</h2>
                <div className="hardware-grid">
                  <div className="hardware-card">
                    <Cpu size={24} />
                    <div className="hardware-info">
                      <div className="hardware-label">CPU</div>
                      <div className="hardware-value">AMD Ryzen 9 5900X</div>
                      <div className="hardware-usage">
                        <div className="usage-bar">
                          <div className="usage-fill" style={{ width: '45%' }} />
                        </div>
                        <span>45% usage</span>
                      </div>
                    </div>
                  </div>

                  <div className="hardware-card">
                    <HardDrive size={24} />
                    <div className="hardware-info">
                      <div className="hardware-label">RAM</div>
                      <div className="hardware-value">32 GB DDR4</div>
                      <div className="hardware-usage">
                        <div className="usage-bar">
                          <div className="usage-fill" style={{ width: '62%' }} />
                        </div>
                        <span>62% usage</span>
                      </div>
                    </div>
                  </div>

                  <div className="hardware-card">
                    <Zap size={24} />
                    <div className="hardware-info">
                      <div className="hardware-label">GPU</div>
                      <div className="hardware-value">NVIDIA RTX 3080</div>
                      <div className="hardware-usage">
                        <div className="usage-bar">
                          <div className="usage-fill" style={{ width: '78%' }} />
                        </div>
                        <span>78% usage</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="system-health">
                <h2>System Health</h2>
                <div className="health-grid">
                  <div className="health-item">
                    <div className="health-label">Temp Files</div>
                    <div className="health-value">2.3 GB</div>
                    <button className="clean-btn">Clean</button>
                  </div>
                  <div className="health-item">
                    <div className="health-label">Cache</div>
                    <div className="health-value">1.1 GB</div>
                    <button className="clean-btn">Clean</button>
                  </div>
                  <div className="health-item">
                    <div className="health-label">Dev Tools</div>
                    <div className="health-status">
                      <CheckCircle size={16} className="status-ok" />
                      <span>All installed</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="dashboard-header">
                <h2>Revenue Dashboard</h2>
                <div className="dashboard-actions">
                  <button className="action-btn">
                    <Sparkles size={16} />
                    <span>AI Insights</span>
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
                      <span>+12.8%</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <Zap size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-label">LLM Costs</div>
                    <div className="metric-value">${totalLLMCost}</div>
                    <div className="metric-change">
                      <span>3.2% of revenue</span>
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
                    <div className="metric-change positive">
                      <TrendingUp size={14} />
                      <span>+15.2%</span>
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <div className="metric-icon">
                    <BarChart3 size={24} />
                  </div>
                  <div className="metric-content">
                    <div className="metric-label">ROI</div>
                    <div className="metric-value">1,660%</div>
                    <div className="metric-change positive">
                      <TrendingUp size={14} />
                      <span>+8.2%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="chart-container">
                <div className="chart-header">
                  <BarChart3 size={20} />
                  <span>Revenue vs LLM Costs</span>
                </div>
                <div className="chart-mockup">
                  <svg viewBox="0 0 400 200" className="revenue-chart">
                    <polyline
                      points="20,180 60,150 100,140 140,130 180,120 220,110 260,105 300,100 340,95 380,90"
                      fill="none"
                      stroke="var(--violet-500)"
                      strokeWidth="2"
                    />
                    <polyline
                      points="20,190 60,185 100,180 140,175 180,170 220,165 260,160 300,155 340,150 380,145"
                      fill="none"
                      stroke="var(--red-500)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  </svg>
                  <div className="chart-legend">
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: 'var(--violet-500)' }} />
                      <span>Revenue</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: 'var(--red-500)' }} />
                      <span>LLM Costs</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Panel */}
        <div className="mockup-sidebar right">
          {activeTab === 'llm' ? (
            <>
              <div className="sidebar-section">
                <h3>Benchmark Runner</h3>
                <div className="benchmark-controls">
                  <button className="benchmark-btn primary">
                    <Play size={16} />
                    <span>Run Benchmark</span>
                  </button>
                </div>
                <div className="benchmark-results">
                  <div className="result-header">Latest Results</div>
                  {models.map((model, idx) => (
                    <div key={idx} className="result-item">
                      <div className="result-model">{model.name}</div>
                      <div className="result-score">
                        <BarChart3 size={14} />
                        <span>{model.quality}/100</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="sidebar-section">
                <h3>Cost Analysis</h3>
                <div className="cost-analysis">
                  <div className="cost-item">
                    <div className="cost-label">Current Model Cost</div>
                    <div className="cost-value">${models.find(m => m.name === activeModel)?.costPer1kTokens || 0}/1k tokens</div>
                  </div>
                  <div className="cost-item">
                    <div className="cost-label">Monthly Usage</div>
                    <div className="cost-value">2.4M tokens</div>
                  </div>
                  <div className="cost-item">
                    <div className="cost-label">Monthly Cost</div>
                    <div className="cost-value">${totalLLMCost}</div>
                  </div>
                  <div className="cost-savings">
                    <AlertCircle size={14} />
                    <span>Switching to Ollama could save $120/mo</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="sidebar-section">
                <h3>
                  <Sparkles size={18} />
                  AI Insights
                </h3>
                <div className="insights-list">
                  <div className="insight-item">
                    <div className="insight-icon">💡</div>
                    <div className="insight-content">
                      <div className="insight-title">Cost Optimization</div>
                      <div className="insight-text">
                        LLM costs are 3.2% of revenue - excellent efficiency. Consider optimizing model selection for non-critical tasks.
                      </div>
                    </div>
                  </div>
                  <div className="insight-item">
                    <div className="insight-icon">🎯</div>
                    <div className="insight-content">
                      <div className="insight-title">Growth Opportunity</div>
                      <div className="insight-text">
                        SaaS subscriptions showing strong growth (+12.5%). Consider increasing pricing or adding premium tiers.
                      </div>
                    </div>
                  </div>
                  <div className="insight-item">
                    <div className="insight-icon">⚡</div>
                    <div className="insight-content">
                      <div className="insight-title">LLM Efficiency</div>
                      <div className="insight-text">
                        Current model (llama-3.1-8b) provides 92% quality at low cost. Perfect balance for most tasks.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sidebar-section">
                <h3>Quick Actions</h3>
                <div className="quick-actions-list">
                  <button className="quick-action-btn">
                    <TrendingUp size={16} />
                    <span>Optimize LLM Costs</span>
                  </button>
                  <button className="quick-action-btn">
                    <DollarSign size={16} />
                    <span>View Revenue Report</span>
                  </button>
                  <button className="quick-action-btn">
                    <BarChart3 size={16} />
                    <span>Run Cost Analysis</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default LLMRevenueCommandCenterMockup;

