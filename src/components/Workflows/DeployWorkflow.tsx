/**
 * Deploy Workflow Component
 * 
 * Provides UI for Deploy workflow: configure deployment targets, deploy, monitor
 */

import { useState } from 'react';
import { useWorkflowStore } from '@/services/workflow/workflowStore';
import { useProjectStore } from '@/services/project/projectStore';
import { useToast } from '@/components/ui';
import WorkflowRunner from './WorkflowRunner';
import TechIcon from '../Icons/TechIcon';
import { Play, Rocket, Server, Globe, Settings } from 'lucide-react';
import type { DeployWorkflowConfig } from '@/types/workflow';
import '@/styles/Workflows.css';

function DeployWorkflow() {
  const { createWorkflow } = useWorkflowStore();
  const { activeProject } = useProjectStore();
  const { showToast } = useToast();
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [deployTarget, setDeployTarget] = useState<'local' | 'staging' | 'production' | 'custom'>('staging');
  const [customUrl, setCustomUrl] = useState('');
  const [deployCommand, setDeployCommand] = useState('');

  const handleCreateDeploy = () => {
    if (!activeProject) {
      showToast({
        variant: 'warning',
        title: 'Project required',
        message: 'Please select a project first',
      });
      return;
    }

    const config: DeployWorkflowConfig = {
      type: 'deploy',
      name: `Deploy: ${activeProject.name} → ${deployTarget}`,
      description: `Deploying ${activeProject.name} to ${deployTarget}`,
      steps: [
        {
          name: 'Pre-deployment Checks',
          description: 'Running pre-deployment validation',
          metadata: { step: 'pre-check' },
        },
        {
          name: 'Build for Deployment',
          description: 'Building optimized production bundle',
          metadata: { step: 'build' },
        },
        {
          name: 'Deploy to Target',
          description: `Deploying to ${deployTarget}`,
          metadata: { step: 'deploy', target: deployTarget },
        },
        {
          name: 'Post-deployment Verification',
          description: 'Verifying deployment success',
          metadata: { step: 'verify' },
        },
      ],
      projectId: activeProject.id,
      target: deployTarget,
      deployCommand: deployCommand || undefined,
      environment: deployTarget === 'custom' ? { CUSTOM_URL: customUrl } : undefined,
      metadata: {
        target: deployTarget,
        deployCommand: deployCommand || 'npm run deploy',
        customUrl: deployTarget === 'custom' ? customUrl : undefined,
      },
    };

    const workflow = createWorkflow(config);
    setWorkflowId(workflow.id);
  };

  return (
    <div className="workflow-container deploy-workflow">
      <div className="workflow-header">
        <TechIcon icon={Rocket} size={24} glow="violet" />
        <h2>Deploy Workflow</h2>
      </div>

      <div className="workflow-content">
        {!activeProject ? (
          <div className="workflow-empty-state">
            <p>Please select a project to deploy</p>
          </div>
        ) : (
          <>
            <div className="workflow-config">
              <div className="config-section">
                <label>Project</label>
                <div className="project-info">
                  <strong>{activeProject.name}</strong>
                </div>
              </div>

              <div className="config-section">
                <label>Deployment Target</label>
                <div className="deploy-target-selector">
                  <button
                    className={`deploy-target-btn ${deployTarget === 'local' ? 'active' : ''}`}
                    onClick={() => setDeployTarget('local')}
                  >
                    <Server size={16} />
                    Local
                  </button>
                  <button
                    className={`deploy-target-btn ${deployTarget === 'staging' ? 'active' : ''}`}
                    onClick={() => setDeployTarget('staging')}
                  >
                    <Settings size={16} />
                    Staging
                  </button>
                  <button
                    className={`deploy-target-btn ${deployTarget === 'production' ? 'active' : ''}`}
                    onClick={() => setDeployTarget('production')}
                  >
                    <Globe size={16} />
                    Production
                  </button>
                  <button
                    className={`deploy-target-btn ${deployTarget === 'custom' ? 'active' : ''}`}
                    onClick={() => setDeployTarget('custom')}
                  >
                    <Rocket size={16} />
                    Custom
                  </button>
                </div>
              </div>

              {deployTarget === 'custom' && (
                <div className="config-section">
                  <label>Custom URL</label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>
              )}

              <div className="config-section">
                <label>Deploy Command (Optional)</label>
                <input
                  type="text"
                  value={deployCommand}
                  onChange={(e) => setDeployCommand(e.target.value)}
                  placeholder="npm run deploy"
                />
              </div>

              <button
                className="workflow-create-btn"
                onClick={handleCreateDeploy}
                disabled={deployTarget === 'custom' && !customUrl.trim()}
              >
                <Play size={16} />
                Create Deploy Workflow
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
          </>
        )}
      </div>
    </div>
  );
}

export default DeployWorkflow;

