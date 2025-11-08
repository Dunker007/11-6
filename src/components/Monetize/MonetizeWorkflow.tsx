import { useState, useEffect } from 'react';
import RevenueStreams from './RevenueStreams';
import PricingStrategies from './PricingStrategies';
import SubscriptionManager from './SubscriptionManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import WorkflowHero from '../shared/WorkflowHero';
import CommandCard from '../shared/CommandCard';
import { useMonetizeStore } from '../../services/monetize/monetizeStore';
import TechIcon from '../Icons/TechIcon';
import { DollarSign, TrendingUp, Tag, Users, BarChart3 } from 'lucide-react';
import '../../styles/MonetizeWorkflow.css';

function MonetizeWorkflow() {
  const [activeTab, setActiveTab] = useState<'streams' | 'pricing' | 'subscriptions' | 'analytics'>('streams');
  const { revenue, subscriptions, refresh } = useMonetizeStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Calculate stats (with safe fallbacks)
  const revenueList = revenue || [];
  const subscriptionList = subscriptions || [];
  const totalRevenue = revenueList.reduce((sum, r) => sum + r.amount, 0);
  const activeSubscriptions = subscriptionList.filter(s => s.status === 'active').length;
  const monthlyRecurring = subscriptionList
    .filter(s => s.status === 'active')
    .reduce((sum, s) => sum + s.amount, 0);
  const churnRate = subscriptionList.length > 0 
    ? Math.round((subscriptionList.filter(s => s.status === 'cancelled').length / subscriptionList.length) * 100) 
    : 0;

  return (
    <div className="monetize-workflow command-center-layout">
      {/* Command Center Hero */}
      <WorkflowHero
        title="REVENUE COMMAND"
        subtitle="Monetization & Analytics Hub"
        showCore={false}
        stats={[
          { icon: '◈', value: `$${totalRevenue.toLocaleString()}`, label: 'Total Revenue' },
          { icon: '◎', value: `$${monthlyRecurring.toLocaleString()}`, label: 'Monthly MRR' },
          { icon: '◉', value: activeSubscriptions, label: 'Active Subscribers' },
          { icon: '▣', value: `${churnRate}%`, label: 'Churn Rate' },
        ]}
        statusIndicators={[
          { label: 'BILLING ACTIVE', status: 'online' },
          { label: 'ANALYTICS LIVE', status: 'online' },
        ]}
      />

      {/* Tab Navigation */}
      <div className="monetize-tab-nav">
        <CommandCard 
          variant="amber"
          clickable
          onClick={() => setActiveTab('streams')}
          className={activeTab === 'streams' ? 'active' : ''}
        >
          <div className="tab-content">
            <TechIcon icon={TrendingUp} size={32} glow="amber" animated={activeTab === 'streams'} />
            <h3>Revenue Streams</h3>
            <p>Track and optimize income sources</p>
          </div>
        </CommandCard>

        <CommandCard 
          variant="cyan"
          clickable
          onClick={() => setActiveTab('pricing')}
          className={activeTab === 'pricing' ? 'active' : ''}
        >
          <div className="tab-content">
            <TechIcon icon={Tag} size={32} glow="cyan" animated={activeTab === 'pricing'} />
            <h3>Pricing Strategies</h3>
            <p>Configure pricing models and tiers</p>
          </div>
        </CommandCard>

        <CommandCard 
          variant="violet"
          clickable
          onClick={() => setActiveTab('subscriptions')}
          className={activeTab === 'subscriptions' ? 'active' : ''}
        >
          <div className="tab-content">
            <TechIcon icon={Users} size={32} glow="violet" animated={activeTab === 'subscriptions'} />
            <h3>Subscriptions</h3>
            <p>Manage customer subscriptions</p>
          </div>
        </CommandCard>

        <CommandCard 
          variant="emerald"
          clickable
          onClick={() => setActiveTab('analytics')}
          className={activeTab === 'analytics' ? 'active' : ''}
        >
          <div className="tab-content">
            <TechIcon icon={BarChart3} size={32} glow="cyan" animated={activeTab === 'analytics'} />
            <h3>Analytics</h3>
            <p>Visualize revenue and trends</p>
          </div>
        </CommandCard>
      </div>

      {/* Content Area */}
      <div className="monetize-content-wrapper">
        {activeTab === 'streams' && <RevenueStreams />}
        {activeTab === 'pricing' && <PricingStrategies />}
        {activeTab === 'subscriptions' && <SubscriptionManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  );
}

export default MonetizeWorkflow;

