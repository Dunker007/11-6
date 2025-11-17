/**
 * PassiveIncomeDashboard.tsx
 *
 * PURPOSE:
 * Comprehensive dashboard for managing passive income automation.
 * Provides overview of content generation, affiliate links, revenue tracking,
 * and automation scheduler status.
 *
 * FEATURES:
 * - Real-time revenue tracking and analytics
 * - Content generation interface
 * - Affiliate link management
 * - Automation scheduler controls
 * - Performance metrics and forecasts
 */

import { useState, useEffect } from 'react';
import {
  contentGenerationService,
  affiliateLinkService,
  revenueTrackingService,
  automationScheduler,
} from '@/services/passive-income';
import type {
  GeneratedContent,
  AffiliateLink,
} from '@/services/passive-income';
import {
  DollarSign,
  TrendingUp,
  FileText,
  Link2,
  Calendar,
  PlayCircle,
  PauseCircle,
  Activity,
  Target,
  Zap,
} from 'lucide-react';
import '@/styles/PassiveIncome.css';

export function PassiveIncomeDashboard() {
  const [revenueStats, setRevenueStats] = useState(revenueTrackingService.getAnalytics());
  const [contentStats, setContentStats] = useState(contentGenerationService.getStats());
  const [affiliateStats, setAffiliateStats] = useState(affiliateLinkService.getAnalytics());
  const [schedulerStats, setSchedulerStats] = useState(automationScheduler.getStats());
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(schedulerStats.isRunning);

  const [selectedTab, setSelectedTab] = useState<'overview' | 'content' | 'affiliate' | 'revenue' | 'automation'>('overview');

  // Refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRevenueStats(revenueTrackingService.getAnalytics());
      setContentStats(contentGenerationService.getStats());
      setAffiliateStats(affiliateLinkService.getAnalytics());
      setSchedulerStats(automationScheduler.getStats());
      setIsSchedulerRunning(automationScheduler.getStats().isRunning);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const toggleScheduler = () => {
    if (isSchedulerRunning) {
      automationScheduler.stop();
    } else {
      automationScheduler.start();
    }
    setIsSchedulerRunning(!isSchedulerRunning);
    setSchedulerStats(automationScheduler.getStats());
  };

  return (
    <div className="passive-income-dashboard">
      <div className="dashboard-header">
        <h1>
          <Zap size={32} className="icon-glow" />
          Passive Income Automation
        </h1>
        <div className="scheduler-control">
          <button
            className={`scheduler-toggle ${isSchedulerRunning ? 'running' : 'stopped'}`}
            onClick={toggleScheduler}
          >
            {isSchedulerRunning ? (
              <>
                <PauseCircle size={20} />
                Pause Automation
              </>
            ) : (
              <>
                <PlayCircle size={20} />
                Start Automation
              </>
            )}
          </button>
          <span className={`scheduler-status ${isSchedulerRunning ? 'active' : 'inactive'}`}>
            {isSchedulerRunning ? '🟢 Active' : '🔴 Stopped'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${selectedTab === 'overview' ? 'active' : ''}`}
          onClick={() => setSelectedTab('overview')}
        >
          <Activity size={18} />
          Overview
        </button>
        <button
          className={`tab-btn ${selectedTab === 'content' ? 'active' : ''}`}
          onClick={() => setSelectedTab('content')}
        >
          <FileText size={18} />
          Content
        </button>
        <button
          className={`tab-btn ${selectedTab === 'affiliate' ? 'active' : ''}`}
          onClick={() => setSelectedTab('affiliate')}
        >
          <Link2 size={18} />
          Affiliate Links
        </button>
        <button
          className={`tab-btn ${selectedTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setSelectedTab('revenue')}
        >
          <DollarSign size={18} />
          Revenue
        </button>
        <button
          className={`tab-btn ${selectedTab === 'automation' ? 'active' : ''}`}
          onClick={() => setSelectedTab('automation')}
        >
          <Calendar size={18} />
          Automation
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <OverviewTab
          revenueStats={revenueStats}
          contentStats={contentStats}
          affiliateStats={affiliateStats}
          schedulerStats={schedulerStats}
        />
      )}

      {selectedTab === 'content' && <ContentTab contentStats={contentStats} />}

      {selectedTab === 'affiliate' && <AffiliateTab affiliateStats={affiliateStats} />}

      {selectedTab === 'revenue' && <RevenueTab revenueStats={revenueStats} />}

      {selectedTab === 'automation' && <AutomationTab schedulerStats={schedulerStats} />}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ revenueStats, contentStats, affiliateStats, schedulerStats }: any) {
  return (
    <div className="overview-tab">
      <div className="stats-grid">
        <div className="stat-card revenue">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">${revenueStats.totalRevenue.toFixed(2)}</span>
            <span className="stat-growth">{revenueStats.growth}</span>
          </div>
        </div>

        <div className="stat-card content">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Content Generated</span>
            <span className="stat-value">{contentStats.totalContent}</span>
            <span className="stat-detail">{contentStats.totalWords.toLocaleString()} words</span>
          </div>
        </div>

        <div className="stat-card affiliate">
          <div className="stat-icon">
            <Link2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Affiliate Revenue</span>
            <span className="stat-value">${affiliateStats.totalRevenue.toFixed(2)}</span>
            <span className="stat-detail">{affiliateStats.totalClicks} clicks | {affiliateStats.conversionRate}</span>
          </div>
        </div>

        <div className="stat-card automation">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Active Tasks</span>
            <span className="stat-value">{schedulerStats.activeTasks}</span>
            <span className="stat-detail">Success rate: {schedulerStats.successRate}</span>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => alert('Content generation started!')}>
            <FileText size={20} />
            Generate Content Now
          </button>
          <button className="action-btn" onClick={() => alert('Creating affiliate link...')}>
            <Link2 size={20} />
            Create Affiliate Link
          </button>
          <button className="action-btn" onClick={() => alert('Adding revenue entry...')}>
            <DollarSign size={20} />
            Record Revenue
          </button>
        </div>
      </div>
    </div>
  );
}

