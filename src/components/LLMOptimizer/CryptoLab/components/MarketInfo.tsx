import { useEffect, useState } from 'react';
import { coinbaseService } from '@/services/crypto/coinbaseService';
import TradingModeToggle from './TradingModeToggle';
import '../../../../styles/CryptoLab.css';

interface MarketInfoProps {
  selectedProduct: string;
  onProductChange: (product: string) => void;
}

function MarketInfo({ selectedProduct, onProductChange }: MarketInfoProps) {
  const [ticker, setTicker] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (coinbaseService.isConfigured() && selectedProduct) {
      loadTicker();
      // Refresh ticker every 5 seconds
      const interval = setInterval(loadTicker, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedProduct]);

  const loadTicker = async () => {
    if (!coinbaseService.isConfigured()) return;
    
    setIsLoading(true);
    try {
      const tickerData = await coinbaseService.getProductTicker(selectedProduct);
      setTicker(tickerData);
    } catch (error) {
      console.error('Failed to load ticker:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${(volume / 1e3).toFixed(2)}K`;
  };

  const currentPrice = ticker?.price ? parseFloat(ticker.price) : 0;
  const priceChange24h = ticker?.price_percentage_change_24h 
    ? parseFloat(ticker.price_percentage_change_24h) 
    : 0;
  const high24h = ticker?.high_24h ? parseFloat(ticker.high_24h) : 0;
  const low24h = ticker?.low_24h ? parseFloat(ticker.low_24h) : 0;
  const volume24h = ticker?.volume_24h ? parseFloat(ticker.volume_24h) : 0;
  const spread = ticker?.best_bid && ticker?.best_ask
    ? parseFloat(ticker.best_ask) - parseFloat(ticker.best_bid)
    : 0;

  return (
    <div className="market-info-bar">
      <div className="market-info-content">
        <TradingModeToggle />
        
        <div className="product-selector">
          <select 
            value={selectedProduct} 
            onChange={(e) => onProductChange(e.target.value)}
            className="product-select"
          >
            <option value="BTC-USD">BTC/USD</option>
            <option value="ETH-USD">ETH/USD</option>
            <option value="SOL-USD">SOL/USD</option>
            <option value="ADA-USD">ADA/USD</option>
            <option value="DOT-USD">DOT/USD</option>
            <option value="MATIC-USD">MATIC/USD</option>
          </select>
        </div>
        
        <div className="market-stats">
          <div className="stat-item">
            <span className="stat-label">Price</span>
            <span className="stat-value">
              {isLoading ? '...' : currentPrice > 0 ? `$${formatPrice(currentPrice)}` : 'N/A'}
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">24h Change</span>
            <span className={`stat-value ${priceChange24h >= 0 ? 'positive' : 'negative'}`}>
              {isLoading ? '...' : priceChange24h !== 0 ? `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(2)}%` : '0.00%'}
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">24h High</span>
            <span className="stat-value">
              {isLoading ? '...' : high24h > 0 ? `$${formatPrice(high24h)}` : 'N/A'}
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">24h Low</span>
            <span className="stat-value">
              {isLoading ? '...' : low24h > 0 ? `$${formatPrice(low24h)}` : 'N/A'}
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">24h Volume</span>
            <span className="stat-value">
              {isLoading ? '...' : volume24h > 0 ? formatVolume(volume24h) : 'N/A'}
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Spread</span>
            <span className="stat-value">
              {isLoading ? '...' : spread > 0 ? `$${formatPrice(spread)}` : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarketInfo;

