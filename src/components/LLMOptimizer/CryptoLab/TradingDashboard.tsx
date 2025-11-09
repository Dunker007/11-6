import { useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertCircle, RefreshCw } from 'lucide-react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import { coinbaseService } from '@/services/crypto/coinbaseService';
import '../../../styles/CryptoLab.css';

function TradingDashboard() {
  const {
    portfolio,
    positions,
    openOrders,
    isLoadingTrading,
    tradingError,
    loadPortfolio,
    loadPositions,
    loadOrders,
  } = useCryptoStore();

  useEffect(() => {
    if (coinbaseService.isConfigured()) {
      loadPortfolio();
      loadPositions();
      loadOrders();
    }
  }, [loadPortfolio, loadPositions, loadOrders]);

  const handleRefresh = () => {
    loadPortfolio();
    loadPositions();
    loadOrders();
  };

  if (!coinbaseService.isConfigured()) {
    return (
      <div className="trading-dashboard">
        <div className="dashboard-empty">
          <AlertCircle size={48} />
          <h3>Coinbase API Not Configured</h3>
          <p>Please configure your Coinbase API credentials to access trading features.</p>
          <p className="hint">Go to Settings → API Keys to add your Coinbase credentials.</p>
        </div>
      </div>
    );
  }

  if (isLoadingTrading && !portfolio) {
    return (
      <div className="trading-dashboard">
        <div className="loading-state">Loading portfolio...</div>
      </div>
    );
  }

  return (
    <div className="trading-dashboard">
      <div className="dashboard-header">
        <h2>Trading Dashboard</h2>
        <button className="refresh-btn" onClick={handleRefresh} disabled={isLoadingTrading}>
          <RefreshCw size={16} className={isLoadingTrading ? 'spinning' : ''} />
          Refresh
        </button>
      </div>

      {tradingError && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{tradingError}</span>
        </div>
      )}

      {portfolio && (
        <>
          {/* Portfolio Summary */}
          <div className="portfolio-summary">
            <div className="summary-card">
              <div className="card-header">
                <Wallet size={20} />
                <span>Total Value</span>
              </div>
              <div className="card-value">
                ${portfolio.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="summary-card">
              <div className="card-header">
                <DollarSign size={20} />
                <span>Available Balance</span>
              </div>
              <div className="card-value">
                ${portfolio.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className={`summary-card ${portfolio.totalPnL >= 0 ? 'positive' : 'negative'}`}>
              <div className="card-header">
                {portfolio.totalPnL >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                <span>Total P&L</span>
              </div>
              <div className="card-value">
                {portfolio.totalPnL >= 0 ? '+' : ''}
                ${portfolio.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="card-subvalue">
                ({portfolio.totalPnLPercentage >= 0 ? '+' : ''}
                {portfolio.totalPnLPercentage.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Active Positions */}
          {positions.length > 0 && (
            <div className="dashboard-section">
              <h3>Active Positions</h3>
              <div className="positions-table">
                <div className="table-header">
                  <div>Product</div>
                  <div>Side</div>
                  <div>Size</div>
                  <div>Entry Price</div>
                  <div>Mark Price</div>
                  <div>Unrealized P&L</div>
                </div>
                {positions.map((position) => {
                  const pnl = parseFloat(position.unrealized_pnl);
                  const isPositive = pnl >= 0;
                  return (
                    <div key={position.product_id} className="table-row">
                      <div className="product-cell">
                        <span className="product-id">{position.product_id}</span>
                        <span className="product-type">{position.product_type}</span>
                      </div>
                      <div className={`side-cell ${position.side.toLowerCase()}`}>
                        {position.side}
                      </div>
                      <div>{parseFloat(position.size).toFixed(4)}</div>
                      <div>${parseFloat(position.entry_price).toLocaleString()}</div>
                      <div>${parseFloat(position.mark_price).toLocaleString()}</div>
                      <div className={isPositive ? 'positive' : 'negative'}>
                        {isPositive ? '+' : ''}${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Open Orders */}
          {openOrders.length > 0 && (
            <div className="dashboard-section">
              <h3>Open Orders</h3>
              <div className="orders-table">
                <div className="table-header">
                  <div>Product</div>
                  <div>Side</div>
                  <div>Type</div>
                  <div>Size</div>
                  <div>Price</div>
                  <div>Status</div>
                  <div>Filled</div>
                </div>
                {openOrders.map((order) => {
                  const orderConfig = order.order_configuration;
                  const limitConfig = orderConfig.limit_limit_gtc || orderConfig.limit_limit_gtd;
                  const marketConfig = orderConfig.market_market_ioc;
                  const size = limitConfig?.base_size || marketConfig?.base_size || '0';
                  const price = limitConfig?.limit_price || '-';

                  return (
                    <div key={order.order_id} className="table-row">
                      <div className="product-cell">
                        <span className="product-id">{order.product_id}</span>
                      </div>
                      <div className={`side-cell ${order.side.toLowerCase()}`}>
                        {order.side}
                      </div>
                      <div>{order.order_type}</div>
                      <div>{parseFloat(size).toFixed(4)}</div>
                      <div>{price === '-' ? 'Market' : `$${parseFloat(price).toLocaleString()}`}</div>
                      <div className={`status-cell ${order.status.toLowerCase()}`}>
                        {order.status}
                      </div>
                      <div>
                        {parseFloat(order.completion_percentage).toFixed(1)}% (
                        {parseFloat(order.filled_size).toFixed(4)})
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {positions.length === 0 && openOrders.length === 0 && (
            <div className="empty-state">
              <p>No active positions or open orders</p>
              <p className="hint">Use the Trading tab to place orders</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TradingDashboard;

