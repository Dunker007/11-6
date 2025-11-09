import { useEffect, useState } from 'react';
import { X, Filter } from 'lucide-react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import { coinbaseService } from '@/services/crypto/coinbaseService';
import '../../../../styles/CryptoLab.css';

interface OpenOrdersPanelProps {
  productId?: string;
}

type OrderFilter = 'all' | 'market' | 'limit' | 'stop';

function OpenOrdersPanel({ productId }: OpenOrdersPanelProps) {
  const { openOrders, loadOrders, cancelOrder, isLoadingTrading } = useCryptoStore();
  const [filter, setFilter] = useState<OrderFilter>('all');
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (coinbaseService.isConfigured()) {
      loadOrders();
      // Refresh orders every 3 seconds
      const interval = setInterval(() => {
        loadOrders();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [loadOrders, productId]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancellingOrderId(orderId);
    try {
      await cancelOrder(orderId);
      loadOrders();
    } catch (error) {
      console.error('Failed to cancel order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrderId(null);
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

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getOrderType = (order: any): string => {
    const config = order.order_configuration;
    if (config.market_market_ioc) return 'Market';
    if (config.limit_limit_gtc || config.limit_limit_gtd) return 'Limit';
    if (config.stop_limit_stop_limit_gtc || config.stop_limit_stop_limit_gtd) return 'Stop Limit';
    if (config.stop_stop_gtc || config.stop_stop_gtd) return 'Stop';
    return 'Unknown';
  };

  const filteredOrders = openOrders.filter((order) => {
    if (productId && order.product_id !== productId) return false;
    
    if (filter === 'all') return true;
    const orderType = getOrderType(order).toLowerCase();
    if (filter === 'market') return orderType === 'market';
    if (filter === 'limit') return orderType === 'limit';
    if (filter === 'stop') return orderType.includes('stop');
    return true;
  });

  if (!coinbaseService.isConfigured()) {
    return (
      <div className="open-orders-panel">
        <div className="panel-empty">
          <p>Coinbase API not configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="open-orders-panel">
      <div className="panel-header">
        <h3>Open Orders</h3>
        <div className="order-filter">
          <Filter size={14} />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as OrderFilter)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="market">Market</option>
            <option value="limit">Limit</option>
            <option value="stop">Stop</option>
          </select>
        </div>
      </div>

      {isLoadingTrading && filteredOrders.length === 0 ? (
        <div className="panel-loading">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="panel-empty">No open orders</div>
      ) : (
        <div className="orders-table">
          <div className="orders-header-row">
            <span>Type</span>
            <span>Side</span>
            <span>Price</span>
            <span>Size</span>
            <span>Time</span>
            <span>Actions</span>
          </div>
          <div className="orders-entries">
            {filteredOrders.map((order) => {
              const orderType = getOrderType(order);
              const side = order.side;
              const price = order.order_configuration.limit_limit_gtc?.limit_price ||
                           order.order_configuration.limit_limit_gtd?.limit_price ||
                           order.order_configuration.stop_limit_stop_limit_gtc?.limit_price ||
                           order.order_configuration.stop_limit_stop_limit_gtd?.limit_price ||
                           'Market';
              const size = order.order_configuration.market_market_ioc?.base_size ||
                          order.order_configuration.market_market_ioc?.quote_size ||
                          order.order_configuration.limit_limit_gtc?.base_size ||
                          order.order_configuration.limit_limit_gtd?.base_size ||
                          order.order_configuration.stop_limit_stop_limit_gtc?.base_size ||
                          order.order_configuration.stop_limit_stop_limit_gtd?.base_size ||
                          '0';

              return (
                <div key={order.order_id} className={`order-row ${side.toLowerCase()}`}>
                  <span className="order-type">{orderType}</span>
                  <span className={`order-side ${side.toLowerCase()}`}>{side}</span>
                  <span className="order-price">
                    {typeof price === 'string' && price !== 'Market' ? `$${formatPrice(price)}` : 'Market'}
                  </span>
                  <span className="order-size">{formatSize(size)}</span>
                  <span className="order-time">{formatTime(order.created_time)}</span>
                  <button
                    className="cancel-order-btn"
                    onClick={() => handleCancelOrder(order.order_id)}
                    disabled={cancellingOrderId === order.order_id}
                    title="Cancel order"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default OpenOrdersPanel;

