/**
 * Monetize Workflow Component
 * 
 * Provides UI for Monetize workflow: revenue streams, pricing strategies, subscriptions
 */

import { useState } from 'react';
import { useWorkflowStore } from '@/services/workflow/workflowStore';
import { useFinancialStore } from '@/services/backoffice/financialStore';
import WorkflowRunner from './WorkflowRunner';
import TechIcon from '../Icons/TechIcon';
import { Play, DollarSign, TrendingUp, CreditCard, Target } from 'lucide-react';
import type { MonetizeWorkflowConfig } from '@/types/workflow';
import '@/styles/Workflows.css';

function MonetizeWorkflow() {
  const { createWorkflow } = useWorkflowStore();
  const { summary } = useFinancialStore();
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [pricingStrategy, setPricingStrategy] = useState<
    'free' | 'freemium' | 'subscription' | 'one-time' | 'usage-based'
  >('subscription');
  const [targetRevenue, setTargetRevenue] = useState(1000);
  const [selectedStreams, setSelectedStreams] = useState<Set<string>>(
    new Set(['subscription', 'one-time'])
  );

  const toggleStream = (stream: string) => {
    setSelectedStreams((prev) => {
      const next = new Set(prev);
      if (next.has(stream)) {
        next.delete(stream);
      } else {
        next.add(stream);
      }
      return next;
    });
  };

  const handleCreateMonetize = () => {
    if (selectedStreams.size === 0) {
      alert('Please select at least one revenue stream');
      return;
    }

    const config: MonetizeWorkflowConfig = {
      type: 'monetize',
      name: 'Monetization Setup',
      description: `Setting up ${pricingStrategy} pricing strategy`,
      steps: [
        {
          name: 'Analyze Current Revenue',
          description: 'Analyzing existing revenue streams',
          metadata: { step: 'analyze' },
        },
        {
          name: 'Configure Pricing Strategy',
          description: `Setting up ${pricingStrategy} pricing`,
          metadata: { step: 'pricing', strategy: pricingStrategy },
        },
        {
          name: 'Setup Revenue Streams',
          description: `Configuring ${selectedStreams.size} revenue stream(s)`,
          metadata: { step: 'streams', streams: Array.from(selectedStreams) },
        },
        {
          name: 'Generate Monetization Insights',
          description: 'Using AI to generate monetization recommendations',
          metadata: { step: 'insights' },
        },
      ],
      revenueStreams: Array.from(selectedStreams),
      pricingStrategy,
      targetRevenue,
      metadata: {
        pricingStrategy,
        targetRevenue,
        revenueStreams: Array.from(selectedStreams),
      },
    };

    const workflow = createWorkflow(config);
    setWorkflowId(workflow.id);
  };

  return (
    <div className="workflow-container monetize-workflow">
      <div className="workflow-header">
        <TechIcon icon={DollarSign} size={24} glow="green" />
        <h2>Monetize Workflow</h2>
      </div>

      <div className="workflow-content">
        <div className="monetize-dashboard">
          <div className="revenue-overview">
            <div className="revenue-stat">
              <DollarSign size={20} />
              <div>
                <span className="stat-label">Current Revenue</span>
                <span className="stat-value">
                  ${summary?.totalIncome?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
            <div className="revenue-stat">
              <TrendingUp size={20} />
              <div>
                <span className="stat-label">Net Profit</span>
                <span className="stat-value">
                  ${summary?.profit?.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="workflow-config">
          <div className="config-section">
            <label>Pricing Strategy</label>
            <div className="pricing-strategy-selector">
              <button
                className={`pricing-strategy-btn ${pricingStrategy === 'free' ? 'active' : ''}`}
                onClick={() => setPricingStrategy('free')}
              >
                Free
              </button>
              <button
                className={`pricing-strategy-btn ${pricingStrategy === 'freemium' ? 'active' : ''}`}
                onClick={() => setPricingStrategy('freemium')}
              >
                Freemium
              </button>
              <button
                className={`pricing-strategy-btn ${pricingStrategy === 'subscription' ? 'active' : ''}`}
                onClick={() => setPricingStrategy('subscription')}
              >
                Subscription
              </button>
              <button
                className={`pricing-strategy-btn ${pricingStrategy === 'one-time' ? 'active' : ''}`}
                onClick={() => setPricingStrategy('one-time')}
              >
                One-Time
              </button>
              <button
                className={`pricing-strategy-btn ${pricingStrategy === 'usage-based' ? 'active' : ''}`}
                onClick={() => setPricingStrategy('usage-based')}
              >
                Usage-Based
              </button>
            </div>
          </div>

          <div className="config-section">
            <label>Target Monthly Revenue</label>
            <div className="target-revenue-input">
              <DollarSign size={16} />
              <input
                type="number"
                value={targetRevenue}
                onChange={(e) => setTargetRevenue(parseInt(e.target.value) || 0)}
                placeholder="1000"
              />
            </div>
          </div>

          <div className="config-section">
            <label>Revenue Streams</label>
            <div className="stream-checkboxes">
              <label className="stream-checkbox">
                <input
                  type="checkbox"
                  checked={selectedStreams.has('subscription')}
                  onChange={() => toggleStream('subscription')}
                />
                <CreditCard size={16} />
                <span>Subscription</span>
              </label>
              <label className="stream-checkbox">
                <input
                  type="checkbox"
                  checked={selectedStreams.has('one-time')}
                  onChange={() => toggleStream('one-time')}
                />
                <DollarSign size={16} />
                <span>One-Time Payment</span>
              </label>
              <label className="stream-checkbox">
                <input
                  type="checkbox"
                  checked={selectedStreams.has('usage-based')}
                  onChange={() => toggleStream('usage-based')}
                />
                <TrendingUp size={16} />
                <span>Usage-Based</span>
              </label>
              <label className="stream-checkbox">
                <input
                  type="checkbox"
                  checked={selectedStreams.has('affiliate')}
                  onChange={() => toggleStream('affiliate')}
                />
                <Target size={16} />
                <span>Affiliate</span>
              </label>
            </div>
          </div>

          <button
            className="workflow-create-btn"
            onClick={handleCreateMonetize}
            disabled={selectedStreams.size === 0}
          >
            <Play size={16} />
            Create Monetize Workflow
          </button>
        </div>

        {workflowId && (
          <div className="workflow-runner-section">
            <WorkflowRunner
              workflowId={workflowId}
              onComplete={() => setWorkflowId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default MonetizeWorkflow;

