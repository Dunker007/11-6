/**
 * HelpPanel.tsx
 *
 * PURPOSE:
 * Comprehensive in-app help system with searchable docs, FAQs,
 * video tutorials, and keyboard shortcuts.
 *
 * FEATURES:
 * - Searchable help articles
 * - Category browsing
 * - FAQ section
 * - Keyboard shortcuts reference
 * - Related articles
 * - Favorite articles
 *
 * USAGE:
 * <HelpPanel />
 */

import React, { useState, useEffect } from 'react';
import {
  useHelpSystemStore,
  helpSystemService,
  HelpArticle,
  HelpCategory,
} from '../../services/help/helpSystemService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import ReactMarkdown from 'react-markdown';
import './HelpPanel.css';

export const HelpPanel: React.FC = () => {
  const {
    isOpen,
    activeCategory,
    activeArticle,
    searchQuery,
    searchResults,
    favoriteArticles,
    closeHelp,
    setActiveCategory,
    setActiveArticle,
    search,
    toggleFavorite,
    clearSearch,
  } = useHelpSystemStore();

  const [view, setView] = useState<'browse' | 'search' | 'faq' | 'shortcuts'>('browse');

  useEffect(() => {
    if (searchQuery) {
      setView('search');
    }
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleCategoryClick = (category: HelpCategory) => {
    setActiveCategory(category);
    setActiveArticle(null);
    clearSearch();
    setView('browse');
  };

  const handleArticleClick = (article: HelpArticle) => {
    setActiveArticle(article);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    search(e.target.value);
  };

  const handleBack = () => {
    if (activeArticle) {
      setActiveArticle(null);
    } else if (activeCategory) {
      setActiveCategory(null);
    } else {
      setView('browse');
      clearSearch();
    }
  };

  return (
    <div className="help-panel-overlay">
      <div className="help-panel-container">
        {/* Header */}
        <div className="help-panel-header">
          <div className="help-panel-title-row">
            {(activeArticle || activeCategory || view !== 'browse') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="help-back-button"
              >
                ← Back
              </Button>
            )}
            <h2 className="help-panel-title">
              {activeArticle?.title || (activeCategory ? helpSystemService.getCategoryName(activeCategory) : 'Help Center')}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeHelp}
              className="help-close-button"
            >
              ✕
            </Button>
          </div>

          {/* Search */}
          <div className="help-search-container">
            <input
              type="text"
              className="help-search-input"
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={handleSearch}
            />
            {searchQuery && (
              <button
                className="help-search-clear"
                onClick={() => {
                  clearSearch();
                  setView('browse');
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* View Tabs */}
          {!activeArticle && !activeCategory && (
            <div className="help-view-tabs">
              <button
                className={`help-tab ${view === 'browse' ? 'active' : ''}`}
                onClick={() => setView('browse')}
              >
                📚 Browse
              </button>
              <button
                className={`help-tab ${view === 'faq' ? 'active' : ''}`}
                onClick={() => setView('faq')}
              >
                ❓ FAQ
              </button>
              <button
                className={`help-tab ${view === 'shortcuts' ? 'active' : ''}`}
                onClick={() => setView('shortcuts')}
              >
                ⌨️ Shortcuts
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="help-panel-content">
          {view === 'search' && searchQuery ? (
            <SearchResults
              results={searchResults}
              query={searchQuery}
              onArticleClick={handleArticleClick}
            />
          ) : activeArticle ? (
            <ArticleView
              article={activeArticle}
              isFavorite={favoriteArticles.includes(activeArticle.id)}
              onToggleFavorite={() => toggleFavorite(activeArticle.id)}
              onRelatedClick={handleArticleClick}
            />
          ) : activeCategory ? (
            <CategoryView
              category={activeCategory}
              onArticleClick={handleArticleClick}
            />
          ) : view === 'browse' ? (
            <BrowseView onCategoryClick={handleCategoryClick} />
          ) : view === 'faq' ? (
            <FAQView />
          ) : view === 'shortcuts' ? (
            <ShortcutsView />
          ) : null}
        </div>

        {/* Footer */}
        <div className="help-panel-footer">
          <span className="help-footer-text">
            Need more help? Contact support at support@dlxstudios.com
          </span>
        </div>
      </div>
    </div>
  );
};

// Browse View - Show all categories
const BrowseView: React.FC<{ onCategoryClick: (category: HelpCategory) => void }> = ({
  onCategoryClick,
}) => {
  const categories: HelpCategory[] = [
    'getting-started',
    'connecting-services',
    'content-creation',
    'revenue-tracking',
    'ai-features',
    'automation',
    'troubleshooting',
    'advanced',
  ];

  return (
    <div className="help-browse-view">
      <div className="help-intro">
        <h3>Welcome to the Help Center</h3>
        <p>Browse by category or search for specific topics above.</p>
      </div>

      <div className="help-categories-grid">
        {categories.map((category) => {
          const articles = helpSystemService.getArticlesByCategory(category);
          return (
            <Card
              key={category}
              className="help-category-card"
              onClick={() => onCategoryClick(category)}
            >
              <div className="help-category-icon">
                {helpSystemService.getCategoryIcon(category)}
              </div>
              <h4 className="help-category-name">
                {helpSystemService.getCategoryName(category)}
              </h4>
              <p className="help-category-count">
                {articles.length} article{articles.length !== 1 ? 's' : ''}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="help-popular-section">
        <h3>Popular Articles</h3>
        <div className="help-article-list">
          <ArticleListItem
            article={helpSystemService.getArticleById('getting-started-intro')!}
            onClick={() => {}}
          />
          <ArticleListItem
            article={helpSystemService.getArticleById('connect-stripe')!}
            onClick={() => {}}
          />
          <ArticleListItem
            article={helpSystemService.getArticleById('content-generate-blog')!}
            onClick={() => {}}
          />
        </div>
      </div>
    </div>
  );
};

// Category View - Show articles in a category
const CategoryView: React.FC<{
  category: HelpCategory;
  onArticleClick: (article: HelpArticle) => void;
}> = ({ category, onArticleClick }) => {
  const articles = helpSystemService.getArticlesByCategory(category);

  return (
    <div className="help-category-view">
      <div className="help-category-header">
        <div className="help-category-icon-large">
          {helpSystemService.getCategoryIcon(category)}
        </div>
        <p className="help-category-description">
          {articles.length} article{articles.length !== 1 ? 's' : ''} in this category
        </p>
      </div>

      <div className="help-article-list">
        {articles.map((article) => (
          <ArticleListItem
            key={article.id}
            article={article}
            onClick={() => onArticleClick(article)}
          />
        ))}
      </div>
    </div>
  );
};

// Article View - Show single article
const ArticleView: React.FC<{
  article: HelpArticle;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRelatedClick: (article: HelpArticle) => void;
}> = ({ article, isFavorite, onToggleFavorite, onRelatedClick }) => {
  const relatedArticles = helpSystemService.getRelatedArticles(article.id);

  return (
    <div className="help-article-view">
      <div className="help-article-header">
        <div className="help-article-meta">
          <span className="help-article-category">
            {helpSystemService.getCategoryIcon(article.category)}{' '}
            {helpSystemService.getCategoryName(article.category)}
          </span>
          <span className="help-article-difficulty">{article.difficulty}</span>
          {article.estimatedReadTime && (
            <span className="help-article-time">
              ⏱️ {article.estimatedReadTime} min read
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleFavorite}
          className="help-favorite-button"
        >
          {isFavorite ? '★' : '☆'}
        </Button>
      </div>

      <div className="help-article-content">
        <ReactMarkdown>{article.content}</ReactMarkdown>
      </div>

      {article.videoUrl && (
        <div className="help-article-video">
          <h4>📹 Video Tutorial</h4>
          <a href={article.videoUrl} target="_blank" rel="noopener noreferrer">
            Watch video tutorial
          </a>
        </div>
      )}

      {relatedArticles.length > 0 && (
        <div className="help-related-articles">
          <h4>Related Articles</h4>
          <div className="help-article-list">
            {relatedArticles.map((relatedArticle) => (
              <ArticleListItem
                key={relatedArticle.id}
                article={relatedArticle}
                onClick={() => onRelatedClick(relatedArticle)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Search Results
const SearchResults: React.FC<{
  results: HelpArticle[];
  query: string;
  onArticleClick: (article: HelpArticle) => void;
}> = ({ results, query, onArticleClick }) => {
  return (
    <div className="help-search-results">
      <div className="help-search-header">
        <h3>
          Search Results for "{query}" ({results.length})
        </h3>
      </div>

      {results.length > 0 ? (
        <div className="help-article-list">
          {results.map((article) => (
            <ArticleListItem
              key={article.id}
              article={article}
              onClick={() => onArticleClick(article)}
            />
          ))}
        </div>
      ) : (
        <div className="help-no-results">
          <div className="help-no-results-icon">🔍</div>
          <h4>No results found</h4>
          <p>Try searching with different keywords</p>
        </div>
      )}
    </div>
  );
};

// FAQ View
const FAQView: React.FC = () => {
  const faqs = helpSystemService.getAllFAQs();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="help-faq-view">
      <div className="help-faq-intro">
        <h3>Frequently Asked Questions</h3>
        <p>Quick answers to common questions</p>
      </div>

      <div className="help-faq-list">
        {faqs.map((faq) => (
          <Card
            key={faq.id}
            className="help-faq-item"
            onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
          >
            <div className="help-faq-question">
              <span>{faq.question}</span>
              <span className="help-faq-toggle">
                {expandedId === faq.id ? '−' : '+'}
              </span>
            </div>
            {expandedId === faq.id && (
              <div className="help-faq-answer">{faq.answer}</div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

// Shortcuts View
const ShortcutsView: React.FC = () => {
  const shortcuts = helpSystemService.getKeyboardShortcuts();
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div className="help-shortcuts-view">
      <div className="help-shortcuts-intro">
        <h3>Keyboard Shortcuts</h3>
        <p>Speed up your workflow with these shortcuts</p>
      </div>

      {categories.map((category) => (
        <div key={category} className="help-shortcuts-category">
          <h4>{category}</h4>
          <div className="help-shortcuts-list">
            {shortcuts
              .filter((s) => s.category === category)
              .map((shortcut, index) => (
                <div key={index} className="help-shortcut-item">
                  <kbd className="help-shortcut-key">{shortcut.keys}</kbd>
                  <span className="help-shortcut-description">
                    {shortcut.description}
                  </span>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Article List Item Component
const ArticleListItem: React.FC<{
  article: HelpArticle;
  onClick: () => void;
}> = ({ article, onClick }) => {
  return (
    <Card className="help-article-list-item" onClick={onClick}>
      <div className="help-article-list-icon">
        {helpSystemService.getCategoryIcon(article.category)}
      </div>
      <div className="help-article-list-content">
        <h5 className="help-article-list-title">{article.title}</h5>
        <div className="help-article-list-meta">
          <span className="help-article-list-category">
            {helpSystemService.getCategoryName(article.category)}
          </span>
          {article.estimatedReadTime && (
            <span className="help-article-list-time">
              {article.estimatedReadTime} min
            </span>
          )}
        </div>
      </div>
      <div className="help-article-list-arrow">→</div>
    </Card>
  );
};

// Floating Help Button
export const HelpButton: React.FC = () => {
  const { openHelp } = useHelpSystemStore();

  return (
    <button
      className="help-floating-button"
      onClick={() => openHelp()}
      title="Need help? (Press ?)"
    >
      ?
    </button>
  );
};

export default HelpPanel;
