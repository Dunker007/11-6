/**
 * Monitor Workflow Component
 * 
 * Provides UI for Monitor workflow: system health, LLM status, alerts, anomaly detection
 */

import { useState } from 'react';
import { useWorkflowStore } from '@/services/workflow/workflowStore';
import { useLLMStore } from '@/services/ai/llmStore';
import { errorLogger } from '@/services/errors/errorLogger';
import { useToast } from '@/components/ui';
import WorkflowRunner from './WorkflowRunner';
import TechIcon from '../Icons/TechIcon';
import { Play, Activity, Zap, AlertTriangle, Brain } from 'lucide-react';
import type { MonitorWorkflowConfig } from '@/types/workflow';
import '@/styles/Workflows.css';

function MonitorWorkflow() {
  const { createWorkflow } = useWorkflowStore();
  const { availableProviders, models } = useLLMStore();
  const { showToast } = useToast();
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<Set<string>>(
    new Set(['health', 'performance', 'errors', 'llm-status'])
  );
  const [alertThresholds, setAlertThresholds] = useState({
    errorCount: 10,
    responseTime: 1000,
    memoryUsage: 80,
  });
  const errorStats = errorLogger.getStats();

  const toggleMetric = (metric: string) => {
    setSelectedMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(metric)) {
        next.delete(metric);
      } else {
        next.add(metric);
      }
      return next;
    });
  };

  const handleCreateMonitor = () => {
    if (selectedMetrics.size === 0) {
      showToast({
        variant: 'warning',
        title: 'Metrics required',
        message: 'Please select at least one metric to monitor',
      });
      return;
    }

    const config: MonitorWorkflowConfig = {
      type: 'monitor',
      name: 'System Monitor',
      description: 'Monitoring system health and performance',
      steps: [
        ...(selectedMetrics.has('health') ? [{
          name: 'Check System Health',
          description: 'Checking overall system health',
          metadata: { metric: 'health' },
        }] : []),
        ...(selectedMetrics.has('performance') ? [{
          name: 'Monitor Performance',
          description: 'Tracking performance metrics',
          metadata: { metric: 'performance' },
        }] : []),
        ...(selectedMetrics.has('errors') ? [{
          name: 'Check Error Logs',
          description: 'Analyzing error logs',
          metadata: { metric: 'errors' },
        }] : []),
        ...(selectedMetrics.has('llm-status') ? [{
          name: 'Check LLM Status',
          description: 'Verifying LLM provider availability',
          metadata: { metric: 'llm-status' },
        }] : []),
        {
          name: 'AI Anomaly Detection',
          description: 'Running AI-powered anomaly detection',
          metadata: { metric: 'anomaly-detection' },
        },
      ],
      targets: ['system'],
      metrics: Array.from(selectedMetrics) as any[],
      alertThresholds: {
        errorCount: alertThresholds.errorCount,
        responseTime: alertThresholds.responseTime,
        memoryUsage: alertThresholds.memoryUsage,
      },
      metadata: {
        metrics: Array.from(selectedMetrics),
        alertThresholds,
      },
    };

    const workflow = createWorkflow(config);
    setWorkflowId(workflow.id);
  };

  return (
    <div className="workflow-container monitor-workflow">
      <div className="workflow-header">
        <TechIcon icon={Activity} size={24} glow="red" />
        <h2>Monitor Workflow</h2>
      </div>

      <div className="workflow-content">
        <div className="monitor-dashboard">
          <div className="monitor-stats">
            <div className="monitor-stat">
              <Activity size={20} />
              <div>
                <span className="stat-label">System Health</span>
                <span className="stat-value good">Healthy</span>
              </div>
            </div>
            <div className="monitor-stat">
              <AlertTriangle size={20} />
              <div>
                <span className="stat-label">Errors</span>
                <span className="stat-value">
                  {errorStats.total}
                </span>
              </div>
            </div>
            <div className="monitor-stat">
              <Zap size={20} />
              <div>
                <span className="stat-label">LLM Providers</span>
                <span className="stat-value">
                  {availableProviders.length} available
                </span>
              </div>
            </div>
            <div className="monitor-stat">
              <Brain size={20} />
              <div>
                <span className="stat-label">Models</span>
                <span className="stat-value">{models.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="workflow-config">
          <div className="config-section">
            <label>Metrics to Monitor</label>
            <div className="metric-checkboxes">
              <label className="metric-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMetrics.has('health')}
                  onChange={() => toggleMetric('health')}
                />
                <Activity size={16} />
                <span>System Health</span>
              </label>
              <label className="metric-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMetrics.has('performance')}
                  onChange={() => toggleMetric('performance')}
                />
                <Zap size={16} />
                <span>Performance</span>
              </label>
              <label className="metric-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMetrics.has('errors')}
                  onChange={() => toggleMetric('errors')}
                />
                <AlertTriangle size={16} />
                <span>Errors</span>
              </label>
              <label className="metric-checkbox">
                <input
                  type="checkbox"
                  checked={selectedMetrics.has('llm-status')}
                  onChange={() => toggleMetric('llm-status')}
                />
                <Brain size={16} />
                <span>LLM Status</span>
              </label>
            </div>
          </div>

          <div className="config-section">
            <label>Alert Thresholds</label>
            <div className="threshold-inputs">
              <div className="threshold-input">
                <label>Error Count</label>
                <input
                  type="number"
                  value={alertThresholds.errorCount}
                  onChange={(e) =>
                    setAlertThresholds((prev) => ({
                      ...prev,
                      errorCount: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="threshold-input">
                <label>Response Time (ms)</label>
                <input
                  type="number"
                  value={alertThresholds.responseTime}
                  onChange={(e) =>
                    setAlertThresholds((prev) => ({
                      ...prev,
                      responseTime: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="threshold-input">
                <label>Memory Usage (%)</label>
                <input
                  type="number"
                  value={alertThresholds.memoryUsage}
                  onChange={(e) =>
                    setAlertThresholds((prev) => ({
                      ...prev,
                      memoryUsage: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <button
            className="workflow-create-btn"
            onClick={handleCreateMonitor}
            disabled={selectedMetrics.size === 0}
          >
            <Play size={16} />
            Create Monitor Workflow
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

export default MonitorWorkflow;

