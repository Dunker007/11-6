import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import type { LLMModel } from '@/types/llm';
import '../../styles/LLMOptimizer.css';

interface ModelSelectorProps {
  onModelChange?: (modelId: string, provider: string) => void;
}

const ModelSelector = ({ onModelChange }: ModelSelectorProps) => {
  const { models, availableProviders } = useLLMStore();
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [fallbackChain, setFallbackChain] = useState<string[]>([]);

  // Group models by provider
  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, LLMModel[]>);

  // Calculate fallback chain based on availability
  useEffect(() => {
    const chain: string[] = [];
    
    if (availableProviders.includes('ollama')) {
      chain.push('Ollama');
    }
    if (availableProviders.includes('lmstudio')) {
      chain.push('LM Studio');
    }
    if (availableProviders.includes('openrouter')) {
      chain.push('OpenRouter');
    }
    
    setFallbackChain(chain);

    // Auto-select first available model
    if (!selectedModel && models.length > 0) {
      // Prefer Ollama code models
      const ollamaCodeModel = models.find(m => 
        m.provider === 'ollama' && 
        (m.name.includes('coder') || m.name.includes('code'))
      );
      
      if (ollamaCodeModel) {
        setSelectedModel(ollamaCodeModel.id);
        onModelChange?.(ollamaCodeModel.id, ollamaCodeModel.provider);
        return;
      }

      // Fall back to first Ollama model
      const ollamaModel = models.find(m => m.provider === 'ollama');
      if (ollamaModel) {
        setSelectedModel(ollamaModel.id);
        onModelChange?.(ollamaModel.id, ollamaModel.provider);
        return;
      }

      // Fall back to any available model
      const firstModel = models[0];
      setSelectedModel(firstModel.id);
      onModelChange?.(firstModel.id, firstModel.provider);
    }
  }, [models, availableProviders, selectedModel, onModelChange]);

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = event.target.value;
    const model = models.find(m => m.id === modelId);
    
    if (model) {
      setSelectedModel(modelId);
      onModelChange?.(modelId, model.provider);
    }
  };

  const getCurrentProvider = () => {
    const model = models.find(m => m.id === selectedModel);
    return model?.provider || 'none';
  };

  const getProviderBadgeClass = (provider: string) => {
    switch (provider) {
      case 'ollama': return 'provider-badge ollama';
      case 'lmstudio': return 'provider-badge lmstudio';
      case 'openrouter':
      case 'openai':
      case 'anthropic':
        return 'provider-badge openrouter';
      default: return 'provider-badge';
    }
  };

  return (
    <div className="model-selector-container">
      <div className="model-selector-header">
        <h3>Active Model</h3>
        <span className={getProviderBadgeClass(getCurrentProvider())}>
          {getCurrentProvider()}
        </span>
      </div>

      <select 
        className="model-select"
        value={selectedModel}
        onChange={handleModelChange}
        disabled={models.length === 0}
      >
        {models.length === 0 ? (
          <option>No models available</option>
        ) : (
          <>
            {Object.entries(groupedModels).map(([provider, providerModels]) => (
              <optgroup key={provider} label={provider.toUpperCase()}>
                {providerModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} {model.size ? `(${model.size})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </>
        )}
      </select>

      {fallbackChain.length > 0 && (
        <div className="fallback-info">
          <div className="fallback-chain">
            <span>Fallback chain:</span>
            {fallbackChain.map((provider, index) => (
              <span key={provider}>
                {provider}
                {index < fallbackChain.length - 1 && (
                  <ChevronRight className="fallback-arrow" size={12} />
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelSelector;

