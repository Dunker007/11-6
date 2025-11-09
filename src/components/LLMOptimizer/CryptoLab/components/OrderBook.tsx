import { useEffect, useState } from 'react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import '../../../../styles/CryptoLab.css';

interface OrderBookProps {
  productId: string;
  onPriceClick?: (price: string, side: 'BUY' | 'SELL') => void;
}

function OrderBook({ productId, onPriceClick }: OrderBookProps) {
  const { orderBook, isLoadingOrderBook, loadOrderBook } = useCryptoStore();
  const [maxDepth] = useState(10);

  useEffect(() => {
    if (productId) {
      loadOrderBook(productId);
      // Refresh order book every 2 seconds
      const interval = setInterval(() => {
        loadOrderBook(productId);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [productId, loadOrderBook]);

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

  const calculateTotal = (entries: Array<{ price: string; size: string }>, index: number): number => {
    return entries
      .slice(0, index + 1)
      .reduce((sum, entry) => sum + parseFloat(entry.size), 0);
  };

  const getMaxTotal = (entries: Array<{ price: string; size: string }>): number => {
    return entries.reduce((sum, entry) => sum + parseFloat(entry.size), 0);
  };

  if (isLoadingOrderBook && !orderBook) {
    return (
      <div className="order-book">
        <div className="order-book-loading">Loading order book...</div>
      </div>
    );
  }

  if (!orderBook) {
    return (
      <div className="order-book">
        <div className="order-book-empty">No order book data available</div>
      </div>
    );
  }

  const asks = orderBook.asks.slice(0, maxDepth).reverse(); // Show lowest asks first
  const bids = orderBook.bids.slice(0, maxDepth); // Show highest bids first

  const maxAskTotal = getMaxTotal(asks);
  const maxBidTotal = getMaxTotal(bids);
  const maxTotal = Math.max(maxAskTotal, maxBidTotal);

  const spread = asks.length > 0 && bids.length > 0
    ? parseFloat(asks[0].price) - parseFloat(bids[0].price)
    : 0;

  return (
    <div className="order-book">
      <div className="order-book-header">
        <div className="order-book-title">Order Book</div>
        <div className="spread-display">
          Spread: ${spread.toFixed(2)}
        </div>
      </div>

      {/* Asks (Sell Orders) */}
      <div className="order-book-section asks">
        <div className="order-book-header-row">
          <span>Price (USD)</span>
          <span>Size</span>
          <span>Total</span>
        </div>
        <div className="order-book-entries">
          {asks.map((ask: { price: string; size: string }, idx: number) => {
            const total = calculateTotal(asks, idx);
            const depthPercent = (total / maxTotal) * 100;
            return (
              <div
                key={`ask-${idx}`}
                className="order-book-entry ask"
                onClick={() => onPriceClick?.(ask.price, 'SELL')}
                style={{
                  background: `linear-gradient(to left, rgba(239, 68, 68, 0.1) ${depthPercent}%, transparent ${depthPercent}%)`,
                }}
              >
                <span className="order-price ask-price">{formatPrice(ask.price)}</span>
                <span className="order-size">{formatSize(ask.size)}</span>
                <span className="order-total">{formatSize(total.toString())}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spread Divider */}
      {spread > 0 && (
        <div className="spread-divider">
          <span>${formatPrice(asks[0]?.price || '0')}</span>
          <span className="spread-value">${spread.toFixed(2)}</span>
          <span>${formatPrice(bids[0]?.price || '0')}</span>
        </div>
      )}

      {/* Bids (Buy Orders) */}
      <div className="order-book-section bids">
        <div className="order-book-entries">
          {bids.map((bid: { price: string; size: string }, idx: number) => {
            const total = calculateTotal(bids, idx);
            const depthPercent = (total / maxTotal) * 100;
            return (
              <div
                key={`bid-${idx}`}
                className="order-book-entry bid"
                onClick={() => onPriceClick?.(bid.price, 'BUY')}
                style={{
                  background: `linear-gradient(to left, rgba(16, 185, 129, 0.1) ${depthPercent}%, transparent ${depthPercent}%)`,
                }}
              >
                <span className="order-price bid-price">{formatPrice(bid.price)}</span>
                <span className="order-size">{formatSize(bid.size)}</span>
                <span className="order-total">{formatSize(total.toString())}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OrderBook;

