import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { accountAggregationService, type AggregationProvider, type Institution } from '@/services/wealth/accountAggregationService';
import { Search, RefreshCw, AlertCircle, CheckCircle2, Link2, X, ChevronRight, Loader2, Building2 } from 'lucide-react';
import SecureInputModal from '@/components/shared/SecureInputModal';
import { useDebounce } from '@/utils/hooks/useDebounce';
import { DEBOUNCE_DELAYS } from '@/utils/constants';
import '@/styles/WealthLab.css';

type ConnectionWizardStep = 'select-provider' | 'select-institution' | 'authenticate' | 'connecting' | 'complete' | null;

interface ConnectionWizardState {
  step: ConnectionWizardStep;
  provider: AggregationProvider | null;
  institution: Institution | null;
  connectionId: string | null;
  authUrl: string | null;
}

const AccountConnections = memo(function AccountConnections() {
  const { accountConnections, addAccountConnection, updateAccountConnection, refresh } = useWealthStore();
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
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(null);

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
    setWizardState((prev) => ({
      ...prev,
      step: 'select-institution',
      provider,
    }));
  }, []);

  const handleSelectInstitution = useCallback(async (institution: Institution) => {
    setWizardState((prev) => ({
      ...prev,
      step: 'authenticate',
      institution,
    }));

    try {
      const { authUrl, connectionId } = await accountAggregationService.initiateConnection(
        wizardState.provider!,
        institution.id,
        {
          provider: wizardState.provider!,
          institutionId: institution.id,
        }
      );

      setWizardState((prev) => ({
        ...prev,
        connectionId,
        authUrl,
      }));

      // Handle different provider authentication flows
      if (wizardState.provider === 'schwab') {
        setShowApiKeyModal(true);
      } else if (wizardState.provider === 'plaid' || wizardState.provider === 'yodlee') {
        // For Plaid/Yodlee, open auth URL in new window
        if (authUrl) {
          window.open(authUrl, '_blank', 'width=600,height=700');
        }
      } else if (wizardState.provider === 'manual') {
        // Manual accounts don't need authentication
        setWizardState((prev) => ({
          ...prev,
          step: 'complete',
        }));
      }
    } catch (error) {
      console.error('Failed to initiate connection:', error);
      alert(`Failed to start connection: ${(error as Error).message}`);
      setWizardState((prev) => ({
        ...prev,
        step: 'select-institution',
      }));
    }
  }, []);

  const handleApiKeyConfirm = useCallback(async (key: string) => {
    setShowApiKeyModal(false);
    // For Schwab, we need both key and secret
    // In a real implementation, this would be handled via OAuth callback
    // For now, we'll simulate completion
    if (wizardState.connectionId && wizardState.institution) {
      try {
        await accountAggregationService.completeConnection(wizardState.connectionId, key);
        const connection = accountAggregationService.getConnection(wizardState.connectionId);
        if (connection) {
          addAccountConnection({
            institution: wizardState.institution.name,
            provider: wizardState.provider!,
            status: 'connected',
            lastSynced: new Date(),
            accountIds: [],
          });
          refresh();
          setWizardState({
            step: null,
            provider: null,
            institution: null,
            connectionId: null,
            authUrl: null,
          });
        }
      } catch (error) {
        console.error('Failed to complete connection:', error);
        alert(`Failed to complete connection: ${(error as Error).message}`);
      }
    }
  }, [wizardState, addAccountConnection, refresh]);

  const handleSyncConnection = useCallback(async (connectionId: string) => {
    setSyncingConnectionId(connectionId);
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
        alert(`Sync complete: ${result.accountsAdded} added, ${result.accountsUpdated} updated, ${result.transactionsImported} transactions imported`);
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
      alert(`Sync failed: ${(error as Error).message}`);
    } finally {
      setSyncingConnectionId(null);
    }
  }, [updateAccountConnection, refresh]);

  const handleCloseWizard = useCallback(() => {
    setWizardState({
      step: 'select-provider',
      provider: null,
      institution: null,
      connectionId: null,
      authUrl: null,
    });
    setSearchQuery('');
  }, []);

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
          handleCloseWizard();
        }}
        onConfirm={handleApiKeyConfirm}
        title={`${wizardState.institution?.name || 'Account'} API Configuration`}
        label="Enter API Key"
        placeholder="API Key"
      />
    </div>
  );
});

export default AccountConnections;
