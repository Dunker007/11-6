import { useState, useEffect } from 'react';
import { Layout } from './nexus/Layout';
import { IdeaGenerator } from './cortex/IdeaGenerator';
import { useStore } from './vault/Store';
import { NeuralMining } from './features/NeuralMining';
import { Dashboard } from './nexus/Dashboard';
import { GemManager } from './cortex/GemManager';
import { ProviderConfig } from './features/settings/ProviderConfig';
import { AgentStudio } from './features/AgentStudio';
import { OptimizationEngine } from './features/OptimizationEngine';
import { LuxRigPanel } from './features/LuxRigPanel';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const { tick } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' && <Dashboard />}
      {activePage === 'gems' && <GemManager />}
      {activePage === 'generator' && <IdeaGenerator />}
      {activePage === 'agents' && <AgentStudio />}
      {activePage === 'optimize' && <OptimizationEngine />}
      {activePage === 'mining' && <NeuralMining />}
      {activePage === 'luxrig' && <LuxRigPanel />}

      {activePage === 'revenue' && <NeuralMining />}

      {activePage === 'settings' && <ProviderConfig />}
    </Layout>
  );
}

export default App;
