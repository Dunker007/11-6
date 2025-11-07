import { useState, useEffect } from 'react';
import { useAPIKeyStore } from '../../services/apiKeys/apiKeyStore';
import { PROVIDER_CONFIGS, type LLMProvider } from '../../types/apiKeys';
import '../styles/APIKeyManager.css';

interface APIKeyManagerProps {
  onClose: () => void;
}

function APIKeyManager({ onClose }: APIKeyManagerProps) {
  const { keys, loadKeys, addKey, deleteKey, healthCheck } = useAPIKeyStore();
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);
  const [keyValue, setKeyValue] = useState('');
  const [keyName, setKeyName] = useState('');
  const [healthStatus, setHealthStatus] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    loadKeys();
    checkAllHealth();
  }, []);

  const checkAllHealth = async () => {
    const status: Record<string, boolean> = {};
    for (const provider of PROVIDER_CONFIGS) {
      status[provider.provider] = await healthCheck(provider.provider);
    }
    setHealthStatus(status);
  };

  const handleAddKey = async () => {
    if (!selectedProvider || !keyValue.trim()) return;

    setIsValidating(true);
    try {
      await addKey(selectedProvider, keyValue.trim(), keyName || PROVIDER_CONFIGS.find(p => p.provider === selectedProvider)?.name || '');
      setKeyValue('');
      setKeyName('');
      setSelectedProvider(null);
      await checkAllHealth();
    } catch (error) {
      console.error('Failed to add key:', error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDeleteKey = async (id: string) => {
    await deleteKey(id);
    await checkAllHealth();
  };

  const providerKeys = (provider: LLMProvider) => keys.filter(k => k.provider === provider);

  return (
    <div className="api-key-manager-overlay" onClick={onClose}>
      <div className="api-key-manager" onClick={(e) => e.stopPropagation()}>
        <div className="manager-header">
          <h2>API Key Management</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="manager-content">
          <div className="providers-grid">
            {PROVIDER_CONFIGS.map((config) => {
              const providerKeysList = providerKeys(config.provider);
              const isHealthy = healthStatus[config.provider] ?? false;

              return (
                <div key={config.provider} className="provider-card">
                  <div className="provider-header">
                    <div className="provider-info">
                      <h3>{config.name}</h3>
                      <p className="provider-description">{config.description}</p>
                    </div>
                    <div className={`health-indicator ${isHealthy ? 'healthy' : 'unhealthy'}`}>
                      <span className="health-dot" />
                      {isHealthy ? 'Connected' : 'Disconnected'}
                    </div>
                  </div>

                  <div className="provider-type">
                    <span className={`type-badge ${config.type}`}>
                      {config.type === 'local' ? '🖥️ Local' : '☁️ Cloud'}
                    </span>
                    {config.endpoint && (
                      <span className="endpoint">{config.endpoint}</span>
                    )}
                  </div>

                  {config.requiresKey && (
                    <div className="provider-keys">
                      {providerKeysList.length === 0 ? (
                        <div className="no-keys">
                          <p>No API key configured</p>
                          {selectedProvider === config.provider ? (
                            <div className="add-key-form">
                              <input
                                type="text"
                                placeholder="API Key"
                                value={keyValue}
                                onChange={(e) => setKeyValue(e.target.value)}
                                className="key-input"
                              />
                              <input
                                type="text"
                                placeholder="Name (optional)"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                className="key-input"
                              />
                              <div className="form-actions">
                                <button
                                  onClick={handleAddKey}
                                  disabled={!keyValue.trim() || isValidating}
                                  className="add-button"
                                >
                                  {isValidating ? 'Validating...' : 'Add Key'}
                                </button>
                                <button
                                  onClick={() => setSelectedProvider(null)}
                                  className="cancel-button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedProvider(config.provider)}
                              className="add-key-button"
                            >
                              + Add API Key
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="keys-list">
                          {providerKeysList.map((key) => (
                            <div key={key.id} className="key-item">
                              <div className="key-info">
                                <span className="key-name">{key.name || 'Unnamed'}</span>
                                <span className={`key-status ${key.isValid ? 'valid' : 'invalid'}`}>
                                  {key.isValid ? '✓ Valid' : '✗ Invalid'}
                                </span>
                              </div>
                              <div className="key-usage">
                                <span>{key.usage.requests} requests</span>
                                <span>${key.usage.cost.toFixed(4)}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteKey(key.id)}
                                className="delete-button"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                          {selectedProvider === config.provider && (
                            <div className="add-key-form">
                              <input
                                type="text"
                                placeholder="API Key"
                                value={keyValue}
                                onChange={(e) => setKeyValue(e.target.value)}
                                className="key-input"
                              />
                              <input
                                type="text"
                                placeholder="Name (optional)"
                                value={keyName}
                                onChange={(e) => setKeyName(e.target.value)}
                                className="key-input"
                              />
                              <div className="form-actions">
                                <button
                                  onClick={handleAddKey}
                                  disabled={!keyValue.trim() || isValidating}
                                  className="add-button"
                                >
                                  {isValidating ? 'Validating...' : 'Add Key'}
                                </button>
                                <button
                                  onClick={() => setSelectedProvider(null)}
                                  className="cancel-button"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                          <button
                            onClick={() => setSelectedProvider(config.provider)}
                            className="add-key-button"
                          >
                            + Add Another Key
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!config.requiresKey && (
                    <div className="local-provider-info">
                      <p>No API key required. Make sure {config.name} is running.</p>
                      <button onClick={checkAllHealth} className="refresh-button">
                        🔄 Check Connection
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default APIKeyManager;

