import { useMemo, useEffect, useState } from 'react';
import { Server, Cloud, Activity, CheckCircle } from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import { llmRouter } from '@/services/ai/router';
import '../../styles/LLMOptimizer.css';

const ActiveConnectionsCompact = () => {
  const { models, availableProviders, isLoading, activeModel } = useLLMStore();
  const [latencies, setLatencies] = useState<Record<string, number>>({});

  // Test connection latency periodically
  useEffect(() => {
    const testLatencies = async () => {
      const newLatencies: Record<string, number> = {};
      
      for (const provider of availableProviders) {
        try {
          const providerInstance = llmRouter.getProvider(provider);
          if (providerInstance) {
            const startTime = performance.now();
            await providerInstance.healthCheck();
            const endTime = performance.now();
            newLatencies[provider] = endTime - startTime;
          }
        } catch {
          // Provider check failed
        }
      }
      
      setLatencies(newLatencies);
    };

    testLatencies();
    const interval = setInterval(testLatencies, 15000); // Test every 15 seconds
    return () => clearInterval(interval);
  }, [availableProviders]);

  // Group models by provider and show active ones
  const activeConnections = useMemo(() => {
    const connections: Array<{
      provider: string;
      providerName: string;
      type: 'local' | 'cloud';
      modelCount: number;
      isOnline: boolean;
      activeModelName?: string;
      latency?: number;
    }> = [];

    const providerMap: Record<string, { name: string; type: 'local' | 'cloud' }> = {
      ollama: { name: 'Ollama', type: 'local' },
      lmstudio: { name: 'LM Studio', type: 'local' },
      gemini: { name: 'Gemini', type: 'cloud' },
      notebooklm: { name: 'NotebookLM', type: 'cloud' },
      openrouter: { name: 'OpenRouter', type: 'cloud' },
    };

    Object.entries(providerMap).forEach(([provider, info]) => {
      const providerModels = models.filter((m) => m.provider === provider);
      const isOnline = availableProviders.includes(provider);
      const activeModelForProvider = activeModel && activeModel.provider === provider ? activeModel : null;

      if (isOnline && providerModels.length > 0) {
        connections.push({
          provider,
          providerName: info.name,
          type: info.type,
          modelCount: providerModels.length,
          isOnline: true,
          activeModelName: activeModelForProvider?.name,
          latency: latencies[provider],
        });
      }
    });

    return connections;
  }, [models, availableProviders, activeModel, latencies]);

  if (isLoading) {
    return (
      <div className="sidebar-section">
        <h3>Active Connections</h3>
        <div className="compact-connections-loading">
          <Activity size={14} className="spinning" />
          <span>Checking...</span>
        </div>
      </div>
    );
  }

  if (activeConnections.length === 0) {
    return (
      <div className="sidebar-section">
        <h3>Active Connections</h3>
        <div className="compact-connections-empty">
          <span className="connection-text">No active connections</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <h3>Active Connections</h3>
      <div className="compact-connections-list">
        {activeConnections.map((conn) => (
          <div key={conn.provider} className="compact-connection-item">
            <div className="connection-icon">
              {conn.type === 'local' ? (
                <Server size={12} />
              ) : (
                <Cloud size={12} />
              )}
            </div>
            <div className="connection-info">
              <div className="connection-name" title={conn.providerName}>
                {conn.providerName.length > 20
                  ? `${conn.providerName.substring(0, 20)}...`
                  : conn.providerName}
              </div>
              <div className="connection-meta">
                {conn.modelCount} {conn.modelCount === 1 ? 'model' : 'models'}
                {conn.activeModelName && (
                  <span style={{ display: 'block', fontSize: '0.625rem', color: 'var(--violet-400)', marginTop: '0.125rem' }}>
                    Active: {conn.activeModelName.length > 15 ? `${conn.activeModelName.substring(0, 15)}...` : conn.activeModelName}
                  </span>
                )}
                {conn.latency !== undefined && (
                  <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                    {conn.latency.toFixed(0)}ms
                  </span>
                )}
              </div>
            </div>
            <div className="connection-status">
              <CheckCircle size={10} className="status-online" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveConnectionsCompact;

