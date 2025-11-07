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
  const geminiModels = models.filter((m) => m.provider === 'gemini');
  const notebookLMModels = models.filter((m) => m.provider === 'notebooklm');

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

        {/* Cloud Providers */}
        <div className="provider-category">
          <div className="category-label">☁️ Cloud</div>
          
          <div className="provider-status">
            <div className="provider-header">
              <span className="provider-name">Google Gemini</span>
              <span className={`status-indicator ${availableProviders.includes('gemini') ? 'online' : 'offline'}`}>
                {availableProviders.includes('gemini') ? '● Online' : '○ Offline'}
              </span>
            </div>
            {availableProviders.includes('gemini') ? (
              <div className="models-list">
                {geminiModels.length > 0 ? (
                  geminiModels.map((model) => (
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
              <span className={`status-indicator ${availableProviders.includes('notebooklm') ? 'online' : 'offline'}`}>
                {availableProviders.includes('notebooklm') ? '● Online' : '○ Offline'}
              </span>
            </div>
            {availableProviders.includes('notebooklm') ? (
              <div className="models-list">
                {notebookLMModels.length > 0 ? (
                  notebookLMModels.map((model) => (
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

