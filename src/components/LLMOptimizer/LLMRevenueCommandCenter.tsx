import { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Zap, TrendingUp, Settings as SettingsIcon, DollarSign, Code, Bitcoin, Lightbulb, FolderPlus, Rocket, Activity, Play, Minus, Square, X } from 'lucide-react';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';
import { useLLMStore } from '@/services/ai/llmStore';
import { useFinancialStore } from '@/services/backoffice/financialStore';
import { CommandPalette, useCommandPalette } from '@/components/ui';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { useScreenSize } from '@/utils/hooks/useScreenSize';
import ConnectionStatusBar from './ConnectionStatusBar';
import LiveHardwareProfiler from './LiveHardwareProfiler';
import ModelCatalog from './ModelCatalog';
import SystemAlertsCompact from './SystemAlertsCompact';
import TopRecommendationsCompact from './TopRecommendationsCompact';
import ActiveConnectionsCompact from './ActiveConnectionsCompact';
import QuickModelSwitcher from './QuickModelSwitcher';
import GPUMonitorDetailed from './GPUMonitorDetailed';
import ModelPerformanceMetrics from './ModelPerformanceMetrics';
import TokenUsageTracker from './TokenUsageTracker';
import BenchmarkRunner from './BenchmarkRunner';
import LocalProviderStatus from './LocalProviderStatus';
import ModelStatusDashboard from './ModelStatusDashboard';
import QuickTestInterface from './QuickTestInterface';
import VibedEd from './VibedEd/VibedEd';
import GeminiStudioPanel from './GeminiStudioPanel';
import { OSOptimizationsPanel } from './OSOptimizationsPanel';
import '../../styles/LLMOptimizer.css';
import '../../styles/LayoutMockups.css';
import '../../styles/ui/Navigation.css';
import '../../styles/ui/Accessibility.css';
import '../../styles/ui/Responsive.css';
import '../../styles/ModelStatusDashboard.css';
import '../../styles/QuickModelActions.css';
import '../../styles/QuickTestInterface.css';

// Lazy load heavy components
const IdeaLab = lazy(() => import('./IdeaLab'));
const CryptoLab = lazy(() => import('./CryptoLab/CryptoLab'));
const WealthLab = lazy(() => import('./WealthLab/WealthLab'));
const FinancialDashboard = lazy(() => import('../BackOffice/FinancialDashboard'));
const BackOffice = lazy(() => import('../BackOffice/BackOffice'));

// Lazy load workflow components
const ProjectWorkflow = lazy(() => import('../Workflows/ProjectWorkflow'));
const BuildWorkflow = lazy(() => import('../Workflows/BuildWorkflow'));
const DeployWorkflow = lazy(() => import('../Workflows/DeployWorkflow'));
const MonitorWorkflow = lazy(() => import('../Workflows/MonitorWorkflow'));
const MonetizeWorkflow = lazy(() => import('../Workflows/MonetizeWorkflow'));

// Lazy load Quick Labs
const QuickLabs = lazy(() => import('../QuickLabs/QuickLabs'));

// Lazy load Settings
const Settings = lazy(() => import('../Settings/Settings'));

type TabType = 'llm' | 'revenue' | 'vibed-ed' | 'crypto-lab' | 'wealth-lab' | 'idea-lab' | 'workflows' | 'quick-labs' | 'settings';
type WorkflowType = 'project' | 'build' | 'deploy' | 'monitor' | 'monetize' | null;

