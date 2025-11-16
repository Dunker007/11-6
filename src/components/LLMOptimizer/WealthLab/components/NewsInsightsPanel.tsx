import { useState, useEffect, useMemo } from 'react';
import { RefreshCw, Filter, Heart, ExternalLink, TrendingUp, TrendingDown, Minus, Sparkles, AlertTriangle, Lightbulb, Shield } from 'lucide-react';
import { newsService } from '@/services/wealth/newsService';
import { watchlistService } from '@/services/wealth/watchlistService';
import { useToast } from '@/components/ui';
import { formatRelativeTime } from '@/utils/formatters';
import type { NewsArticle, MarketInsight, NewsSentiment } from '@/types/wealth';
import '@/styles/WealthLab.css';

function NewsInsightsPanel() {
  const { showToast } = useToast();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [insights, setInsights] = useState<MarketInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterSentiment, setFilterSentiment] = useState<NewsSentiment | 'all'>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [favoriteArticles, setFavoriteArticles] = useState<Set<string>>(new Set());
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadFavorites();
    loadInsights();
    fetchNews();
  }, []);

  useEffect(() => {
    fetchNews();
  }, [selectedSymbols, dateRange]);

  const loadFavorites = () => {
    try {
      const saved = localStorage.getItem('dlx_wealth_favorite_articles');
      if (saved) {
        setFavoriteArticles(new Set(JSON.parse(saved)));
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const saveFavorites = (favorites: Set<string>) => {
    try {
      localStorage.setItem('dlx_wealth_favorite_articles', JSON.stringify(Array.from(favorites)));
    } catch (error) {
      console.error('Failed to save favorites:', error);
    }
  };

  const loadInsights = () => {
    const loaded = newsService.getInsights(20);
    setInsights(loaded);
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      let fetchedArticles: NewsArticle[] = [];
      
      if (selectedSymbols.length > 0) {
        fetchedArticles = await newsService.fetchNews(selectedSymbols, 30);
      } else {
        fetchedArticles = await newsService.fetchMarketNews();
      }

      // Filter by date range
      const now = Date.now();
      const filtered = fetchedArticles.filter(article => {
        const articleDate = article.publishedAt.getTime();
        const age = now - articleDate;
        
        switch (dateRange) {
          case 'today':
            return age < 24 * 60 * 60 * 1000;
          case 'week':
            return age < 7 * 24 * 60 * 60 * 1000;
          case 'month':
            return age < 30 * 24 * 60 * 60 * 1000;
          default:
            return true;
        }
      });

      setArticles(filtered);
    } catch (error) {
      console.error('Failed to fetch news:', error);
      showToast({
        variant: 'error',
        title: 'Failed to fetch news',
        message: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (articleId: string) => {
    const newFavorites = new Set(favoriteArticles);
    if (newFavorites.has(articleId)) {
      newFavorites.delete(articleId);
    } else {
      newFavorites.add(articleId);
    }
    setFavoriteArticles(newFavorites);
    saveFavorites(newFavorites);
  };

  const handleGenerateInsights = async () => {
    setLoading(true);
    try {
      // Get portfolio from watchlists (simplified - in production would use portfolioService)
      const watchlists = watchlistService.getWatchlists();
      const allSymbols = watchlists.flatMap(w => w.symbols);
      
      if (allSymbols.length === 0) {
        showToast({
          variant: 'info',
          title: 'No symbols',
          message: 'Add symbols to watchlists to generate insights',
        });
        return;
      }

      const news = await newsService.fetchNews(allSymbols, 20);
      // Create a mock portfolio for insights generation
      const mockPortfolio = {
        id: 'mock',
        name: 'Current Holdings',
        holdings: allSymbols.map(symbol => ({
          id: symbol,
          symbol,
          quantity: 1,
          purchasePrice: 0,
          purchaseDate: new Date(),
        })),
        allocation: {} as Record<string, number>,
        performance: {
          totalReturn: 0,
          totalReturnPercent: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newInsights = await newsService.generateInsights(mockPortfolio as any, news);
      setInsights([...newInsights, ...insights]);
      loadInsights();
      
      showToast({
        variant: 'success',
        title: 'Insights generated',
        message: `Generated ${newInsights.length} new insights`,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Failed to generate insights',
        message: (error as Error).message,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = useMemo(() => {
    let filtered = [...articles];

    if (filterSentiment !== 'all') {
      filtered = filtered.filter(a => a.sentiment === filterSentiment);
    }

    if (filterSource !== 'all') {
      filtered = filtered.filter(a => a.source === filterSource);
    }

    return filtered.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }, [articles, filterSentiment, filterSource]);

  const sources = useMemo(() => {
    const sourceSet = new Set(articles.map(a => a.source));
    return Array.from(sourceSet).sort();
  }, [articles]);

  const sentimentCounts = useMemo(() => {
    const counts = { positive: 0, negative: 0, neutral: 0 };
    articles.forEach(a => {
      counts[a.sentiment]++;
    });
    return counts;
  }, [articles]);

  const getInsightIcon = (type: MarketInsight['type']) => {
    switch (type) {
      case 'trend':
        return <TrendingUp size={16} />;
      case 'alert':
        return <AlertTriangle size={16} />;
      case 'recommendation':
        return <Lightbulb size={16} />;
      case 'risk':
        return <Shield size={16} />;
      default:
        return <Sparkles size={16} />;
    }
  };

  const getSentimentIcon = (sentiment: NewsSentiment) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp size={14} className="sentiment-positive" />;
      case 'negative':
        return <TrendingDown size={14} className="sentiment-negative" />;
      default:
        return <Minus size={14} className="sentiment-neutral" />;
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    // Use relative time for older dates, fallback to medium format
    return formatRelativeTime(date);
  };

  return (
    <div className="news-insights-panel">
      <div className="news-insights-header">
      <h2>News & Insights</h2>
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={fetchNews}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
          <button
            className="generate-insights-btn"
            onClick={handleGenerateInsights}
            disabled={loading}
          >
            <Sparkles size={16} />
            Generate Insights
          </button>
        </div>
      </div>

      <div className="news-insights-content">
        <div className="insights-section">
          <h3>AI Insights</h3>
          {insights.length === 0 ? (
            <div className="empty-state">
              <p>No insights yet. Click "Generate Insights" to analyze news.</p>
            </div>
          ) : (
            <div className="insights-list">
              {insights.slice(0, 10).map((insight) => (
                <div key={insight.id} className={`insight-card insight-${insight.type}`}>
                  <div className="insight-header">
                    {getInsightIcon(insight.type)}
                    <span className="insight-type">{insight.type}</span>
                    {insight.asset && (
                      <span className="insight-asset">{insight.asset}</span>
                    )}
                    <span className="insight-confidence">{insight.confidence}% confidence</span>
                  </div>
                  <p className="insight-message">{insight.message}</p>
                  <div className="insight-footer">
                    <span className="insight-time">{formatDate(insight.timestamp)}</span>
                    {insight.actionable && (
                      <span className="actionable-badge">Actionable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="news-section">
          <div className="news-filters">
            <div className="filter-group">
              <Filter size={14} />
              <select
                value={filterSentiment}
                onChange={(e) => setFilterSentiment(e.target.value as NewsSentiment | 'all')}
              >
                <option value="all">All Sentiment</option>
                <option value="positive">Positive ({sentimentCounts.positive})</option>
                <option value="negative">Negative ({sentimentCounts.negative})</option>
                <option value="neutral">Neutral ({sentimentCounts.neutral})</option>
              </select>
            </div>
            <div className="filter-group">
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
              >
                <option value="all">All Sources</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="all">All Time</option>
              </select>
            </div>
          </div>

          <div className="symbol-selector">
            <input
              type="text"
              placeholder="Filter by symbols (comma-separated, e.g., AAPL,TSLA,BTC)"
              value={selectedSymbols.join(',')}
              onChange={(e) => {
                const symbols = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                setSelectedSymbols(symbols);
              }}
            />
          </div>

          {loading ? (
            <div className="loading-state">
              <RefreshCw size={20} className="spinning" />
              <p>Loading news...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="empty-state">
              <p>No news articles found. Try adjusting filters or refreshing.</p>
            </div>
          ) : (
            <div className="articles-list">
              {filteredArticles.map((article) => (
                <div key={article.id} className="article-card">
                  <div className="article-header">
                    <div className="article-sentiment">
                      {getSentimentIcon(article.sentiment)}
                      <span className={`sentiment-label sentiment-${article.sentiment}`}>
                        {article.sentiment}
                      </span>
                    </div>
                    <div className="article-meta">
                      <span className="article-source">{article.source}</span>
                      <span className="article-date">{formatDate(article.publishedAt)}</span>
                      {article.impactScore && (
                        <span className="impact-score" title="Impact Score">
                          Impact: {article.impactScore}
                        </span>
                      )}
                    </div>
                  </div>
                  <h4 className="article-title">{article.title}</h4>
                  <p className="article-summary">{article.summary}</p>
                  {article.relatedAssets.length > 0 && (
                    <div className="article-assets">
                      <span>Related: </span>
                      {article.relatedAssets.map((symbol) => (
                        <span key={symbol} className="asset-tag">
                          {symbol}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="article-footer">
                    <button
                      className={`favorite-btn ${favoriteArticles.has(article.id) ? 'active' : ''}`}
                      onClick={() => handleToggleFavorite(article.id)}
                      title={favoriteArticles.has(article.id) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart size={14} fill={favoriteArticles.has(article.id) ? 'currentColor' : 'none'} />
                    </button>
                    {article.sourceUrl && (
                      <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="external-link-btn"
                      >
                        <ExternalLink size={14} />
                        Read Full Article
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewsInsightsPanel;
