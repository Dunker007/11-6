/**
 * CryptoETFCenter.tsx
 *
 * PURPOSE:
 * Comprehensive cryptocurrency and ETF tracking center.
 * Provides portfolio management, real-time price updates, and performance analytics.
 *
 * FEATURES:
 * ✅ Crypto holdings tracking (10+ cryptocurrencies)
 * ✅ ETF holdings tracking (10+ ETFs)
 * ✅ Real-time price updates (simulated 30s intervals)
 * ✅ Portfolio value and P/L tracking
 * ✅ Add/remove holdings
 * ✅ Performance analytics
 * ✅ Category breakdowns
 */

import { memo, useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, X } from 'lucide-react';
import { cryptoETFService } from '@/services/wealth/cryptoETFService';
import type { CryptoHolding, ETFHolding, PortfolioSummary } from '@/services/wealth/cryptoETFService';
import { formatCurrency, formatPercent } from '@/utils/formatters';
import '@/styles/WealthLab.css';

const CryptoETFCenter = memo(function CryptoETFCenter() {
  const [cryptoHoldings, setCryptoHoldings] = useState<CryptoHolding[]>([]);
  const [etfHoldings, setETFHoldings] = useState<ETFHolding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'crypto' | 'etf' | 'summary'>('summary');
  const [showAddCrypto, setShowAddCrypto] = useState(false);
  const [showAddETF, setShowAddETF] = useState(false);

  // Add crypto form state
  const [cryptoSymbol, setCryptoSymbol] = useState('');
  const [cryptoQuantity, setCryptoQuantity] = useState('');
  const [cryptoCostBasis, setCryptoCostBasis] = useState('');

  // Add ETF form state
  const [etfSymbol, setETFSymbol] = useState('');
  const [etfShares, setETFShares] = useState('');
  const [etfCostBasis, setETFCostBasis] = useState('');

  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setCryptoHoldings(cryptoETFService.getCryptoHoldings());
    setETFHoldings(cryptoETFService.getETFHoldings());
    setSummary(cryptoETFService.getPortfolioSummary());
  };

  const handleAddCrypto = () => {
    try {
      cryptoETFService.addCryptoHolding(
        cryptoSymbol,
        parseFloat(cryptoQuantity),
        parseFloat(cryptoCostBasis)
      );
      loadData();
      setShowAddCrypto(false);
      setCryptoSymbol('');
      setCryptoQuantity('');
      setCryptoCostBasis('');
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleAddETF = () => {
    try {
      cryptoETFService.addETFHolding(
        etfSymbol,
        parseFloat(etfShares),
        parseFloat(etfCostBasis)
      );
      loadData();
      setShowAddETF(false);
      setETFSymbol('');
      setETFShares('');
      setETFCostBasis('');
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const handleDeleteCrypto = (id: string) => {
    if (confirm('Delete this crypto holding?')) {
      cryptoETFService.deleteCryptoHolding(id);
      loadData();
    }
  };

  const handleDeleteETF = (id: string) => {
    if (confirm('Delete this ETF holding?')) {
      cryptoETFService.deleteETFHolding(id);
      loadData();
    }
  };

  const availableCryptos = cryptoETFService.getAvailableCryptos();
  const availableETFs = cryptoETFService.getAvailableETFs();

  return (
    <div className="crypto-etf-center">
      <div className="wealth-lab-header">
        <h2>Crypto & ETF Center</h2>
        <div className="header-actions">
          <button className="refresh-btn" onClick={loadData} title="Refresh prices">
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      {summary && (
        <div className="portfolio-summary">
          <div className="summary-card primary">
            <div className="card-icon">
              <DollarSign size={24} />
            </div>
            <div className="card-content">
              <div className="card-label">Total Portfolio Value</div>
              <div className="card-value">{formatCurrency(summary.totalValue)}</div>
              <div className="card-meta">
                Invested: {formatCurrency(summary.totalInvested)}
              </div>
            </div>
          </div>

          <div className={`summary-card ${summary.totalProfitLoss >= 0 ? 'positive' : 'negative'}`}>
            <div className="card-icon">
              {summary.totalProfitLoss >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
            </div>
            <div className="card-content">
              <div className="card-label">Total Profit/Loss</div>
              <div className="card-value">{formatCurrency(summary.totalProfitLoss)}</div>
              <div className="card-meta">
                {formatPercent(summary.totalProfitLossPercent)}
              </div>
            </div>
          </div>

          <div className="summary-card">
            <div className="card-icon">
              <PieChart size={24} />
            </div>
            <div className="card-content">
              <div className="card-label">Asset Distribution</div>
              <div className="card-value">{summary.cryptoCount + summary.etfCount}</div>
              <div className="card-meta">
                {summary.cryptoCount} Crypto · {summary.etfCount} ETF
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allocation Breakdown */}
      {summary && summary.totalValue > 0 && (
        <div className="allocation-breakdown">
          <div className="breakdown-item">
            <div className="breakdown-header">
              <span>₿ Cryptocurrency</span>
              <span>{formatCurrency(summary.cryptoValue)} ({formatPercent((summary.cryptoValue / summary.totalValue) * 100)})</span>
            </div>
            <div className="breakdown-bar">
              <div
                className="breakdown-fill crypto"
                style={{ width: `${(summary.cryptoValue / summary.totalValue) * 100}%` }}
              />
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-header">
              <span>📈 ETFs</span>
              <span>{formatCurrency(summary.etfValue)} ({formatPercent((summary.etfValue / summary.totalValue) * 100)})</span>
            </div>
            <div className="breakdown-bar">
              <div
                className="breakdown-fill etf"
                style={{ width: `${(summary.etfValue / summary.totalValue) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="wealth-lab-tabs">
        <button
          className={`tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button
          className={`tab ${activeTab === 'crypto' ? 'active' : ''}`}
          onClick={() => setActiveTab('crypto')}
        >
          Cryptocurrency ({cryptoHoldings.length})
        </button>
        <button
          className={`tab ${activeTab === 'etf' ? 'active' : ''}`}
          onClick={() => setActiveTab('etf')}
        >
          ETFs ({etfHoldings.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'summary' && (
          <div className="summary-view">
            {cryptoHoldings.length === 0 && etfHoldings.length === 0 ? (
              <div className="empty-state">
                <PieChart size={48} className="empty-icon" />
                <h3>No Holdings Yet</h3>
                <p>Add your first cryptocurrency or ETF to start tracking your portfolio.</p>
                <div className="empty-actions">
                  <button className="primary-btn" onClick={() => setShowAddCrypto(true)}>
                    <Plus size={16} />
                    Add Cryptocurrency
                  </button>
                  <button className="secondary-btn" onClick={() => setShowAddETF(true)}>
                    <Plus size={16} />
                    Add ETF
                  </button>
                </div>
              </div>
            ) : (
              <div className="summary-lists">
                {cryptoHoldings.length > 0 && (
                  <div className="holdings-section">
                    <h3>Top Crypto Holdings</h3>
                    <div className="holdings-list">
                      {cryptoHoldings
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5)
                        .map(holding => (
                          <div key={holding.id} className="holding-item">
                            <div className="holding-info">
                              <div className="holding-symbol">{holding.symbol}</div>
                              <div className="holding-name">{holding.name}</div>
                            </div>
                            <div className="holding-value">
                              <div>{formatCurrency(holding.value)}</div>
                              <div className={`holding-pl ${holding.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                                {holding.profitLoss >= 0 ? '+' : ''}{formatCurrency(holding.profitLoss)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {etfHoldings.length > 0 && (
                  <div className="holdings-section">
                    <h3>Top ETF Holdings</h3>
                    <div className="holdings-list">
                      {etfHoldings
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 5)
                        .map(holding => (
                          <div key={holding.id} className="holding-item">
                            <div className="holding-info">
                              <div className="holding-symbol">{holding.symbol}</div>
                              <div className="holding-name">{holding.name}</div>
                            </div>
                            <div className="holding-value">
                              <div>{formatCurrency(holding.value)}</div>
                              <div className={`holding-pl ${holding.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                                {holding.profitLoss >= 0 ? '+' : ''}{formatCurrency(holding.profitLoss)}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'crypto' && (
          <div className="crypto-view">
            <div className="view-header">
              <h3>Cryptocurrency Holdings</h3>
              <button className="add-btn" onClick={() => setShowAddCrypto(true)}>
                <Plus size={16} />
                Add Crypto
              </button>
            </div>

            {cryptoHoldings.length === 0 ? (
              <div className="empty-state">
                <p>No cryptocurrency holdings. Add your first crypto to get started.</p>
              </div>
            ) : (
              <div className="holdings-table">
                <div className="table-header">
                  <div>Symbol</div>
                  <div>Quantity</div>
                  <div>Cost Basis</div>
                  <div>Current Price</div>
                  <div>Value</div>
                  <div>P/L</div>
                  <div></div>
                </div>
                {cryptoHoldings.map(holding => (
                  <div key={holding.id} className="table-row">
                    <div className="symbol-cell">
                      <div className="symbol">{holding.symbol}</div>
                      <div className="name">{holding.name}</div>
                    </div>
                    <div>{holding.quantity.toFixed(8)}</div>
                    <div>{formatCurrency(holding.costBasis)}</div>
                    <div>{formatCurrency(holding.currentPrice)}</div>
                    <div className="value-cell">{formatCurrency(holding.value)}</div>
                    <div className={`pl-cell ${holding.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                      {holding.profitLoss >= 0 ? '+' : ''}{formatCurrency(holding.profitLoss)}
                      <span className="pl-percent">({formatPercent(holding.profitLossPercent)})</span>
                    </div>
                    <div>
                      <button className="delete-btn" onClick={() => handleDeleteCrypto(holding.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'etf' && (
          <div className="etf-view">
            <div className="view-header">
              <h3>ETF Holdings</h3>
              <button className="add-btn" onClick={() => setShowAddETF(true)}>
                <Plus size={16} />
                Add ETF
              </button>
            </div>

            {etfHoldings.length === 0 ? (
              <div className="empty-state">
                <p>No ETF holdings. Add your first ETF to get started.</p>
              </div>
            ) : (
              <div className="holdings-table">
                <div className="table-header">
                  <div>Symbol</div>
                  <div>Shares</div>
                  <div>Cost Basis</div>
                  <div>Current Price</div>
                  <div>Value</div>
                  <div>P/L</div>
                  <div></div>
                </div>
                {etfHoldings.map(holding => (
                  <div key={holding.id} className="table-row">
                    <div className="symbol-cell">
                      <div className="symbol">{holding.symbol}</div>
                      <div className="name">{holding.name}</div>
                    </div>
                    <div>{holding.shares.toFixed(4)}</div>
                    <div>{formatCurrency(holding.costBasis)}</div>
                    <div>{formatCurrency(holding.currentPrice)}</div>
                    <div className="value-cell">{formatCurrency(holding.value)}</div>
                    <div className={`pl-cell ${holding.profitLoss >= 0 ? 'positive' : 'negative'}`}>
                      {holding.profitLoss >= 0 ? '+' : ''}{formatCurrency(holding.profitLoss)}
                      <span className="pl-percent">({formatPercent(holding.profitLossPercent)})</span>
                    </div>
                    <div>
                      <button className="delete-btn" onClick={() => handleDeleteETF(holding.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Crypto Modal */}
      {showAddCrypto && (
        <div className="modal-overlay" onClick={() => setShowAddCrypto(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Cryptocurrency</h3>
              <button className="modal-close" onClick={() => setShowAddCrypto(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Cryptocurrency</label>
                <select value={cryptoSymbol} onChange={(e) => setCryptoSymbol(e.target.value)} required>
                  <option value="">Select crypto...</option>
                  {availableCryptos.map(crypto => (
                    <option key={crypto.symbol} value={crypto.symbol}>
                      {crypto.symbol} - {crypto.name} (${crypto.price.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  value={cryptoQuantity}
                  onChange={(e) => setCryptoQuantity(e.target.value)}
                  placeholder="0.00"
                  step="0.00000001"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Cost Basis (per unit)</label>
                <input
                  type="number"
                  value={cryptoCostBasis}
                  onChange={(e) => setCryptoCostBasis(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAddCrypto(false)}>
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleAddCrypto}
                disabled={!cryptoSymbol || !cryptoQuantity || !cryptoCostBasis}
              >
                Add Holding
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add ETF Modal */}
      {showAddETF && (
        <div className="modal-overlay" onClick={() => setShowAddETF(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add ETF</h3>
              <button className="modal-close" onClick={() => setShowAddETF(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>ETF</label>
                <select value={etfSymbol} onChange={(e) => setETFSymbol(e.target.value)} required>
                  <option value="">Select ETF...</option>
                  {availableETFs.map(etf => (
                    <option key={etf.symbol} value={etf.symbol}>
                      {etf.symbol} - {etf.name} (${etf.price.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Shares</label>
                <input
                  type="number"
                  value={etfShares}
                  onChange={(e) => setETFShares(e.target.value)}
                  placeholder="0"
                  step="0.0001"
                  min="0"
                  required
                />
              </div>
              <div className="form-group">
                <label>Cost Basis (per share)</label>
                <input
                  type="number"
                  value={etfCostBasis}
                  onChange={(e) => setETFCostBasis(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setShowAddETF(false)}>
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={handleAddETF}
                disabled={!etfSymbol || !etfShares || !etfCostBasis}
              >
                Add Holding
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default CryptoETFCenter;
