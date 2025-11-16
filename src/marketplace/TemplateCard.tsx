/**
 * Template Card Component
 * Displays individual template information in the marketplace grid
 */

import { Template } from './types';
import '../styles-new/marketplace.css';

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
}

export default function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const formatPrice = (price: number, currency: string) => {
    if (price === 0) return 'Free';
    return `${currency === 'USD' ? '$' : currency}${price}`;
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push('⭐');
    }

    if (hasHalfStar) {
      stars.push('⭐');
    }

    while (stars.length < 5) {
      stars.push('☆');
    }

    return stars.join('');
  };

  return (
    <div className="template-card" onClick={() => onSelect(template)}>
      <div className="template-header">
        {template.featured && (
          <div className="featured-badge">Featured</div>
        )}
        <div className="template-price">
          {formatPrice(template.price, template.currency)}
        </div>
      </div>

      <div className="template-image">
        {/* Placeholder for template screenshot */}
        <div className="template-placeholder">
          <div className="template-icon">
            {template.category === 'web-app' && '🌐'}
            {template.category === 'ai-ml' && '🤖'}
            {template.category === 'blockchain' && '⛓️'}
            {template.category === 'mobile-app' && '📱'}
            {template.category === 'game-dev' && '🎮'}
            {template.category === 'data-science' && '📊'}
            {template.category === 'dev-tools' && '🛠️'}
            {template.category === 'business' && '💼'}
          </div>
        </div>
      </div>

      <div className="template-content">
        <h3 className="template-name">{template.name}</h3>
        <p className="template-description">{template.description}</p>

        <div className="template-meta">
          <div className="template-rating">
            <span className="stars">{renderStars(template.rating)}</span>
            <span className="rating-text">
              {template.rating} ({template.reviewCount})
            </span>
          </div>

          <div className="template-stats">
            <span className="downloads">
              📥 {template.downloads.toLocaleString()}
            </span>
            <span className="file-size">
              📦 {formatFileSize(template.fileSize)}
            </span>
          </div>
        </div>

        <div className="template-tags">
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          {template.tags.length > 3 && (
            <span className="tag more">+{template.tags.length - 3}</span>
          )}
        </div>

        <div className="template-author">
          <span className="author-name">
            by {template.author.name}
            {template.author.verified && ' ✓'}
          </span>
        </div>
      </div>

      <div className="template-footer">
        <div className="template-category">{template.category.replace('-', ' ')}</div>
        <div className="template-version">v{template.version}</div>
      </div>
    </div>
  );
}
