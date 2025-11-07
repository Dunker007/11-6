import { useState, useEffect } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import { Zap, Server, Cloud, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import '../../styles/LLMStatusPanel.css';

interface LLMProvider {
  id: string;
  name: string;
  icon: typeof Server;
  endpoint?: string;
  status: 'connected' | 'disconnected' | 'checking';
}

function LLMStatusPanel() {
  const { status, checkConnection } = useLLMStore();
  const [providers, setProviders] = useState<LLMProvider[]>([
    {
      id: 'lmstudio',
      name: 'LM Studio',
      icon: Server,
      endpoint: 'http://localhost:1234',
      status: 'checking',
    },
    {
      id: 'ollama',
      name: 'Ollama',
      icon: Server,
      endpoint: 'http://localhost:11434',
      status: 'checking',
    },
    {
      id: 'gemini',
      name: 'Gemini',
      icon: Cloud,
      status: 'checking',
    },
  ]);

  // Check provider status every 10 seconds
  useEffect(() => {
    const checkProviders = async () => {
      const updated = await Promise.all(
        providers.map(async (provider) => {
          try {
            if (provider.endpoint) {
              // Try to fetch from endpoint
              const response = await fetch(provider.endpoint, {
                method: 'GET',
                signal: AbortSignal.timeout(2000),
              });
              return {
                ...provider,
                status: response.ok ? 'connected' : 'disconnected',
              } as LLMProvider;
            } else {
              // Cloud provider - check if API key is set
              const hasKey = localStorage.getItem(`${provider.id}-api-key`);
              return {
                ...provider,
                status: hasKey ? 'connected' : 'disconnected',
              } as LLMProvider;
            }
          } catch {
            return {
              ...provider,
              status: 'disconnected',
            } as LLMProvider;
          }
        })
      );
      setProviders(updated);
    };

    checkProviders();
    const interval = setInterval(checkProviders, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={16} className="status-icon connected" />;
      case 'disconnected':
        return <XCircle size={16} className="status-icon disconnected" />;
      case 'checking':
        return <AlertCircle size={16} className="status-icon checking" />;
      default:
        return <AlertCircle size={16} className="status-icon" />;
    }
  };

  const connectedCount = providers.filter(p => p.status === 'connected').length;
  const overallHealth = connectedCount > 0 ? 'healthy' : 'warning';

  return (
    <div className="llm-status-panel">
      <div className="panel-header">
        <div className="header-content">
          <Zap size={20} className="panel-icon" />
          <h3 className="panel-title">LLM Status</h3>
        </div>
        <div className={`health-badge ${overallHealth}`}>
          {connectedCount}/{providers.length} Online
        </div>
      </div>

      <div className="providers-list">
        {providers.map((provider) => {
          const Icon = provider.icon;
          return (
            <div key={provider.id} className={`provider-card ${provider.status}`}>
              <div className="provider-header">
                <div className="provider-info">
                  <Icon size={18} className="provider-icon" />
                  <span className="provider-name">{provider.name}</span>
                </div>
                {getStatusIcon(provider.status)}
              </div>

              {provider.endpoint && (
                <div className="provider-endpoint">
                  <code>{provider.endpoint}</code>
                </div>
              )}

              <div className={`provider-status ${provider.status}`}>
                <span className="status-dot"></span>
                <span className="status-text">
                  {provider.status === 'connected' && 'Connected'}
                  {provider.status === 'disconnected' && 'Disconnected'}
                  {provider.status === 'checking' && 'Checking...'}
                </span>
              </div>

              {/* Connection glow */}
              {provider.status === 'connected' && (
                <div className="connection-glow"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LLMStatusPanel;

