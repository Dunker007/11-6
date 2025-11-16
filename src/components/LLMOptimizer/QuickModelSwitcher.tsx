import { useState, useMemo, useEffect, useRef } from 'react';
import { ChevronDown, Server, Cloud, Check, Loader } from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import { useToast } from '@/components/ui';
import '../../styles/LLMOptimizer.css';

const QuickModelSwitcher = () => {
  const { models, availableProviders, activeModel, switchToModel, isLoading } = useLLMStore();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'all' | string>('all');
  const [switching, setSwitching] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter available models
  const availableModels = useMemo(() => {
    return models.filter((model) => {
      if (selectedProvider !== 'all') {
        return model.provider === selectedProvider;
      }
      return availableProviders.includes(model.provider);
    });
  }, [models, availableProviders, selectedProvider]);

  const handleModelSelect = async (modelId: string) => {
    if (switching || activeModel?.id === modelId) return;
    
    setSwitching(modelId);
    try {
      const success = await switchToModel(modelId);
      if (success) {
        setIsOpen(false);
        const model = models.find(m => m.id === modelId);
        showToast({
          variant: 'success',
          title: 'Model switched',
          message: `Switched to ${model?.name || modelId}`,
          duration: 2000,
        });
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to switch model',
          message: 'Model or provider not available',
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Error',
        message: `Failed to switch model: ${(error as Error).message}`,
      });
    } finally {
      setSwitching(null);
    }
  };

  const providers = useMemo(() => {
    const uniqueProviders = Array.from(
      new Set(availableModels.map((m) => m.provider))
    );
    return uniqueProviders.map((provider) => {
      const providerNames: Record<string, string> = {
        ollama: 'Ollama',
        lmstudio: 'LM Studio',
        gemini: 'Gemini',
        notebooklm: 'NotebookLM',
        openrouter: 'OpenRouter',
      };
      return {
        id: provider,
        name: providerNames[provider] || provider,
        type: ['ollama', 'lmstudio'].includes(provider) ? 'local' : 'cloud',
      };
    });
  }, [availableModels]);

  if (availableModels.length === 0) {
    return (
      <div className="sidebar-section">
        <h3>Quick Switch</h3>
        <div className="compact-switcher-empty">
          <span className="switcher-text">No models available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <h3>Quick Switch</h3>
      <div className="compact-model-switcher" ref={dropdownRef}>
        <button
          className="switcher-trigger"
          onClick={() => setIsOpen(!isOpen)}
          title={activeModel ? `Current: ${activeModel.name}` : 'Select model'}
        >
          <span className="switcher-label">
            {activeModel 
              ? (activeModel.name.length > 20 
                  ? `${activeModel.name.substring(0, 20)}...` 
                  : activeModel.name)
              : selectedProvider === 'all' 
                ? 'Select Model' 
                : providers.find((p) => p.id === selectedProvider)?.name}
          </span>
          <ChevronDown size={12} className={`chevron-down ${isOpen ? 'open' : ''}`} />
        </button>

        {isOpen && (
          <div className="switcher-dropdown">
            <div className="switcher-filters">
              <button
                className={`filter-btn ${selectedProvider === 'all' ? 'active' : ''}`}
                onClick={() => setSelectedProvider('all')}
              >
                All
              </button>
              {providers.map((provider) => (
                <button
                  key={provider.id}
                  className={`filter-btn ${selectedProvider === provider.id ? 'active' : ''}`}
                  onClick={() => setSelectedProvider(provider.id)}
                  title={provider.name}
                >
                  {provider.type === 'local' ? (
                    <Server size={10} />
                  ) : (
                    <Cloud size={10} />
                  )}
                  <span>{provider.name.length > 8 ? `${provider.name.substring(0, 8)}...` : provider.name}</span>
                </button>
              ))}
            </div>
            <div className="switcher-models">
              {availableModels.slice(0, 10).map((model) => (
                <button
                  key={model.id}
                  className={`switcher-model-item ${activeModel?.id === model.id ? 'active' : ''} ${switching === model.id ? 'switching' : ''}`}
                  onClick={() => handleModelSelect(model.id)}
                  title={model.name}
                  disabled={switching === model.id || isLoading}
                >
                  <span className="model-name">
                    {model.name.length > 25
                      ? `${model.name.substring(0, 25)}...`
                      : model.name}
                  </span>
                  {switching === model.id ? (
                    <Loader size={12} className="active-indicator spinning" />
                  ) : activeModel?.id === model.id ? (
                    <Check size={12} className="active-indicator" />
                  ) : null}
                </button>
              ))}
              {availableModels.length > 10 && (
                <div className="switcher-more">
                  +{availableModels.length - 10} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickModelSwitcher;
