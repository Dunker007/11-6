/**
 * App.tsx
 * DLX v2 - Revenue Operating System
 * Main application entry point
 */

import { useEffect, useState } from 'react';
import { RevenueHUD } from './components/revenue/RevenueHUD';
import { SetupWizard } from './components/setup/SetupWizard';
import { useAIStore } from './services/ai/ai-router';
import { useCredentialVault } from './services/integration/credential-vault';
import { logger } from './services/foundation/logger';
import { Toaster } from './components/ui/Toast';

function App() {
  const { detectProviders } = useAIStore();
  const { initialize: initVault } = useCredentialVault();
  const [showSetup, setShowSetup] = useState(false);

  useEffect(() => {
    // Initialize app
    logger.info('🚀 DLX v2 initializing...');

    // Check if setup was completed
    const setupCompleted = localStorage.getItem('dlx-setup-completed');
    if (!setupCompleted) {
      setShowSetup(true);
    }

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => logger.info('✅ Service Worker registered'))
        .catch((err) => logger.error('Service Worker registration failed', { err }));
    }

    // Initialize credential vault
    initVault().then(() => {
      // Detect AI providers after vault is ready
      detectProviders();

      // Log startup
      logger.info('✅ DLX v2 ready', {
        version: '2.0.0',
        build: import.meta.env.MODE,
      });
    });
  }, [initVault, detectProviders]);

  return (
    <div className="min-h-screen bg-cyber-darker">
      {/* Data stream background effect */}
      <div className="fixed inset-0 data-stream opacity-5 pointer-events-none" />

      {/* Setup Wizard */}
      {showSetup && <SetupWizard onComplete={() => setShowSetup(false)} />}

      {/* Main content */}
      <RevenueHUD />

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;
