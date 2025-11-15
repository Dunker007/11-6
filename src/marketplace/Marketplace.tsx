/**
 * Template Marketplace Platform
 * Browse, purchase, and deploy pre-built project templates
 */

import { useState, useEffect } from 'react';
import TemplateCard from './TemplateCard';
import TemplateDetail from './TemplateDetail';
import { Template, TemplateCategory } from './types';
import { templateService } from './templateService';
import '../styles-new/marketplace.css';

export default function Marketplace() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, selectedCategory, searchQuery]);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const loadedTemplates = await templateService.getTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleBackToMarketplace = () => {
    setSelectedTemplate(null);
  };

  const categories: { value: TemplateCategory | 'all'; label: string }[] = [
    { value: 'all', label: 'All Templates' },
    { value: 'web-app', label: 'Web Apps' },
    { value: 'mobile-app', label: 'Mobile Apps' },
    { value: 'ai-ml', label: 'AI/ML' },
    { value: 'blockchain', label: 'Blockchain' },
    { value: 'game-dev', label: 'Game Dev' },
    { value: 'data-science', label: 'Data Science' },
    { value: 'dev-tools', label: 'Dev Tools' },
    { value: 'business', label: 'Business' },
  ];

  if (selectedTemplate) {
    return (
      <TemplateDetail
        template={selectedTemplate}
        onBack={handleBackToMarketplace}
      />
    );
  }

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1>Template Marketplace</h1>
        <p>Ready-to-deploy project templates to accelerate your development</p>
      </div>

      <div className="marketplace-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category.value}
              className={`category-button ${selectedCategory === category.value ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.value)}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="marketplace-stats">
        <div className="stat-item">
          <span className="stat-number">{filteredTemplates.length}</span>
          <span className="stat-label">Templates</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {filteredTemplates.reduce((sum, t) => sum + t.downloads, 0)}
          </span>
          <span className="stat-label">Total Downloads</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">
            {filteredTemplates.filter(t => t.featured).length}
          </span>
          <span className="stat-label">Featured</span>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading templates...</p>
        </div>
      ) : (
        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleTemplateSelect}
            />
          ))}
        </div>
      )}

      {!isLoading && filteredTemplates.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3>No templates found</h3>
          <p>Try adjusting your search or category filter</p>
        </div>
      )}
    </div>
  );
}
