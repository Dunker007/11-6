/**
 * App.tsx
 * DLX v2 - Revenue Operating System
 * Main application entry point
 */

import { useEffect } from 'react';
import { RevenueHUD } from './components/revenue/RevenueHUD';
import { useAIStore } from './services/ai/ai-router';
import { useCredentialVault } from './services/integration/credential-vault';
import { logger } from './services/foundation/logger';

function App() {
  const { detectProviders } = useAIStore();
  const { initialize: initVault } = useCredentialVault();

  useEffect(() => {
    // Initialize app
    logger.info('🚀 DLX v2 initializing...');

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

      {/* Main content */}
      <RevenueHUD />
    </div>
  );
}

export default App;
