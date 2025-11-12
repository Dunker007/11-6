import { useState, useEffect, useCallback } from 'react';
import { useAPIKeyStore } from '../../services/apiKeys/apiKeyStore';
import { useDebouncedCallback } from '@/utils/hooks/useDebounce';
import { PROVIDER_CONFIGS, type LLMProvider } from '../../types/apiKeys';
import { Search, Plus, Trash2, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardBody } from '../ui';
import { useToast } from '../ui';

/**
 * Settings panel for managing API credentials and provider connections.
 *
 * @returns API settings section with provider grid and key management controls.
 */
function APISettings() {
  const { keys, loadKeys, addKey, deleteKey, healthCheck } = useAPIKeyStore();
  const { showToast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider | null>(null);
  const [keyValue, setKeyValue] = useState('');
  const [keyName, setKeyName] = useState('');
  const [healthStatus, setHealthStatus] = useState<Record<string, boolean>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetch the connection health for every configured provider and cache results in state.
   */
  const checkAllHealth = useCallback(async () => {
    const status: Record<string, boolean> = {};
    for (const provider of PROVIDER_CONFIGS) {
      status[provider.provider] = await healthCheck(provider.provider);
    }
    setHealthStatus(status);
  }, [healthCheck]);

  const debouncedCheckHealth = useDebouncedCallback(checkAllHealth, 500);

  useEffect(() => {
    loadKeys();
    checkAllHealth();
  }, [loadKeys, checkAllHealth]);

  /**
   * Persist a new API key for the selected provider and refresh provider health indicators.
   */
  const handleAddKey = async () => {
    if (!selectedProvider || !keyValue.trim()) return;

    setIsValidating(true);
    try {
      await addKey(
        selectedProvider,
        keyValue.trim(),
        keyName || PROVIDER_CONFIGS.find((p) => p.provider === selectedProvider)?.name || ''
      );
      setKeyValue('');
      setKeyName('');
      setSelectedProvider(null);
      await checkAllHealth();
      showToast({ message: 'API key added successfully', variant: 'success' });
    } catch (error) {
      console.error('Failed to add key:', error);
      showToast({ message: 'Failed to add API key', variant: 'error' });
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Remove an API key from secure storage after user confirmation and recompute health states.
   *
   * @param id - Identifier of the API key to delete.
   */
  const handleDeleteKey = async (id: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      await deleteKey(id);
      await checkAllHealth();
      showToast({ message: 'API key deleted', variant: 'success' });
    }
  };

  /**
   * Filter stored keys to those belonging to a specific provider.
   *
   * @param provider - Provider identifier used to match keys.
   * @returns Array of matching keys for the provider.
   */
  const providerKeys = (provider: LLMProvider) =>
    keys.filter((k) => k.provider === provider);

  const filteredProviders = PROVIDER_CONFIGS.filter((config) =>
    config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    config.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="api-settings">
      <div className="settings-section-header">
        <h2>API Key Management</h2>
        <p>Manage API keys for all services. Keys are encrypted and stored securely.</p>
      </div>

      <div className="api-settings-controls">
        <Input
          type="text"
          placeholder="Search providers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search size={18} />}
          fullWidth
        />
        <Button onClick={checkAllHealth} variant="secondary" leftIcon={RefreshCw}>
          Check All Connections
        </Button>
      </div>

      <div className="providers-grid">
        {filteredProviders.map((config) => {
          const providerKeysList = providerKeys(config.provider);
          const isHealthy = healthStatus[config.provider] ?? false;

          return (
            <Card key={config.provider} variant="outlined" hover className="provider-card">
              <CardHeader>
                <div className="provider-info">
                  <h3>{config.name}</h3>
                  <p className="provider-description">{config.description}</p>
                </div>
                <div className={`health-indicator ${isHealthy ? 'healthy' : 'unhealthy'}`}>
                  {isHealthy ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                  <span>{isHealthy ? 'Connected' : 'Disconnected'}</span>
                </div>
              </CardHeader>
              <CardBody>

              <div className="provider-type">
                <span className={`type-badge ${config.type}`}>
                  {config.type === 'local' ? '🖥️ Local' : '☁️ Cloud'}
                </span>
                {config.endpoint && <span className="endpoint">{config.endpoint}</span>}
              </div>

              {config.requiresKey && (
                <div className="provider-keys">
                  {providerKeysList.length === 0 ? (
                    <div className="no-keys">
                      <p>No API key configured</p>
                      {selectedProvider === config.provider ? (
                        <div className="add-key-form">
                          <Input
                            type="password"
                            placeholder="API Key"
                            value={keyValue}
                            onChange={(e) => setKeyValue(e.target.value)}
                            fullWidth
                          />
                          <Input
                            type="text"
                            placeholder="Name (optional)"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            fullWidth
                          />
                          <div className="form-actions">
                            <Button
                              onClick={handleAddKey}
                              disabled={!keyValue.trim() || isValidating}
                              isLoading={isValidating}
                              variant="primary"
                              fullWidth
                            >
                              Add Key
                            </Button>
                            <Button
                              onClick={() => setSelectedProvider(null)}
                              variant="ghost"
                              fullWidth
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setSelectedProvider(config.provider)}
                          variant="primary"
                          leftIcon={Plus}
                          fullWidth
                        >
                          Add API Key
                        </Button>
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
                          <Button
                            onClick={() => handleDeleteKey(key.id)}
                            variant="ghost"
                            size="sm"
                            title="Delete key"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                      {selectedProvider === config.provider && (
                        <div className="add-key-form">
                          <Input
                            type="password"
                            placeholder="API Key"
                            value={keyValue}
                            onChange={(e) => setKeyValue(e.target.value)}
                            fullWidth
                          />
                          <Input
                            type="text"
                            placeholder="Name (optional)"
                            value={keyName}
                            onChange={(e) => setKeyName(e.target.value)}
                            fullWidth
                          />
                          <div className="form-actions">
                            <Button
                              onClick={handleAddKey}
                              disabled={!keyValue.trim() || isValidating}
                              isLoading={isValidating}
                              variant="primary"
                              fullWidth
                            >
                              Add Key
                            </Button>
                            <Button
                              onClick={() => setSelectedProvider(null)}
                              variant="ghost"
                              fullWidth
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={() => setSelectedProvider(config.provider)}
                        variant="secondary"
                        leftIcon={Plus}
                        fullWidth
                      >
                        Add Another Key
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {!config.requiresKey && (
                <div className="local-provider-info">
                  <p>No API key required. Make sure {config.name} is running.</p>
                  <Button onClick={debouncedCheckHealth} variant="secondary" leftIcon={RefreshCw}>
                    Check Connection
                  </Button>
                </div>
              )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default APISettings;

