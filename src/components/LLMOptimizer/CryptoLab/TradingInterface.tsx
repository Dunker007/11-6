import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, X, AlertCircle } from 'lucide-react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import type { OrderType, OrderSide } from '@/types/crypto';
import '../../../styles/CryptoLab.css';

function TradingInterface() {
  const {
    selectedMarketType,
    setSelectedMarketType,
    placeOrder,
    cancelOrder,
    openOrders,
    loadOrders,
    isLoadingTrading,
    tradingError,
  } = useCryptoStore();

  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('BTC-USD');

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handlePlaceOrder = async () => {
    if (!size || (orderType === 'LIMIT' && !price)) {
      return;
    }

    let orderConfig: any = {};

    if (orderType === 'MARKET') {
      orderConfig.market_market_ioc = {
        quote_size: orderSide === 'BUY' ? size : undefined,
        base_size: orderSide === 'SELL' ? size : undefined,
      };
    } else if (orderType === 'LIMIT') {
      orderConfig.limit_limit_gtc = {
        base_size: size,
        limit_price: price,
        post_only: false,
      };
    }

    try {
      await placeOrder(selectedProductId, orderSide, orderConfig);
      // Reset form
      setSize('');
      setPrice('');
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await cancelOrder(orderId);
    } catch (error) {
      console.error('Failed to cancel order:', error);
    }
  };

  const formatProductId = (productId: string): string => {
    return productId.replace('-', '/');
  };

  return (
    <div className="trading-interface">
      <div className="trading-header">
        <h2>Trading</h2>
        <div className="market-type-toggle">
          <button
            className={selectedMarketType === 'spot' ? 'active' : ''}
            onClick={() => setSelectedMarketType('spot')}
          >
            Spot
          </button>
          <button
            className={selectedMarketType === 'futures' ? 'active' : ''}
            onClick={() => setSelectedMarketType('futures')}
          >
            Futures
          </button>
        </div>
      </div>

      {tradingError && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{tradingError}</span>
        </div>
      )}

      <div className="trading-content">
        {/* Order Placement Form */}
        <div className="order-form">
          <div className="form-header">
            <h3>Place Order</h3>
          </div>

          <div className="order-side-toggle">
            <button
              className={`side-btn buy ${orderSide === 'BUY' ? 'active' : ''}`}
              onClick={() => setOrderSide('BUY')}
            >
              <ArrowUp size={18} />
              Buy
            </button>
            <button
              className={`side-btn sell ${orderSide === 'SELL' ? 'active' : ''}`}
              onClick={() => setOrderSide('SELL')}
            >
              <ArrowDown size={18} />
              Sell
            </button>
          </div>

          <div className="form-group">
            <label>Product</label>
            <input
              type="text"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value.toUpperCase())}
              placeholder="BTC-USD"
              className="product-input"
            />
          </div>

          <div className="form-group">
            <label>Order Type</label>
            <select
              value={orderType}
              onChange={(e) => setOrderType(e.target.value as OrderType)}
              className="order-type-select"
            >
              <option value="MARKET">Market</option>
              <option value="LIMIT">Limit</option>
            </select>
          </div>

          {orderType === 'LIMIT' && (
            <div className="form-group">
              <label>Price (USD)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="price-input"
              />
            </div>
          )}

          <div className="form-group">
            <label>{orderSide === 'BUY' && orderType === 'MARKET' ? 'Quote Size (USD)' : 'Base Size'}</label>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              step="0.0001"
              className="size-input"
            />
          </div>

          <button
            className={`place-order-btn ${orderSide.toLowerCase()}`}
            onClick={handlePlaceOrder}
            disabled={isLoadingTrading || !size || (orderType === 'LIMIT' && !price)}
          >
            {orderSide} {formatProductId(selectedProductId)}
          </button>
        </div>

        {/* Open Orders */}
        <div className="open-orders">
          <div className="section-header">
            <h3>Open Orders</h3>
            <button onClick={loadOrders} className="refresh-btn-small">
              Refresh
            </button>
          </div>

          {openOrders.length === 0 ? (
            <div className="empty-state">No open orders</div>
          ) : (
            <div className="orders-list">
              {openOrders.map((order) => {
                const orderConfig = order.order_configuration;
                const limitConfig = orderConfig.limit_limit_gtc || orderConfig.limit_limit_gtd;
                const marketConfig = orderConfig.market_market_ioc;
                const size = limitConfig?.base_size || marketConfig?.base_size || '0';
                const price = limitConfig?.limit_price || 'Market';

                return (
                  <div key={order.order_id} className="order-item">
                    <div className="order-info">
                      <div className="order-header">
                        <span className={`order-side ${order.side.toLowerCase()}`}>
                          {order.side}
                        </span>
                        <span className="order-product">{order.product_id}</span>
                        <span className="order-type">{order.order_type}</span>
                      </div>
                      <div className="order-details">
                        <span>Size: {parseFloat(size).toFixed(4)}</span>
                        <span>Price: {price === 'Market' ? 'Market' : `$${parseFloat(price).toLocaleString()}`}</span>
                        <span className={`order-status ${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="order-progress">
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${parseFloat(order.completion_percentage)}%` }}
                          />
                        </div>
                        <span>{parseFloat(order.completion_percentage).toFixed(1)}% filled</span>
                      </div>
                    </div>
                    <button
                      className="cancel-order-btn"
                      onClick={() => handleCancelOrder(order.order_id)}
                      disabled={order.status !== 'OPEN'}
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TradingInterface;

