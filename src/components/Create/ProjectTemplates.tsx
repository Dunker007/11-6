import { useState, useMemo } from 'react';
import { createService } from '../../services/create/createService';
import type { ProjectTemplate } from '@/types/create';
import '../../styles/ProjectTemplates.css';

interface ProjectTemplatesProps {
  onSelectTemplate: (templateId: string) => void;
}

function ProjectTemplates({ onSelectTemplate }: ProjectTemplatesProps) {
  const [selectedCategory, setSelectedCategory] = useState<ProjectTemplate['category'] | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const templates = useMemo(() => createService.getAllTemplates(), []);
  
  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return Array.from(cats);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.framework?.toLowerCase().includes(query) ||
          t.language.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="project-templates">
      <div className="templates-header">
        <h2>Project Templates</h2>
        <p>Choose a template to get started quickly</p>
      </div>

      <div className="templates-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="category-filters">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="templates-grid">
        {filteredTemplates.length === 0 ? (
          <div className="no-templates">
            <p>No templates found matching your criteria.</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => onSelectTemplate(template.id)}
            >
              <div className="template-icon">{template.icon}</div>
              <div className="template-info">
                <h3>{template.name}</h3>
                <p className="template-description">{template.description}</p>
                <div className="template-meta">
                  {template.framework && (
                    <span className="meta-badge">{template.framework}</span>
                  )}
                  <span className="meta-badge">{template.language}</span>
                </div>
              </div>
              <div className="template-action">
                <button className="use-template-btn">Use Template</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ProjectTemplates;

