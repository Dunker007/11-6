import { useEffect, useState } from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import '../../styles/LLMOptimizer.css';

interface ProviderStatus {
  name: string;
  provider: string;
  isOnline: boolean;
  modelCount: number;
  checking: boolean;
}

const ConnectionStatus = () => {
  const { models, availableProviders, discoverProviders } = useLLMStore();
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [autoRetry, setAutoRetry] = useState(true);

  // Calculate provider statuses from available data
  useEffect(() => {
    const ollama = {
      name: 'Ollama',
      provider: 'ollama',
      isOnline: availableProviders.includes('ollama'),
      modelCount: models.filter(m => m.provider === 'ollama').length,
      checking: false,
    };

    const lmstudio = {
      name: 'LM Studio',
      provider: 'lmstudio',
      isOnline: availableProviders.includes('lmstudio'),
      modelCount: models.filter(m => m.provider === 'lmstudio').length,
      checking: false,
    };

    const openrouter = {
      name: 'OpenRouter',
      provider: 'openrouter',
      isOnline: availableProviders.includes('openrouter'),
      modelCount: models.filter(m => m.provider === 'openai' || m.provider === 'anthropic').length,
      checking: false,
    };

    setProviderStatuses([ollama, lmstudio, openrouter]);
  }, [models, availableProviders]);

  // Auto-retry connection every 30 seconds if enabled
  useEffect(() => {
    if (!autoRetry) return;

    const interval = setInterval(() => {
      const hasOfflineProvider = providerStatuses.some(p => !p.isOnline);
      if (hasOfflineProvider) {
        discoverProviders();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRetry, providerStatuses, discoverProviders]);

  const handleManualRefresh = () => {
    discoverProviders();
  };

  const getStatusIcon = (status: ProviderStatus) => {
    if (status.checking) {
      return <Activity className="connection-status-icon checking" size={16} />;
    }
    if (status.isOnline) {
      return <CheckCircle className="connection-status-icon online" size={16} />;
    }
    return <XCircle className="connection-status-icon offline" size={16} />;
  };

  const getStatusText = (status: ProviderStatus) => {
    if (status.checking) return 'Checking...';
    if (status.isOnline) return `Online (${status.modelCount} models)`;
    return 'Offline';
  };

  return (
    <div className="connection-status-container">
      <div className="connection-status-header">
        <h3>LLM Providers</h3>
        <div className="connection-status-controls">
          <label className="auto-retry-toggle">
            <input
              type="checkbox"
              checked={autoRetry}
              onChange={(e) => setAutoRetry(e.target.checked)}
            />
            <span>Auto-retry</span>
          </label>
          <button 
            className="refresh-button"
            onClick={handleManualRefresh}
            title="Refresh connection status"
          >
            <Activity size={16} />
          </button>
        </div>
      </div>

      <div className="provider-status-list">
        {providerStatuses.map((status) => (
          <div 
            key={status.provider} 
            className={`provider-status-item ${status.isOnline ? 'online' : 'offline'}`}
          >
            <div className="provider-status-info">
              {getStatusIcon(status)}
              <span className="provider-name">{status.name}</span>
            </div>
            <span className="provider-status-text">{getStatusText(status)}</span>
          </div>
        ))}
      </div>

      {providerStatuses.every(p => !p.isOnline) && (
        <div className="connection-status-warning">
          <AlertCircle size={16} />
          <span>No LLM providers available. Configure Ollama, LM Studio, or OpenRouter.</span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;

