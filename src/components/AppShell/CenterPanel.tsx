import { useMemo } from 'react';
import '../../styles/CenterPanel.css';
import NeuralCore from './NeuralCore';
import VibeEditor from '../VibeEditor/VibeEditor';
import FinancialDashboard from '../BackOffice/FinancialDashboard';
import CreateWorkflow from '../Create/CreateWorkflow';
import DeployWorkflow from '../Deploy/DeployWorkflow';
import MonetizeWorkflow from '../Monetize/MonetizeWorkflow';

interface CenterPanelProps {
  activeWorkflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize';
  onWorkflowChange?: (workflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize') => void;
}

const WORKFLOWS = [
  { id: 'create' as const, name: 'Create' },
  { id: 'build' as const, name: 'Build' },
  { id: 'deploy' as const, name: 'Deploy' },
  { id: 'monitor' as const, name: 'Monitor' },
  { id: 'monetize' as const, name: 'Monetize' },
] as const;

function CenterPanel({ activeWorkflow, onWorkflowChange }: CenterPanelProps) {
  // Memoize active workflow index calculation
  const activeIndex = useMemo(
    () => WORKFLOWS.findIndex((w) => w.id === activeWorkflow),
    [activeWorkflow]
  );

  const handleProjectCreated = () => {
    if (onWorkflowChange) {
      onWorkflowChange('build');
    }
  };

  // Memoize workflow component rendering
  const workflowContent = useMemo(() => {
    switch (activeWorkflow) {
      case 'create':
        return <CreateWorkflow onProjectCreated={handleProjectCreated} />;
      case 'build':
        return <VibeEditor />;
      case 'deploy':
        return <DeployWorkflow />;
      case 'monitor':
        return <FinancialDashboard />;
      case 'monetize':
        return <MonetizeWorkflow />;
      default:
        const workflow = WORKFLOWS.find((w) => w.id === activeWorkflow);
        return (
          <div className="workflow-placeholder">
            <h2>{workflow?.name} Workflow</h2>
            <p>Coming soon...</p>
          </div>
        );
    }
  }, [activeWorkflow, onWorkflowChange]);

  return (
    <div className="center-panel">
      <div className="neural-core-container">
        <NeuralCore />
      </div>
      
      <div className="workflow-pipeline">
        <div className="pipeline-stages">
          {WORKFLOWS.map((workflow, index) => {
            const isActive = workflow.id === activeWorkflow;
            const isPast = activeIndex > index;
            
            return (
              <div key={workflow.id} className={`pipeline-stage ${isActive ? 'active' : ''} ${isPast ? 'completed' : ''}`}>
                <div className="stage-indicator" />
                <span className="stage-name">{workflow.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="main-content">
        {workflowContent}
      </div>
    </div>
  );
}

export default CenterPanel;

