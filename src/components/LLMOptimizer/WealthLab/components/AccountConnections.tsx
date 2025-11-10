import { useState, useCallback } from 'react';
import { useWealthStore } from '@/services/wealth/wealthStore';
import { schwabService } from '@/services/wealth/schwabService';
import { accountAggregationService } from '@/services/wealth/accountAggregationService';
import { Link2, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import SecureInputModal from '@/components/shared/SecureInputModal';

function AccountConnections() {
  const { accountConnections, addAccountConnection, updateAccountConnection, refresh } = useWealthStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionType, setConnectionType] = useState<'schwab' | 'plaid' | 'yodlee' | 'manual' | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showApiSecretModal, setShowApiSecretModal] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');

  const handleConnectSchwab = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (!schwabService.isConfigured()) {
        // Show secure API key input modal
        setShowApiKeyModal(true);
      } else {
        // Sync existing connection
        await schwabService.getAccounts();
        updateAccountConnection(accountConnections[0]?.id || '', {
          status: 'syncing',
        });
        refresh();
        updateAccountConnection(accountConnections[0]?.id || '', {
          status: 'connected',
          lastSynced: new Date(),
        });
      }
    } catch (error) {
      console.error('Failed to connect Schwab:', error);
      if (accountConnections.length > 0) {
        updateAccountConnection(accountConnections[0].id, {
          status: 'error',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [accountConnections, addAccountConnection, updateAccountConnection, refresh]);

  const handleApiKeyConfirm = useCallback(async (key: string) => {
    setApiKey(key);
    setShowApiKeyModal(false);
    setShowApiSecretModal(true);
  }, []);

  const handleApiSecretConfirm = useCallback(async (secret: string) => {
    setIsConnecting(true);
    try {
      if (apiKey && secret) {
        const authenticated = await schwabService.authenticate(apiKey, secret);
        if (authenticated) {
          const accounts = await schwabService.getAccounts();
          addAccountConnection({
            institution: 'Charles Schwab',
            provider: 'schwab',
            status: 'connected',
            lastSynced: new Date(),
            accountIds: accounts.map((acc) => acc.accountNumber),
          });
          refresh();
        }
      }
      setApiKey('');
      setShowApiSecretModal(false);
    } catch (error) {
      console.error('Failed to authenticate Schwab:', error);
      if (accountConnections.length > 0) {
        updateAccountConnection(accountConnections[0].id, {
          status: 'error',
          errorMessage: (error as Error).message,
        });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [apiKey, addAccountConnection, refresh, accountConnections, updateAccountConnection]);

  const handleConnectPlaid = useCallback(async () => {
    // Note: Plaid integration should use Plaid Link SDK in production
    // For now, this is a placeholder that would need secure input modals similar to Schwab
    alert('Plaid integration requires Plaid Link SDK. This feature is not yet implemented.');
  }, []);

  const handleManualAccount = useCallback(() => {
    setConnectionType('manual');
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
        <button className="account-refresh-btn" onClick={refresh} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="account-connections-list">
        {accountConnections.map((conn) => (
          <div key={conn.id} className="account-connection-item">
            <div className="connection-main">
              <div className="connection-info">
                {getStatusIcon(conn.status)}
                <div className="connection-details">
                  <div className="connection-institution">{conn.institution}</div>
                  <div className="connection-provider">{conn.provider}</div>
                </div>
              </div>
              <div className="connection-status">
                <span className={`status-badge ${conn.status}`}>{conn.status}</span>
                {conn.lastSynced && (
                  <span className="connection-synced">
                    Synced {conn.lastSynced.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {conn.errorMessage && (
              <div className="connection-error">{conn.errorMessage}</div>
            )}
          </div>
        ))}

        {accountConnections.length === 0 && (
          <div className="account-connections-empty">
            <p>No accounts connected</p>
            <p className="empty-hint">Connect your accounts to automatically sync data</p>
          </div>
        )}
      </div>

      <div className="account-connections-actions">
        <button
          className="connection-btn"
          onClick={handleConnectSchwab}
          disabled={isConnecting}
        >
          <Link2 size={16} />
          <span>Connect Schwab</span>
        </button>
        <button
          className="connection-btn"
          onClick={handleConnectPlaid}
          disabled={isConnecting}
        >
          <Link2 size={16} />
          <span>Connect via Plaid</span>
        </button>
        <button
          className="connection-btn"
          onClick={handleManualAccount}
          disabled={isConnecting}
        >
          <Link2 size={16} />
          <span>Add Manual Account</span>
        </button>
      </div>

      {connectionType === 'manual' && (
        <ManualAccountForm
          onSave={(account) => {
            // Add account via store
            useWealthStore.getState().addAccount({
              ...account,
              institution: 'Manual',
              isConnected: false,
            });
            setConnectionType(null);
          }}
          onCancel={() => setConnectionType(null)}
        />
      )}

      {/* Secure input modals for API credentials */}
      <SecureInputModal
        isOpen={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false);
          setIsConnecting(false);
        }}
        onConfirm={handleApiKeyConfirm}
        title="Schwab API Configuration"
        label="Enter Schwab API Key"
        placeholder="API Key"
      />
      <SecureInputModal
        isOpen={showApiSecretModal}
        onClose={() => {
          setShowApiSecretModal(false);
          setApiKey('');
          setIsConnecting(false);
        }}
        onConfirm={handleApiSecretConfirm}
        title="Schwab API Configuration"
        label="Enter Schwab API Secret"
        placeholder="API Secret"
      />
    </div>
  );
}

interface ManualAccountFormProps {
  onSave: (account: Omit<import('@/types/wealth').Account, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

function ManualAccountForm({ onSave, onCancel }: ManualAccountFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<import('@/types/wealth').AccountType>('checking');
  const [balance, setBalance] = useState('0');
  const [accountNumber, setAccountNumber] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        name,
        type,
        balance: parseFloat(balance) || 0,
        currency: 'USD',
        isConnected: false,
        accountNumber: accountNumber || undefined,
        institution: 'Manual',
      });
    },
    [name, type, balance, accountNumber, onSave]
  );

  return (
    <form className="manual-account-form" onSubmit={handleSubmit}>
      <h4>Add Manual Account</h4>
      <label>
        Account Name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label>
        Account Type
        <select value={type} onChange={(e) => setType(e.target.value as any)} required>
          <option value="checking">Checking</option>
          <option value="savings">Savings</option>
          <option value="investment">Investment</option>
          <option value="retirement">Retirement</option>
          <option value="credit_card">Credit Card</option>
          <option value="loan">Loan</option>
          <option value="mortgage">Mortgage</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>
        Balance ($)
        <input
          type="number"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          required
          step="0.01"
        />
      </label>
      <label>
        Account Number (Last 4 digits, optional)
        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          maxLength={4}
        />
      </label>
      <div className="manual-account-form-actions">
        <button type="submit">Add Account</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default AccountConnections;

