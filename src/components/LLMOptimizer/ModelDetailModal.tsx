import { useState, useEffect, useCallback } from 'react';
import { X, Download, Zap, Play, ExternalLink, CheckCircle2, XCircle, AlertCircle, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui';
import { useLLMStore } from '@/services/ai/llmStore';
import { useHealthStore } from '@/services/health/healthStore';
import type { ModelCatalogEntry } from '@/types/optimizer';
import '../../styles/LLMOptimizer.css';

interface ModelDetailModalProps {
  entry: ModelCatalogEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

const ModelDetailModal = ({ entry, isOpen, onClose }: ModelDetailModalProps) => {
  const { showToast } = useToast();
  const activeModel = useLLMStore((state) => state.activeModel);
  const switchToModel = useLLMStore((state) => state.switchToModel);
  const pullModel = useLLMStore((state) => state.pullModel);
  const pullingModels = useLLMStore((state) => state.pullingModels);
  const models = useLLMStore((state) => state.models);
  const { stats } = useHealthStore();
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (entry && models.length > 0) {
      // Check if model is installed by looking in models list
      const installed = models.some(
        (m) => m.id === entry.id || m.name.toLowerCase().includes(entry.displayName.toLowerCase())
      );
      setIsInstalled(installed);
    }
  }, [entry, models]);

  const handlePull = useCallback(async () => {
    if (!entry?.pullCommand) return;

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
        setIsInstalled(true);
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
  }, [entry, pullModel, showToast]);

  const handleLoad = useCallback(async () => {
    if (!entry) return;

    try {
      const success = await switchToModel(entry.id);
      if (success) {
        showToast({
          variant: 'success',
          title: 'Model loaded',
          message: `Switched to ${entry.displayName}`,
        });
        onClose();
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
  }, [entry, switchToModel, showToast, onClose]);

  const handleDownload = useCallback(async () => {
    if (!entry?.downloadUrl) return;

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
  }, [entry, showToast]);

  const checkCompatibility = () => {
    if (!entry || !stats) return null;

    const issues: string[] = [];
    const warnings: string[] = [];

    if (entry.minSystemMemoryGB && stats.memory.total) {
      const totalGB = stats.memory.total / (1024 ** 3);
      if (totalGB < entry.minSystemMemoryGB) {
        issues.push(`Requires ${entry.minSystemMemoryGB}GB RAM, you have ${totalGB.toFixed(1)}GB`);
      }
    }

    if (entry.minGpuMemoryGB && stats.gpu?.memoryTotalGB) {
      if (stats.gpu.memoryTotalGB < entry.minGpuMemoryGB) {
        issues.push(`Requires ${entry.minGpuMemoryGB}GB VRAM, you have ${stats.gpu.memoryTotalGB.toFixed(1)}GB`);
      }
    }

    if (entry.minGpuMemoryGB && !stats.gpu?.name) {
      warnings.push('Discrete GPU recommended for best performance');
    }

    return { issues, warnings };
  };

  if (!isOpen || !entry) return null;

  const compatibility = checkCompatibility();
  const isPulling = pullingModels.has(entry.id);
  const isActive = activeModel?.id === entry.id;

  return (
    <div className="model-detail-modal-overlay" onClick={onClose}>
      <div className="model-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="model-detail-header">
          <div className="model-detail-title">
            <div className="model-detail-badges">
              <span className={`provider-chip ${entry.provider}`}>{entry.provider}</span>
              {entry.optimizationMethod === 'unsloth-dynamic-2.0' && (
                <span className="optimization-badge unsloth-badge">
                  <Sparkles size={12} />
                  Dynamic 2.0
                </span>
              )}
              {isInstalled && (
                <span className="installed-badge">
                  <CheckCircle2 size={12} />
                  Installed
                </span>
              )}
              {isActive && (
                <span className="active-badge">
                  <Zap size={12} />
                  Active
                </span>
              )}
            </div>
            <h2>{entry.displayName}</h2>
            <p className="model-detail-family">{entry.family}</p>
          </div>
          <button className="model-detail-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="model-detail-content">
          <div className="model-detail-section">
            <h3>Description</h3>
            <p>{entry.description}</p>
          </div>

          <div className="model-detail-section">
            <h3>Specifications</h3>
            <div className="model-detail-specs">
              <div className="spec-item">
                <span className="spec-label">Size:</span>
                <span className="spec-value">{entry.sizeGB > 0 ? `${entry.sizeGB} GB` : 'Cloud hosted'}</span>
              </div>
              {entry.quantization && (
                <div className="spec-item">
                  <span className="spec-label">Quantization:</span>
                  <span className="spec-value">{entry.quantization}</span>
                </div>
              )}
              <div className="spec-item">
                <span className="spec-label">Context Window:</span>
                <span className="spec-value">{entry.contextWindow.toLocaleString()} tokens</span>
              </div>
              {entry.minSystemMemoryGB && (
                <div className="spec-item">
                  <span className="spec-label">Min RAM:</span>
                  <span className="spec-value">{entry.minSystemMemoryGB} GB</span>
                </div>
              )}
              {entry.minGpuMemoryGB && (
                <div className="spec-item">
                  <span className="spec-label">Min VRAM:</span>
                  <span className="spec-value">{entry.minGpuMemoryGB} GB</span>
                </div>
              )}
              {entry.license && (
                <div className="spec-item">
                  <span className="spec-label">License:</span>
                  <span className="spec-value">{entry.license}</span>
                </div>
              )}
            </div>
          </div>

          {compatibility && (compatibility.issues.length > 0 || compatibility.warnings.length > 0) && (
            <div className="model-detail-section">
              <h3>Compatibility Check</h3>
              {compatibility.issues.length > 0 && (
                <div className="compatibility-issues">
                  {compatibility.issues.map((issue, idx) => (
                    <div key={idx} className="compatibility-item error">
                      <XCircle size={16} />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
              {compatibility.warnings.length > 0 && (
                <div className="compatibility-warnings">
                  {compatibility.warnings.map((warning, idx) => (
                    <div key={idx} className="compatibility-item warning">
                      <AlertCircle size={16} />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {entry.strengths.length > 0 && (
            <div className="model-detail-section">
              <h3>Strengths</h3>
              <ul className="model-detail-list">
                {entry.strengths.map((strength, idx) => (
                  <li key={idx}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {entry.limitations.length > 0 && (
            <div className="model-detail-section">
              <h3>Limitations</h3>
              <ul className="model-detail-list">
                {entry.limitations.map((limitation, idx) => (
                  <li key={idx}>{limitation}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="model-detail-section">
            <h3>Use Cases</h3>
            <div className="model-detail-tags">
              {entry.bestFor.map((useCase) => (
                <span key={useCase} className="catalog-tag">
                  {useCase.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>

          {entry.tags.length > 0 && (
            <div className="model-detail-section">
              <h3>Tags</h3>
              <div className="model-detail-tags">
                {entry.tags.map((tag) => (
                  <span key={tag} className="catalog-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="model-detail-actions">
          {entry.pullCommand && !isInstalled && (
            <button
              className="model-detail-action-btn pull-btn"
              onClick={handlePull}
              disabled={isPulling}
            >
              <Download size={16} className={isPulling ? 'spinning' : ''} />
              {isPulling ? 'Pulling...' : 'Pull Model'}
            </button>
          )}
          {entry.downloadUrl && (
            <button className="model-detail-action-btn download-btn" onClick={handleDownload}>
              <ExternalLink size={16} />
              Download
            </button>
          )}
          {isInstalled && (
            <button
              className={`model-detail-action-btn load-btn ${isActive ? 'active' : ''}`}
              onClick={handleLoad}
            >
              <Zap size={16} />
              {isActive ? 'Active' : 'Load Model'}
            </button>
          )}
          <button className="model-detail-action-btn test-btn" onClick={handleLoad}>
            <Play size={16} />
            Quick Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelDetailModal;

