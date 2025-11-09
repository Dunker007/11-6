import { useEffect, useRef } from 'react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import '../../../../styles/CryptoLab.css';

interface TradeHistoryProps {
  productId: string;
}

function TradeHistory({ productId }: TradeHistoryProps) {
  const { fills, loadFills } = useCryptoStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (productId) {
      loadFills(productId);
      // Refresh fills every 5 seconds
      const interval = setInterval(() => {
        loadFills(productId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [productId, loadFills]);

  useEffect(() => {
    // Auto-scroll to bottom when new trades arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [fills]);

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

  const recentFills = fills
    .filter((fill) => fill.product_id === productId)
    .slice(-20)
    .reverse(); // Show newest first

  return (
    <div className="trade-history">
      <div className="trade-history-header">
        <h3>Trade History</h3>
        <div className="trade-count">{recentFills.length} trades</div>
      </div>

      <div className="trade-history-table" ref={scrollRef}>
        <div className="trade-history-header-row">
          <span>Time</span>
          <span>Side</span>
          <span>Price</span>
          <span>Size</span>
          <span>Total</span>
        </div>

        {recentFills.length === 0 ? (
          <div className="trade-history-empty">No recent trades</div>
        ) : (
          <div className="trade-history-entries">
            {recentFills.map((fill) => {
              const total = parseFloat(fill.price) * parseFloat(fill.size);
              const isBuy = fill.side === 'BUY';

              return (
                <div key={fill.entry_id} className={`trade-history-entry ${isBuy ? 'buy' : 'sell'}`}>
                  <span className="trade-time">{formatTime(fill.trade_time)}</span>
                  <span className={`trade-side ${isBuy ? 'buy' : 'sell'}`}>
                    {fill.side}
                  </span>
                  <span className="trade-price">${formatPrice(fill.price)}</span>
                  <span className="trade-size">{formatSize(fill.size)}</span>
                  <span className="trade-total">${total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default TradeHistory;

