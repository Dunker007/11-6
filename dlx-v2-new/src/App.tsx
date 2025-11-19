/**
 * App.tsx
 * DLX v2 - Revenue Operating System
 * Main application entry point
 */

import { useEffect } from 'react';
import { RevenueHUD } from './components/revenue/RevenueHUD';
import { useAIStore } from './services/ai/ai-router';
import { logger } from './services/foundation/logger';

function App() {
  const { detectProviders } = useAIStore();

  useEffect(() => {
    // Initialize app
    logger.info('🚀 DLX v2 initializing...');

    // Detect AI providers on mount
    detectProviders();

    // Log startup
    logger.info('✅ DLX v2 ready', {
      version: '2.0.0',
      build: import.meta.env.MODE,
    });
  }, []);

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
