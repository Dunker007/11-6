/**
 * LLMOptimizerPanel.tsx
 * 
 * PURPOSE:
 * Main panel component for LLM optimization and management. Provides comprehensive interface
 * for hardware profiling, model catalog browsing, recommendations, benchmarks, and system
 * health monitoring. Central hub for all LLM optimization features.
 * 
 * ARCHITECTURE:
 * Orchestrates multiple sub-components:
 * - ConnectionStatus: Provider connection status
 * - HardwareProfiler: Hardware detection and profiling
 * - ModelCatalog: Browse and select models
 * - ModelSelector: Quick model switching
 * - RecommendationPanel: Hardware-based recommendations
 * - StrategySelector: Provider routing strategy
 * - BenchmarkRunner: Model performance benchmarking
 * - SystemHealth: System resource monitoring
 * - LLMRevenueCommandCenter: Revenue tracking (default tab)
 * 
 * CURRENT STATUS:
 * ✅ Hardware detection and profiling
 * ✅ Model catalog loading and display
 * ✅ Recommendations generation
 * ✅ Benchmark execution
 * ✅ Provider discovery
 * ✅ Tab-based navigation (optimization, health, revenue)
 * ✅ Use case and priority selection
 * 
 * DEPENDENCIES:
 * - useLLMOptimizerStore: Optimization state
 * - useLLMStore: LLM models and providers
 * - llmOptimizerService: Optimization logic
 * - Sub-components: Various optimization UI components
 * 
 * STATE MANAGEMENT:
 * - Uses multiple Zustand stores
 * - Local state: activeTab, initialized, preselectedBenchmarkModels
 * - Auto-initializes on mount (hardware detection, catalog loading)
 * 
 * PERFORMANCE:
 * - Lazy initialization (only once)
 * - Memoized use case options
 * - Efficient store selectors
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import LLMOptimizerPanel from '@/components/LLMOptimizer/LLMOptimizerPanel';
 * 
 * function App() {
 *   return <LLMOptimizerPanel />;
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/llmOptimizerStore.ts: Optimization state
 * - src/services/ai/llmOptimizerService.ts: Optimization logic
 * - src/components/LLMOptimizer/*: Sub-components
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Real-time hardware monitoring
 * - Model performance history
 * - Custom benchmark suites
 * - A/B testing interface
 */
import { useEffect, useMemo, useState } from 'react';
import ConnectionStatus from './ConnectionStatus';
import HardwareProfiler from './HardwareProfiler';
import ModelCatalog from './ModelCatalog';
import ModelSelector from './ModelSelector';
import RecommendationPanel from './RecommendationPanel';
import StrategySelector from './StrategySelector';
import BenchmarkRunner from './BenchmarkRunner';
import SystemHealth from './SystemHealth';
import LLMRevenueCommandCenter from './LLMRevenueCommandCenter';
import GoogleAIHub from './GoogleAIHub';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';
import { useLLMStore } from '@/services/ai/llmStore';
import { llmOptimizerService } from '@/services/ai/llmOptimizerService';
import type { LLMUseCase, OptimizationPriority } from '@/types/optimizer';
import '../../styles/LLMOptimizer.css';

const priorityOptions: OptimizationPriority[] = ['balanced', 'quality', 'speed'];

