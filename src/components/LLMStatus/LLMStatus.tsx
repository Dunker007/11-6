import { useEffect, useState } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import '../styles/LLMStatus.css';

function LLMStatus() {
  const { models, availableProviders, isLoading, discoverProviders } = useLLMStore();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    discoverProviders();
    const interval = setInterval(() => {
      discoverProviders();
      setLastChecked(new Date());
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    await discoverProviders();
    setLastChecked(new Date());
  };

  const lmStudioModels = models.filter((m) => m.provider === 'lmstudio');
  const ollamaModels = models.filter((m) => m.provider === 'ollama');

  return (
    <div className="llm-status">
      <div className="status-header">
        <h3>Local LLM Status</h3>
        <button onClick={handleRefresh} className="refresh-button" disabled={isLoading}>
          {isLoading ? '🔄' : '↻'} Refresh
        </button>
      </div>

      <div className="providers-status">
        <div className="provider-status">
          <div className="provider-header">
            <span className="provider-name">LM Studio</span>
            <span className={`status-indicator ${availableProviders.includes('lmstudio') ? 'online' : 'offline'}`}>
              {availableProviders.includes('lmstudio') ? '● Online' : '○ Offline'}
            </span>
          </div>
          {availableProviders.includes('lmstudio') ? (
            <div className="models-list">
              {lmStudioModels.length > 0 ? (
                lmStudioModels.map((model) => (
                  <div key={model.id} className="model-item">
                    <span className="model-name">{model.name}</span>
                    {model.size && <span className="model-size">{model.size}</span>}
                  </div>
                ))
              ) : (
                <span className="no-models">No models found</span>
              )}
            </div>
          ) : (
            <p className="offline-message">Make sure LM Studio is running on localhost:1234</p>
          )}
        </div>

        <div className="provider-status">
          <div className="provider-header">
            <span className="provider-name">Ollama</span>
            <span className={`status-indicator ${availableProviders.includes('ollama') ? 'online' : 'offline'}`}>
              {availableProviders.includes('ollama') ? '● Online' : '○ Offline'}
            </span>
          </div>
          {availableProviders.includes('ollama') ? (
            <div className="models-list">
              {ollamaModels.length > 0 ? (
                ollamaModels.map((model) => (
                  <div key={model.id} className="model-item">
                    <span className="model-name">{model.name}</span>
                    {model.size && <span className="model-size">{model.size}</span>}
                  </div>
                ))
              ) : (
                <span className="no-models">No models found</span>
              )}
            </div>
          ) : (
            <p className="offline-message">Make sure Ollama is running on localhost:11434</p>
          )}
        </div>
      </div>

      {lastChecked && (
        <div className="last-checked">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

export default LLMStatus;

