/**
 * Build Workflow Component
 * 
 * Provides UI for Build workflow: configure builds, view history, run builds
 */

import { useState, useEffect } from 'react';
import { useWorkflowStore } from '@/services/workflow/workflowStore';
import { useProjectStore } from '@/services/project/projectStore';
import WorkflowRunner from './WorkflowRunner';
import TechIcon from '../Icons/TechIcon';
import { Play, History, Zap } from 'lucide-react';
import type { BuildWorkflowConfig } from '@/types/workflow';
import '@/styles/Workflows.css';

function BuildWorkflow() {
  const { createWorkflow, getWorkflowsByType } = useWorkflowStore();
  const { activeProject } = useProjectStore();
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [buildType, setBuildType] = useState<'dev' | 'production' | 'test'>('dev');
  const [buildCommand, setBuildCommand] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const buildWorkflows = getWorkflowsByType('build');

  useEffect(() => {
    if (activeProject && !buildCommand) {
      // Set default build command based on project type
      setBuildCommand('npm run build');
    }
  }, [activeProject, buildCommand]);

  const handleCreateBuild = () => {
    if (!activeProject) {
      alert('Please select a project first');
      return;
    }

    const config: BuildWorkflowConfig = {
      type: 'build',
      name: `Build: ${activeProject.name} (${buildType})`,
      description: `Building ${activeProject.name} for ${buildType}`,
      steps: [
        {
          name: 'Prepare Build Environment',
          description: 'Setting up build environment and dependencies',
          metadata: { step: 'prepare' },
        },
        {
          name: 'Run Build Command',
          description: `Executing: ${buildCommand || 'npm run build'}`,
          metadata: { step: 'build', command: buildCommand || 'npm run build' },
        },
        {
          name: 'Validate Build Output',
          description: 'Checking build output for errors',
          metadata: { step: 'validate' },
        },
        {
          name: 'Optimize Build',
          description: 'Running AI-powered build optimization',
          metadata: { step: 'optimize' },
        },
      ],
      projectId: activeProject.id,
      buildType,
      buildCommand: buildCommand || undefined,
      metadata: {
        buildType,
        buildCommand: buildCommand || 'npm run build',
      },
    };

    const workflow = createWorkflow(config);
    setWorkflowId(workflow.id);
  };

  return (
    <div className="workflow-container build-workflow">
      <div className="workflow-header">
        <TechIcon icon={Zap} size={24} glow="amber" />
        <h2>Build Workflow</h2>
      </div>

      <div className="workflow-content">
        {!activeProject ? (
          <div className="workflow-empty-state">
            <p>Please select a project to build</p>
          </div>
        ) : (
          <>
            <div className="workflow-config">
              <div className="config-section">
                <label>Project</label>
                <div className="project-info">
                  <strong>{activeProject.name}</strong>
                  {activeProject.description && <span>{activeProject.description}</span>}
                </div>
              </div>

              <div className="config-section">
                <label>Build Type</label>
                <div className="build-type-selector">
                  <button
                    className={`build-type-btn ${buildType === 'dev' ? 'active' : ''}`}
                    onClick={() => setBuildType('dev')}
                  >
                    Development
                  </button>
                  <button
                    className={`build-type-btn ${buildType === 'production' ? 'active' : ''}`}
                    onClick={() => setBuildType('production')}
                  >
                    Production
                  </button>
                  <button
                    className={`build-type-btn ${buildType === 'test' ? 'active' : ''}`}
                    onClick={() => setBuildType('test')}
                  >
                    Test
                  </button>
                </div>
              </div>

              <div className="config-section">
                <label>Build Command</label>
                <input
                  type="text"
                  value={buildCommand}
                  onChange={(e) => setBuildCommand(e.target.value)}
                  placeholder="npm run build"
                />
              </div>

              <button
                className="workflow-create-btn"
                onClick={handleCreateBuild}
                disabled={!buildCommand.trim()}
              >
                <Play size={16} />
                Create Build Workflow
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

            {buildWorkflows.length > 0 && (
              <div className="workflow-history">
                <button
                  className="history-toggle"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  <History size={16} />
                  Build History ({buildWorkflows.length})
                </button>
                {showHistory && (
                  <div className="history-list">
                    {buildWorkflows.map((workflow) => (
                      <div key={workflow.id} className="history-item">
                        <div className="history-item-header">
                          <span>{workflow.name}</span>
                          <span className="history-status">{workflow.status}</span>
                        </div>
                        {workflow.duration && (
                          <span className="history-duration">
                            {(workflow.duration / 1000).toFixed(1)}s
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default BuildWorkflow;

