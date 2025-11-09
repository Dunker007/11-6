import { useEffect, useState } from 'react';
import { TrendingUp, Activity, Newspaper, BarChart3 } from 'lucide-react';
import { useCryptoStore } from '@/services/crypto/cryptoStore';
import '../../../../styles/CryptoLab.css';

function AnalyticsPanel() {
  const {
    socialSentiment,
    onChainData,
    news,
    marketMetrics,
    loadSocialSentiment,
    loadOnChainData,
    loadNews,
    loadMarketMetrics,
  } = useCryptoStore();

  const [activeTab, setActiveTab] = useState<'sentiment' | 'onchain' | 'news' | 'metrics'>('sentiment');

  useEffect(() => {
    loadSocialSentiment();
    loadOnChainData();
    loadNews();
    loadMarketMetrics();

    // Refresh every 5 minutes
    const interval = setInterval(() => {
      loadSocialSentiment();
      loadOnChainData();
      loadNews();
      loadMarketMetrics();
    }, 300000);

    return () => clearInterval(interval);
  }, [loadSocialSentiment, loadOnChainData, loadNews, loadMarketMetrics]);

  const getSentimentColor = (score: number): string => {
    if (score > 0.5) return 'var(--emerald-500)';
    if (score < -0.5) return 'var(--red-500)';
    return 'var(--text-muted)';
  };

  const getFearGreedLabel = (index: number): string => {
    if (index >= 75) return 'Extreme Greed';
    if (index >= 55) return 'Greed';
    if (index >= 45) return 'Neutral';
    if (index >= 25) return 'Fear';
    return 'Extreme Fear';
  };

  return (
    <div className="crypto-analytics-panel">
      <div className="panel-header">
        <h3>Analytics</h3>
        <div className="analytics-tabs">
          <button
            className={activeTab === 'sentiment' ? 'active' : ''}
            onClick={() => setActiveTab('sentiment')}
            title="Social Sentiment"
          >
            <TrendingUp size={16} />
          </button>
          <button
            className={activeTab === 'onchain' ? 'active' : ''}
            onClick={() => setActiveTab('onchain')}
            title="On-Chain Data"
          >
            <Activity size={16} />
          </button>
          <button
            className={activeTab === 'news' ? 'active' : ''}
            onClick={() => setActiveTab('news')}
            title="News"
          >
            <Newspaper size={16} />
          </button>
          <button
            className={activeTab === 'metrics' ? 'active' : ''}
            onClick={() => setActiveTab('metrics')}
            title="Market Metrics"
          >
            <BarChart3 size={16} />
          </button>
        </div>
      </div>

      <div className="analytics-content">
        {activeTab === 'sentiment' && (
          <div className="sentiment-feed">
            <h4>Social Sentiment</h4>
            {socialSentiment.length === 0 ? (
              <div className="empty-state">No sentiment data available</div>
            ) : (
              <div className="sentiment-list">
                {socialSentiment.map((item) => (
                  <div key={item.coinId} className="sentiment-item">
                    <div className="sentiment-header">
                      <span className="coin-symbol">{item.symbol}</span>
                      <span
                        className="sentiment-score"
                        style={{ color: getSentimentColor(item.sentimentScore) }}
                      >
                        {(item.sentimentScore * 100).toFixed(0)}
                      </span>
                    </div>
                    <div className="sentiment-bars">
                      <div className="sentiment-bar">
                        <div className="bar-label">Bullish</div>
                        <div className="bar-container">
                          <div
                            className="bar-fill bullish"
                            style={{ width: `${item.bullishPercentage}%` }}
                          />
                          <span className="bar-value">{item.bullishPercentage}%</span>
                        </div>
                      </div>
                      <div className="sentiment-bar">
                        <div className="bar-label">Bearish</div>
                        <div className="bar-container">
                          <div
                            className="bar-fill bearish"
                            style={{ width: `${item.bearishPercentage}%` }}
                          />
                          <span className="bar-value">{item.bearishPercentage}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="sentiment-metrics">
                      <span>Mentions: {item.mentions.toLocaleString()}</span>
                      <span>Volume: {item.socialVolume.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'onchain' && (
          <div className="onchain-feed">
            <h4>On-Chain Analytics</h4>
            {onChainData.length === 0 ? (
              <div className="empty-state">No on-chain data available</div>
            ) : (
              <div className="onchain-list">
                {onChainData.map((item) => (
                  <div key={item.coinId} className="onchain-item">
                    <div className="onchain-header">
                      <span className="coin-symbol">{item.symbol}</span>
                    </div>
                    <div className="onchain-metrics">
                      <div className="metric-row">
                        <span>Active Addresses</span>
                        <span>{item.activeAddresses.toLocaleString()}</span>
                      </div>
                      <div className="metric-row">
                        <span>Transactions (24h)</span>
                        <span>{item.transactionCount.toLocaleString()}</span>
                      </div>
                      <div className="metric-row">
                        <span>Exchange Inflows</span>
                        <span className="negative">{item.exchangeInflows.toLocaleString()}</span>
                      </div>
                      <div className="metric-row">
                        <span>Exchange Outflows</span>
                        <span className="positive">{item.exchangeOutflows.toLocaleString()}</span>
                      </div>
                      <div className="metric-row">
                        <span>Whale Movements</span>
                        <span>{item.whaleMovements}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'news' && (
          <div className="news-feed">
            <h4>Crypto News</h4>
            {news.length === 0 ? (
              <div className="empty-state">No news available</div>
            ) : (
              <div className="news-list">
                {news.map((item) => (
                  <div key={item.id} className="news-item">
                    <div className="news-header">
                      <span className="news-source">{item.source}</span>
                      {item.sentiment && (
                        <span className={`sentiment-badge ${item.sentiment}`}>
                          {item.sentiment}
                        </span>
                      )}
                    </div>
                    <h5 className="news-title">{item.title}</h5>
                    {item.description && (
                      <p className="news-description">{item.description}</p>
                    )}
                    <div className="news-footer">
                      <span className="news-time">
                        {new Date(item.publishedAt).toLocaleString()}
                      </span>
                      {item.coins && item.coins.length > 0 && (
                        <div className="news-coins">
                          {item.coins.map((coin) => (
                            <span key={coin} className="coin-tag">
                              {coin}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && marketMetrics && (
          <div className="metrics-feed">
            <h4>Market Metrics</h4>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-label">Fear & Greed Index</div>
                <div className="metric-value-large">{marketMetrics.fearGreedIndex}</div>
                <div className="metric-description">
                  {getFearGreedLabel(marketMetrics.fearGreedIndex)}
                </div>
                <div className="fear-greed-bar">
                  <div
                    className="fear-greed-fill"
                    style={{ width: `${marketMetrics.fearGreedIndex}%` }}
                  />
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Bitcoin Dominance</div>
                <div className="metric-value">{marketMetrics.bitcoinDominance.toFixed(2)}%</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Ethereum Dominance</div>
                <div className="metric-value">{marketMetrics.ethereumDominance.toFixed(2)}%</div>
              </div>

              <div className="metric-card">
                <div className="metric-label">Total Market Cap</div>
                <div className="metric-value">
                  ${(marketMetrics.totalMarketCap / 1e12).toFixed(2)}T
                </div>
              </div>

              <div className="metric-card">
                <div className="metric-label">24h Volume</div>
                <div className="metric-value">
                  ${(marketMetrics.totalVolume24h / 1e9).toFixed(2)}B
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AnalyticsPanel;

