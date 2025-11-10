/**
 * Workflow Runner Component
 * 
 * UI component for executing and monitoring workflows.
 * Displays workflow progress, steps, and allows cancellation.
 */

import { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/services/workflow/workflowStore';
import type { Workflow } from '@/types/workflow';
import { Play, Square, Trash2, CheckCircle, XCircle, Loader, Clock } from 'lucide-react';
import '@/styles/WorkflowRunner.css';

interface WorkflowRunnerProps {
  workflowId?: string;
  onComplete?: (workflowId: string) => void;
  onError?: (workflowId: string, error: string) => void;
}

function WorkflowRunner({ workflowId, onComplete, onError }: WorkflowRunnerProps) {
  const {
    workflows,
    isLoading,
    error,
    executeWorkflow,
    cancelWorkflow,
    deleteWorkflow,
    getWorkflow,
    refreshWorkflows,
  } = useWorkflowStore();

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    refreshWorkflows();
    
    // Only poll when there are running workflows to reduce resource consumption
    const hasRunningWorkflows = workflows.some(w => w.status === 'running');
    if (!hasRunningWorkflows) return;

    // Use 5 second interval instead of 1 second to reduce CPU/battery usage
    const interval = setInterval(() => {
      refreshWorkflows();
    }, 5000); // Refresh every 5 seconds instead of 1 second

    return () => clearInterval(interval);
  }, [refreshWorkflows, workflows]);

  useEffect(() => {
    if (workflowId) {
      const workflow = getWorkflow(workflowId);
      setSelectedWorkflow(workflow || null);
    }
  }, [workflowId, getWorkflow, workflows]);

  const handleExecute = async () => {
    if (!selectedWorkflow) return;

    try {
      const result = await executeWorkflow(selectedWorkflow.id);
      if (result.success && onComplete) {
        onComplete(selectedWorkflow.id);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (onError) {
        onError(selectedWorkflow.id, errorMessage);
      }
    }
  };

  const handleCancel = () => {
    if (!selectedWorkflow) return;
    cancelWorkflow(selectedWorkflow.id);
  };

  const handleDelete = () => {
    if (!selectedWorkflow) return;
    deleteWorkflow(selectedWorkflow.id);
    setSelectedWorkflow(null);
  };

  const getStatusIcon = (status: Workflow['status']) => {
    switch (status) {
      case 'running':
        return <Loader className="spinning" size={16} />;
      case 'completed':
        return <CheckCircle size={16} className="status-icon success" />;
      case 'failed':
        return <XCircle size={16} className="status-icon error" />;
      case 'cancelled':
        return <Square size={16} className="status-icon cancelled" />;
      default:
        return <Clock size={16} className="status-icon idle" />;
    }
  };

  const getStepStatusIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'running':
        return <Loader className="spinning" size={12} />;
      case 'completed':
        return <CheckCircle size={12} className="step-icon success" />;
      case 'failed':
        return <XCircle size={12} className="step-icon error" />;
      default:
        return <div className="step-icon pending" />;
    }
  };

  if (!selectedWorkflow) {
    return (
      <div className="workflow-runner-empty">
        <p>No workflow selected</p>
      </div>
    );
  }

  const isRunning = selectedWorkflow.status === 'running';
  const progress = selectedWorkflow.steps.length > 0
    ? (selectedWorkflow.steps.filter(s => s.status === 'completed').length / selectedWorkflow.steps.length) * 100
    : 0;

  return (
    <div className="workflow-runner">
      <div className="workflow-runner-header">
        <div className="workflow-runner-title">
          {getStatusIcon(selectedWorkflow.status)}
          <h3>{selectedWorkflow.name}</h3>
          <span className="workflow-type-badge">{selectedWorkflow.type}</span>
        </div>
        <div className="workflow-runner-actions">
          {isRunning ? (
            <button className="workflow-action-btn cancel-btn" onClick={handleCancel} disabled={isLoading}>
              <Square size={14} />
              Cancel
            </button>
          ) : (
            <button className="workflow-action-btn execute-btn" onClick={handleExecute} disabled={isLoading || isRunning}>
              <Play size={14} />
              Execute
            </button>
          )}
          <button className="workflow-action-btn delete-btn" onClick={handleDelete} disabled={isRunning}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {selectedWorkflow.description && (
        <p className="workflow-description">{selectedWorkflow.description}</p>
      )}

      {error && (
        <div className="workflow-error">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Progress Bar */}
      <div className="workflow-progress">
        <div className="workflow-progress-bar">
          <div
            className="workflow-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="workflow-progress-text">
          {selectedWorkflow.steps.filter(s => s.status === 'completed').length} / {selectedWorkflow.steps.length} steps
          {selectedWorkflow.duration && ` • ${(selectedWorkflow.duration / 1000).toFixed(1)}s`}
        </div>
      </div>

      {/* Steps List */}
      <div className="workflow-steps">
        <h4>Steps</h4>
        <div className="workflow-steps-list">
          {selectedWorkflow.steps.map((step, index) => (
            <div
              key={step.id}
              className={`workflow-step ${step.status} ${index === selectedWorkflow.currentStepIndex ? 'current' : ''}`}
            >
              <div className="workflow-step-header">
                {getStepStatusIcon(step.status)}
                <span className="workflow-step-name">{step.name}</span>
                {step.duration && (
                  <span className="workflow-step-duration">
                    {(step.duration / 1000).toFixed(1)}s
                  </span>
                )}
              </div>
              {step.description && (
                <p className="workflow-step-description">{step.description}</p>
              )}
              {step.error && (
                <div className="workflow-step-error">
                  <XCircle size={12} />
                  <span>{step.error}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WorkflowRunner;