// Content Tab Component
function ContentTab({ contentStats }: any) {
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);

  useEffect(() => {
    setGeneratedContent(contentGenerationService.getGeneratedContent());
  }, [contentStats]);

  return (
    <div className="content-tab">
      <div className="tab-header">
        <h2>Content Generation</h2>
        <div className="stats-summary">
          <span>Total: {contentStats.totalContent}</span>
          <span>Avg Quality: {contentStats.avgQualityScore}%</span>
          <span>Templates: {contentStats.templates}</span>
        </div>
      </div>

      <div className="content-list">
        {generatedContent.length === 0 ? (
          <div className="empty-state">
            <FileText size={48} />
            <p>No content generated yet</p>
            <button className="primary-btn">Generate First Content</button>
          </div>
        ) : (
          generatedContent.map((content) => (
            <div key={content.id} className="content-item">
              <div className="content-header">
                <h4>{content.title}</h4>
                <span className={`quality-badge ${content.qualityScore >= 70 ? 'high' : 'medium'}`}>
                  {content.qualityScore}%
                </span>
              </div>
              <div className="content-meta">
                <span>{content.type}</span>
                <span>{content.metadata.wordCount} words</span>
                <span>{content.metadata.readingTime} min read</span>
                <span>{content.generatedAt.toLocaleDateString()}</span>
              </div>
              <p className="content-preview">
                {content.content.substring(0, 150)}...
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Affiliate Tab Component
function AffiliateTab({ affiliateStats }: any) {
  const [links, setLinks] = useState<AffiliateLink[]>([]);

  useEffect(() => {
    setLinks(affiliateLinkService.getLinks());
  }, [affiliateStats]);

  return (
    <div className="affiliate-tab">
      <div className="tab-header">
        <h2>Affiliate Links</h2>
        <div className="stats-summary">
          <span>Total Links: {affiliateStats.totalLinks}</span>
          <span>Clicks: {affiliateStats.totalClicks}</span>
          <span>Conversions: {affiliateStats.totalConversions}</span>
          <span>Revenue: ${affiliateStats.totalRevenue.toFixed(2)}</span>
        </div>
      </div>

      <div className="top-performers">
        <h3>Top Performers</h3>
        <div className="performers-list">
          {affiliateStats.topPerformers.map((performer: any, index: number) => (
            <div key={index} className="performer-item">
              <span className="rank">#{index + 1}</span>
              <span className="product">{performer.productName}</span>
              <span className="clicks">{performer.clicks} clicks</span>
              <span className="revenue">${performer.revenue.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="links-list">
        <h3>All Links</h3>
        {links.length === 0 ? (
          <div className="empty-state">
            <Link2 size={48} />
            <p>No affiliate links created yet</p>
          </div>
        ) : (
          links.slice(0, 10).map((link) => (
            <div key={link.id} className="link-item">
              <div className="link-info">
                <h4>{link.productName}</h4>
                <span className="category">{link.category}</span>
              </div>
              <div className="link-metrics">
                <span>{link.metrics.clicks} clicks</span>
                <span>{link.metrics.conversions} conversions</span>
                <span>${link.metrics.revenue.toFixed(2)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Revenue Tab Component
function RevenueTab({ revenueStats }: any) {
  const forecast = revenueTrackingService.getForecast(3);
  const goals = revenueTrackingService.getGoals();

  return (
    <div className="revenue-tab">
      <div className="revenue-summary">
        <h2>Revenue Analytics</h2>
        <div className="revenue-metrics">
          <div className="metric">
            <TrendingUp size={20} />
            <div>
              <span className="metric-label">Total Revenue</span>
              <span className="metric-value">${revenueStats.totalRevenue.toFixed(2)}</span>
            </div>
          </div>
          <div className="metric">
            <Activity size={20} />
            <div>
              <span className="metric-label">Growth</span>
              <span className="metric-value">{revenueStats.growth}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="revenue-forecast">
        <h3>3-Month Forecast</h3>
        <div className="forecast-list">
          {forecast.map((f) => (
            <div key={f.period} className="forecast-item">
              <span className="period">{f.period}</span>
              <span className="amount">${f.predictedAmount.toFixed(2)}</span>
              <span className="confidence">{f.confidence}% confidence</span>
            </div>
          ))}
        </div>
      </div>

      <div className="revenue-goals">
        <h3>Revenue Goals</h3>
        {goals.length === 0 ? (
          <p>No active goals</p>
        ) : (
          goals.map((goal) => {
            const progress = revenueTrackingService.getGoalProgress(goal.id);
            return (
              <div key={goal.id} className="goal-item">
                <div className="goal-header">
                  <h4>{goal.name}</h4>
                  <span className="goal-target">${goal.targetAmount.toFixed(2)}</span>
                </div>
                <div className="goal-progress">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="progress-text">{progress.toFixed(0)}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// Automation Tab Component
function AutomationTab({ schedulerStats }: any) {
  const [tasks, setTasks] = useState(automationScheduler.getTasks());
  const [history, setHistory] = useState(automationScheduler.getHistory(20));

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(automationScheduler.getTasks());
      setHistory(automationScheduler.getHistory(20));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="automation-tab">
      <div className="automation-stats">
        <h2>Automation Status</h2>
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{schedulerStats.totalTasks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active</span>
            <span className="stat-value">{schedulerStats.activeTasks}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Success Rate</span>
            <span className="stat-value">{schedulerStats.successRate}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Avg Duration</span>
            <span className="stat-value">{schedulerStats.avgDuration}</span>
          </div>
        </div>
      </div>

      <div className="scheduled-tasks">
        <h3>Scheduled Tasks</h3>
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task.id} className={`task-item status-${task.status}`}>
              <div className="task-info">
                <h4>{task.name}</h4>
                <p>{task.description}</p>
              </div>
              <div className="task-meta">
                <span className={`priority ${task.priority}`}>{task.priority}</span>
                <span className={`status ${task.status}`}>{task.status}</span>
                {task.nextRun && (
                  <span className="next-run">
                    Next: {task.nextRun.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="task-history">
        <h3>Recent Activity</h3>
        <div className="history-list">
          {history.map((entry, index) => (
            <div key={index} className={`history-item ${entry.success ? 'success' : 'failed'}`}>
              <span className="task-name">{entry.taskName}</span>
              <span className="timestamp">{entry.startedAt.toLocaleString()}</span>
              <span className="duration">{entry.duration}ms</span>
              <span className={`result ${entry.success ? 'success' : 'failed'}`}>
                {entry.success ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PassiveIncomeDashboard;
