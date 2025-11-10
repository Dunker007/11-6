import { useMemo, useState } from 'react';
import { Filter, Info, Package, Search } from 'lucide-react';
import { useDebounce } from '@/utils/hooks/useDebounce';
import type { ModelCatalogEntry } from '@/types/optimizer';
import '../../styles/LLMOptimizer.css';

interface ModelCatalogProps {
  entries: ModelCatalogEntry[];
  onSelect?: (entry: ModelCatalogEntry) => void;
}

const ModelCatalog = ({ entries = [], onSelect }: ModelCatalogProps) => {
  const [providerFilter, setProviderFilter] = useState<'all' | ModelCatalogEntry['provider']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredEntries = useMemo(() => {
    if (!entries || !Array.isArray(entries)) {
      return [];
    }
    return entries
      .filter((entry) => providerFilter === 'all' || entry.provider === providerFilter)
      .filter((entry) => {
        if (!debouncedSearchTerm) return true;
        const needle = debouncedSearchTerm.toLowerCase();
        return (
          entry.displayName.toLowerCase().includes(needle) ||
          entry.family.toLowerCase().includes(needle) ||
          entry.tags.some((tag) => tag.toLowerCase().includes(needle))
        );
      });
  }, [entries, providerFilter, debouncedSearchTerm]);

  return (
    <div className="model-catalog-card">
      <div className="model-catalog-header">
        <div className="catalog-title">
          <Package size={18} />
          <h3>Model Catalog</h3>
          <span className="catalog-count">{entries.length} curated models</span>
        </div>
        <div className="catalog-controls">
          <div className="catalog-search">
            <Search size={14} />
            <input
              type="search"
              placeholder="Search models, families, tags…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <div className="catalog-filter">
            <Filter size={14} />
            <select value={providerFilter} onChange={(event) => setProviderFilter(event.target.value as any)}>
              <option value="all">All providers</option>
              <option value="ollama">Ollama</option>
              <option value="lmstudio">LM Studio</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </div>
        </div>
      </div>

      <div className="catalog-grid">
        {filteredEntries.map((entry) => (
          <button
            key={entry.id}
            className="catalog-card"
            onClick={() => onSelect?.(entry)}
            type="button"
          >
            <div className="catalog-card-header">
              <span className={`provider-chip ${entry.provider}`}>{entry.provider}</span>
              <span className="model-family">{entry.family}</span>
            </div>
            <div className="catalog-card-body">
              <h4>{entry.displayName}</h4>
              <p>{entry.description}</p>
            </div>
            <div className="catalog-card-footer">
              <div className="catalog-meta">
                <span>{entry.sizeGB > 0 ? `${entry.sizeGB} GB` : 'Cloud hosted'}</span>
                <span>{entry.contextWindow.toLocaleString()} tokens</span>
              </div>
              <div className="catalog-tags">
                {entry.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="catalog-tag">
                    {tag}
                  </span>
                ))}
                {entry.tags.length > 3 && (
                  <span className="catalog-tag more">+{entry.tags.length - 3}</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="catalog-empty">
          <Info size={16} />
          <p>No models match the current filters.</p>
        </div>
      )}
    </div>
  );
};

export default ModelCatalog;

