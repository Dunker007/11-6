import '../styles/CenterPanel.css';
import NeuralCore from './NeuralCore';
import VibDEEditor from '../VibDEEditor/VibDEEditor';

interface CenterPanelProps {
  activeWorkflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize';
}

const workflows = [
  { id: 'create' as const, name: 'Create' },
  { id: 'build' as const, name: 'Build' },
  { id: 'deploy' as const, name: 'Deploy' },
  { id: 'monitor' as const, name: 'Monitor' },
  { id: 'monetize' as const, name: 'Monetize' },
];

function CenterPanel({ activeWorkflow }: CenterPanelProps) {
  return (
    <div className="center-panel">
      <div className="neural-core-container">
        <NeuralCore />
      </div>
      
      <div className="workflow-pipeline">
        <div className="pipeline-stages">
          {workflows.map((workflow, index) => {
            const isActive = workflow.id === activeWorkflow;
            const activeIndex = workflows.findIndex(w => w.id === activeWorkflow);
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
        {activeWorkflow === 'build' ? (
          <VibDEEditor />
        ) : (
          <div className="workflow-placeholder">
            <h2>{workflows.find(w => w.id === activeWorkflow)?.name} Workflow</h2>
            <p>Coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CenterPanel;

