import { useState } from 'react';
import { AlertTriangle, TestTube } from 'lucide-react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import '../../../../styles/CryptoLab.css';

function TradingModeToggle() {
  const { tradingMode, setTradingMode } = useCryptoStore();
  const [showWarning, setShowWarning] = useState(false);

  const handleModeChange = (newMode: 'paper' | 'live') => {
    if (newMode === 'live' && tradingMode === 'paper') {
      setShowWarning(true);
    } else {
      setTradingMode(newMode);
    }
  };

  const confirmLiveMode = () => {
    setTradingMode('live');
    setShowWarning(false);
  };

  return (
    <>
      <div className="trading-mode-toggle">
        <div className={`mode-indicator ${tradingMode === 'paper' ? 'paper' : 'live'}`}>
          {tradingMode === 'paper' ? (
            <>
              <TestTube size={14} />
              <span>Paper Trading</span>
            </>
          ) : (
            <>
              <AlertTriangle size={14} />
              <span>LIVE TRADING</span>
            </>
          )}
        </div>
        <div className="mode-switch">
          <button
            className={`mode-btn ${tradingMode === 'paper' ? 'active' : ''}`}
            onClick={() => handleModeChange('paper')}
          >
            Paper
          </button>
          <button
            className={`mode-btn ${tradingMode === 'live' ? 'active' : ''}`}
            onClick={() => handleModeChange('live')}
          >
            Live
          </button>
        </div>
      </div>

      {showWarning && (
        <div className="mode-warning-modal">
          <div className="mode-warning-content">
            <div className="warning-header">
              <AlertTriangle size={24} className="warning-icon" />
              <h3>Switch to Live Trading?</h3>
            </div>
            <p>
              You are about to switch to <strong>LIVE TRADING</strong> mode. This will use real funds
              and execute real trades on your Coinbase account.
            </p>
            <p className="warning-subtext">
              Make sure you understand the risks and have proper risk management in place.
            </p>
            <div className="warning-actions">
              <button className="warning-btn cancel" onClick={() => setShowWarning(false)}>
                Cancel
              </button>
              <button className="warning-btn confirm" onClick={confirmLiveMode}>
                Switch to Live Trading
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TradingModeToggle;

