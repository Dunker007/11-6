import React, { useState, lazy, Suspense, memo } from 'react';
import {
  LayoutDashboard,
  Brain,
  DollarSign,
  TrendingUp,
  Gem,
  Cpu,
  Lightbulb,
  Sparkles,
  Bot,
  Key,
  FlaskConical,
  Rocket
} from 'lucide-react';
import { CyberCard } from '../ui/CyberCard';
import { CyberButton } from '../ui/CyberButton';
import { CyberLoader } from '../ui/CyberLoader';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { Sidebar, Tab } from '../Navigation/Sidebar';
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

// Use TabId from Sidebar or define compatible type
type TabId = 'overview' | 'intelligence' | 'credentials' | 'idle' | 'agents' | 'testing' | 'setup' | 'revenue' | 'backoffice' | 'wealth' | 'ideas' | 'googleai';

// Professional Loading Fallback
const TabLoadingFallback = () => (
  <div className="tab-loading-container">
    <CyberLoader variant="spinner" size="lg" message="Loading module..." />
  </div>
);

export const UnifiedDashboard: React.FC = memo(() => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const tabs: Tab[] = [
    // Dashboard
    { id: 'overview', name: 'Overview', icon: <LayoutDashboard size={18} />, category: 'main' },
    { id: 'intelligence', name: 'AI Intelligence', icon: <Brain size={18} />, category: 'main' },

    // Revenue & Finance
    { id: 'revenue', name: 'Revenue', icon: <DollarSign size={18} />, category: 'revenue' },
    { id: 'backoffice', name: 'Back Office', icon: <TrendingUp size={18} />, category: 'revenue' },
    { id: 'wealth', name: 'Wealth Lab', icon: <Gem size={18} />, category: 'revenue' },
    { id: 'idle', name: 'Idle Computing', icon: <Cpu size={18} />, category: 'revenue' },

    // Innovation Labs
    { id: 'ideas', name: 'Idea Lab', icon: <Lightbulb size={18} />, category: 'labs' },
    { id: 'googleai', name: 'Google AI', icon: <Sparkles size={18} />, category: 'labs' },
    { id: 'agents', name: 'AI Agents', icon: <Bot size={18} />, badge: 7, category: 'labs' },

    // System
    { id: 'credentials', name: 'Credentials', icon: <Key size={18} />, category: 'system' },
    { id: 'testing', name: 'Integration Tests', icon: <FlaskConical size={18} />, category: 'system' },
    { id: 'setup', name: 'Setup', icon: <Rocket size={18} />, category: 'system' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ErrorBoundary sectionName="Overview Tab">
            <OverviewTab setActiveTab={setActiveTab} />
          </ErrorBoundary>
        );
      case 'revenue':
        return (
          <ErrorBoundary sectionName="Revenue Intelligence">
            <Suspense fallback={<TabLoadingFallback />}><MasterRevenueDashboard /></Suspense>
          </ErrorBoundary>
        );
      case 'backoffice':
        return (
          <ErrorBoundary sectionName="Back Office Dashboard">
            <Suspense fallback={<TabLoadingFallback />}><FinancialDashboard /></Suspense>
          </ErrorBoundary>
        );
      case 'wealth':
        return (
          <ErrorBoundary sectionName="Wealth Lab">
            <Suspense fallback={<TabLoadingFallback />}><WealthLab /></Suspense>
          </ErrorBoundary>
        );
      case 'ideas':
        return (
          <ErrorBoundary sectionName="Idea Lab">
            <Suspense fallback={<TabLoadingFallback />}><IdeaLab /></Suspense>
          </ErrorBoundary>
        );
      case 'googleai':
        return (
          <ErrorBoundary sectionName="Google AI Hub">
            <Suspense fallback={<TabLoadingFallback />}><GoogleAIHub /></Suspense>
          </ErrorBoundary>
        );
      case 'intelligence':
        return (
          <ErrorBoundary sectionName="AI Intelligence">
            <Suspense fallback={<TabLoadingFallback />}><AIIntelligenceDashboard /></Suspense>
          </ErrorBoundary>
        );
      case 'credentials':
        return (
          <ErrorBoundary sectionName="Credential Vault">
            <Suspense fallback={<TabLoadingFallback />}><CredentialVault /></Suspense>
          </ErrorBoundary>
        );
      case 'idle':
        return (
          <ErrorBoundary sectionName="Idle Computing">
            <Suspense fallback={<TabLoadingFallback />}><IdleRevenueDashboard /></Suspense>
          </ErrorBoundary>
        );
      case 'agents':
        return (
          <ErrorBoundary sectionName="AI Agents">
            <Suspense fallback={<TabLoadingFallback />}><AgentGrid /></Suspense>
          </ErrorBoundary>
        );
      case 'testing':
        return (
          <ErrorBoundary sectionName="Integration Tests">
            <Suspense fallback={<TabLoadingFallback />}><IntegrationTestDashboard /></Suspense>
          </ErrorBoundary>
        );
      case 'setup':
        return (
          <ErrorBoundary sectionName="Setup Wizard">
            <Suspense fallback={<TabLoadingFallback />}><SetupLauncher /></Suspense>
          </ErrorBoundary>
        );
      default:
        return (
          <ErrorBoundary sectionName="Overview Tab">
            <OverviewTab setActiveTab={setActiveTab} />
          </ErrorBoundary>
        );
    }
  };

  return (
    <div className={`cyber-command-center ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Animated Background */}
      <div className="cyber-background">
        <div className="cyber-background__stars"></div>
        <div className="cyber-background__grid"></div>
        <div className="cyber-background__glow cyber-background__glow--cyan"></div>
        <div className="cyber-background__glow cyber-background__glow--purple"></div>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(id) => setActiveTab(id as TabId)}
        tabs={tabs}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Layout */}
      <div className="cyber-main-layout">
        {/* Header */}
        <header className="cyber-header">
          <div className="cyber-header__container">
            <div className="cyber-header__content">
              <div className="cyber-header__breadcrumbs">
                <span className="cyber-breadcrumb-item">DLX Ultimate</span>
                <span className="cyber-breadcrumb-separator">/</span>
                <span className="cyber-breadcrumb-item cyber-breadcrumb-item--active">
                  {tabs.find(t => t.id === activeTab)?.name || 'Overview'}
                </span>
              </div>

              <div className="cyber-header__actions">
                <CyberButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('credentials')}
                  leftIcon={<span>⚙️</span>}
                >
                  Settings
                </CyberButton>
                <CyberButton
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab('setup')}
                  leftIcon={<span>🚀</span>}
                >
                  Quick Start
                </CyberButton>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="cyber-content">
          <div key={activeTab} className="page-transition">
            {renderTabContent()}
          </div>
        </main>
      </div>
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
          <div className="cyber-stats-grid stagger-children">
            {quickStats.map((stat, idx) => (
              <CyberCard
                key={idx}
                variant="glass"
                glow={true}
                hoverEffect={true}
                neonBorder={true}
                cornerAccents={false}
                className="cyber-stat-card"
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
          <div className="cyber-features-grid stagger-children">
            <FeatureCard
              icon="💰"
              title="Master Revenue Dashboard"
              description="Unified view of all revenue sources - Stripe, Gumroad, affiliates, passive income, and idle computing"
              onClick={() => setActiveTab('revenue')}
            />
            <FeatureCard
              icon="📈"
              title="Back Office & Analytics"
              description="Financial charts, expense tracking, and business performance metrics"
              onClick={() => setActiveTab('backoffice')}
            />
            <FeatureCard
              icon="💎"
              title="Wealth Lab"
              description="Crypto & ETF portfolio tracking, budget management, and net worth analysis"
              onClick={() => setActiveTab('wealth')}
            />
            <FeatureCard
              icon="💡"
              title="Idea Lab"
              description="Brainstorm and plan ideas with interactive canvas and mind maps"
              onClick={() => setActiveTab('ideas')}
            />
            <FeatureCard
              icon="🤖"
              title="Google AI Hub"
              description="Gemini AI Studio, NotebookLM research, vision-to-code, and smart code analysis"
              onClick={() => setActiveTab('googleai')}
            />
            <FeatureCard
              icon="🧠"
              title="AI Intelligence"
              description="10 intelligent systems optimizing revenue, content, and automation in real-time"
              onClick={() => setActiveTab('intelligence')}
            />
            <FeatureCard
              icon="🔐"
              title="Manage Credentials"
              description="Connect and manage all your service credentials in one secure vault"
              onClick={() => setActiveTab('credentials')}
            />
            <FeatureCard
              icon="💻"
              title="Idle Computing Revenue"
              description="Earn up to $432/month from your unused computing resources"
              onClick={() => setActiveTab('idle')}
            />
            <FeatureCard
              icon="🤖"
              title="AI Agents"
              description="7 specialized agents ready to help with content, revenue, and more"
              onClick={() => setActiveTab('agents')}
            />
            <FeatureCard
              icon="🧪"
              title="Test Integrations"
              description="One-click testing for all your service connections"
              onClick={() => setActiveTab('testing')}
            />
          </div>
        </section>

        {/* Recent Activity */}
        <section className="cyber-section">
          <h2 className="cyber-section__title">
            <span>Recent Activity</span>
          </h2>
          <CyberCard variant="glass" neonBorder={true} glow={false} className="cyber-activity-list">
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
}

const FeatureCard: React.FC<FeatureCardProps> = memo(({ icon, title, description, onClick }) => (
  <CyberCard
    variant="glass"
    glow={true}
    hoverEffect={true}
    neonBorder={true}
    clickable={true}
    onClick={onClick}
    className="cyber-feature-card"
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
