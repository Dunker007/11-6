import React from 'react';
import { useLLMStore } from '@/services/ai/llmStore';
import { RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';
import '@/styles/LocalProviderStatus.css';

const LocalProviderStatus: React.FC = React.memo(() => {
  const localProviders = useLLMStore((state) => state.localProviders);
  const discoverLocalProviders = useLLMStore((state) => state.discoverLocalProviders);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await discoverLocalProviders();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="local-provider-status">
      <div className="local-provider-header">
        <h3>Local Providers</h3>
        <button
          onClick={handleRefresh}
          className="refresh-btn"
          disabled={isRefreshing}
          title="Refresh provider status"
        >
          <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
        </button>
      </div>

      <div className="provider-list">
        {localProviders.map((provider) => (
          <div
            key={provider.name}
            className={`provider-item ${provider.status === 'online' ? 'online' : 'offline'}`}
          >
            <div className="provider-info">
              <div className="provider-name-row">
                <div
                  className={`status-indicator ${provider.status === 'online' ? 'online' : 'offline'}`}
                />
                <span className="provider-name">{provider.name}</span>
              </div>
              {provider.status === 'online' && (
                <div className="provider-details">
                  {provider.latency !== undefined && (
                    <span className="latency">
                      <Clock size={12} />
                      {provider.latency}ms
                    </span>
                  )}
                  {provider.modelCount !== undefined && (
                    <span className="model-count">
                      {provider.modelCount} model{provider.modelCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="provider-status-icon">
              {provider.status === 'online' ? (
                <CheckCircle2 size={16} className="status-online" />
              ) : (
                <XCircle size={16} className="status-offline" />
              )}
            </div>
          </div>
        ))}
      </div>

      {localProviders.every((p) => p.status === 'offline') && (
        <div className="no-providers-message">
          <p>No local providers detected</p>
          <p className="hint">
            Start Ollama or LM Studio to enable local LLM support
          </p>
        </div>
      )}
    </div>
  );
});

LocalProviderStatus.displayName = 'LocalProviderStatus';

export default LocalProviderStatus;

