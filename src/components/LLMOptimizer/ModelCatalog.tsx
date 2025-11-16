/**
 * ModelCatalog.tsx
 * 
 * PURPOSE:
 * Model catalog browser component for LLM Optimizer. Displays curated list of recommended
 * LLM models with filtering, search, and quick actions. Allows users to browse, select,
 * and pull models from the catalog.
 * 
 * ARCHITECTURE:
 * Catalog display component with:
 * - Model list with metadata (size, quantization, context window)
 * - Provider filtering (all, ollama, lmstudio)
 * - Search functionality (debounced)
 * - Model detail modal
 * - Quick actions (switch, pull, test)
 * - Download link handling
 * 
 * Features:
 * - Filter by provider
 * - Search by name/description
 * - Model details on click
 * - Quick model switching
 * - Model pulling (Ollama/LM Studio)
 * - External download links
 * 
 * CURRENT STATUS:
 * ✅ Model catalog display
 * ✅ Provider filtering
 * ✅ Search functionality
 * ✅ Model detail modal
 * ✅ Quick actions integration
 * ✅ Model switching
 * ✅ Model pulling
 * ✅ Download link handling
 * ✅ Memoized component
 * 
 * DEPENDENCIES:
 * - useLLMStore: Model operations (switch, pull, generate)
 * - useDebounce: Search debouncing
 * - ModelDetailModal: Model details display
 * - QuickModelActions: Quick action buttons
 * - @/types/optimizer: ModelCatalogEntry type
 * 
 * STATE MANAGEMENT:
 * - Local state: providerFilter, searchTerm, selectedEntry, isModalOpen
 * - Uses Zustand store for model operations
 * - Debounced search term
 * 
 * PERFORMANCE:
 * - Memoized component
 * - Debounced search (300ms)
 * - Efficient filtering
 * - Lazy modal rendering
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import ModelCatalog from '@/components/LLMOptimizer/ModelCatalog';
 * 
 * function LLMOptimizerPanel() {
 *   const { modelCatalog } = useLLMOptimizerStore();
 *   return <ModelCatalog entries={modelCatalog} />;
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/ai/llmOptimizerStore.ts: Catalog data source
 * - src/components/LLMOptimizer/ModelDetailModal.tsx: Details display
 * - src/components/LLMOptimizer/QuickModelActions.tsx: Quick actions
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Model comparison view
 * - Favorite models
 * - Recently used models
 * - Model performance history
 * - Custom model recommendations
 */
import { useMemo, useState, memo, useCallback } from 'react';
import { Filter, Info, Package, Search, Sparkles, ExternalLink, Download, Star } from 'lucide-react';
import { useDebounce } from '@/utils/hooks/useDebounce';
import { useToast } from '@/components/ui';
import { useLLMStore } from '@/services/ai/llmStore';
import type { ModelCatalogEntry } from '@/types/optimizer';
import { measureRender, measureAsync } from '@/utils/performance';
import ModelDetailModal from './ModelDetailModal';
import QuickModelActions from './QuickModelActions';
import '../../styles/LLMOptimizer.css';
import '../../styles/QuickModelActions.css';

interface ModelCatalogProps {
  entries: ModelCatalogEntry[];
  onSelect?: (entry: ModelCatalogEntry) => void;
}

/**
 * Catalog grid for exploring recommended LLM models with filtering and quick actions.
 *
 * @param entries - Complete list of catalog entries to display.
 * @param onSelect - Optional handler invoked when a catalog entry is opened.
 * @returns Model catalog card UI.
 */
