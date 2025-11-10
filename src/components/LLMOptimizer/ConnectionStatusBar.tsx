import { useEffect, useState, useCallback } from 'react';
import { Activity, CheckCircle, XCircle, RefreshCw, Server, Cloud, Zap } from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import { useDebouncedCallback } from '@/utils/hooks/useDebounce';
import '../../styles/LLMOptimizer.css';

interface ProviderStatus {
  name: string;
  provider: string;
  isOnline: boolean;
  modelCount: number;
  type: 'local' | 'cloud';
}

const ConnectionStatusBar = () => {
  const { models, availableProviders, isLoading, discoverProviders } = useLLMStore();
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);

  useEffect(() => {
    const ollama: ProviderStatus = {
      name: 'Ollama',
      provider: 'ollama',
      isOnline: availableProviders.includes('ollama'),
      modelCount: models.filter(m => m.provider === 'ollama').length,
      type: 'local',
    };

    const lmstudio: ProviderStatus = {
      name: 'LM Studio',
      provider: 'lmstudio',
      isOnline: availableProviders.includes('lmstudio'),
      modelCount: models.filter(m => m.provider === 'lmstudio').length,
      type: 'local',
    };

    const gemini: ProviderStatus = {
      name: 'Gemini',
      provider: 'gemini',
      isOnline: availableProviders.includes('gemini'),
      modelCount: models.filter(m => m.provider === 'gemini').length,
      type: 'cloud',
    };

    const notebooklm: ProviderStatus = {
      name: 'NotebookLM',
      provider: 'notebooklm',
      isOnline: availableProviders.includes('notebooklm'),
      modelCount: models.filter(m => m.provider === 'notebooklm').length,
      type: 'cloud',
    };

    const openrouter: ProviderStatus = {
      name: 'OpenRouter',
      provider: 'openrouter',
      isOnline: availableProviders.includes('openrouter'),
      modelCount: models.filter(m => m.provider === 'openai' || m.provider === 'anthropic').length,
      type: 'cloud',
    };

    setProviderStatuses([ollama, lmstudio, gemini, notebooklm, openrouter]);
  }, [models, availableProviders]);

  const handleRefreshInternal = useCallback(async () => {
    await discoverProviders();
  }, [discoverProviders]);

  const handleRefresh = useDebouncedCallback(handleRefreshInternal, 500);

  const getStatusIcon = (status: ProviderStatus) => {
    if (isLoading) {
      return <Activity className="connection-bar-icon checking" size={14} />;
    }
    if (status.isOnline) {
      return <CheckCircle className="connection-bar-icon online" size={14} />;
    }
    return <XCircle className="connection-bar-icon offline" size={14} />;
  };

  const getProviderIcon = (type: 'local' | 'cloud') => {
    return type === 'local' ? <Server size={12} /> : <Cloud size={12} />;
  };

  const onlineCount = providerStatuses.filter(p => p.isOnline).length;
  const totalCount = providerStatuses.length;

  return (
    <div className="connection-status-bar">
      <div className="connection-bar-summary">
        <Zap size={14} className="summary-icon" />
        <span className="summary-text">{onlineCount}/{totalCount} Active</span>
      </div>
      
      <div className="connection-bar-providers">
        {providerStatuses.map((status) => (
          <div 
            key={status.provider} 
            className={`connection-bar-item ${status.isOnline ? 'online' : 'offline'} ${status.type}`}
            title={`${status.name}: ${status.isOnline ? `${status.modelCount} models available` : 'Offline'}`}
          >
            <div className="bar-item-icon">
              {getProviderIcon(status.type)}
            </div>
            {getStatusIcon(status)}
            <span className="bar-item-name">{status.name}</span>
            {status.isOnline && status.modelCount > 0 && (
              <span className="bar-item-count">{status.modelCount}</span>
            )}
          </div>
        ))}
      </div>

      <button 
        className="connection-bar-refresh"
        onClick={handleRefresh}
        disabled={isLoading}
        title="Refresh connection status"
      >
        <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
      </button>
    </div>
  );
};

export default ConnectionStatusBar;