function LLMRevenueCommandCenter() {
  const [activeTab, setActiveTab] = useState<TabType>('llm');
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowType>(null);
  const commandPalette = useCommandPalette();
  const screenSize = useScreenSize();
  
  // LLM Store
  const discoverProviders = useLLMStore((state) => state.discoverProviders);
  const discoverLocalProviders = useLLMStore((state) => state.discoverLocalProviders);
  const models = useLLMStore((state) => state.models);
  
  // Check if Gemini is available
  const hasGemini = useMemo(() => {
    return models.some(m => m.provider === 'gemini' && m.isAvailable);
  }, [models]);
  
  // LLM Optimizer Store
  const detectHardware = useLLMOptimizerStore((state) => state.detectHardware);
  const loadCatalog = useLLMOptimizerStore((state) => state.loadCatalog);
  const modelCatalog = useLLMOptimizerStore((state) => state.modelCatalog);
  const runBenchmarks = useLLMOptimizerStore((state) => state.runBenchmarks);
  const benchmarks = useLLMOptimizerStore((state) => state.benchmarks);
  const isBenchmarking = useLLMOptimizerStore((state) => state.isBenchmarking);
  const benchmarkError = useLLMOptimizerStore((state) => state.benchmarkError);
  
  // Financial Store
  const { refresh: refreshFinancials } = useFinancialStore();
  
  useEffect(() => {
    detectHardware();
    loadCatalog();
    discoverProviders();
    discoverLocalProviders(); // Initial discovery
    refreshFinancials();

    // Set up polling for local provider discovery
    const intervalId = setInterval(discoverLocalProviders, 10000); // every 10 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [detectHardware, loadCatalog, discoverProviders, discoverLocalProviders, refreshFinancials]);

  // Helper function to get tab display name
  const getTabName = useCallback((tab: TabType): string => {
    const names: Record<TabType, string> = {
      'llm': 'LLM Optimization',
      'revenue': 'Revenue & Monetization',
      'vibed-ed': 'Vibed Ed',
      'crypto-lab': 'Crypto Lab',
      'wealth-lab': 'Wealth Lab',
      'idea-lab': 'Idea Lab',
      'workflows': 'Workflows',
      'quick-labs': 'Quick Labs',
      'settings': 'Settings',
    };
    return names[tab];
  }, []);

  // Tab configuration with shortcuts
  const tabs: Array<{ id: TabType; icon: React.ReactNode; shortcut: string }> = useMemo(() => [
    { id: 'llm', icon: <Zap size={18} />, shortcut: 'Alt+1' },
    { id: 'revenue', icon: <DollarSign size={18} />, shortcut: 'Alt+2' },
    { id: 'vibed-ed', icon: <Code size={18} />, shortcut: 'Alt+3' },
    { id: 'crypto-lab', icon: <Bitcoin size={18} />, shortcut: 'Alt+4' },
    { id: 'wealth-lab', icon: <TrendingUp size={18} />, shortcut: 'Alt+5' },
    { id: 'idea-lab', icon: <Lightbulb size={18} />, shortcut: 'Alt+6' },
    { id: 'workflows', icon: <Play size={18} />, shortcut: 'Alt+7' },
    { id: 'quick-labs', icon: <Code size={18} />, shortcut: 'Alt+8' },
    { id: 'settings', icon: <SettingsIcon size={18} />, shortcut: 'Alt+9' },
  ], []);

  // Memoize tab change handler
  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
  }, []);

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if not in input/textarea and not command palette
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Alt + number keys for quick tab switching (1-9)
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const tabs: TabType[] = ['llm', 'revenue', 'vibed-ed', 'crypto-lab', 'wealth-lab', 'idea-lab', 'workflows', 'quick-labs', 'settings'];
        const key = e.key;
        if (key >= '1' && key <= '9') {
          const index = parseInt(key) - 1;
          if (tabs[index]) {
            e.preventDefault();
            handleTabChange(tabs[index]);
          }
        }
      }

      // Arrow keys for tab navigation (when tab selector is focused)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const tabs: TabType[] = ['llm', 'revenue', 'vibed-ed', 'crypto-lab', 'wealth-lab', 'idea-lab', 'workflows', 'quick-labs', 'settings'];
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex !== -1) {
          if (e.key === 'ArrowLeft' && currentIndex > 0) {
            e.preventDefault();
            handleTabChange(tabs[currentIndex - 1]);
          } else if (e.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
            e.preventDefault();
            handleTabChange(tabs[currentIndex + 1]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, handleTabChange]);

  // Workflow selection handler
  const handleWorkflowChange = useCallback((workflow: WorkflowType) => {
    setActiveWorkflow(workflow);
  }, []);


  return (
    <div className="mockup-container llm-revenue-command-center" data-screen-size={screenSize.isMobile ? 'mobile' : screenSize.isTablet ? 'tablet' : screenSize.isLargeDesktop ? 'large-desktop' : 'desktop'}>
      {/* Skip Links - Hidden by default, visible on focus */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      
      {/* Electron Title Bar Spacer */}
      <div className="electron-titlebar-spacer">
        <div className="titlebar-content">
          <div className="titlebar-title">
            <span>DLX Studios Ultimate</span>
          </div>
          <div className="titlebar-controls">
            <button 
              className="titlebar-button" 
              onClick={() => (window as any).windowControls?.minimize?.()}
              aria-label="Minimize"
            >
              <Minus size={14} />
            </button>
            <button 
              className="titlebar-button" 
              onClick={() => (window as any).windowControls?.maximize?.()}
              aria-label="Maximize"
            >
              <Square size={12} />
            </button>
            <button 
              className="titlebar-button titlebar-close" 
              onClick={() => (window as any).windowControls?.close?.()}
              aria-label="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Top Status Bar */}
      <div className="mockup-top-bar llm-revenue-bar">
        <div className="tab-selector" role="tablist" aria-label="Main navigation tabs" id="navigation">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn-large ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
            >
              {tab.icon}
              <span>{getTabName(tab.id)}</span>
              <span className="tab-shortcut-hint" aria-label={tab.shortcut}>{tab.shortcut}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={`mockup-main-layout llm-revenue-layout ${activeTab === 'idea-lab' || activeTab === 'crypto-lab' || activeTab === 'wealth-lab' || activeTab === 'vibed-ed' || activeTab === 'workflows' || activeTab === 'quick-labs' || activeTab === 'settings' ? 'full-width-tab' : ''} ${activeTab === 'revenue' ? 'revenue-tab-layout' : ''}`} style={{ position: 'relative', zIndex: 1 }}>
        {/* Left Panel */}
        {activeTab === 'llm' && (
          <div className="mockup-sidebar left">
            <div className="sidebar-section">
              <h3>Model Catalog</h3>
              <ModelCatalog entries={modelCatalog || []} />
            </div>
          </div>
        )}

        {/* Center - Main Dashboard */}
        <div className="mockup-center" role="tabpanel" id="main-content" aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'llm' && (
            <div className="connection-status-section">
              <h3 className="connection-status-heading">Connection Status</h3>
              <ConnectionStatusBar />
            </div>
          )}
          {activeTab === 'idea-lab' ? (
            <ErrorBoundary sectionName="Idea Lab">
              <Suspense fallback={<div className="loading-state slide-up-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                <span>Loading Idea Lab...</span>
              </div>}>
                <IdeaLab />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'vibed-ed' ? (
            <ErrorBoundary sectionName="Vibed Ed">
              <Suspense fallback={<div className="loading-state slide-up-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                <span>Loading Vibed Ed...</span>
              </div>}>
                <VibedEd />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'crypto-lab' ? (
            <ErrorBoundary sectionName="Crypto Lab">
              <Suspense fallback={<div className="loading-state slide-up-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                <span>Loading Crypto Lab...</span>
              </div>}>
                <CryptoLab />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'wealth-lab' ? (
            <ErrorBoundary sectionName="Wealth Lab">
              <Suspense fallback={<div className="loading-state slide-up-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                <span>Loading Wealth Lab...</span>
              </div>}>
                <WealthLab />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'llm' ? (
            <>
              <LiveHardwareProfiler />
              <ModelCatalog entries={modelCatalog || []} />
              <GPUMonitorDetailed />
              <BenchmarkRunner
                catalog={modelCatalog || []}
                results={benchmarks}
                isRunning={isBenchmarking}
                onRun={runBenchmarks}
                error={benchmarkError ?? undefined}
              />
              <ModelPerformanceMetrics />
              <TokenUsageTracker />
            </>
          ) : activeTab === 'revenue' ? (
            <ErrorBoundary sectionName="Revenue Dashboard">
              <Suspense fallback={<div className="loading-state slide-up-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                <span>Loading Revenue Dashboard...</span>
              </div>}>
                <div className="revenue-tab-content">
                  <FinancialDashboard />
                  <ErrorBoundary sectionName="Back Office">
                    <Suspense fallback={<div className="loading-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                      <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                      <span>Loading Back Office...</span>
                    </div>}>
                      <BackOffice />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'workflows' ? (
            <ErrorBoundary sectionName="Workflows">
              <Suspense fallback={<div className="loading-state slide-up-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                <span>Loading Workflows...</span>
              </div>}>
                <div className="workflows-container">
                <div className="workflows-sidebar">
                  <h3>Workflow Types</h3>
                  <div className="workflow-type-buttons">
                    <button
                      className={`workflow-type-btn ${activeWorkflow === 'project' ? 'active' : ''}`}
                      onClick={() => handleWorkflowChange('project')}
                    >
                      <FolderPlus size={18} />
                      <span>Project</span>
                    </button>
                    <button
                      className={`workflow-type-btn ${activeWorkflow === 'build' ? 'active' : ''}`}
                      onClick={() => handleWorkflowChange('build')}
                    >
                      <Zap size={18} />
                      <span>Build</span>
                    </button>
                    <button
                      className={`workflow-type-btn ${activeWorkflow === 'deploy' ? 'active' : ''}`}
                      onClick={() => handleWorkflowChange('deploy')}
                    >
                      <Rocket size={18} />
                      <span>Deploy</span>
                    </button>
                    <button
                      className={`workflow-type-btn ${activeWorkflow === 'monitor' ? 'active' : ''}`}
                      onClick={() => handleWorkflowChange('monitor')}
                    >
                      <Activity size={18} />
                      <span>Monitor</span>
                    </button>
                    <button
                      className={`workflow-type-btn ${activeWorkflow === 'monetize' ? 'active' : ''}`}
                      onClick={() => handleWorkflowChange('monetize')}
                    >
                      <DollarSign size={18} />
                      <span>Monetize</span>
                    </button>
                  </div>
                </div>
                <div className="workflows-content">
                  {activeWorkflow === 'project' ? (
                    <ProjectWorkflow />
                  ) : activeWorkflow === 'build' ? (
                    <BuildWorkflow />
                  ) : activeWorkflow === 'deploy' ? (
                    <DeployWorkflow />
                  ) : activeWorkflow === 'monitor' ? (
                    <MonitorWorkflow />
                  ) : activeWorkflow === 'monetize' ? (
                    <MonetizeWorkflow />
                  ) : (
                    <div className="workflow-select-prompt">
                      <Play size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                      <h3>Select a Workflow</h3>
                      <p>Choose a workflow type from the sidebar to get started</p>
                    </div>
                  )}
                </div>
              </div>
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'quick-labs' ? (
            <ErrorBoundary sectionName="Quick Labs">
              <Suspense fallback={<div className="loading-state slide-up-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                <span>Loading Quick Labs...</span>
              </div>}>
                <QuickLabs />
              </Suspense>
            </ErrorBoundary>
          ) : activeTab === 'settings' ? (
            <ErrorBoundary sectionName="Settings">
              <Suspense fallback={<div className="loading-state slide-up-fade" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', gap: '0.75rem' }}>
                <div className="loading-spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(139, 92, 246, 0.3)', borderTopColor: 'var(--violet-500)', borderRadius: '50%' }}></div>
                <span>Loading Settings...</span>
              </div>}>
                <Settings />
              </Suspense>
            </ErrorBoundary>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: 'var(--text-muted)',
              fontSize: '1.125rem',
              fontWeight: 500
            }}>
              {getTabName(activeTab)}
            </div>
          )}
        </div>

        {/* Right Panel */}
        {activeTab === 'llm' && (
          <div className="mockup-sidebar right">
            <LocalProviderStatus />
            {hasGemini && <GeminiStudioPanel />}
            <ModelStatusDashboard catalog={modelCatalog || []} />
            <QuickTestInterface />
            <SystemAlertsCompact />
            <TopRecommendationsCompact />
            <ActiveConnectionsCompact />
            <QuickModelSwitcher />
            <OSOptimizationsPanel />
          </div>
        )}

      </div>
      
      {/* Command Palette */}
      <CommandPalette
        isOpen={commandPalette.isOpen}
        onClose={commandPalette.close}
        onNavigate={(tab) => handleTabChange(tab as TabType)}
      />
    </div>
  );
}

export default LLMRevenueCommandCenter;

