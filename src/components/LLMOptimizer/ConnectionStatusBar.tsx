import { useEffect, useState, useCallback } from 'react';
import { Activity, CheckCircle, XCircle, RefreshCw, Server, Cloud, Zap, Wifi } from '@/components/Icons/icons';
import { useLLMStore } from '@/services/ai/llmStore';
import { llmRouter } from '@/services/ai/router';
import { useDebouncedCallback } from '@/utils/hooks/useDebounce';
import { useToast } from '@/components/ui';
import '../../styles/LLMOptimizer.css';

interface ProviderStatus {
  name: string;
  provider: string;
  isOnline: boolean;
  modelCount: number;
  type: 'local' | 'cloud';
  latency?: number;
}

const ConnectionStatusBar = () => {
  const models = useLLMStore((state) => state.models);
  const availableProviders = useLLMStore((state) => state.availableProviders);
  const isLoading = useLLMStore((state) => state.isLoading);
  const discoverProviders = useLLMStore((state) => state.discoverProviders);
  const { showToast } = useToast();
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const updateStatuses = () => {
      const newStatuses: Omit<ProviderStatus, 'latency'>[] = [
        {
          name: 'Ollama',
          provider: 'ollama',
          isOnline: availableProviders.includes('ollama'),
          modelCount: models.filter((m) => m.provider === 'ollama').length,
          type: 'local',
        },
        {
          name: 'LM Studio',
          provider: 'lmstudio',
          isOnline: availableProviders.includes('lmstudio'),
          modelCount: models.filter((m) => m.provider === 'lmstudio').length,
          type: 'local',
        },
        {
          name: 'Gemini',
          provider: 'gemini',
          isOnline: availableProviders.includes('gemini'),
          modelCount: models.filter((m) => m.provider === 'gemini').length,
          type: 'cloud',
        },
        {
          name: 'NotebookLM',
          provider: 'notebooklm',
          isOnline: availableProviders.includes('notebooklm'),
          modelCount: models.filter((m) => m.provider === 'notebooklm').length,
          type: 'cloud',
        },
        {
          name: 'Ollama Cloud',
          provider: 'ollama-cloud',
          isOnline: availableProviders.includes('ollama-cloud'),
          modelCount: models.filter((m) => m.provider === 'ollama-cloud').length,
          type: 'cloud',
        },
        {
          name: 'OpenRouter',
          provider: 'openrouter',
          isOnline: availableProviders.includes('openrouter'),
          modelCount: models.filter(
            (m) => m.provider === 'openai' || m.provider === 'anthropic'
          ).length,
          type: 'cloud',
        },
      ];

      setProviderStatuses(prevStatuses => {
        const prevStatusMap = new Map(prevStatuses.map(s => [s.provider, s]));
        return newStatuses.map(newStatus => ({
          ...newStatus,
          latency: prevStatusMap.get(newStatus.provider)?.latency,
        }));
      });
    };

    updateStatuses();
  }, [models, availableProviders]);

  // Auto-refresh every 30 seconds (matches LLMStatus interval)
  useEffect(() => {
    // Initial load - use cache if available
    discoverProviders(false);
    const interval = setInterval(async () => {
      // Periodic checks - use cache when available (respects 30s cache TTL)
      await discoverProviders(false);
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Zustand actions are stable, don't need to be in deps

  const handleRefreshInternal = useCallback(async () => {
    // Manual refresh - force fresh checks
    await discoverProviders(true);
    setLastRefresh(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Zustand actions are stable, don't need to be in deps

  const handleRefresh = useDebouncedCallback(handleRefreshInternal, 500);

  const handleTestConnection = useCallback(async (providerName: string) => {
    setTestingProvider(providerName);
    try {
      const provider = llmRouter.getProvider(providerName);
      if (!provider) {
        showToast({
          variant: 'error',
          title: 'Provider not found',
          message: `${providerName} provider is not available`,
        });
        return;
      }

      const startTime = performance.now();
      const isHealthy = await provider.healthCheck();
      const endTime = performance.now();
      const latency = endTime - startTime;

      if (isHealthy) {
        // Update latency for this provider
        setProviderStatuses(prev => prev.map(p => 
          p.provider === providerName ? { ...p, latency, isOnline: true } : p
        ));
        
        showToast({
          variant: 'success',
          title: 'Connection test successful',
          message: `${providerName} responded in ${latency.toFixed(0)}ms`,
          duration: 2000,
        });
      } else {
        showToast({
          variant: 'error',
          title: 'Connection test failed',
          message: `${providerName} is offline or unreachable`,
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Connection test error',
        message: `Failed to test ${providerName}: ${(error as Error).message}`,
      });
    } finally {
      setTestingProvider(null);
    }
  }, [showToast]);

  const getStatusIcon = (status: ProviderStatus) => {
    if (testingProvider === status.provider) {
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
        {lastRefresh && (
          <span className="summary-timestamp" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
            {lastRefresh.toLocaleTimeString()}
          </span>
        )}
      </div>
      
      <div className="connection-bar-providers">
        {providerStatuses.map((status) => (
          <div 
            key={status.provider} 
            className={`connection-bar-item ${status.isOnline ? 'online' : 'offline'} ${status.type}`}
            title={`${status.name}: ${status.isOnline ? `${status.modelCount} models available${status.latency ? ` • ${status.latency.toFixed(0)}ms latency` : ''}` : 'Offline'}`}
          >
            <div className="bar-item-icon">
              {getProviderIcon(status.type)}
            </div>
            {getStatusIcon(status)}
            <span className="bar-item-name">{status.name}</span>
            {status.isOnline && status.modelCount > 0 && (
              <span className="bar-item-count">{status.modelCount}</span>
            )}
            {status.latency && status.isOnline && (
              <span className="bar-item-latency" style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                {status.latency.toFixed(0)}ms
              </span>
            )}
            <button
              className="bar-item-test-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleTestConnection(status.provider);
              }}
              disabled={testingProvider === status.provider || isLoading}
              title={`Test ${status.name} connection`}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '0.25rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--text-muted)',
                transition: 'color 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <Wifi size={12} />
            </button>
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

