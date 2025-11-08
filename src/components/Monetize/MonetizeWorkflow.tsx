import { useState, useEffect } from 'react';
import RevenueStreams from './RevenueStreams';
import PricingStrategies from './PricingStrategies';
import SubscriptionManager from './SubscriptionManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import { useMonetizeStore } from '../../services/monetize/monetizeStore';
import TechIcon from '../Icons/TechIcon';
import { DollarSign, TrendingUp, Tag, Users, BarChart3 } from 'lucide-react';
import '../../styles/MonetizeWorkflow.css';

function MonetizeWorkflow() {
  const [activeTab, setActiveTab] = useState<'streams' | 'pricing' | 'subscriptions' | 'analytics'>('streams');
  const { refresh } = useMonetizeStore();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="monetize-workflow">
      <div className="monetize-header">
        <div className="monetize-title">
          <TechIcon icon={DollarSign} size={32} glow="amber" animated={false} />
          <div>
            <h2>Monetize Your Project</h2>
            <p>Track revenue, manage subscriptions, and optimize pricing strategies</p>
          </div>
        </div>
      </div>

      <div className="monetize-tabs">
        <button
          className={`monetize-tab ${activeTab === 'streams' ? 'active' : ''}`}
          onClick={() => setActiveTab('streams')}
        >
          <TechIcon icon={TrendingUp} size={18} glow={activeTab === 'streams' ? 'amber' : 'none'} />
          <span>Revenue Streams</span>
        </button>
        <button
          className={`monetize-tab ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          <TechIcon icon={Tag} size={18} glow={activeTab === 'pricing' ? 'amber' : 'none'} />
          <span>Pricing Strategies</span>
        </button>
        <button
          className={`monetize-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          <TechIcon icon={Users} size={18} glow={activeTab === 'subscriptions' ? 'amber' : 'none'} />
          <span>Subscriptions</span>
        </button>
        <button
          className={`monetize-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TechIcon icon={BarChart3} size={18} glow={activeTab === 'analytics' ? 'amber' : 'none'} />
          <span>Analytics</span>
        </button>
      </div>

      <div className="monetize-content">
        {activeTab === 'streams' && <RevenueStreams />}
        {activeTab === 'pricing' && <PricingStrategies />}
        {activeTab === 'subscriptions' && <SubscriptionManager />}
        {activeTab === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  );
}

export default MonetizeWorkflow;

