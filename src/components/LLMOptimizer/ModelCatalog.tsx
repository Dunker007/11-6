import { useMemo, useState, memo, useCallback } from 'react';
import { Filter, Info, Package, Search, Sparkles, ExternalLink, Download } from 'lucide-react';
import { useDebounce } from '@/utils/hooks/useDebounce';
import { useToast } from '@/components/ui';
import { useLLMStore } from '@/services/ai/llmStore';
import type { ModelCatalogEntry } from '@/types/optimizer';
import ModelDetailModal from './ModelDetailModal';
import QuickModelActions from './QuickModelActions';
import '../../styles/LLMOptimizer.css';
import '../../styles/QuickModelActions.css';

interface ModelCatalogProps {
  entries: ModelCatalogEntry[];
  onSelect?: (entry: ModelCatalogEntry) => void;
}

const ModelCatalog = ({ entries = [], onSelect }: ModelCatalogProps) => {
  const [providerFilter, setProviderFilter] = useState<'all' | ModelCatalogEntry['provider']>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<ModelCatalogEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { showToast } = useToast();
  const { switchToModel, pullModel, pullingModels, generate } = useLLMStore();

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

  const handlePullModel = useCallback(async (entry: ModelCatalogEntry) => {
    if (!entry.pullCommand) return;
    
    try {
      showToast({
        variant: 'info',
        title: 'Pulling model',
        message: `Starting download of ${entry.displayName}...`,
        duration: 3000,
      });

      const success = await pullModel(entry.id, entry.pullCommand);
      
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

  const handleLoadModel = useCallback(async (entry: ModelCatalogEntry) => {
    try {
      const success = await switchToModel(entry.id);
      if (success) {
        showToast({
          variant: 'success',
          title: 'Model loaded',
          message: `Switched to ${entry.displayName}`,
        });
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to load model',
          message: 'Model or provider not available',
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Error',
        message: `Failed to load model: ${(error as Error).message}`,
      });
    }
  }, [switchToModel, showToast]);

  const handleQuickTest = useCallback(async (entry: ModelCatalogEntry) => {
    try {
      showToast({
        variant: 'info',
        title: 'Testing model',
        message: `Sending test prompt to ${entry.displayName}...`,
        duration: 2000,
      });

      const startTime = performance.now();
      const response = await generate('Say "Hello, I am working correctly!" in one sentence.', {
        model: entry.id,
        temperature: 0.7,
        maxTokens: 50,
      });
      const endTime = performance.now();
      const latency = endTime - startTime;

      showToast({
        variant: 'success',
        title: 'Test successful',
        message: `Response: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}" (${latency.toFixed(0)}ms)`,
        duration: 5000,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Test failed',
        message: `Failed to test ${entry.displayName}: ${(error as Error).message}`,
      });
    }
  }, [generate, showToast]);

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

