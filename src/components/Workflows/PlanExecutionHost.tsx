/**
 * PlanExecutionHost.tsx
 * 
 * PURPOSE:
 * Visual plan execution interface for AI-generated execution plans. Displays plan steps in
 * a timeline format with execution controls, progress tracking, and step-by-step execution.
 * Integrates with planExecutionService for actual plan execution.
 * 
 * ARCHITECTURE:
 * Plan execution component that:
 * - Displays plan steps in timeline format
 * - Executes steps sequentially or individually
 * - Shows execution progress and status
 * - Handles step failures and retries
 * - Displays file diffs for file operations
 * - Provides execution controls (play, pause, stop, reset)
 * 
 * Features:
 * - Timeline visualization
 * - Step-by-step execution
 * - Auto-execution mode
 * - Manual step control
 * - File diff preview
 * - Execution state tracking
 * - Error handling and recovery
 * 
 * CURRENT STATUS:
 * ✅ Plan step display
 * ✅ Sequential execution
 * ✅ Individual step execution
 * ✅ Progress tracking
 * ✅ File diff display
 * ✅ Execution controls
 * ✅ Error handling
 * ✅ Auto-start option
 * 
 * DEPENDENCIES:
 * - planExecutionService: Plan execution logic
 * - PlanFileDiff: File diff display component
 * - @/types/plan: Plan and PlanStep types
 * 
 * STATE MANAGEMENT:
 * - Local state: execution state, current step, errors
 * - Uses planExecutionService for execution
 * - Tracks execution progress
 * 
 * PERFORMANCE:
 * - Efficient step rendering
 * - Debounced operations
 * - Optimized diff calculations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import PlanExecutionHost from '@/components/Workflows/PlanExecutionHost';
 * 
 * function WorkflowRunner() {
 *   const plan = { steps: [...] };
 *   return <PlanExecutionHost plan={plan} autoStart={true} />;
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/workflow/planExecutionService.ts: Execution logic
 * - src/components/Workflows/PlanFileDiff.tsx: File diff display
 * - src/types/plan.ts: Plan type definitions
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Parallel step execution
 * - Step rollback
 * - Execution history
 * - Plan templates
 * - Custom execution strategies
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Terminal,
  Brain,
  ChevronRight,
  Download,
  AlertTriangle,
} from 'lucide-react';
import type { Plan, PlanStep } from '@/types/plan';
import { planExecutionService, type PlanExecutionState } from '@/services/workflow/planExecutionService';
import { useToast } from '@/components/ui';
import PlanFileDiff from './PlanFileDiff';
import '@/styles/PlanExecutionHost.css';

interface PlanExecutionHostProps {
  plan: Plan;
  onComplete?: (plan: Plan) => void;
  onError?: (plan: Plan, error: string) => void;
  autoStart?: boolean;
}

const STEP_TYPE_ICONS = {
  THINK: Brain,
  READ_FILE: FileText,
  CREATE_FILE: FileText,
  EDIT_FILE: FileText,
  DELETE_FILE: FileText,
  RUN_COMMAND: Terminal,
};

const STEP_TYPE_LABELS = {
  THINK: 'Think',
  READ_FILE: 'Read File',
  CREATE_FILE: 'Create File',
  EDIT_FILE: 'Edit File',
  DELETE_FILE: 'Delete File',
  RUN_COMMAND: 'Run Command',
};

function PlanExecutionHost({
  plan,
  onComplete,
  onError,
  autoStart = false,
}: PlanExecutionHostProps) {
  const { showToast } = useToast();
  const [executionState, setExecutionState] = useState<PlanExecutionState | null>(null);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  // Subscribe to execution state updates
  useEffect(() => {
    if (!plan.id) return;

    const unsubscribe = planExecutionService.subscribe(plan.id, (state) => {
      setExecutionState(state);

      // Handle completion
      if (state.plan.status === 'completed') {
        onComplete?.(state.plan);
        showToast({
          variant: 'success',
          title: 'Plan completed',
          message: `Successfully executed ${state.plan.steps.length} steps`,
        });
      }

      // Handle errors
      if (state.plan.status === 'error' && state.plan.error) {
        onError?.(state.plan, state.plan.error);
        showToast({
          variant: 'error',
          title: 'Plan execution failed',
          message: state.plan.error,
        });
      }
    });

    return unsubscribe;
  }, [plan.id, onComplete, onError, showToast]);

  // Auto-start if enabled
  useEffect(() => {
    if (autoStart && !executionState) {
      handleStart();
    }
  }, [autoStart]);

  const handleStart = useCallback(async () => {
    try {
      await planExecutionService.startExecution(plan, {
        autoProceed: true,
        pauseOnError: true,
        dryRun: false,
      });
      showToast({
        variant: 'success',
        title: 'Plan execution started',
        message: `Executing ${plan.steps.length} steps`,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to start execution',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [plan, showToast]);

  const handlePause = useCallback(() => {
    if (executionState) {
      planExecutionService.pauseExecution(plan.id);
      showToast({
        variant: 'info',
        title: 'Execution paused',
        message: 'Plan execution has been paused',
      });
    }
  }, [executionState, plan.id, showToast]);

  const handleResume = useCallback(() => {
    if (executionState) {
      planExecutionService.resumeExecution(plan.id);
      showToast({
        variant: 'success',
        title: 'Execution resumed',
        message: 'Plan execution has been resumed',
      });
    }
  }, [executionState, plan.id, showToast]);

  const handleStop = useCallback(() => {
    if (executionState) {
      planExecutionService.stopExecution(plan.id);
      showToast({
        variant: 'info',
        title: 'Execution stopped',
        message: 'Plan execution has been stopped',
      });
    }
  }, [executionState, plan.id, showToast]);

  const handleRetryStep = useCallback(async (stepIndex: number) => {
    try {
      await planExecutionService.retryStep(plan.id, stepIndex);
      showToast({
        variant: 'success',
        title: 'Step retrying',
        message: 'Retrying failed step',
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to retry step',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, [plan.id, showToast]);

  const currentPlan = executionState?.plan || plan;
  const isExecuting = executionState?.isExecuting || false;
  const isPaused = executionState?.isPaused || false;
  const canControl = isExecuting || isPaused;

  const getStepStatusIcon = (step: PlanStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 size={16} className="step-icon step-icon-success" />;
      case 'running':
        return <Clock size={16} className="step-icon step-icon-running" />;
      case 'error':
        return <XCircle size={16} className="step-icon step-icon-error" />;
      default:
        return <div className="step-icon step-icon-pending" />;
    }
  };

  const getStepTypeIcon = (type: PlanStep['type']) => {
    const Icon = STEP_TYPE_ICONS[type] || FileText;
    return <Icon size={14} />;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const exportPlan = useCallback(() => {
    const planJson = JSON.stringify(currentPlan, null, 2);
    const blob = new Blob([planJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-${currentPlan.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentPlan]);

  return (
    <div className="plan-execution-host">
      <div className="plan-execution-header">
        <div className="plan-execution-title">
          <h2>{currentPlan.title || 'Plan Execution'}</h2>
          <span className={`plan-status plan-status-${currentPlan.status}`}>
            {currentPlan.status}
          </span>
        </div>
        <div className="plan-execution-controls">
          {!canControl && (
            <button className="plan-control-btn plan-control-start" onClick={handleStart}>
              <Play size={16} />
              Start
            </button>
          )}
          {isExecuting && !isPaused && (
            <button className="plan-control-btn plan-control-pause" onClick={handlePause}>
              <Pause size={16} />
              Pause
            </button>
          )}
          {isPaused && (
            <button className="plan-control-btn plan-control-resume" onClick={handleResume}>
              <Play size={16} />
              Resume
            </button>
          )}
          {canControl && (
            <button className="plan-control-btn plan-control-stop" onClick={handleStop}>
              <Square size={16} />
              Stop
            </button>
          )}
          <button className="plan-control-btn plan-control-export" onClick={exportPlan}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {currentPlan.description && (
        <div className="plan-execution-description">
          {currentPlan.description}
        </div>
      )}

      <div className="plan-execution-timeline">
        {currentPlan.steps.map((step, index) => {
          const isCurrent = index === currentPlan.currentStep;
          const isPast = index < currentPlan.currentStep;
          const isFuture = index > currentPlan.currentStep;
          const isSelected = selectedStepIndex === index;

          return (
            <div
              key={step.id || index}
              className={`plan-step ${isCurrent ? 'plan-step-current' : ''} ${isPast ? 'plan-step-past' : ''} ${isFuture ? 'plan-step-future' : ''} ${step.status === 'error' ? 'plan-step-error' : ''}`}
            >
              <div className="plan-step-header" onClick={() => setSelectedStepIndex(isSelected ? null : index)}>
                <div className="plan-step-indicator">
                  {getStepStatusIcon(step)}
                  <span className="plan-step-number">{index + 1}</span>
                </div>
                <div className="plan-step-info">
                  <div className="plan-step-type">
                    {getStepTypeIcon(step.type)}
                    <span>{STEP_TYPE_LABELS[step.type]}</span>
                  </div>
                  {step.thought && (
                    <div className="plan-step-thought">{step.thought}</div>
                  )}
                  {step.filePath && (
                    <div className="plan-step-file">
                      <FileText size={12} />
                      <span>{step.filePath}</span>
                    </div>
                  )}
                  {step.command && (
                    <div className="plan-step-command">
                      <Terminal size={12} />
                      <code>{step.command}</code>
                    </div>
                  )}
                </div>
                <div className="plan-step-meta">
                  {step.duration && (
                    <span className="plan-step-duration">{formatDuration(step.duration)}</span>
                  )}
                  {isSelected ? (
                    <ChevronRight size={16} className="plan-step-chevron rotated" />
                  ) : (
                    <ChevronRight size={16} className="plan-step-chevron" />
                  )}
                </div>
              </div>

              {isSelected && (
                <div className="plan-step-details">
                  {step.error && (
                    <div className="plan-step-error-message">
                      <AlertTriangle size={16} />
                      <span>{step.error}</span>
                      <button
                        className="plan-step-retry"
                        onClick={() => handleRetryStep(index)}
                      >
                        <RotateCcw size={14} />
                        Retry
                      </button>
                    </div>
                  )}
                  {(step.type === 'EDIT_FILE' || step.type === 'CREATE_FILE') && step.content && (
                    <div className="plan-step-content">
                      <button
                        className="plan-step-toggle-diff"
                        onClick={() => setShowDiff(!showDiff)}
                      >
                        {showDiff ? 'Hide' : 'Show'} File Changes
                      </button>
                      {showDiff && step.filePath && (
                        <PlanFileDiff filePath={step.filePath} newContent={step.content} />
                      )}
                    </div>
                  )}
                  {step.type === 'RUN_COMMAND' && step.command && (
                    <div className="plan-step-command-preview">
                      <label>Command:</label>
                      <pre className="plan-step-command-output">{step.command}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {currentPlan.error && (
        <div className="plan-execution-error">
          <AlertTriangle size={20} />
          <div>
            <strong>Execution Error:</strong>
            <p>{currentPlan.error}</p>
          </div>
        </div>
      )}

      {currentPlan.status === 'completed' && (
        <div className="plan-execution-summary">
          <CheckCircle2 size={20} className="plan-summary-icon" />
          <div>
            <strong>Plan completed successfully!</strong>
            <p>
              Executed {currentPlan.steps.length} steps in{' '}
              {formatDuration(currentPlan.duration)}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanExecutionHost;

