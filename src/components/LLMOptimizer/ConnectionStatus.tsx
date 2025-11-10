import { useEffect, useState, useCallback, useMemo } from 'react';
import { Activity, AlertCircle, CheckCircle, XCircle, RefreshCw, Zap, Server, Cloud } from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import { useDebouncedCallback } from '@/utils/hooks/useDebounce';
import '../../styles/LLMOptimizer.css';

interface ProviderStatus {
  name: string;
  provider: string;
  isOnline: boolean;
  modelCount: number;
  checking: boolean;
  type: 'local' | 'cloud';
  lastChecked?: Date;
}

const ConnectionStatus = () => {
  const { models, availableProviders, isLoading, discoverProviders } = useLLMStore();
  // Calculate provider statuses from available data (memoized)
  const providerStatuses = useMemo(() => {
    const ollama: ProviderStatus = {
      name: 'Ollama',
      provider: 'ollama',
      isOnline: availableProviders.includes('ollama'),
      modelCount: models.filter(m => m.provider === 'ollama').length,
      checking: false,
      type: 'local',
    };

    const lmstudio: ProviderStatus = {
      name: 'LM Studio',
      provider: 'lmstudio',
      isOnline: availableProviders.includes('lmstudio'),
      modelCount: models.filter(m => m.provider === 'lmstudio').length,
      checking: false,
      type: 'local',
    };

    const gemini: ProviderStatus = {
      name: 'Gemini',
      provider: 'gemini',
      isOnline: availableProviders.includes('gemini'),
      modelCount: models.filter(m => m.provider === 'gemini').length,
      checking: false,
      type: 'cloud',
    };

    const notebooklm: ProviderStatus = {
      name: 'NotebookLM',
      provider: 'notebooklm',
      isOnline: availableProviders.includes('notebooklm'),
      modelCount: models.filter(m => m.provider === 'notebooklm').length,
      checking: false,
      type: 'cloud',
    };

    const openrouter: ProviderStatus = {
      name: 'OpenRouter',
      provider: 'openrouter',
      isOnline: availableProviders.includes('openrouter'),
      modelCount: models.filter(m => m.provider === 'openai' || m.provider === 'anthropic').length,
      checking: false,
      type: 'cloud',
    };

    return [ollama, lmstudio, gemini, notebooklm, openrouter];
  }, [models, availableProviders]);

  // Auto-retry connection every 30 seconds if enabled
  useEffect(() => {
    if (!autoRetry) return;

    const interval = setInterval(() => {
      const hasOfflineProvider = providerStatuses.some(p => !p.isOnline);
      if (hasOfflineProvider) {
        handleRefresh();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRetry, providerStatuses]);

  const handleRefreshInternal = useCallback(async () => {
    await discoverProviders();
    setLastRefresh(new Date());
  }, [discoverProviders]);

  const handleRefresh = useDebouncedCallback(handleRefreshInternal, 500);

  const getStatusIcon = (status: ProviderStatus) => {
    if (isLoading || status.checking) {
      return <Activity className="connection-status-icon checking" size={18} />;
    }
    if (status.isOnline) {
      return <CheckCircle className="connection-status-icon online" size={18} />;
    }
    return <XCircle className="connection-status-icon offline" size={18} />;
  };

  const getProviderIcon = (type: 'local' | 'cloud') => {
    return type === 'local' ? <Server size={14} /> : <Cloud size={14} />;
  };

  const getStatusBadge = (status: ProviderStatus) => {
    if (isLoading || status.checking) {
      return <span className="status-badge checking">Checking</span>;
    }
    if (status.isOnline) {
      return <span className="status-badge online">Online</span>;
    }
    return <span className="status-badge offline">Offline</span>;
  };

  const onlineCount = providerStatuses.filter(p => p.isOnline).length;
  const totalCount = providerStatuses.length;

  return (
    <div className="connection-status-container">
      <div className="connection-status-controls">
        <div className="connection-status-summary">
          <Zap size={14} className="summary-icon" />
          <span className="summary-text">
            {onlineCount}/{totalCount} Active
          </span>
        </div>
        <div className="connection-status-actions">
          <label className="auto-retry-toggle">
            <input
              type="checkbox"
              checked={autoRetry}
              onChange={(e) => setAutoRetry(e.target.checked)}
            />
            <span>Auto</span>
          </label>
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh connection status"
          >
            <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      <div className="provider-status-list">
        {providerStatuses.map((status) => (
          <div 
            key={status.provider} 
            className={`provider-status-card ${status.isOnline ? 'online' : 'offline'} ${status.type}`}
          >
            <div className="provider-card-header">
              <div className="provider-card-info">
                <div className="provider-icon-wrapper">
                  {getProviderIcon(status.type)}
                </div>
                <div className="provider-details">
                  <span className="provider-name">{status.name}</span>
                  <span className="provider-type">{status.type === 'local' ? 'Local' : 'Cloud'}</span>
                </div>
              </div>
              {getStatusBadge(status)}
            </div>
            
            <div className="provider-card-body">
              <div className="provider-status-indicator">
                {getStatusIcon(status)}
                <div className="status-details">
                  <span className="status-text">
                    {status.isOnline 
                      ? `${status.modelCount} model${status.modelCount !== 1 ? 's' : ''} available`
                      : 'Not connected'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {allOffline && (
        <div className="connection-status-warning">
          <AlertCircle size={16} />
          <div className="warning-content">
            <span className="warning-title">No Providers Available</span>
            <span className="warning-text">Configure Ollama, LM Studio, or cloud providers to get started.</span>
          </div>
        </div>
      )}

      {lastRefresh && (
        <div className="connection-status-footer">
          <span className="last-refresh-text">
            Last checked: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
