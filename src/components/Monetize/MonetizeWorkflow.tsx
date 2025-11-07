import { useState, useEffect } from 'react';
import RevenueStreams from './RevenueStreams';
import PricingStrategies from './PricingStrategies';
import SubscriptionManager from './SubscriptionManager';
import AnalyticsDashboard from './AnalyticsDashboard';
import { useMonetizeStore } from '../../services/monetize/monetizeStore';
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
        <h2>Monetize Your Project</h2>
        <p>Track revenue, manage subscriptions, and optimize pricing strategies</p>
      </div>

      <div className="monetize-tabs">
        <button
          className={`monetize-tab ${activeTab === 'streams' ? 'active' : ''}`}
          onClick={() => setActiveTab('streams')}
        >
          💰 Revenue Streams
        </button>
        <button
          className={`monetize-tab ${activeTab === 'pricing' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          💵 Pricing Strategies
        </button>
        <button
          className={`monetize-tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          📋 Subscriptions
        </button>
        <button
          className={`monetize-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
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

