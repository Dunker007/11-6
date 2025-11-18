import React, { useState, lazy, Suspense, memo } from 'react';

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

// Loading fallback with skeleton
const TabLoadingFallback = () => (
  <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '30px 20px' }}>
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '40px',
      textAlign: 'center',
      border: '1px solid #e5e7eb'
    }}>
      <div className="loading-spinner" style={{
        width: '40px',
        height: '40px',
        border: '4px solid #f3f4f6',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        margin: '0 auto 20px',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Loading...</p>
    </div>
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
    <div className="unified-dashboard" style={{ minHeight: '100vh', overflow: 'auto' }}>
      {/* Header */}
      <div className="unified-dashboard-header" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', fontWeight: 'bold' }}>
                DLX Studios Ultimate
              </h1>
              <p style={{ margin: 0, color: '#6b7280' }}>
                Complete passive income automation platform
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setActiveTab('credentials')}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => setActiveTab('setup')}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                🚀 Quick Start
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '5px', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 20px',
                  background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                  color: activeTab === tab.id ? '#1e40af' : '#6b7280',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: activeTab === tab.id ? '600' : '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
                {tab.badge && (
                  <span
                    style={{
                      padding: '2px 6px',
                      background: '#ef4444',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: '700',
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>

      {/* Add keyframes for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

UnifiedDashboard.displayName = 'UnifiedDashboard';

const OverviewTab: React.FC<{ setActiveTab: (tab: TabId) => void }> = memo(({ setActiveTab }) => {
  const quickStats = [
    { label: 'Total Revenue', value: '$2,847.32', change: '+12.5%', icon: '💰', color: '#10b981' },
    { label: 'Content Published', value: '142', change: '+8', icon: '📝', color: '#3b82f6' },
    { label: 'Idle Computing', value: '$432/mo', change: 'potential', icon: '💻', color: '#8b5cf6' },
    { label: 'Active Services', value: '12/18', change: '66%', icon: '🔗', color: '#f59e0b' },
  ];

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '30px 20px' }}>
      {/* Quick Stats */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px', fontWeight: '600' }}>Quick Stats</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {quickStats.map((stat, idx) => (
            <div
              key={idx}
              style={{
                padding: '20px',
                background: 'white',
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <span style={{ fontSize: '32px' }}>{stat.icon}</span>
                <div
                  style={{
                    padding: '4px 10px',
                    background: `${stat.color}20`,
                    color: stat.color,
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {stat.change}
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '15px', fontWeight: '600' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <FeatureCard
            icon="💰"
            title="Master Revenue Dashboard"
            description="Unified view of all revenue sources - Stripe, Gumroad, affiliates, passive income, and idle computing"
            action="View Revenue"
            gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
            onClick={() => setActiveTab('revenue')}
          />
          <FeatureCard
            icon="📈"
            title="Back Office & Analytics"
            description="Financial charts, expense tracking, and business performance metrics"
            action="View Analytics"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            onClick={() => setActiveTab('backoffice')}
          />
          <FeatureCard
            icon="💎"
            title="Wealth Lab"
            description="Crypto & ETF portfolio tracking, budget management, and net worth analysis"
            action="View Wealth"
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            onClick={() => setActiveTab('wealth')}
          />
          <FeatureCard
            icon="💡"
            title="Idea Lab"
            description="Brainstorm and plan ideas with interactive canvas and mind maps"
            action="Open Idea Lab"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            onClick={() => setActiveTab('ideas')}
          />
          <FeatureCard
            icon="🤖"
            title="Google AI Hub"
            description="Gemini AI Studio, NotebookLM research, vision-to-code, and smart code analysis"
            action="Open AI Hub"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            onClick={() => setActiveTab('googleai')}
          />
          <FeatureCard
            icon="🧠"
            title="AI Intelligence"
            description="10 intelligent systems optimizing revenue, content, and automation in real-time"
            action="View AI Dashboard"
            gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
            onClick={() => setActiveTab('intelligence')}
          />
          <FeatureCard
            icon="🔐"
            title="Manage Credentials"
            description="Connect and manage all your service credentials in one secure vault"
            action="View Credentials"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            onClick={() => setActiveTab('credentials')}
          />
          <FeatureCard
            icon="💻"
            title="Idle Computing Revenue"
            description="Earn up to $432/month from your unused computing resources"
            action="Start Earning"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
            onClick={() => setActiveTab('idle')}
          />
          <FeatureCard
            icon="🤖"
            title="AI Agents"
            description="7 specialized agents ready to help with content, revenue, and more"
            action="Chat with Agents"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
            onClick={() => setActiveTab('agents')}
          />
          <FeatureCard
            icon="🧪"
            title="Test Integrations"
            description="One-click testing for all your service connections"
            action="Run Tests"
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
            onClick={() => setActiveTab('testing')}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ fontSize: '20px', marginBottom: '15px', fontWeight: '600' }}>Recent Activity</h2>
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          <ActivityItem
            icon="✅"
            title="Stripe Connected"
            description="Payment processing is now active"
            time="5 minutes ago"
            color="#10b981"
          />
          <ActivityItem
            icon="📝"
            title="Content Generated"
            description="New blog post created: 'Passive Income Strategies'"
            time="1 hour ago"
            color="#3b82f6"
          />
          <ActivityItem
            icon="💻"
            title="Joined Golem Network"
            description="Earning $108/month from compute resources"
            time="2 hours ago"
            color="#8b5cf6"
          />
          <ActivityItem
            icon="🧪"
            title="Integration Tests Passed"
            description="12/12 services connected successfully"
            time="3 hours ago"
            color="#10b981"
          />
        </div>
      </div>
    </div>
  );
});

OverviewTab.displayName = 'OverviewTab';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  action: string;
  gradient: string;
  onClick?: () => void;
}

const FeatureCard: React.FC<FeatureCardProps> = memo(({ icon, title, description, action, gradient, onClick }) => (
  <div
    style={{
      padding: '25px',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      transition: 'all 0.2s',
      cursor: 'pointer',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
    }}
  >
    <div style={{ fontSize: '40px', marginBottom: '15px' }}>{icon}</div>
    <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>{title}</h3>
    <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
      {description}
    </p>
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        background: gradient,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        width: '100%',
      }}
    >
      {action} →
    </button>
  </div>
));

FeatureCard.displayName = 'FeatureCard';

interface ActivityItemProps {
  icon: string;
  title: string;
  description: string;
  time: string;
  color: string;
}

const ActivityItem: React.FC<ActivityItemProps> = memo(({ icon, title, description, time, color }) => (
  <div
    style={{
      padding: '20px',
      borderBottom: '1px solid #f3f4f6',
      display: 'flex',
      alignItems: 'center',
      gap: '15px',
    }}
  >
    <div
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
      }}
    >
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '3px' }}>{title}</div>
      <div style={{ fontSize: '13px', color: '#6b7280' }}>{description}</div>
    </div>
    <div style={{ fontSize: '12px', color: '#9ca3af' }}>{time}</div>
  </div>
));

ActivityItem.displayName = 'ActivityItem';
