// src/components/LLMOptimizer/IdeaList.tsx
import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, CheckSquare, Square, Download, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { ideaInventoryService, Idea } from '@/services/idea/ideaInventoryService';
import { useDebounce } from '@/utils/hooks/useDebounce';

interface IdeaListProps {
  onIdeaSelect?: (idea: Idea | null) => void;
  selectedIdeaId?: string | null;
}

function IdeaList({ onIdeaSelect, selectedIdeaId }: IdeaListProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadIdeas();
  }, []);

  const loadIdeas = () => {
    ideaInventoryService.refresh();
    setIdeas(ideaInventoryService.getAllIdeas());
  };

  const topics = useMemo(() => {
    return ['all', ...ideaInventoryService.getTopics()];
  }, []);

  const filteredIdeas = useMemo(() => {
    let filtered = ideas;

    if (selectedTopic !== 'all') {
      filtered = filtered.filter(idea => idea.topic === selectedTopic);
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(idea =>
        idea.title.toLowerCase().includes(query) ||
        idea.description.toLowerCase().includes(query) ||
        idea.topic.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [ideas, selectedTopic, debouncedSearchQuery]);

  const handleToggleStatus = (id: string, currentStatus: 'keep' | 'delete' | 'pending') => {
    const newStatus = currentStatus === 'keep' ? 'delete' : 'keep';
    ideaInventoryService.updateIdeaStatus(id, newStatus);
    setIdeas(ideaInventoryService.getAllIdeas());
  };

  const handleBulkAction = (action: 'keep-all' | 'delete-all' | 'delete-selected') => {
    if (action === 'keep-all') {
      ideaInventoryService.bulkUpdateStatus(filteredIdeas.map(i => i.id), 'keep');
    } else if (action === 'delete-all') {
      ideaInventoryService.bulkUpdateStatus(filteredIdeas.map(i => i.id), 'delete');
    } else if (action === 'delete-selected') {
      const selectedIds = filteredIdeas.filter(i => i.status === 'keep').map(i => i.id);
      ideaInventoryService.bulkUpdateStatus(selectedIds, 'delete');
    }
    setIdeas(ideaInventoryService.getAllIdeas());
  };

  const handleExport = () => {
    const json = ideaInventoryService.exportIdeas(idea => idea.status === 'keep');
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `idea-inventory-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getStatusIcon = (status: 'keep' | 'delete' | 'pending') => {
    switch (status) {
      case 'keep':
        return <CheckCircle2 size={16} className="status-icon keep" />;
      case 'delete':
        return <XCircle size={16} className="status-icon delete" />;
      default:
        return <Square size={16} className="status-icon pending" />;
    }
  };

  const getTopicColor = (topic: string): string => {
    const colors: Record<string, string> = {
      'Passive Income': 'var(--emerald-500)',
      'LLM Optimization': 'var(--violet-500)',
      'AI Features': 'var(--cyan-500)',
      'Developer Experience': 'var(--blue-500)',
      'Revenue Streams': 'var(--amber-500)',
      'Infrastructure': 'var(--red-500)',
    };
    return colors[topic] || 'var(--text-muted)';
  };

  const stats = useMemo(() => {
    const kept = ideas.filter(i => i.status === 'keep').length;
    const deleted = ideas.filter(i => i.status === 'delete').length;
    const pending = ideas.filter(i => i.status === 'pending').length;
    return { total: ideas.length, kept, deleted, pending };
  }, [ideas]);

  return (
    <div className="idea-list-panel">
      {/* Header */}
      <div className="idea-list-header">
        <h3>Idea Inventory</h3>
        <div className="idea-list-stats">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item keep">
            <span className="stat-value">{stats.kept}</span>
            <span className="stat-label">Keep</span>
          </div>
          <div className="stat-item pending">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="idea-list-controls">
        <div className="search-filter-group">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search ideas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="idea-search-input"
            />
          </div>
          <div className="filter-select-wrapper">
            <Filter size={18} className="filter-icon" />
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="topic-filter-select"
            >
              {topics.map(topic => (
                <option key={topic} value={topic}>
                  {topic === 'all' ? 'All Topics' : topic}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="action-buttons">
          <button
            onClick={() => handleBulkAction('keep-all')}
            className="action-btn secondary"
            title="Mark all as keep"
          >
            <CheckSquare size={16} />
            Keep All
          </button>
          <button
            onClick={handleExport}
            className="action-btn secondary"
            title="Export kept ideas"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={loadIdeas}
            className="action-btn secondary"
            title="Refresh ideas"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Ideas List */}
      <div className="idea-list-content">
        {filteredIdeas.length === 0 ? (
          <div className="empty-state">
            <p>No ideas found matching your filters.</p>
          </div>
        ) : (
          filteredIdeas.map(idea => {
            const isExpanded = expandedIds.has(idea.id);
            const isSelected = selectedIdeaId === idea.id;
            const descriptionLines = idea.description.split('\n');
            const isLongDescription = descriptionLines.length > 1 || idea.description.length > 150;
            const displayDescription = isExpanded || !isLongDescription
              ? idea.description
              : `${idea.description.substring(0, 150)}...`;

            return (
              <div
                key={idea.id}
                className={`idea-item ${idea.status} ${isSelected ? 'selected' : ''}`}
                onClick={() => onIdeaSelect?.(idea)}
              >
                <div className="idea-item-header">
                  <div className="idea-checkbox-wrapper">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(idea.id, idea.status);
                      }}
                      className={`idea-checkbox ${idea.status}`}
                      title={idea.status === 'keep' ? 'Mark as delete' : 'Mark as keep'}
                    >
                      {getStatusIcon(idea.status)}
                    </button>
                  </div>
                  <div className="idea-content">
                    <div className="idea-title-row">
                      <h4 className="idea-title">{idea.title}</h4>
                      <span
                        className="topic-badge"
                        style={{ backgroundColor: getTopicColor(idea.topic) + '20', color: getTopicColor(idea.topic) }}
                      >
                        {idea.topic}
                      </span>
                    </div>
                    <p className="idea-description">
                      {displayDescription}
                      {isLongDescription && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(idea.id);
                          }}
                          className="expand-toggle"
                        >
                          {isExpanded ? ' Show less' : ' Show more'}
                        </button>
                      )}
                    </p>
                    <div className="idea-meta">
                      <span className="idea-source">Source: {idea.source}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default IdeaList;

