import { useState } from 'react';
import LeftPanel from './components/AppShell/LeftPanel';
import CenterPanel from './components/AppShell/CenterPanel';
import RightPanel from './components/AppShell/RightPanel';
import './styles/index.css';

function App() {
  const [activeWorkflow, setActiveWorkflow] = useState<'create' | 'build' | 'deploy' | 'monitor' | 'monetize'>('build');

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh',
      width: '100vw',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden'
    }}>
      <LeftPanel 
        activeWorkflow={activeWorkflow} 
        onWorkflowChange={setActiveWorkflow}
      />
      <CenterPanel activeWorkflow={activeWorkflow} />
      <RightPanel />
    </div>
  );
}

export default App;
