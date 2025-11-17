import React, { useState } from 'react';
import { CredentialVault } from '../Settings/CredentialVault';
import { IdleRevenueDashboard } from '../IdleComputing/IdleRevenueDashboard';
import { AgentGrid } from '../Agents/AgentChat';
import { IntegrationTestDashboard } from '../Testing/IntegrationTestDashboard';
import { SetupLauncher } from '../Setup/GuidedSetupWizard';

type TabId = 'overview' | 'credentials' | 'idle' | 'agents' | 'testing' | 'setup';

interface Tab {
  id: TabId;
  name: string;
  icon: string;
  badge?: number;
}

export const UnifiedDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const tabs: Tab[] = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'credentials', name: 'Credentials', icon: '🔐' },
    { id: 'idle', name: 'Idle Computing', icon: '💻' },
    { id: 'agents', name: 'AI Agents', icon: '🤖', badge: 7 },
    { id: 'testing', name: 'Integration Tests', icon: '🧪' },
    { id: 'setup', name: 'Setup', icon: '🚀' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab />;
      case 'credentials':
        return <CredentialVault />;
      case 'idle':
        return <IdleRevenueDashboard />;
      case 'agents':
        return <AgentGrid />;
      case 'testing':
        return <IntegrationTestDashboard />;
      case 'setup':
        return <SetupLauncher />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 100 }}>
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
    </div>
  );
};

const OverviewTab: React.FC = () => {
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
            icon="🔐"
            title="Manage Credentials"
            description="Connect and manage all your service credentials in one secure vault"
            action="View Credentials"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <FeatureCard
            icon="💻"
            title="Idle Computing Revenue"
            description="Earn up to $432/month from your unused computing resources"
            action="Start Earning"
            gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
          />
          <FeatureCard
            icon="🤖"
            title="AI Agents"
            description="7 specialized agents ready to help with content, revenue, and more"
            action="Chat with Agents"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
          <FeatureCard
            icon="🧪"
            title="Test Integrations"
            description="One-click testing for all your service connections"
            action="Run Tests"
            gradient="linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"
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
};

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  action: string;
  gradient: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, action, gradient }) => (
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
);

interface ActivityItemProps {
  icon: string;
  title: string;
  description: string;
  time: string;
  color: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ icon, title, description, time, color }) => (
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
);
