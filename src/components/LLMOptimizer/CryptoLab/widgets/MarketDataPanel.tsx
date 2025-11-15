import { useEffect, useState } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import '../../../../styles/CryptoLab.css';

function MarketDataPanel() {
  const { marketData, selectedCoin, setSelectedCoin, loadMarketData, isLoadingMarketData } = useCryptoStore();
  const [viewMode, setViewMode] = useState<'top' | 'trending'>('top');

  useEffect(() => {
    loadMarketData();
    // Refresh every 60 seconds
    const interval = setInterval(loadMarketData, 60000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  const displayCoins = viewMode === 'top' ? marketData?.coins.slice(0, 20) : marketData?.trending.slice(0, 20);

  const formatPrice = (price: number): string => {
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) return `$${(volume / 1e9).toFixed(2)}B`;
    if (volume >= 1e6) return `$${(volume / 1e6).toFixed(2)}M`;
    return `$${(volume / 1e3).toFixed(2)}K`;
  };

  return (
    <div className="crypto-market-panel">
      <div className="panel-header">
        <h3>Market Data</h3>
        <div className="view-toggle">
          <button
            className={viewMode === 'top' ? 'active' : ''}
            onClick={() => setViewMode('top')}
          >
            Top
          </button>
          <button
            className={viewMode === 'trending' ? 'active' : ''}
            onClick={() => setViewMode('trending')}
          >
            Trending
          </button>
        </div>
      </div>

      {isLoadingMarketData && !marketData && (
        <div className="loading-state">Loading market data...</div>
      )}

      {marketData && (
        <div className="coins-list">
          {displayCoins?.map((coin) => {
            const isSelected = selectedCoin?.id === coin.id;
            const priceChange24h = coin.price_change_percentage_24h || 0;
            const isPositive = priceChange24h >= 0;

            return (
              <div
                key={coin.id}
                className={`coin-item ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedCoin(coin)}
              >
                <div className="coin-header">
                  <div className="coin-rank">#{coin.market_cap_rank}</div>
                  {coin.image && (
                    <img src={coin.image} alt={coin.symbol} className="coin-icon" />
                  )}
                  <div className="coin-info">
                    <div className="coin-name">{coin.name}</div>
                    <div className="coin-symbol">{coin.symbol.toUpperCase()}</div>
                  </div>
                </div>

                <div className="coin-price">
                  <div className="price-value">${formatPrice(coin.current_price)}</div>
                  <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                    {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {Math.abs(priceChange24h).toFixed(2)}%
                  </div>
                </div>

                <div className="coin-metrics">
                  <div className="metric">
                    <span className="metric-label">24h Vol</span>
                    <span className="metric-value">{formatVolume(coin.total_volume)}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Market Cap</span>
                    <span className="metric-value">
                      {coin.market_cap >= 1e9
                        ? `$${(coin.market_cap / 1e9).toFixed(2)}B`
                        : `$${(coin.market_cap / 1e6).toFixed(2)}M`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedCoin && (
        <div className="selected-coin-details">
          <div className="details-header">
            <h4>{selectedCoin.name}</h4>
            <button onClick={() => setSelectedCoin(null)}>×</button>
          </div>
          <div className="details-content">
            <div className="detail-row">
              <span>Price:</span>
              <span>${formatPrice(selectedCoin.current_price)}</span>
            </div>
            <div className="detail-row">
              <span>24h Change:</span>
              <span className={selectedCoin.price_change_percentage_24h >= 0 ? 'positive' : 'negative'}>
                {selectedCoin.price_change_percentage_24h >= 0 ? '+' : ''}
                {selectedCoin.price_change_percentage_24h.toFixed(2)}%
              </span>
            </div>
            <div className="detail-row">
              <span>24h High:</span>
              <span>${formatPrice(selectedCoin.high_24h)}</span>
            </div>
            <div className="detail-row">
              <span>24h Low:</span>
              <span>${formatPrice(selectedCoin.low_24h)}</span>
            </div>
            <div className="detail-row">
              <span>Market Cap:</span>
              <span>
                ${selectedCoin.market_cap >= 1e9
                  ? `${(selectedCoin.market_cap / 1e9).toFixed(2)}B`
                  : `${(selectedCoin.market_cap / 1e6).toFixed(2)}M`}
              </span>
            </div>
            <div className="detail-row">
              <span>Volume:</span>
              <span>{formatVolume(selectedCoin.total_volume)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketDataPanel;

