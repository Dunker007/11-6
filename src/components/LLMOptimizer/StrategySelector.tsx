import { useState, useEffect } from 'react';
import { Shield, Zap, Cloud, Sparkles } from 'lucide-react';
import { llmRouter } from '@/services/ai/router';
import '../../styles/LLMOptimizer.css';

type ProviderStrategy = 'local-only' | 'local-first' | 'cloud-fallback' | 'hybrid';

interface StrategyOption {
  id: ProviderStrategy;
  name: string;
  icon: React.ReactNode;
  description: string;
  pros: string[];
  cons: string[];
}

const strategies: StrategyOption[] = [
  {
    id: 'local-only',
    name: 'Local Only',
    icon: <Shield size={20} />,
    description: 'Never use cloud - maximum privacy',
    pros: ['100% privacy', 'No API costs', 'Works offline'],
    cons: ['Fails if local unavailable', 'Limited to local models'],
  },
  {
    id: 'local-first',
    name: 'Local First',
    icon: <Zap size={20} />,
    description: 'Prefer local, fail if unavailable',
    pros: ['Fast local inference', 'No costs when working', 'Privacy first'],
    cons: ['No fallback', 'Fails if Ollama/LM Studio down'],
  },
  {
    id: 'cloud-fallback',
    name: 'Cloud Fallback',
    icon: <Cloud size={20} />,
    description: 'Try local, use cloud if needed (Recommended)',
    pros: ['Always available', 'Best of both worlds', 'Automatic fallback'],
    cons: ['May incur cloud costs', 'Requires OpenRouter key'],
  },
  {
    id: 'hybrid',
    name: 'Hybrid',
    icon: <Sparkles size={20} />,
    description: 'Auto-choose best for each task',
    pros: ['Optimal performance', 'Task-aware routing', 'Flexible'],
    cons: ['More complex', 'Requires configuration'],
  },
];

const StrategySelector = () => {
  const [selectedStrategy, setSelectedStrategy] = useState<ProviderStrategy>('cloud-fallback');

  // Load strategy from localStorage first, then sync with router
  useEffect(() => {
    try {
      const savedStrategy = localStorage.getItem('llm-strategy') as ProviderStrategy;
      if (savedStrategy && strategies.some(s => s.id === savedStrategy)) {
        setSelectedStrategy(savedStrategy);
        llmRouter.setStrategy(savedStrategy);
      } else {
        const currentStrategy = llmRouter.getStrategy();
        setSelectedStrategy(currentStrategy);
      }
    } catch (error) {
      console.warn('Failed to load strategy from localStorage:', error);
      // Fallback to router's current strategy
      const currentStrategy = llmRouter.getStrategy();
      setSelectedStrategy(currentStrategy);
    }
  }, []);

  const handleStrategyChange = (strategy: ProviderStrategy) => {
    setSelectedStrategy(strategy);
    llmRouter.setStrategy(strategy);
    
    // Save to localStorage for persistence
    try {
      localStorage.setItem('llm-strategy', strategy);
    } catch (error) {
      console.warn('Failed to save strategy to localStorage:', error);
      // Continue anyway - router has the strategy
    }
  };

  return (
    <div className="strategy-selector-container">
      <div className="strategy-selector-header">
        <h3>Provider Strategy</h3>
        <span className="strategy-hint">How should we route your AI requests?</span>
      </div>

      <div className="strategy-options">
        {strategies.map((strategy) => (
          <div
            key={strategy.id}
            className={`strategy-option ${selectedStrategy === strategy.id ? 'selected' : ''}`}
            onClick={() => handleStrategyChange(strategy.id)}
          >
            <div className="strategy-option-header">
              <div className="strategy-icon">{strategy.icon}</div>
              <div className="strategy-info">
                <h4>{strategy.name}</h4>
                <p>{strategy.description}</p>
              </div>
              <div className="strategy-radio">
                <input
                  type="radio"
                  checked={selectedStrategy === strategy.id}
                  onChange={() => handleStrategyChange(strategy.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {selectedStrategy === strategy.id && (
              <div className="strategy-details">
                <div className="strategy-pros">
                  <strong>Pros:</strong>
                  <ul>
                    {strategy.pros.map((pro, index) => (
                      <li key={index}>✓ {pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="strategy-cons">
                  <strong>Cons:</strong>
                  <ul>
                    {strategy.cons.map((con, index) => (
                      <li key={index}>⚠ {con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategySelector;

