import { useState, useEffect } from 'react';
import { llmRouter } from '../services/ai/router';
import VibedEdAvatar from '../vibed-ed/VibedEdAvatar';
import '../styles-new/ai-status.css';

interface ProviderStatus {
  name: string;
  available: boolean;
  models: number;
  type: 'local' | 'cloud';
  status: 'checking' | 'online' | 'offline';
}

function AIStatus() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    checkProviders();
  }, []);

  const checkProviders = async () => {
    setIsChecking(true);
    try {
      const results = await llmRouter.discoverProviders();
      const providerStatuses: ProviderStatus[] = results.map((result) => ({
        name: result.provider,
        available: result.available,
        models: result.models.length,
        type:
          result.provider === 'openrouter'
            ? 'cloud'
            : result.provider === 'lmstudio' || result.provider === 'ollama'
              ? 'local'
              : ('cloud' as 'local' | 'cloud'),
        status: result.available
          ? 'online'
          : ('offline' as 'checking' | 'online' | 'offline'),
      }));
      setProviders(providerStatuses);
    } catch (error) {
      console.error('Failed to check providers:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return '#10b981'; // green
      case 'offline':
        return '#ef4444'; // red
      case 'checking':
        return '#f59e0b'; // yellow
      default:
        return '#6b7280'; // gray
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return '🟢';
      case 'offline':
        return '🔴';
      case 'checking':
        return '🟡';
      default:
        return '⚪';
    }
  };

  const onlineProviders = providers.filter((p) => p.available).length;
  const totalProviders = providers.length;

  return (
    <div className="ai-status">
      <div
        className="ai-status-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <VibedEdAvatar size="tiny" />
        <div className="status-summary">
          <span className="status-text">
            {onlineProviders}/{totalProviders} AI providers online
          </span>
          <span className="status-indicator">
            {isChecking
              ? '🔄'
              : getStatusIcon(onlineProviders > 0 ? 'online' : 'offline')}
          </span>
        </div>
        <button
          className="expand-button"
          onClick={(e) => {
            e.stopPropagation();
            checkProviders();
          }}
          disabled={isChecking}
        >
          {isChecking ? '⏳' : '🔄'}
        </button>
      </div>

      {isExpanded && (
        <div className="ai-status-details">
          <div className="providers-list">
            {providers.map((provider) => (
              <div key={provider.name} className="provider-item">
                <div className="provider-info">
                  <span className="provider-name">{provider.name}</span>
                  <span
                    className="provider-status"
                    style={{ color: getStatusColor(provider.status) }}
                  >
                    {getStatusIcon(provider.status)} {provider.status}
                  </span>
                </div>
                <div className="provider-details">
                  <span className="provider-type">{provider.type}</span>
                  {provider.available && (
                    <span className="provider-models">
                      {provider.models} models available
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="ai-status-help">
            <div className="help-section">
              <h4>🚀 Local AI Setup</h4>
              <div className="setup-links">
                <a
                  href="https://lmstudio.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download LM Studio
                </a>
                <a
                  href="https://ollama.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download Ollama
                </a>
              </div>
            </div>

            <div className="help-section">
              <h4>💡 Tips</h4>
              <ul>
                <li>LM Studio: Start server on port 1234</li>
                <li>Ollama: Run models locally</li>
                <li>Cloud providers: Configure API keys</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIStatus;
