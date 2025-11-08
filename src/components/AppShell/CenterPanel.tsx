import { lazy, Suspense, useMemo } from 'react';
import '../../styles/CenterPanel.css';
import NeuralCore from './NeuralCore';

// Lazy load workflows for better code splitting and faster initial load
const VibeEditor = lazy(() => import('../VibeEditor/VibeEditor'));
const DesktopEnvironment = lazy(() => import('../MonitorLayout/MonitorLayoutManager'));
const CreateWorkflow = lazy(() => import('../Create/CreateWorkflow'));
const DeployWorkflow = lazy(() => import('../Deploy/DeployWorkflow'));
const MonetizeWorkflow = lazy(() => import('../Monetize/MonetizeWorkflow'));
const MissionControl = lazy(() => import('../MissionControl/MissionControl')); // Lazy load MissionControl

// Loading fallback component
const WorkflowLoader = () => (
  <div className="workflow-loading" style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '0.5rem' }}>Loading...</div>
    </div>
  </div>
);

interface CenterPanelProps {
  activeWorkflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize' | 'mission-control';
  onWorkflowChange?: (workflow: 'create' | 'build' | 'deploy' | 'monitor' | 'monetize' | 'mission-control') => void;
}

const WORKFLOWS = [
  { id: 'create' as const, name: 'Create' },
  { id: 'build' as const, name: 'Build' },
  { id: 'deploy' as const, name: 'Deploy' },
  { id: 'monitor' as const, name: 'Monitor' },
  { id: 'monetize' as const, name: 'Monetize' },
  { id: 'mission-control' as const, name: 'Missions' },
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
        return <DesktopEnvironment />;
      case 'monetize':
        return <MonetizeWorkflow />;
      case 'mission-control':
        return <MissionControl />;
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
        <Suspense fallback={<WorkflowLoader />}>
          {workflowContent}
        </Suspense>
      </div>
    </div>
  );
}

export default CenterPanel;

