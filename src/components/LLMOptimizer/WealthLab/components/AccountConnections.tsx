import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { shallow } from 'zustand/shallow';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { accountAggregationService, type AggregationProvider, type Institution } from '@/services/wealth/accountAggregationService';
import { Search, RefreshCw, AlertCircle, CheckCircle2, Link2, X, ChevronRight, Loader2, Building2 } from 'lucide-react';
import SecureInputModal from '@/components/shared/SecureInputModal';
import { useDebounce } from '@/utils/hooks/useDebounce';
import { DEBOUNCE_DELAYS } from '@/utils/constants';
import { useToast } from '@/components/ui';
import '@/styles/WealthLab.css';

type ConnectionWizardStep = 'select-provider' | 'select-institution' | 'authenticate' | 'connecting' | 'complete' | 'manual-form' | null;

interface ConnectionWizardState {
  step: ConnectionWizardStep;
  provider: AggregationProvider | null;
  institution: Institution | null;
  connectionId: string | null;
  authUrl: string | null;
}

const AccountConnections = memo(function AccountConnections() {
  const { accountConnections, addAccountConnection, updateAccountConnection, refresh } = useWealthStore(
    state => ({
      accountConnections: state.accountConnections,
      addAccountConnection: state.addAccountConnection,
      updateAccountConnection: state.updateAccountConnection,
      refresh: state.refresh,
    }),
    shallow
  );
  const { showToast } = useToast();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingInstitutions, setIsLoadingInstitutions] = useState(false);
  const [wizardState, setWizardState] = useState<ConnectionWizardState>({
    step: null,
    provider: null,
    institution: null,
    connectionId: null,
    authUrl: null,
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isCollectingSecret, setIsCollectingSecret] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(null);
  const [manualAccountName, setManualAccountName] = useState('');
  const [manualInstitutionName, setManualInstitutionName] = useState('');
  const [isSavingManual, setIsSavingManual] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, DEBOUNCE_DELAYS.SEARCH_INPUT);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = useCallback(async () => {
    setIsLoadingInstitutions(true);
    try {
      const insts = await accountAggregationService.getSupportedInstitutions();
      setInstitutions(insts);
    } catch (error) {
      console.error('Failed to load institutions:', error);
    } finally {
      setIsLoadingInstitutions(false);
    }
  }, []);

  const filteredInstitutions = useMemo(() => {
    if (!debouncedSearch) return institutions;
    const query = debouncedSearch.toLowerCase();
    return institutions.filter(
      (inst) =>
        inst.name.toLowerCase().includes(query) ||
        inst.supportedProviders.some(p => p.toLowerCase().includes(query))
    );
  }, [institutions, debouncedSearch]);

  const handleStartConnection = useCallback(() => {
    setWizardState({
      step: 'select-provider',
      provider: null,
      institution: null,
      connectionId: null,
      authUrl: null,
    });
  }, []);

  const handleSelectProvider = useCallback((provider: AggregationProvider) => {
    // For manual provider, skip institution selection and go directly to manual form
    if (provider === 'manual') {
      setWizardState((prev) => ({
        ...prev,
        step: 'manual-form',
        provider,
        institution: null, // Manual accounts don't need an institution
      }));
    } else {
      setWizardState((prev) => ({
        ...prev,
        step: 'select-institution',
        provider,
      }));
    }
  }, []);

  const handleSelectInstitution = useCallback(async (institution: Institution) => {
    // Validate provider is set
    if (!wizardState.provider) {
      showToast({
        variant: 'error',
        title: 'Provider required',
        message: 'Please select a provider first',
      });
      setWizardState((prev) => ({
        ...prev,
        step: 'select-provider',
      }));
      return;
    }

    // Manual provider should never reach here (skips institution selection)
    if (wizardState.provider === 'manual') {
      console.warn('Manual provider should not reach institution selection');
      return;
    }

    // Validate institution supports the selected provider
    if (!institution.supportedProviders.includes(wizardState.provider)) {
      showToast({
        variant: 'error',
        title: 'Provider not supported',
        message: `${institution.name} does not support ${wizardState.provider}. Supported providers: ${institution.supportedProviders.join(', ')}`,
      });
      setWizardState((prev) => ({
        ...prev,
        step: 'select-institution',
      }));
      return;
    }

    // For Schwab, we need to collect API key and secret before initiating connection
    if (wizardState.provider === 'schwab') {
      setWizardState((prev) => ({
        ...prev,
        step: 'authenticate',
        institution,
      }));
      // Show API key modal first
      setIsCollectingSecret(false);
      setApiKey('');
      setShowApiKeyModal(true);
      return;
    }

    // For other providers, proceed with normal OAuth flow
    setWizardState((prev) => ({
      ...prev,
      step: 'authenticate',
      institution,
    }));

    try {
      const { authUrl, connectionId } = await accountAggregationService.initiateConnection(
        wizardState.provider,
        institution.id,
        {
          provider: wizardState.provider,
          institutionId: institution.id,
        }
      );

      setWizardState((prev) => ({
        ...prev,
        connectionId,
        authUrl,
      }));

      // Handle different provider authentication flows
      if (wizardState.provider === 'plaid' || wizardState.provider === 'yodlee') {
        // For Plaid/Yodlee, open auth URL in new window
        if (authUrl) {
          window.open(authUrl, '_blank', 'width=600,height=700');
        }
      }
    } catch (error) {
      console.error('Failed to initiate connection:', error);
      showToast({
        variant: 'error',
        title: 'Connection failed',
        message: `Failed to start connection: ${(error as Error).message}`,
      });
      setWizardState((prev) => ({
        ...prev,
        step: 'select-institution',
      }));
    }
  }, [wizardState.provider, showToast]);

  const handleCloseWizard = useCallback(() => {
    setWizardState({
      step: null,
      provider: null,
      institution: null,
      connectionId: null,
      authUrl: null,
    });
    setSearchQuery('');
    setShowApiKeyModal(false);
    setIsCollectingSecret(false);
    setApiKey('');
    setManualAccountName('');
    setManualInstitutionName('');
  }, []);

  const handleApiKeyConfirm = useCallback(async (value: string) => {
    // If we're collecting the secret (second step), initiate connection with both credentials
    if (isCollectingSecret) {
      const secret = value;
      setShowApiKeyModal(false);
      setIsCollectingSecret(false);

      if (!wizardState.institution || !wizardState.provider) {
        showToast({
          variant: 'error',
          title: 'Missing information',
          message: 'Missing connection information',
        });
        handleCloseWizard();
        return;
      }

      try {
        // Now initiate connection with both API key and secret
        setWizardState((prev) => ({
          ...prev,
          step: 'connecting',
        }));

        const { authUrl, connectionId } = await accountAggregationService.initiateConnection(
          wizardState.provider,
          wizardState.institution.id,
          {
            provider: wizardState.provider,
            institutionId: wizardState.institution.id,
            apiKey: apiKey,
            apiSecret: secret,
            redirectUri: window.location.origin,
          }
        );

        setWizardState((prev) => ({
          ...prev,
          connectionId,
          authUrl,
          step: 'authenticate',
        }));

        // For Schwab, if we got an auth URL, open it for OAuth
        if (authUrl && wizardState.provider === 'schwab') {
          window.open(authUrl, '_blank', 'width=600,height=700');
          // In a real implementation, we'd wait for OAuth callback
          // For now, simulate successful connection after a delay
          setTimeout(async () => {
            try {
              // Simulate OAuth callback with auth code
              // In production, this would come from OAuth redirect
              const mockAuthCode = 'mock_auth_code_' + Date.now();
              await accountAggregationService.completeConnection(connectionId, mockAuthCode);
              const connection = accountAggregationService.getConnection(connectionId);
              if (connection) {
                addAccountConnection({
                  institution: wizardState.institution!.name,
                  provider: wizardState.provider!,
                  status: 'connected',
                  lastSynced: new Date(),
                  accountIds: [],
                });
                refresh();
                setWizardState({
                  step: 'complete',
                  provider: null,
                  institution: null,
                  connectionId: null,
                  authUrl: null,
                });
              }
            } catch (error) {
              console.error('Failed to complete connection:', error);
              showToast({
                variant: 'error',
                title: 'Connection failed',
                message: `Failed to complete connection: ${(error as Error).message}`,
              });
              setWizardState((prev) => ({
                ...prev,
                step: 'authenticate',
              }));
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to initiate Schwab connection:', error);
        showToast({
          variant: 'error',
          title: 'Connection failed',
          message: `Failed to start connection: ${(error as Error).message}`,
        });
        setWizardState((prev) => ({
          ...prev,
          step: 'authenticate',
        }));
      } finally {
        setApiKey('');
      }
    } else {
      // First step: collect API key, then transition to secret collection
      setApiKey(value);
      // Close and immediately reopen modal for secret collection
      setShowApiKeyModal(false);
      setIsCollectingSecret(true);
      // Use setTimeout to ensure modal closes before reopening
      setTimeout(() => {
        setShowApiKeyModal(true);
      }, 100);
    }
  }, [isCollectingSecret, wizardState, apiKey, addAccountConnection, refresh, handleCloseWizard]);

  const handleSaveManualAccount = useCallback(async () => {
    if (!manualAccountName.trim() || !manualInstitutionName.trim()) {
      showToast({
        variant: 'error',
        title: 'Missing information',
        message: 'Please enter both account name and institution name',
      });
      return;
    }

    setIsSavingManual(true);
    try {
      // Create manual connection directly without calling initiateConnection
      // The store will generate the ID automatically
      addAccountConnection({
        institution: manualInstitutionName.trim(),
        provider: 'manual',
        status: 'connected',
        lastSynced: new Date(),
        accountIds: [],
      });

      refresh();
      
      showToast({
        variant: 'success',
        title: 'Account added',
        message: `Manual account "${manualAccountName}" has been added successfully`,
      });

      setWizardState({
        step: 'complete',
        provider: null,
        institution: null,
        connectionId: null,
        authUrl: null,
      });

      // Reset form
      setManualAccountName('');
      setManualInstitutionName('');
    } catch (error) {
      console.error('Failed to save manual account:', error);
      showToast({
        variant: 'error',
        title: 'Failed to add account',
        message: `Failed to add manual account: ${(error as Error).message}`,
      });
    } finally {
      setIsSavingManual(false);
    }
  }, [manualAccountName, manualInstitutionName, addAccountConnection, refresh, showToast]);

  const handleSyncConnection = useCallback(async (connectionId: string) => {
    try {
      const result = await accountAggregationService.syncAccounts(connectionId);
      const connection = accountAggregationService.getConnection(connectionId);
      if (connection) {
        updateAccountConnection(connectionId, {
          status: connection.status,
          lastSynced: connection.lastSynced,
          accountIds: connection.accountIds,
        });
        refresh();
        showToast({
          variant: 'success',
          title: 'Sync complete',
          message: `${result.accountsAdded} added, ${result.accountsUpdated} updated, ${result.transactionsImported} transactions imported`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Failed to sync connection:', error);
      const connection = accountAggregationService.getConnection(connectionId);
      if (connection) {
        updateAccountConnection(connectionId, {
          status: 'error',
          errorMessage: (error as Error).message,
        });
      }
      showToast({
        variant: 'error',
        title: 'Sync failed',
        message: `Sync failed: ${(error as Error).message}`,
      });
    } finally {
      setSyncingConnectionId(null);
    }
  }, [updateAccountConnection, refresh, showToast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 size={16} className="status-icon connected" />;
      case 'error':
        return <AlertCircle size={16} className="status-icon error" />;
      case 'syncing':
        return <RefreshCw size={16} className="status-icon syncing spinning" />;
      default:
        return null;
    }
  };


  return (
    <div className="account-connections">
      <div className="account-connections-header">
        <h3>Account Connections</h3>
        <div className="header-actions">
          <button className="account-refresh-btn" onClick={refresh} title="Refresh All">
            <RefreshCw size={16} />
          </button>
          <button className="connection-wizard-btn" onClick={handleStartConnection}>
            <Link2 size={16} />
            <span>Connect Account</span>
          </button>
        </div>
      </div>

      {/* Connection Wizard */}
      {wizardState.step !== null && (
        <div className="connection-wizard">
          <div className="wizard-header">
            <h4>Connect Account</h4>
            <button className="wizard-close-btn" onClick={handleCloseWizard}>
              <X size={18} />
            </button>
          </div>

          {/* Step Indicator */}
          <div className="wizard-steps">
            <div className={`wizard-step ${wizardState.step === 'select-provider' ? 'active' : wizardState.provider ? 'completed' : ''}`}>
              <span className="step-number">1</span>
              <span className="step-label">Provider</span>
            </div>
            <ChevronRight size={16} className="step-arrow" />
            <div className={`wizard-step ${wizardState.step === 'select-institution' ? 'active' : wizardState.institution ? 'completed' : ''}`}>
              <span className="step-number">2</span>
              <span className="step-label">Institution</span>
            </div>
            <ChevronRight size={16} className="step-arrow" />
            <div className={`wizard-step ${wizardState.step === 'authenticate' || wizardState.step === 'connecting' ? 'active' : wizardState.step === 'complete' ? 'completed' : ''}`}>
              <span className="step-number">3</span>
              <span className="step-label">Connect</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="wizard-content">
            {wizardState.step === 'select-provider' && (
              <div className="wizard-provider-selection">
                <h5>Select Connection Method</h5>
                <div className="provider-grid">
                  <button
                    className="provider-card"
                    onClick={() => handleSelectProvider('plaid')}
                  >
                    <span className="provider-icon">🔗</span>
                    <span className="provider-name">Plaid</span>
                    <span className="provider-description">Connect via Plaid Link</span>
                  </button>
                  <button
                    className="provider-card"
                    onClick={() => handleSelectProvider('yodlee')}
                  >
                    <span className="provider-icon">🔐</span>
                    <span className="provider-name">Yodlee</span>
                    <span className="provider-description">Connect via Yodlee FastLink</span>
                  </button>
                  <button
                    className="provider-card"
                    onClick={() => handleSelectProvider('schwab')}
                  >
                    <span className="provider-icon">📊</span>
                    <span className="provider-name">Schwab</span>
                    <span className="provider-description">Direct API connection</span>
                  </button>
                  <button
                    className="provider-card"
                    onClick={() => handleSelectProvider('manual')}
                  >
                    <span className="provider-icon">✏️</span>
                    <span className="provider-name">Manual</span>
                    <span className="provider-description">Add account manually</span>
                  </button>
                </div>
              </div>
            )}

            {wizardState.step === 'select-institution' && (
              <div className="wizard-institution-selection">
                <h5>Select Institution</h5>
                <div className="institution-search">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search institutions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="institution-search-input"
                  />
                </div>
                {isLoadingInstitutions ? (
                  <div className="loading-institutions">
                    <Loader2 size={24} className="spinning" />
                    <span>Loading institutions...</span>
                  </div>
                ) : (
                  <div className="institution-list">
                    {filteredInstitutions
                      .filter((inst) => inst.supportedProviders.includes(wizardState.provider!))
                      .map((inst) => (
                        <button
                          key={inst.id}
                          className="institution-card"
                          onClick={() => handleSelectInstitution(inst)}
                        >
                          {inst.logo ? (
                            <img src={inst.logo} alt={inst.name} className="institution-logo" />
                          ) : (
                            <Building2 size={24} className="institution-icon" />
                          )}
                          <div className="institution-info">
                            <span className="institution-name">{inst.name}</span>
                            <span className="institution-provider">{inst.supportedProviders.join(', ')}</span>
                          </div>
                          <ChevronRight size={16} className="institution-arrow" />
                        </button>
                      ))}
                    {filteredInstitutions.filter((inst) => inst.supportedProviders.includes(wizardState.provider!)).length === 0 && (
                      <div className="no-institutions">
                        <p>No institutions found</p>
                        <p className="empty-hint">Try adjusting your search</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {wizardState.step === 'manual-form' && (
              <div className="wizard-manual-form">
                <h5>Add Manual Account</h5>
                <p className="manual-form-description">
                  Enter the details for your account. This account will be tracked manually and won't sync automatically.
                </p>
                <div className="manual-form-fields">
                  <div className="form-field">
                    <label htmlFor="manual-institution">Institution Name *</label>
                    <input
                      id="manual-institution"
                      type="text"
                      value={manualInstitutionName}
                      onChange={(e) => setManualInstitutionName(e.target.value)}
                      placeholder="e.g., Bank of America, Chase, etc."
                      className="manual-form-input"
                      disabled={isSavingManual}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="manual-account">Account Name *</label>
                    <input
                      id="manual-account"
                      type="text"
                      value={manualAccountName}
                      onChange={(e) => setManualAccountName(e.target.value)}
                      placeholder="e.g., Checking Account, Savings Account, etc."
                      className="manual-form-input"
                      disabled={isSavingManual}
                    />
                  </div>
                </div>
                <div className="manual-form-actions">
                  <button
                    className="manual-form-cancel-btn"
                    onClick={handleCloseWizard}
                    disabled={isSavingManual}
                  >
                    Cancel
                  </button>
                  <button
                    className="manual-form-save-btn"
                    onClick={handleSaveManualAccount}
                    disabled={isSavingManual || !manualAccountName.trim() || !manualInstitutionName.trim()}
                  >
                    {isSavingManual ? (
                      <>
                        <Loader2 size={16} className="spinning" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Add Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {wizardState.step === 'authenticate' && wizardState.institution && (
              <div className="wizard-authenticate">
                <h5>Connecting to {wizardState.institution.name}</h5>
                <p>Please complete the authentication process...</p>
                {wizardState.authUrl && wizardState.provider !== 'schwab' && (
                  <div className="auth-instructions">
                    <p>A new window should open for authentication.</p>
                    <p>If it doesn't, <a href={wizardState.authUrl} target="_blank" rel="noopener noreferrer">click here</a>.</p>
                  </div>
                )}
              </div>
            )}

            {wizardState.step === 'connecting' && (
              <div className="wizard-connecting">
                <Loader2 size={32} className="spinning" />
                <p>Connecting your account...</p>
              </div>
            )}

            {wizardState.step === 'complete' && (
              <div className="wizard-complete">
                <CheckCircle2 size={48} className="status-icon connected" />
                <h5>Connection Successful!</h5>
                <p>Your account has been connected successfully.</p>
                <button className="wizard-finish-btn" onClick={handleCloseWizard}>
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connections List */}
      <div className="account-connections-list">
        {accountConnections.map((conn) => (
          <div key={conn.id} className="account-connection-item">
            <div className="connection-main">
              <div className="connection-info">
                {getStatusIcon(conn.status)}
                <div className="connection-details">
                  <div className="connection-institution">{conn.institution}</div>
                  <div className="connection-provider">{conn.provider}</div>
                  {conn.accountIds && conn.accountIds.length > 0 && (
                    <div className="connection-account-count">
                      {conn.accountIds.length} account{conn.accountIds.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              <div className="connection-status">
                <span className={`status-badge ${conn.status}`}>{conn.status}</span>
                {conn.lastSynced && (
                  <span className="connection-synced">
                    Synced {conn.lastSynced.toLocaleDateString()} {conn.lastSynced.toLocaleTimeString()}
                  </span>
                )}
                <div className="connection-actions">
                  <button
                    className="sync-btn"
                    onClick={() => handleSyncConnection(conn.id)}
                    disabled={syncingConnectionId === conn.id || conn.status === 'syncing'}
                    title="Sync Now"
                  >
                    {syncingConnectionId === conn.id ? (
                      <Loader2 size={14} className="spinning" />
                    ) : (
                      <RefreshCw size={14} />
                    )}
                    <span>Sync</span>
                  </button>
                </div>
              </div>
            </div>
            {conn.errorMessage && (
              <div className="connection-error">
                <AlertCircle size={14} />
                <span>{conn.errorMessage}</span>
              </div>
            )}
            {conn.status === 'syncing' && (
              <div className="sync-progress">
                <div className="sync-progress-bar">
                  <div className="sync-progress-fill" />
                </div>
                <span className="sync-progress-text">Syncing accounts...</span>
              </div>
            )}
          </div>
        ))}

        {accountConnections.length === 0 && (wizardState.step === 'select-provider' || wizardState.step === null) && (
          <div className="account-connections-empty">
            <Building2 size={48} className="empty-icon" />
            <p>No accounts connected</p>
            <p className="empty-hint">Connect your accounts to automatically sync data</p>
            <button className="empty-connect-btn" onClick={handleStartConnection}>
              <Link2 size={16} />
              <span>Connect Your First Account</span>
            </button>
          </div>
        )}
      </div>

      {/* Secure input modal for API credentials */}
      <SecureInputModal
        isOpen={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false);
          setIsCollectingSecret(false);
          setApiKey('');
          if (!isCollectingSecret) {
            handleCloseWizard();
          } else {
            // If closing secret modal, go back to key collection
            setIsCollectingSecret(false);
            setShowApiKeyModal(true);
          }
        }}
        onConfirm={handleApiKeyConfirm}
        title={`${wizardState.institution?.name || 'Account'} API Configuration`}
        label={isCollectingSecret ? 'Enter API Secret' : 'Enter API Key'}
        placeholder={isCollectingSecret ? 'API Secret' : 'API Key'}
      />
    </div>
  );
});

export default AccountConnections;
