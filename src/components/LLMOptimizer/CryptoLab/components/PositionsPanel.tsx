import { useEffect, useState, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import { coinbaseService } from '@/services/crypto/coinbaseService';
import { trackCryptoWithdrawal } from '@/services/crypto/cryptoWithdrawalService';
import '../../../../styles/CryptoLab.css';

interface PositionsPanelProps {
  productId?: string;
}

function PositionsPanel({ productId }: PositionsPanelProps) {
  const { positions, accounts, portfolio, loadPositions, loadAccounts } = useCryptoStore();
  const [closingPositionId, setClosingPositionId] = useState<string | null>(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalSource, setWithdrawalSource] = useState<'trading' | 'staking'>('trading');
  const [isRecordingWithdrawal, setIsRecordingWithdrawal] = useState(false);

  useEffect(() => {
    if (coinbaseService.isConfigured()) {
      loadPositions();
      loadAccounts();
      // Refresh positions every 3 seconds
      const interval = setInterval(() => {
        loadPositions();
        loadAccounts();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loadPositions, loadAccounts, productId]);

  const handleClosePosition = async (_positionId: string, _productId: string) => {
    if (!confirm('Are you sure you want to close this position?')) {
      return;
    }

    setClosingPositionId(_positionId);
    try {
      // Close position by placing opposite order
      // This is a simplified implementation - actual implementation would need position details
      alert('Position close functionality requires position details. This will be implemented with order placement.');
      setClosingPositionId(null);
    } catch (error) {
      console.error('Failed to close position:', error);
      alert('Failed to close position. Please try again.');
      setClosingPositionId(null);
    }
  };

  const formatPrice = (price: string): string => {
    return parseFloat(price).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatSize = (size: string): string => {
    const num = parseFloat(size);
    if (num >= 1) return num.toFixed(4);
    if (num >= 0.1) return num.toFixed(5);
    return num.toFixed(6);
  };

  // Get spot holdings from accounts
  const spotHoldings = accounts
    .filter((acc) => acc.type === 'SPOT')
    .filter((acc) => {
      const balance = parseFloat(acc.available_balance.value);
      return balance > 0.0001; // Filter out dust
    })
    .map((acc) => ({
      productId: acc.available_balance.currency,
      size: acc.available_balance.value,
      type: 'SPOT' as const,
    }));

  const filteredPositions = positions.filter((pos) => {
    if (productId) {
      return pos.product_id === productId;
    }
    return true;
  });

  const totalPnL = positions.reduce((sum, pos) => {
    return sum + parseFloat(pos.unrealized_pnl || '0');
  }, 0);

  // Calculate realized profit from portfolio (simplified - in production, track this separately)
  const realizedProfit = portfolio?.totalPnL && portfolio.totalPnL > 0 ? portfolio.totalPnL : 0;

  const handleRecordWithdrawal = useCallback(async () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid withdrawal amount');
      return;
    }

    setIsRecordingWithdrawal(true);
    try {
      await trackCryptoWithdrawal(amount, withdrawalSource, new Date(), undefined, 'Coinbase');
      alert(`Withdrawal of $${amount.toFixed(2)} recorded in Revenue & Monetization tab`);
      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
    } catch (error) {
      console.error('Failed to record withdrawal:', error);
      alert('Failed to record withdrawal. Please try again.');
    } finally {
      setIsRecordingWithdrawal(false);
    }
  }, [withdrawalAmount, withdrawalSource]);

  if (!coinbaseService.isConfigured()) {
    return (
      <div className="positions-panel">
        <div className="panel-empty">
          <p>Coinbase API not configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="positions-panel">
      <div className="panel-header">
        <h3>Positions</h3>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {totalPnL !== 0 && (
            <div className={`total-pnl ${totalPnL >= 0 ? 'positive' : 'negative'}`}>
              {totalPnL >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>${formatPrice(Math.abs(totalPnL).toString())}</span>
            </div>
          )}
          {realizedProfit > 0 && (
            <button
              className="record-withdrawal-btn"
              onClick={() => setShowWithdrawalModal(true)}
              title="Record withdrawal to Revenue & Monetization"
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--violet-500)',
                border: 'none',
                borderRadius: '0.375rem',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              <DollarSign size={14} />
              <span>Record Withdrawal</span>
            </button>
          )}
        </div>
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawalModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowWithdrawalModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              padding: '2rem',
              borderRadius: '0.75rem',
              border: '1px solid var(--panel-border)',
              minWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Record Crypto Withdrawal</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              This will record the withdrawal as business income in the Revenue & Monetization tab.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Amount (USD)</label>
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Source</label>
                <select
                  value={withdrawalSource}
                  onChange={(e) => setWithdrawalSource(e.target.value as 'trading' | 'staking')}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="trading">Trading Profits</option>
                  <option value="staking">Staking Rewards</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowWithdrawalModal(false)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'transparent',
                    border: '1px solid var(--panel-border)',
                    borderRadius: '0.375rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordWithdrawal}
                  disabled={isRecordingWithdrawal || !withdrawalAmount}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--violet-500)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    color: 'white',
                    cursor: isRecordingWithdrawal || !withdrawalAmount ? 'not-allowed' : 'pointer',
                    opacity: isRecordingWithdrawal || !withdrawalAmount ? 0.5 : 1,
                  }}
                >
                  {isRecordingWithdrawal ? 'Recording...' : 'Record Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Futures Positions */}
      {filteredPositions.length > 0 && (
        <div className="positions-section">
          <div className="section-title">Futures Positions</div>
          <div className="positions-list">
            {filteredPositions.map((position) => {
              const pnl = parseFloat(position.unrealized_pnl || '0');
              const pnlPercentage = position.entry_price && position.mark_price
                ? ((parseFloat(position.mark_price) - parseFloat(position.entry_price)) / parseFloat(position.entry_price)) * 100
                : 0;
              const isLong = parseFloat(position.size || '0') > 0;

              return (
                <div key={position.product_id} className="position-card">
                  <div className="position-header">
                    <div className="position-pair">
                      <span className="pair-name">{position.product_id}</span>
                      <span className={`position-side ${isLong ? 'long' : 'short'}`}>
                        {isLong ? 'LONG' : 'SHORT'}
                      </span>
                    </div>
                    <button
                      className="close-position-btn"
                      onClick={() => handleClosePosition(position.product_id, position.product_id)}
                      disabled={closingPositionId === position.product_id}
                      title="Close position"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="position-details">
                    <div className="detail-row">
                      <span className="detail-label">Size</span>
                      <span className="detail-value">{formatSize(Math.abs(parseFloat(position.size || '0')).toString())}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Entry Price</span>
                      <span className="detail-value">${formatPrice(position.entry_price || '0')}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Mark Price</span>
                      <span className="detail-value">${formatPrice(position.mark_price || '0')}</span>
                    </div>
                    <div className="detail-row pnl-row">
                      <span className="detail-label">Unrealized P&L</span>
                      <span className={`detail-value pnl ${pnl >= 0 ? 'positive' : 'negative'}`}>
                        {pnl >= 0 ? '+' : ''}${formatPrice(pnl.toString())} ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(2)}%)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Spot Holdings */}
      {spotHoldings.length > 0 && (
        <div className="positions-section">
          <div className="section-title">Spot Holdings</div>
          <div className="positions-list">
            {spotHoldings.map((holding, idx) => (
              <div key={`${holding.productId}-${idx}`} className="position-card spot">
                <div className="position-header">
                  <div className="position-pair">
                    <span className="pair-name">{holding.productId}</span>
                    <span className="position-side spot">SPOT</span>
                  </div>
                </div>
                <div className="position-details">
                  <div className="detail-row">
                    <span className="detail-label">Balance</span>
                    <span className="detail-value">{formatSize(holding.size)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredPositions.length === 0 && spotHoldings.length === 0 && (
        <div className="panel-empty">No open positions</div>
      )}
    </div>
  );
}

export default PositionsPanel;

