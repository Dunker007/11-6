/**
 * Project Workflow Component
 * 
 * Provides UI for Project workflow: create, open, analyze, generate, git-init
 */

import { useState, useCallback, useMemo } from 'react';
import { useWorkflowStore } from '@/services/workflow/workflowStore';
import { useProjectStore } from '@/services/project/projectStore';
import { aiServiceBridge } from '@/services/ai/aiServiceBridge';
import { logger } from '@/services/logging/loggerService';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import WorkflowRunner from './WorkflowRunner';
import PlanExecutionHost from './PlanExecutionHost';
import { BoltExport } from './BoltExport';
import TechIcon from '../Icons/TechIcon';
import { FolderPlus, GitBranch, Sparkles, FileSearch, Play, Wand2 } from 'lucide-react';
import type { ProjectWorkflowConfig } from '@/types/workflow';
import type { Plan } from '@/types/plan';
import '@/styles/Workflows.css';

type WorkflowType = 'project' | 'build' | 'deploy' | 'monitor' | 'monetize' | null;

interface ProjectWorkflowProps {
  activeWorkflow?: WorkflowType;
  onWorkflowChange?: (workflow: WorkflowType) => void;
}

function ProjectWorkflow({ activeWorkflow: _activeWorkflow, onWorkflowChange }: ProjectWorkflowProps = {}) {
  const { createWorkflow } = useWorkflowStore();
  const { createProject, setActiveProject } = useProjectStore();
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set(['create', 'analyze']));
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planPrompt, setPlanPrompt] = useState('');
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [showPlanSection, setShowPlanSection] = useState(false);

  // Wrap handleProjectCreated in useCallback with onWorkflowChange as dependency
  // This prevents stale closure issues when onWorkflowChange is used in useMemo dependencies
  const handleProjectCreated = useCallback(() => {
    // Notify parent component about workflow change if callback provided
    if (onWorkflowChange) {
      onWorkflowChange('project');
    }
    // Additional logic for project creation can go here
  }, [onWorkflowChange]);

  // Memoize workflow configuration with proper dependencies
  const workflowConfig = useMemo(() => {
    if (!projectName.trim()) return null;

    const config: ProjectWorkflowConfig = {
      type: 'project',
      name: `Project: ${projectName}`,
      description: projectDescription || undefined,
      actions: Array.from(selectedActions) as ('create' | 'open' | 'analyze' | 'generate' | 'git-init')[],
      steps: [
        ...(selectedActions.has('create') ? [{
          name: 'Create Project',
          description: `Creating project "${projectName}"`,
          metadata: { action: 'create', projectName },
        }] : []),
        ...(selectedActions.has('analyze') ? [{
          name: 'Analyze Project',
          description: 'Analyzing project structure and dependencies',
          metadata: { action: 'analyze' },
        }] : []),
        ...(selectedActions.has('generate') ? [{
          name: 'Generate Structure',
          description: 'Using AI to generate project structure',
          metadata: { action: 'generate', prompt: `Generate a project structure for ${projectName}` },
        }] : []),
        ...(selectedActions.has('git-init') ? [{
          name: 'Initialize Git',
          description: 'Initializing Git repository',
          metadata: { action: 'git-init' },
        }] : []),
      ],
      metadata: {
        projectName,
        projectDescription,
        actions: Array.from(selectedActions),
      },
    };

    return config;
  }, [projectName, projectDescription, selectedActions]);

  const handleCreateWorkflow = useCallback(() => {
    if (!workflowConfig) return;

    const workflow = createWorkflow(workflowConfig);
    setWorkflowId(workflow.id);

    // Create project first if needed
    if (selectedActions.has('create')) {
      const project = createProject(projectName, projectDescription);
      setActiveProject(project.id);
      // Call handleProjectCreated after project is created
      handleProjectCreated();
    }
  }, [workflowConfig, selectedActions, projectName, projectDescription, createWorkflow, createProject, setActiveProject, handleProjectCreated]);

  const handleCreatePlan = useCallback(async () => {
    if (!planPrompt.trim()) return;

    setIsCreatingPlan(true);
    try {
      const response = await aiServiceBridge.createPlan(planPrompt);
      if (response.success && response.plan) {
        setPlan(response.plan);
        setShowPlanSection(true);
      }
    } catch (error) {
      logger.error('Failed to create plan:', { error });
    } finally {
      setIsCreatingPlan(false);
    }
  }, [planPrompt]);

  const toggleAction = (action: string) => {
    setSelectedActions((prev) => {
      const next = new Set(prev);
      if (next.has(action)) {
        next.delete(action);
      } else {
        next.add(action);
      }
      return next;
    });
  };

  return (
    <ErrorBoundary sectionName="Project Workflow">
    <div className="workflow-container project-workflow">
      <div className="workflow-header">
        <TechIcon icon={FolderPlus} size={24} glow="cyan" />
        <h2>Project Workflow</h2>
      </div>

      <div className="workflow-content">
        <div className="workflow-config">
          <div className="config-section">
            <label>Project Name</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
            />
          </div>

          <div className="config-section">
            <label>Description (Optional)</label>
            <textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="A brief description of your project..."
              rows={3}
            />
          </div>

          <div className="config-section">
            <label>Actions</label>
            <div className="action-checkboxes">
              <label className="action-checkbox">
                <input
                  type="checkbox"
                  checked={selectedActions.has('create')}
                  onChange={() => toggleAction('create')}
                />
                <FolderPlus size={16} />
                <span>Create Project</span>
              </label>
              <label className="action-checkbox">
                <input
                  type="checkbox"
                  checked={selectedActions.has('analyze')}
                  onChange={() => toggleAction('analyze')}
                />
                <FileSearch size={16} />
                <span>Analyze Project</span>
              </label>
              <label className="action-checkbox">
                <input
                  type="checkbox"
                  checked={selectedActions.has('generate')}
                  onChange={() => toggleAction('generate')}
                />
                <Sparkles size={16} />
                <span>AI Generate Structure</span>
              </label>
              <label className="action-checkbox">
                <input
                  type="checkbox"
                  checked={selectedActions.has('git-init')}
                  onChange={() => toggleAction('git-init')}
                />
                <GitBranch size={16} />
                <span>Initialize Git</span>
              </label>
            </div>
          </div>

          <button
            className="workflow-create-btn"
            onClick={handleCreateWorkflow}
            disabled={!projectName.trim() || selectedActions.size === 0}
          >
            <Play size={16} />
            Create Workflow
          </button>

          <div className="workflow-divider">
            <span>OR</span>
          </div>

          <div className="config-section">
            <label>AI Plan Execution</label>
            <p className="config-hint">Create an AI-generated plan to execute step-by-step</p>
            <textarea
              value={planPrompt}
              onChange={(e) => setPlanPrompt(e.target.value)}
              placeholder="Describe what you want to accomplish... (e.g., 'Add a login page with email and password')"
              rows={3}
            />
            <button
              className="workflow-create-btn workflow-create-plan-btn"
              onClick={handleCreatePlan}
              disabled={!planPrompt.trim() || isCreatingPlan}
            >
              <Wand2 size={16} />
              {isCreatingPlan ? 'Creating Plan...' : 'Create AI Plan'}
            </button>
          </div>
        </div>

        {plan && showPlanSection && (
          <div className="workflow-runner-section">
            <PlanExecutionHost
              plan={plan}
              onComplete={() => {
                setPlan(null);
                setPlanPrompt('');
                setShowPlanSection(false);
              }}
              onError={(_failedPlan, error) => {
                logger.error('Plan execution error:', { error });
              }}
            />
          </div>
        )}

        {workflowId && (
          <div className="workflow-runner-section">
            <WorkflowRunner
              workflowId={workflowId}
              onComplete={() => {
                setWorkflowId(null);
                setProjectName('');
                setProjectDescription('');
              }}
            />
          </div>
        )}

        <div className="workflow-divider">
          <span>OR</span>
        </div>

        <div className="workflow-runner-section">
          <BoltExport />
        </div>
      </div>
    </div>
    </ErrorBoundary>
  );
}

export default ProjectWorkflow;

