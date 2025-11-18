import React, { useState, lazy, Suspense, memo } from 'react';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { CyberLoader } from '../ui/CyberLoader';
import './UnifiedDashboard.css';

// Lazy load all heavy components for optimal bundle splitting
const CredentialVault = lazy(() => import('../Settings/CredentialVault').then(m => ({ default: m.CredentialVault })));
const IdleRevenueDashboard = lazy(() => import('../IdleComputing/IdleRevenueDashboard').then(m => ({ default: m.IdleRevenueDashboard })));
const AgentGrid = lazy(() => import('../Agents/AgentChat').then(m => ({ default: m.AgentGrid })));
const IntegrationTestDashboard = lazy(() => import('../Testing/IntegrationTestDashboard').then(m => ({ default: m.IntegrationTestDashboard })));
const SetupLauncher = lazy(() => import('../Setup/GuidedSetupWizard').then(m => ({ default: m.SetupLauncher })));
const AIIntelligenceDashboard = lazy(() => import('./AIIntelligenceDashboard').then(m => ({ default: m.AIIntelligenceDashboard })));
const MasterRevenueDashboard = lazy(() => import('../Revenue/MasterRevenueDashboard').then(m => ({ default: m.MasterRevenueDashboard })));
const FinancialDashboard = lazy(() => import('../BackOffice/FinancialDashboard'));
const WealthLab = lazy(() => import('../LLMOptimizer/WealthLab/WealthLab'));
const IdeaLab = lazy(() => import('../LLMOptimizer/IdeaLab'));
const GoogleAIHub = lazy(() => import('../LLMOptimizer/GoogleAIHub'));

type TabId = 'overview' | 'intelligence' | 'credentials' | 'idle' | 'agents' | 'testing' | 'setup' | 'revenue' | 'backoffice' | 'wealth' | 'ideas' | 'googleai';

interface Tab {
  id: TabId;
  name: string;
  icon: string;
  badge?: number;
}

// Professional Loading Fallback
const TabLoadingFallback = () => (
  <div className="tab-loading-container">
    <CyberLoader variant="spinner" size="lg" message="Loading module..." />
  </div>
);

export const UnifiedDashboard: React.FC = memo(() => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: Tab[] = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'revenue', name: 'Revenue', icon: '💰' },
    { id: 'backoffice', name: 'Back Office', icon: '📈' },
    { id: 'wealth', name: 'Wealth Lab', icon: '💎' },
    { id: 'ideas', name: 'Idea Lab', icon: '💡' },
    { id: 'googleai', name: 'Google AI', icon: '🤖' },
    { id: 'intelligence', name: 'AI Intelligence', icon: '🧠' },
    { id: 'credentials', name: 'Credentials', icon: '🔐' },
    { id: 'idle', name: 'Idle Computing', icon: '💻' },
    { id: 'agents', name: 'AI Agents', icon: '🤖', badge: 7 },
    { id: 'testing', name: 'Integration Tests', icon: '🧪' },
    { id: 'setup', name: 'Setup', icon: '🚀' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab setActiveTab={setActiveTab} />;
      case 'revenue':
        return <Suspense fallback={<TabLoadingFallback />}><MasterRevenueDashboard /></Suspense>;
      case 'backoffice':
        return <Suspense fallback={<TabLoadingFallback />}><FinancialDashboard /></Suspense>;
      case 'wealth':
        return <Suspense fallback={<TabLoadingFallback />}><WealthLab /></Suspense>;
      case 'ideas':
        return <Suspense fallback={<TabLoadingFallback />}><IdeaLab /></Suspense>;
      case 'googleai':
        return <Suspense fallback={<TabLoadingFallback />}><GoogleAIHub /></Suspense>;
      case 'intelligence':
        return <Suspense fallback={<TabLoadingFallback />}><AIIntelligenceDashboard /></Suspense>;
      case 'credentials':
        return <Suspense fallback={<TabLoadingFallback />}><CredentialVault /></Suspense>;
      case 'idle':
        return <Suspense fallback={<TabLoadingFallback />}><IdleRevenueDashboard /></Suspense>;
      case 'agents':
        return <Suspense fallback={<TabLoadingFallback />}><AgentGrid /></Suspense>;
      case 'testing':
        return <Suspense fallback={<TabLoadingFallback />}><IntegrationTestDashboard /></Suspense>;
      case 'setup':
        return <Suspense fallback={<TabLoadingFallback />}><SetupLauncher /></Suspense>;
      default:
        return <OverviewTab setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="cyber-command-center">
      {/* Animated Background */}
      <div className="cyber-background">
        <div className="cyber-background__stars"></div>
        <div className="cyber-background__grid"></div>
        <div className="cyber-background__glow cyber-background__glow--cyan"></div>
        <div className="cyber-background__glow cyber-background__glow--purple"></div>
      </div>

      {/* Header */}
      <header className="cyber-header">
        <div className="cyber-header__container">
          <div className="cyber-header__top">
            <div className="cyber-header__brand">
              <div className="cyber-header__logo">
                <img
                  src="/assets/branding/dlx-brain-command-center.png"
                  alt="DLX Studios"
                  className="cyber-header__logo-img"
                />
              </div>
              <div className="cyber-header__title">
                <h1 className="gradient-text">
                  DLX Studios Ultimate
                </h1>
                <p className="cyber-header__subtitle">
                  Enterprise Revenue Automation Platform
                </p>
              </div>
            </div>
            <div className="cyber-header__actions">
              <CyberButton
                variant="secondary"
                size="md"
                onClick={() => setActiveTab('credentials')}
                leftIcon={<span>⚙️</span>}
              >
                Settings
              </CyberButton>
              <CyberButton
                variant="primary"
                size="md"
                onClick={() => setActiveTab('setup')}
                leftIcon={<span>🚀</span>}
              >
                Quick Start
              </CyberButton>
            </div>
          </div>

          {/* Tabs Navigation */}
          <nav className="cyber-tabs">
            <div className="cyber-tabs__container">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`cyber-tab ${activeTab === tab.id ? 'cyber-tab--active' : ''} animate-fade-in-up`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <span className="cyber-tab__icon">{tab.icon}</span>
                  <span className="cyber-tab__name">{tab.name}</span>
                  {tab.badge && (
                    <span className="cyber-tab__badge animate-pulse">
                      {tab.badge}
                    </span>
                  )}
                  {activeTab === tab.id && (
                    <span className="cyber-tab__indicator"></span>
                  )}
                </button>
              ))}
            </div>
          </nav>
        </div>
      </header>

      {/* Content Area */}
      <main className="cyber-content">
        {renderTabContent()}
      </main>
    </div>
  );
});

