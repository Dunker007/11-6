/**
 * Project Workflow Component
 * 
 * Provides UI for Project workflow: create, open, analyze, generate, git-init
 */

import { useState } from 'react';
import { useWorkflowStore } from '@/services/workflow/workflowStore';
import { useProjectStore } from '@/services/project/projectStore';
import WorkflowRunner from './WorkflowRunner';
import TechIcon from '../Icons/TechIcon';
import { FolderPlus, GitBranch, Sparkles, FileSearch, Play } from 'lucide-react';
import type { ProjectWorkflowConfig } from '@/types/workflow';
import '@/styles/Workflows.css';

function ProjectWorkflow() {
  const { createWorkflow } = useWorkflowStore();
  const { createProject, setActiveProject } = useProjectStore();
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [selectedActions, setSelectedActions] = useState<Set<string>>(new Set(['create', 'analyze']));

  const handleCreateWorkflow = () => {
    if (!projectName.trim()) return;

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

    const workflow = createWorkflow(config);
    setWorkflowId(workflow.id);

    // Create project first if needed
    if (selectedActions.has('create')) {
      const project = createProject(projectName, projectDescription);
      setActiveProject(project.id);
    }
  };

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
        </div>

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
      </div>
    </div>
  );
}

export default ProjectWorkflow;

