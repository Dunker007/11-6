import { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import { useAPIKeyStore } from '../../services/apiKeys/apiKeyStore';
import { useDebouncedCallback } from '@/utils/hooks/useDebounce';
import { Crown, Zap } from 'lucide-react';
import '../../styles/LLMStatus.css';

const LLMStatus = memo(function LLMStatus() {
  const models = useLLMStore((state) => state.models);
  const availableProviders = useLLMStore((state) => state.availableProviders);
  const isLoading = useLLMStore((state) => state.isLoading);
  const discoverProviders = useLLMStore((state) => state.discoverProviders);
  const { keys } = useAPIKeyStore();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Get Gemini key tier
  const geminiKey = useMemo(() => {
    return keys.find(k => k.provider === 'gemini' && k.isValid);
  }, [keys]);

  const geminiTier = geminiKey?.metadata?.tier as 'free' | 'pro' | 'unknown' | undefined;

  useEffect(() => {
    // Initial load - use cache if available
    discoverProviders(false);
    const interval = setInterval(() => {
      // Periodic checks - use cache when available (respects 30s cache TTL)
      discoverProviders(false);
      setLastChecked(new Date());
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Zustand actions are stable, don't need to be in deps

  const handleRefreshInternal = useCallback(async () => {
    // Manual refresh - force fresh checks
    await discoverProviders(true);
    setLastChecked(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Zustand actions are stable, don't need to be in deps

  // Debounce manual refresh button clicks (500ms delay)
  const handleRefresh = useDebouncedCallback(handleRefreshInternal, 500);

  // Memoize model filtering to avoid recalculating on every render
  const modelGroups = useMemo(() => ({
    lmStudio: models.filter((m) => m.provider === 'lmstudio'),
    ollama: models.filter((m) => m.provider === 'ollama'),
    gemini: models.filter((m) => m.provider === 'gemini'),
    notebookLM: models.filter((m) => m.provider === 'notebooklm'),
  }), [models]);

  // Memoize provider status checks
  const providerStatus = useMemo(() => ({
    lmstudio: availableProviders.includes('lmstudio'),
    ollama: availableProviders.includes('ollama'),
    gemini: availableProviders.includes('gemini'),
    notebooklm: availableProviders.includes('notebooklm'),
  }), [availableProviders]);

  return (
    <div className="llm-status">
      <div className="status-header">
        <h3>LLM Status</h3>
        <button onClick={handleRefresh} className="refresh-button" disabled={isLoading}>
          {isLoading ? '🔄' : '↻'} Refresh
        </button>
      </div>

      <div className="providers-status">
        {/* Local Providers */}
        <div className="provider-category">
          <div className="category-label">🖥️ Local</div>
          
          <div className="provider-status">
            <div className="provider-header">
              <span className="provider-name">LM Studio</span>
              <span className={`status-indicator ${providerStatus.lmstudio ? 'online' : 'offline'}`}>
                {providerStatus.lmstudio ? '● Online' : '○ Offline'}
              </span>
            </div>
            {providerStatus.lmstudio ? (
              <div className="models-list">
                {modelGroups.lmStudio.length > 0 ? (
                  modelGroups.lmStudio.map((model) => (
                    <div key={model.id} className="model-item">
                      <span className="model-name">{model.name}</span>
                      {model.size && <span className="model-size">{model.size}</span>}
                    </div>
                  ))
                ) : (
                  <span className="no-models">No models found</span>
                )}
              </div>
            ) : (
              <p className="offline-message">Make sure LM Studio is running on localhost:1234</p>
            )}
          </div>

          <div className="provider-status">
            <div className="provider-header">
              <span className="provider-name">Ollama</span>
              <span className={`status-indicator ${providerStatus.ollama ? 'online' : 'offline'}`}>
                {providerStatus.ollama ? '● Online' : '○ Offline'}
              </span>
            </div>
            {providerStatus.ollama ? (
              <div className="models-list">
                {modelGroups.ollama.length > 0 ? (
                  modelGroups.ollama.map((model) => (
                    <div key={model.id} className="model-item">
                      <span className="model-name">{model.name}</span>
                      {model.size && <span className="model-size">{model.size}</span>}
                    </div>
                  ))
                ) : (
                  <span className="no-models">No models found</span>
                )}
              </div>
            ) : (
              <p className="offline-message">Make sure Ollama is running on localhost:11434</p>
            )}
          </div>
        </div>

        {/* Cloud Providers */}
        <div className="provider-category">
          <div className="category-label">☁️ Cloud</div>
          
          <div className="provider-status">
            <div className="provider-header">
              <span className="provider-name">Google Gemini</span>
              <div className="provider-header-right">
                {geminiTier && geminiTier !== 'unknown' && (
                  <span className={`gemini-tier-badge gemini-tier-${geminiTier}`}>
                    {geminiTier === 'pro' ? (
                      <>
                        <Crown size={12} />
                        Pro
                      </>
                    ) : (
                      <>
                        <Zap size={12} />
                        Free
                      </>
                    )}
                  </span>
                )}
                <span className={`status-indicator ${providerStatus.gemini ? 'online' : 'offline'}`}>
                  {providerStatus.gemini ? '● Online' : '○ Offline'}
                </span>
              </div>
            </div>
            {providerStatus.gemini ? (
              <div className="models-list">
                {modelGroups.gemini.length > 0 ? (
                  <>
                    {geminiTier === 'free' && (
                      <div className="tier-notice">
                        <Zap size={14} />
                        <span>Free tier - Upgrade to Pro for access to advanced models</span>
                      </div>
                    )}
                    {modelGroups.gemini.map((model) => {
                      const isProOnly = model.id?.includes('gemini-1.5-pro') || 
                                       model.id?.includes('gemini-ultra') ||
                                       model.id?.includes('gemini-2.0');
                      const isAvailable = geminiTier === 'pro' || !isProOnly;
                      
                      return (
                        <div 
                          key={model.id} 
                          className={`model-item ${!isAvailable ? 'model-unavailable' : ''}`}
                        >
                          <span className="model-name">
                            {model.name}
                            {isProOnly && geminiTier !== 'pro' && (
                              <span className="pro-badge">Pro Only</span>
                            )}
                          </span>
                          {model.contextWindow && (
                            <span className="model-size">{model.contextWindow.toLocaleString()} tokens</span>
                          )}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <span className="no-models">Configure API key in settings</span>
                )}
              </div>
            ) : (
              <p className="offline-message">Configure Gemini API key in settings</p>
            )}
          </div>

          <div className="provider-status">
            <div className="provider-header">
              <span className="provider-name">NotebookLM</span>
              <span className={`status-indicator ${providerStatus.notebooklm ? 'online' : 'offline'}`}>
                {providerStatus.notebooklm ? '● Online' : '○ Offline'}
              </span>
            </div>
            {providerStatus.notebooklm ? (
              <div className="models-list">
                {modelGroups.notebookLM.length > 0 ? (
                  modelGroups.notebookLM.map((model) => (
                    <div key={model.id} className="model-item">
                      <span className="model-name">{model.name}</span>
                      {model.description && (
                        <span className="model-size">{model.description}</span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="no-models">Configure API key in settings</span>
                )}
              </div>
            ) : (
              <p className="offline-message">Configure NotebookLM API key in settings</p>
            )}
          </div>
        </div>
      </div>

      {lastChecked && (
        <div className="last-checked">
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
});

export default LLMStatus;

