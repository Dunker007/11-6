import { useState, useEffect, useCallback } from 'react';
import MarketInfo from './components/MarketInfo';
import TradingChart from './components/TradingChart';
import OrderBook from './components/OrderBook';
import TradingPanel from './components/TradingPanel';
import TradeHistory from './components/TradeHistory';
import OpenOrdersPanel from './components/OpenOrdersPanel';
import PositionsPanel from './components/PositionsPanel';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import { DEFAULTS } from '@/utils/constants';
import '@/styles/CryptoLab.css';

type BottomTab = 'trading' | 'positions';

function CryptoLab() {
  const [selectedProduct, setSelectedProduct] = useState<string>(DEFAULTS.SELECTED_PRODUCT);
  const [bottomTab, setBottomTab] = useState<BottomTab>('trading');
  const { setSelectedProduct: setStoreProduct, loadTicker } = useCryptoStore();

  useEffect(() => {
    setStoreProduct(selectedProduct);
    loadTicker(selectedProduct);
  }, [selectedProduct, setStoreProduct, loadTicker]);

  const handleProductChange = useCallback((product: string) => {
    setSelectedProduct(product);
  }, []);

  const handleBottomTabChange = useCallback((tab: BottomTab) => {
    setBottomTab(tab);
  }, []);

  const handlePriceClick = useCallback((price: string, side: 'BUY' | 'SELL') => {
    // This will be handled by TradingPanel when we integrate click-to-fill
    console.log(`Price clicked: ${price} for ${side}`);
  }, []);

  return (
    <div className="crypto-lab-full-width">
      {/* Market Info Bar */}
      <MarketInfo selectedProduct={selectedProduct} onProductChange={handleProductChange} />

      {/* Chart Area */}
      <div className="chart-area">
        <TradingChart productId={selectedProduct} />
      </div>

      {/* Bottom Section Tabs */}
      <div className="bottom-tabs">
        <button
          className={`bottom-tab ${bottomTab === 'trading' ? 'active' : ''}`}
          onClick={() => handleBottomTabChange('trading')}
        >
          Trading
        </button>
        <button
          className={`bottom-tab ${bottomTab === 'positions' ? 'active' : ''}`}
          onClick={() => handleBottomTabChange('positions')}
        >
          Positions & Orders
        </button>
      </div>

      {/* Bottom Section - Content */}
      <div className="trading-bottom-section">
        {bottomTab === 'trading' ? (
          <>
            {/* Order Book */}
            <div className="order-book-column">
              <OrderBook productId={selectedProduct} onPriceClick={handlePriceClick} />
            </div>

            {/* Trading Panel */}
            <div className="trading-panel-column">
              <TradingPanel productId={selectedProduct} />
            </div>

            {/* Trade History */}
            <div className="trade-history-column">
              <TradeHistory productId={selectedProduct} />
            </div>
          </>
        ) : (
          <>
            {/* Open Orders */}
            <div className="order-book-column">
              <OpenOrdersPanel productId={selectedProduct} />
            </div>

            {/* Positions */}
            <div className="trading-panel-column" style={{ gridColumn: 'span 2' }}>
              <PositionsPanel productId={selectedProduct} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CryptoLab;

