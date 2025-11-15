import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Plus, Minus } from 'lucide-react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import { coinbaseService } from '@/services/crypto/coinbaseService';
import type { OrderType, OrderSide } from '@/types/crypto';
import '../../../../styles/CryptoLab.css';

interface TradingPanelProps {
  productId: string;
}

function TradingPanel({ productId }: TradingPanelProps) {
  const {
    portfolio,
    placeOrder,
    isLoadingTrading,
    tradingError,
    loadPortfolio,
    ticker,
  } = useCryptoStore();

  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [size, setSize] = useState('');
  const [price, setPrice] = useState('');
  const [priceStep] = useState(0.01);

  useEffect(() => {
    if (coinbaseService.isConfigured()) {
      loadPortfolio();
    }
  }, [loadPortfolio]);

  const currentPrice = ticker?.price ? parseFloat(ticker.price) : 0;
  const availableBalance = portfolio?.availableBalance || 0;

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
      await placeOrder(productId, orderSide, orderConfig);
      setSize('');
      setPrice('');
      loadPortfolio();
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (!availableBalance || !currentPrice) return;
    
    if (orderSide === 'BUY' && orderType === 'MARKET') {
      // For market buy, use quote size (USD)
      const quoteSize = (availableBalance * percentage).toFixed(2);
      setSize(quoteSize);
    } else {
      // For limit orders or sells, use base size
      const baseSize = ((availableBalance * percentage) / currentPrice).toFixed(6);
      setSize(baseSize);
    }
  };

  const adjustPrice = (direction: 'up' | 'down') => {
    if (!price) {
      setPrice(currentPrice.toFixed(2));
      return;
    }
    const current = parseFloat(price);
    const newPrice = direction === 'up' 
      ? current + priceStep 
      : Math.max(0, current - priceStep);
    setPrice(newPrice.toFixed(2));
  };

  const estimatedCost = orderType === 'MARKET' && orderSide === 'BUY' && size
    ? parseFloat(size)
    : orderType === 'LIMIT' && size && price
    ? parseFloat(size) * parseFloat(price)
    : 0;

  const formatProductId = (productId: string): string => {
    return productId.replace('-', '/');
  };

  return (
    <div className="trading-panel-compact">
      <div className="trading-panel-header">
        <h3>Trading</h3>
        {coinbaseService.isConfigured() && (
          <div className="available-balance">
            Available: ${availableBalance.toFixed(2)}
          </div>
        )}
      </div>

      {tradingError && (
        <div className="trading-error">
          {tradingError}
        </div>
      )}

      {!coinbaseService.isConfigured() ? (
        <div className="trading-panel-empty">
          <p>Coinbase API not configured</p>
          <p className="hint">Configure API credentials to start trading</p>
        </div>
      ) : (
        <>
          {/* Buy/Sell Toggle */}
          <div className="order-side-toggle-large">
            <button
              className={`side-btn-large buy ${orderSide === 'BUY' ? 'active' : ''}`}
              onClick={() => setOrderSide('BUY')}
            >
              <ArrowUp size={20} />
              Buy
            </button>
            <button
              className={`side-btn-large sell ${orderSide === 'SELL' ? 'active' : ''}`}
              onClick={() => setOrderSide('SELL')}
            >
              <ArrowDown size={20} />
              Sell
            </button>
          </div>

          {/* Order Type */}
          <div className="order-type-selector">
            <button
              className={`order-type-btn ${orderType === 'MARKET' ? 'active' : ''}`}
              onClick={() => setOrderType('MARKET')}
            >
              Market
            </button>
            <button
              className={`order-type-btn ${orderType === 'LIMIT' ? 'active' : ''}`}
              onClick={() => setOrderType('LIMIT')}
            >
              Limit
            </button>
          </div>

          {/* Size Input with Percentage Buttons */}
          <div className="trading-input-group">
            <label>
              {orderSide === 'BUY' && orderType === 'MARKET' ? 'Quote Size (USD)' : 'Base Size'}
            </label>
            <div className="percentage-buttons">
              <button onClick={() => handlePercentageClick(0.25)}>25%</button>
              <button onClick={() => handlePercentageClick(0.5)}>50%</button>
              <button onClick={() => handlePercentageClick(0.75)}>75%</button>
              <button onClick={() => handlePercentageClick(1)}>100%</button>
            </div>
            <input
              type="number"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="0.00"
              step="0.0001"
              className="size-input-large"
            />
          </div>

          {/* Price Input (for Limit Orders) */}
          {orderType === 'LIMIT' && (
            <div className="trading-input-group">
              <label>Price (USD)</label>
              <div className="price-input-group">
                <button className="price-adjust-btn" onClick={() => adjustPrice('down')}>
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={currentPrice.toFixed(2)}
                  step={priceStep.toString()}
                  className="price-input-large"
                />
                <button className="price-adjust-btn" onClick={() => adjustPrice('up')}>
                  <Plus size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Order Summary */}
          {estimatedCost > 0 && (
            <div className="order-summary">
              <div className="summary-row">
                <span>Estimated Cost</span>
                <span>${estimatedCost.toFixed(2)}</span>
              </div>
              {orderType === 'LIMIT' && size && price && (
                <div className="summary-row">
                  <span>Total</span>
                  <span>${(parseFloat(size) * parseFloat(price)).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            className={`submit-order-btn ${orderSide.toLowerCase()}`}
            onClick={handlePlaceOrder}
            disabled={isLoadingTrading || !size || (orderType === 'LIMIT' && !price)}
          >
            {orderSide} {formatProductId(productId)}
          </button>

          {/* Quick Market Buttons */}
          <div className="quick-market-buttons">
            <button
              className="quick-market-btn buy"
              onClick={() => {
                setOrderSide('BUY');
                setOrderType('MARKET');
                handlePercentageClick(1);
              }}
            >
              Market Buy Max
            </button>
            <button
              className="quick-market-btn sell"
              onClick={() => {
                setOrderSide('SELL');
                setOrderType('MARKET');
                handlePercentageClick(1);
              }}
            >
              Market Sell Max
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default TradingPanel;

