import { useEffect, useState, useMemo, useCallback } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import '../../styles/LLMStatus.css';

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
  }, [discoverProviders]);

  const handleRefresh = useCallback(async () => {
    await discoverProviders();
    setLastChecked(new Date());
  }, [discoverProviders]);

  // Memoize model filtering to avoid recalculating on every render
  const modelGroups = useMemo(() => ({
    lmStudio: models.filter((m) => m.provider === 'lmstudio'),
    ollama: models.filter((m) => m.provider === 'ollama'),
    gemini: models.filter((m) => m.provider === 'gemini'),
    notebookLM: models.filter((m) => m.provider === 'notebooklm'),
  }), [models]);

  // Memoize provider status checks
  const providerStatus = useMemo(() => ({
    lmstudio: availableProviders.includes('lmstudio'),
    ollama: availableProviders.includes('ollama'),
    gemini: availableProviders.includes('gemini'),
    notebooklm: availableProviders.includes('notebooklm'),
  }), [availableProviders]);

  return (
    <div className="llm-status">
      <div className="status-header">
        <h3>LLM Status</h3>
        <button onClick={handleRefresh} className="refresh-button" disabled={isLoading}>
          {isLoading ? '🔄' : '↻'} Refresh
        </button>
      </div>

      <div className="providers-status">
        {/* Local Providers */}
        <div className="provider-category">
          <div className="category-label">🖥️ Local</div>
          
          <div className="provider-status">
            <div className="provider-header">
              <span className="provider-name">LM Studio</span>
              <span className={`status-indicator ${providerStatus.lmstudio ? 'online' : 'offline'}`}>
                {providerStatus.lmstudio ? '● Online' : '○ Offline'}
              </span>
            </div>
            {providerStatus.lmstudio ? (
              <div className="models-list">
                {modelGroups.lmStudio.length > 0 ? (
                  modelGroups.lmStudio.map((model) => (
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
              <span className={`status-indicator ${providerStatus.ollama ? 'online' : 'offline'}`}>
                {providerStatus.ollama ? '● Online' : '○ Offline'}
              </span>
            </div>
            {providerStatus.ollama ? (
              <div className="models-list">
                {modelGroups.ollama.length > 0 ? (
                  modelGroups.ollama.map((model) => (
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

        {/* Cloud Providers */}
        <div className="provider-category">
          <div className="category-label">☁️ Cloud</div>
          
          <div className="provider-status">
            <div className="provider-header">
              <span className="provider-name">Google Gemini</span>
              <span className={`status-indicator ${providerStatus.gemini ? 'online' : 'offline'}`}>
                {providerStatus.gemini ? '● Online' : '○ Offline'}
              </span>
            </div>
            {providerStatus.gemini ? (
              <div className="models-list">
                {modelGroups.gemini.length > 0 ? (
                  modelGroups.gemini.map((model) => (
                    <div key={model.id} className="model-item">
                      <span className="model-name">{model.name}</span>
                      {model.contextWindow && (
                        <span className="model-size">{model.contextWindow.toLocaleString()} tokens</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="no-models">Configure API key in settings</span>
                )}
              </div>
            ) : (
              <p className="offline-message">Configure Gemini API key in settings</p>
            )}
          </div>

          <div className="provider-status">
            <div className="provider-header">
              <span className="provider-name">NotebookLM</span>
              <span className={`status-indicator ${providerStatus.notebooklm ? 'online' : 'offline'}`}>
                {providerStatus.notebooklm ? '● Online' : '○ Offline'}
              </span>
            </div>
            {providerStatus.notebooklm ? (
              <div className="models-list">
                {modelGroups.notebookLM.length > 0 ? (
                  modelGroups.notebookLM.map((model) => (
                    <div key={model.id} className="model-item">
                      <span className="model-name">{model.name}</span>
                      {model.description && (
                        <span className="model-size">{model.description}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="no-models">Configure API key in settings</span>
                )}
              </div>
            ) : (
              <p className="offline-message">Configure NotebookLM API key in settings</p>
            )}
          </div>
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