const LLMOptimizerPanel = () => {
  const detectHardware = useLLMOptimizerStore((state) => state.detectHardware);
  const loadCatalog = useLLMOptimizerStore((state) => state.loadCatalog);
  const setUseCase = useLLMOptimizerStore((state) => state.setUseCase);
  const setPriority = useLLMOptimizerStore((state) => state.setPriority);
  const refreshRecommendations = useLLMOptimizerStore((state) => state.refreshRecommendations);
  const runBenchmarks = useLLMOptimizerStore((state) => state.runBenchmarks);
  const recommendations = useLLMOptimizerStore((state) => state.recommendations);
  const modelCatalog = useLLMOptimizerStore((state) => state.modelCatalog);
  const benchmarks = useLLMOptimizerStore((state) => state.benchmarks);
  const selectedUseCase = useLLMOptimizerStore((state) => state.selectedUseCase);
  const priority = useLLMOptimizerStore((state) => state.priority);
  const isBenchmarking = useLLMOptimizerStore((state) => state.isBenchmarking);
  const benchmarkError = useLLMOptimizerStore((state) => state.benchmarkError);
  const recommendationTimestamp = useLLMOptimizerStore((state) => state.recommendationTimestamp);

  const discoverProviders = useLLMStore((state) => state.discoverProviders);

  const [preselectedBenchmarkModels, setPreselectedBenchmarkModels] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [activeTab, setActiveTab] = useState<'optimization' | 'health' | 'revenue' | 'google-ai'>('revenue');
  const useCaseOptions = useMemo(() => llmOptimizerService.getUseCaseOptions(), []);

  useEffect(() => {
    if (initialized) return;
    setInitialized(true);
    detectHardware();
    loadCatalog();
    discoverProviders();
  }, [initialized, detectHardware, loadCatalog, discoverProviders]);

  useEffect(() => {
    if (!recommendationTimestamp) {
      refreshRecommendations();
    }
  }, [recommendationTimestamp, refreshRecommendations]);

  const handleUseCaseChange = (useCase: LLMUseCase) => {
    setUseCase(useCase);
  };

  const handlePriorityChange = (value: OptimizationPriority) => {
    setPriority(value);
  };

  const handleRecommendationBenchmark = (modelId: string) => {
    setPreselectedBenchmarkModels([modelId]);
    runBenchmarks([modelId]);
  };

  const handleCatalogSelect = (entryId: string) => {
    setPreselectedBenchmarkModels([entryId]);
  };

  return (
    <div className="llm-optimizer-panel">
      <div className="optimizer-tabs">
        <button
          className={`optimizer-tab ${activeTab === 'optimization' ? 'active' : ''}`}
          onClick={() => setActiveTab('optimization')}
        >
          Optimization
        </button>
        <button
          className={`optimizer-tab ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
        >
          System Health
        </button>
        <button
          className={`optimizer-tab ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          LLM & Revenue
        </button>
        <button
          className={`optimizer-tab ${activeTab === 'google-ai' ? 'active' : ''}`}
          onClick={() => setActiveTab('google-ai')}
        >
          Google AI Hub
        </button>
      </div>

      {activeTab === 'optimization' && (
        <div className="optimizer-grid">
          <div className="optimizer-column narrow">
            <HardwareProfiler />
            <ConnectionStatus />
            <StrategySelector />
            <ModelSelector />
          </div>

          <div className="optimizer-column wide">
            <section className="usecase-selector">
              <header>
                <h3>Optimization target</h3>
                <p>Select the workflow you want to optimize and we'll tune the stack accordingly.</p>
              </header>
              <div className="usecase-list">
                {useCaseOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={`usecase-pill ${selectedUseCase === option.id ? 'active' : ''}`}
                    onClick={() => handleUseCaseChange(option.id)}
                  >
                    <div className="usecase-pill-header">
                      <span>{option.label}</span>
                    </div>
                    <p>{option.description}</p>
                  </button>
                ))}
              </div>
              <div className="priority-selector">
                {priorityOptions.map((option) => (
                  <button
                    key={option}
                    className={`priority-pill ${priority === option ? 'active' : ''}`}
                    onClick={() => handlePriorityChange(option)}
                    type="button"
                  >
                    {option === 'balanced' && 'Balanced'}
                    {option === 'quality' && 'Quality first'}
                    {option === 'speed' && 'Speed first'}
                  </button>
                ))}
              </div>
            </section>

            <RecommendationPanel
              recommendations={recommendations}
              onBenchmark={handleRecommendationBenchmark}
            />

            <BenchmarkRunner
              catalog={modelCatalog}
              results={benchmarks}
              isRunning={isBenchmarking}
              onRun={runBenchmarks}
              error={benchmarkError ?? undefined}
              initialSelection={preselectedBenchmarkModels}
            />
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="optimizer-health-view">
          <SystemHealth />
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="optimizer-revenue-view">
          <LLMRevenueCommandCenter />
        </div>
      )}

      {activeTab === 'google-ai' && (
        <div className="optimizer-google-ai-view">
          <GoogleAIHub />
        </div>
      )}

      {activeTab === 'optimization' && (
        <ModelCatalog
          entries={modelCatalog}
          onSelect={(entry) => handleCatalogSelect(entry.id)}
        />
      )}
    </div>
  );
};

export default LLMOptimizerPanel;