UnifiedDashboard.displayName = 'UnifiedDashboard';

const OverviewTab: React.FC<{ setActiveTab: (tab: TabId) => void }> = memo(({ setActiveTab }) => {
  const quickStats = [
    { label: 'Total Revenue', value: '$2,847.32', change: '+12.5%', icon: '💰', color: 'cyan' },
    { label: 'Content Published', value: '142', change: '+8', icon: '📝', color: 'purple' },
    { label: 'Idle Computing', value: '$432/mo', change: 'potential', icon: '💻', color: 'cyan' },
    { label: 'Active Services', value: '12/18', change: '66%', icon: '🔗', color: 'purple' },
  ];

  return (
    <div className="cyber-overview">
      <div className="cyber-overview__container">
        {/* Quick Stats */}
        <section className="cyber-section">
          <h2 className="cyber-section__title">
            <span>Overview</span>
          </h2>
          <div className="cyber-stats-grid">
            {quickStats.map((stat, idx) => (
              <CyberCard
                key={idx}
                variant="glass"
                glow={false}
                hoverEffect={true}
                neonBorder={false}
                cornerAccents={false}
                className="cyber-stat-card animate-fade-in-up"
                style={{ animationDelay: `${idx * 0.05}s` }}
              >
                <div className="cyber-stat-card__header">
                  <span className="cyber-stat-card__icon">{stat.icon}</span>
                  <div className={`cyber-stat-card__change cyber-stat-card__change--${stat.color}`}>
                    {stat.change}
                  </div>
                </div>
                <div className={`cyber-stat-card__value gradient-text`}>
                  {stat.value}
                </div>
                <div className="cyber-stat-card__label">
                  {stat.label}
                </div>
              </CyberCard>
            ))}
          </div>
        </section>

        {/* Feature Cards */}
        <section className="cyber-section">
          <h2 className="cyber-section__title">
            <span>Quick Access</span>
          </h2>
          <div className="cyber-features-grid">
            <FeatureCard
              icon="💰"
              title="Master Revenue Dashboard"
              description="Unified view of all revenue sources - Stripe, Gumroad, affiliates, passive income, and idle computing"
              onClick={() => setActiveTab('revenue')}
              delay={0}
            />
            <FeatureCard
              icon="📈"
              title="Back Office & Analytics"
              description="Financial charts, expense tracking, and business performance metrics"
              onClick={() => setActiveTab('backoffice')}
              delay={0.1}
            />
            <FeatureCard
              icon="💎"
              title="Wealth Lab"
              description="Crypto & ETF portfolio tracking, budget management, and net worth analysis"
              onClick={() => setActiveTab('wealth')}
              delay={0.2}
            />
            <FeatureCard
              icon="💡"
              title="Idea Lab"
              description="Brainstorm and plan ideas with interactive canvas and mind maps"
              onClick={() => setActiveTab('ideas')}
              delay={0.3}
            />
            <FeatureCard
              icon="🤖"
              title="Google AI Hub"
              description="Gemini AI Studio, NotebookLM research, vision-to-code, and smart code analysis"
              onClick={() => setActiveTab('googleai')}
              delay={0.4}
            />
            <FeatureCard
              icon="🧠"
              title="AI Intelligence"
              description="10 intelligent systems optimizing revenue, content, and automation in real-time"
              onClick={() => setActiveTab('intelligence')}
              delay={0.5}
            />
            <FeatureCard
              icon="🔐"
              title="Manage Credentials"
              description="Connect and manage all your service credentials in one secure vault"
              onClick={() => setActiveTab('credentials')}
              delay={0.6}
            />
            <FeatureCard
              icon="💻"
              title="Idle Computing Revenue"
              description="Earn up to $432/month from your unused computing resources"
              onClick={() => setActiveTab('idle')}
              delay={0.7}
            />
            <FeatureCard
              icon="🤖"
              title="AI Agents"
              description="7 specialized agents ready to help with content, revenue, and more"
              onClick={() => setActiveTab('agents')}
              delay={0.8}
            />
            <FeatureCard
              icon="🧪"
              title="Test Integrations"
              description="One-click testing for all your service connections"
              onClick={() => setActiveTab('testing')}
              delay={0.9}
            />
          </div>
        </section>

        {/* Recent Activity */}
        <section className="cyber-section">
          <h2 className="cyber-section__title">
            <span>Recent Activity</span>
          </h2>
          <CyberCard variant="glass" neonBorder={false} className="cyber-activity-list">
            <ActivityItem
              icon="✅"
              title="Stripe Connected"
              description="Payment processing is now active"
              time="5 minutes ago"
              color="success"
            />
            <ActivityItem
              icon="📝"
              title="Content Generated"
              description="New blog post created: 'Passive Income Strategies'"
              time="1 hour ago"
              color="info"
            />
            <ActivityItem
              icon="💻"
              title="Joined Golem Network"
              description="Earning $108/month from compute resources"
              time="2 hours ago"
              color="purple"
            />
            <ActivityItem
              icon="🧪"
              title="Integration Tests Passed"
              description="12/12 services connected successfully"
              time="3 hours ago"
              color="success"
            />
          </CyberCard>
        </section>
      </div>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
  delay?: number;
}

const FeatureCard: React.FC<FeatureCardProps> = memo(({ icon, title, description, onClick, delay = 0 }) => (
  <CyberCard
    variant="glass"
    glow={false}
    hoverEffect={true}
    neonBorder={false}
    clickable={true}
    onClick={onClick}
    className="cyber-feature-card animate-fade-in-up"
    style={{ animationDelay: `${delay * 0.05}s` }}
  >
    <div className="cyber-feature-card__icon">{icon}</div>
    <h3 className="cyber-feature-card__title">{title}</h3>
    <p className="cyber-feature-card__description">{description}</p>
    <div className="cyber-feature-card__arrow">→</div>
  </CyberCard>
));

FeatureCard.displayName = 'FeatureCard';

interface ActivityItemProps {
  icon: string;
  title: string;
  description: string;
  time: string;
  color: 'success' | 'info' | 'purple' | 'warning';
}

const ActivityItem: React.FC<ActivityItemProps> = memo(({ icon, title, description, time, color }) => (
  <div className="cyber-activity-item">
    <div className={`cyber-activity-item__icon cyber-activity-item__icon--${color}`}>
      {icon}
    </div>
    <div className="cyber-activity-item__content">
      <div className="cyber-activity-item__title">{title}</div>
      <div className="cyber-activity-item__description">{description}</div>
    </div>
    <div className="cyber-activity-item__time">{time}</div>
  </div>
));

ActivityItem.displayName = 'ActivityItem';
