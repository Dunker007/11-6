import { useMemo } from 'react';
import '../../styles/CenterPanel.css';
import NeuralCore from './NeuralCore';
import VibDEEditor from '../VibDEEditor/VibDEEditor';
import FinancialDashboard from '../BackOffice/FinancialDashboard';
import CreateWorkflow from '../Create/CreateWorkflow';

interface CenterPanelProps {
  activeWorkflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize';
}

const WORKFLOWS = [
  { id: 'create' as const, name: 'Create' },
  { id: 'build' as const, name: 'Build' },
  { id: 'deploy' as const, name: 'Deploy' },
  { id: 'monitor' as const, name: 'Monitor' },
  { id: 'monetize' as const, name: 'Monetize' },
] as const;

function CenterPanel({ activeWorkflow }: CenterPanelProps) {
  // Memoize active workflow index calculation
  const activeIndex = useMemo(
    () => WORKFLOWS.findIndex((w) => w.id === activeWorkflow),
    [activeWorkflow]
  );

  // Memoize workflow component rendering
  const workflowContent = useMemo(() => {
    switch (activeWorkflow) {
      case 'create':
        return <CreateWorkflow />;
      case 'build':
        return <VibDEEditor />;
      case 'monitor':
        return <FinancialDashboard />;
      default:
        const workflow = WORKFLOWS.find((w) => w.id === activeWorkflow);
        return (
          <div className="workflow-placeholder">
            <h2>{workflow?.name} Workflow</h2>
            <p>Coming soon...</p>
          </div>
        );
    }
  }, [activeWorkflow]);

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