const ModelCatalog = ({ entries = [], onSelect }: ModelCatalogProps) => {
  const [providerFilter, setProviderFilter] = useState<'all' | ModelCatalogEntry['provider']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<ModelCatalogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { showToast } = useToast();
  const { pullModel, pullingModels, toggleFavorite, isFavorite } = useLLMStore();

  /**
   * Launch the external download URL for a catalog entry and surface toast feedback.
   *
   * @param entry - Catalog entry whose download link should be opened.
   */
  const handleDownload = useCallback(async (entry: ModelCatalogEntry) => {
    if (!entry.downloadUrl) return;
    
    try {
      if (window.llm?.openExternalUrl) {
        const result = await window.llm.openExternalUrl(entry.downloadUrl);
        if (result.success) {
          showToast({
            variant: 'success',
            title: 'Opening download page',
            message: `Opening ${entry.displayName} download page in your browser`,
          });
        } else {
          showToast({
            variant: 'error',
            title: 'Failed to open link',
            message: result.error || 'Could not open download URL',
          });
        }
      } else {
        // Fallback to window.open if IPC not available
        window.open(entry.downloadUrl, '_blank');
        showToast({
          variant: 'info',
          title: 'Opening download page',
          message: `Opening ${entry.displayName} download page`,
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Error',
        message: `Failed to open download link: ${(error as Error).message}`,
      });
    }
  }, [showToast]);

  /**
   * Invoke the pull command for an entry via the LLM store and display status toasts.
   *
   * @param entry - Catalog entry to pull into the local runtime.
   */
  const handlePullModel = useCallback(async (entry: ModelCatalogEntry) => {
    if (!entry.pullCommand) return;
    
    try {
      showToast({
        variant: 'info',
        title: 'Pulling model',
        message: `Starting download of ${entry.displayName}...`,
        duration: 3000,
      });

      const success = await measureAsync(
        `ModelCatalog.pullModel:${entry.id}`,
        () => pullModel(entry.id, entry.pullCommand || ''),
        5000,
        { provider: entry.provider, sizeGB: entry.sizeGB }
      );
      
      if (success) {
        showToast({
          variant: 'success',
          title: 'Model pulled',
          message: `${entry.displayName} has been downloaded successfully`,
        });
        // Refresh providers to update model list
        // This will be handled by pullModel
      } else {
        showToast({
          variant: 'error',
          title: 'Pull failed',
          message: `Failed to pull ${entry.displayName}. Make sure Ollama is running.`,
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Error',
        message: `Failed to pull model: ${(error as Error).message}`,
      });
    }
  }, [pullModel, showToast]);

  // TODO: Implement handleLoadModel and handleQuickTest when needed
  // These functions are defined but not currently used in the UI

  const filteredEntries = useMemo(() => {
    return measureRender(
      'ModelCatalog.filterEntries',
      () => {
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
          })
          .sort((a, b) => {
            // Sort favorites to the top
            const aFav = isFavorite(a.id);
            const bFav = isFavorite(b.id);
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
            return 0; // Keep original order for non-favorites
          });
      },
      8,
      { totalEntries: entries?.length ?? 0, providerFilter, hasSearch: Boolean(debouncedSearchTerm) }
    );
  }, [entries, providerFilter, debouncedSearchTerm, isFavorite]);

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
          <div
            key={entry.id}
            className={`catalog-card ${entry.optimizationMethod === 'unsloth-dynamic-2.0' ? 'unsloth-optimized' : ''}`}
            onClick={() => onSelect?.(entry)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect?.(entry);
              }
            }}
          >
            <div className="catalog-card-header">
              <div className="header-badges">
                <span className={`provider-chip ${entry.provider}`}>{entry.provider}</span>
                {entry.optimizationMethod === 'unsloth-dynamic-2.0' && (
                  <span 
                    className="optimization-badge unsloth-badge" 
                    title="Unsloth Dynamic 2.0 - Optimized quantization with better accuracy"
                  >
                    <Sparkles size={12} />
                    Dynamic 2.0
                  </span>
                )}
              </div>
              <div className="header-right">
                <button
                  className={`favorite-btn ${isFavorite(entry.id) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(entry.id);
                  }}
                  title={isFavorite(entry.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star size={14} fill={isFavorite(entry.id) ? 'currentColor' : 'none'} />
                </button>
                <span className="model-family">{entry.family}</span>
              </div>
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
              <div className="catalog-actions">
                <QuickModelActions model={entry} compact={true} />
                {entry.downloadUrl && (
                  <button
                    className="catalog-action-btn download-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(entry);
                    }}
                    title={`Download ${entry.displayName} from HuggingFace`}
                  >
                    <Download size={14} />
                    <ExternalLink size={12} />
                  </button>
                )}
                {entry.pullCommand && (
                  <button
                    className={`catalog-action-btn pull-btn ${pullingModels.has(entry.id) ? 'pulling' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePullModel(entry);
                    }}
                    disabled={pullingModels.has(entry.id)}
                    title={`Pull ${entry.displayName} via Ollama`}
                  >
                    <Download size={14} className={pullingModels.has(entry.id) ? 'spinning' : ''} />
                  </button>
                )}
                <button
                  className="catalog-action-btn test-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEntry(entry);
                    setIsModalOpen(true);
                    onSelect?.(entry);
                  }}
                  title={`View details for ${entry.displayName}`}
                >
                  <Info size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEntries.length === 0 && (
        <div className="catalog-empty">
          <Info size={16} />
          <p>No models match the current filters.</p>
        </div>
      )}

      <ModelDetailModal
        entry={selectedEntry}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default memo(ModelCatalog);

