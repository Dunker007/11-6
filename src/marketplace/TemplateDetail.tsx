/**
 * Template Detail Component
 * Shows detailed information about a selected template
 */

import { useState } from 'react';
import { Template } from './types';
import { templateService } from './templateService';
import { useProjectStore } from '../core/project/projectStore';
import '../styles-new/marketplace.css';

interface TemplateDetailProps {
  template: Template;
  onBack: () => void;
}

export default function TemplateDetail({ template, onBack }: TemplateDetailProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseComplete, setPurchaseComplete] = useState(false);
  const { createProject } = useProjectStore();

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

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const handlePurchase = async () => {
    if (template.price === 0) {
      // Free template - create project directly
      await handleDeploy();
      return;
    }

    setIsPurchasing(true);

    try {
      // Simulate purchase process
      await new Promise(resolve => setTimeout(resolve, 2000));

      const purchase = await templateService.purchaseTemplate(template.id, 'current-user');
      console.log('Purchase completed:', purchase);

      setPurchaseComplete(true);

      // Auto-deploy after purchase
      setTimeout(() => {
        handleDeploy();
      }, 1500);

    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDeploy = async () => {
    try {
      // Create a new project from the template
      const projectName = `${template.name} Project`;
      const project = createProject(projectName);

      // In a real implementation, this would:
      // 1. Download the template files
      // 2. Extract them to the project directory
      // 3. Initialize git repository
      // 4. Install dependencies
      // 5. Open the project in the editor

      console.log('Template deployed as new project:', project);

      // Navigate to the project
      onBack(); // Go back to marketplace
      // The project should now be available in the project panel

    } catch (error) {
      console.error('Deployment failed:', error);
      alert('Deployment failed. Please try again.');
    }
  };

  return (
    <div className="template-detail">
      <div className="detail-header">
        <button className="back-button" onClick={onBack}>
          ← Back to Marketplace
        </button>
        <div className="template-actions">
          {template.demoUrl && (
            <a
              href={template.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="demo-button"
            >
              View Demo
            </a>
          )}
          {template.documentationUrl && (
            <a
              href={template.documentationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="docs-button"
            >
              Documentation
            </a>
          )}
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div className="template-hero">
            <div className="hero-image">
              <div className="template-placeholder-large">
                <div className="template-icon-large">
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

            <div className="hero-info">
              <div className="template-header-info">
                <h1>{template.name}</h1>
                {template.featured && (
                  <div className="featured-badge-large">Featured</div>
                )}
              </div>

              <p className="template-description-full">{template.description}</p>

              <div className="template-meta-large">
                <div className="rating-section">
                  <span className="stars-large">{renderStars(template.rating)}</span>
                  <span className="rating-info">
                    {template.rating} ({template.reviewCount} reviews)
                  </span>
                </div>

                <div className="stats-section">
                  <span className="downloads-large">
                    📥 {template.downloads.toLocaleString()} downloads
                  </span>
                  <span className="file-size-large">
                    📦 {formatFileSize(template.fileSize)}
                  </span>
                </div>
              </div>

              <div className="template-author-large">
                <span className="author-info">
                  Created by {template.author.name}
                  {template.author.verified && ' ✓ Verified'}
                </span>
                <span className="last-updated">
                  Last updated {formatDate(template.lastUpdated)}
                </span>
              </div>
            </div>
          </div>

          <div className="template-details">
            <section className="detail-section">
              <h2>Features</h2>
              <ul className="features-list">
                {template.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </section>

            <section className="detail-section">
              <h2>Tech Stack</h2>
              <div className="tech-stack">
                {template.techStack.map(tech => (
                  <span key={tech} className="tech-tag">{tech}</span>
                ))}
              </div>
            </section>

            <section className="detail-section">
              <h2>Compatibility</h2>
              <div className="compatibility-info">
                {template.compatibility.nodeVersion && (
                  <div className="compat-item">
                    <strong>Node.js:</strong> {template.compatibility.nodeVersion}
                  </div>
                )}
                {template.compatibility.reactVersion && (
                  <div className="compat-item">
                    <strong>React:</strong> {template.compatibility.reactVersion}
                  </div>
                )}
                {template.compatibility.framework && (
                  <div className="compat-item">
                    <strong>Framework:</strong> {template.compatibility.framework}
                  </div>
                )}
              </div>
            </section>

            <section className="detail-section">
              <h2>License & Support</h2>
              <div className="license-info">
                <div className="license-item">
                  <strong>License:</strong> {template.license}
                </div>
                <div className="license-item">
                  <strong>Support:</strong> {template.supportLevel}
                </div>
                <div className="license-item">
                  <strong>Version:</strong> {template.version}
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="purchase-card">
            <div className="price-section">
              <div className="price">
                {formatPrice(template.price, template.currency)}
              </div>
              {template.price > 0 && (
                <div className="price-note">
                  One-time purchase, lifetime access
                </div>
              )}
            </div>

            <button
              className="purchase-button"
              onClick={handlePurchase}
              disabled={isPurchasing || purchaseComplete}
            >
              {isPurchasing ? (
                <>
                  <div className="button-spinner"></div>
                  Processing...
                </>
              ) : purchaseComplete ? (
                'Purchase Complete! Deploying...'
              ) : template.price === 0 ? (
                'Deploy Template'
              ) : (
                `Purchase & Deploy - ${formatPrice(template.price, template.currency)}`
              )}
            </button>

            <div className="purchase-benefits">
              <h4>What's included:</h4>
              <ul>
                <li>✅ Complete source code</li>
                <li>✅ Documentation & setup guide</li>
                <li>✅ 30-day support</li>
                {template.price > 0 && <li>✅ Commercial license</li>}
                <li>✅ Future updates</li>
              </ul>
            </div>
          </div>

          <div className="template-tags-sidebar">
            <h4>Tags</h4>
            <div className="tags-list">
              {template.tags.map(tag => (
                <span key={tag} className="tag-sidebar">{tag}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
