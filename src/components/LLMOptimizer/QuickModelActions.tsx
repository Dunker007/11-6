/**
 * Quick Model Actions Panel
 * One-click operations for models: Load, Test, Compare, Details
 */

import React, { useState } from 'react';
import { Zap, Play, GitCompare, Info, X, Loader2 } from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import { useToast } from '@/components/ui';
import type { ModelCatalogEntry } from '@/types/optimizer';
import TechIcon from '../Icons/TechIcon';
import '@/styles/QuickModelActions.css';

interface QuickModelActionsProps {
  model: ModelCatalogEntry;
  onClose?: () => void;
  compact?: boolean;
}

/**
 * Action tray for interacting with a catalog model (load, quick test, compare, details).
 *
 * @param model - Catalog entry the actions operate on.
 * @param onClose - Optional callback to close parent popover/sheet.
 * @param compact - Renders condensed button cluster when true.
 * @returns Panel or compact control set for model interactions.
 */
const QuickModelActions: React.FC<QuickModelActionsProps> = ({ model, onClose, compact = false }) => {
  const { switchToModel, generate, activeModel, isLoading } = useLLMStore();
  const { showToast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  const isActive = activeModel?.id === model.id;

  /**
   * Switch the active model in the LLM store and surface toast feedback.
   */
  const handleLoad = async () => {
    setIsLoadingModel(true);
    try {
      const success = await switchToModel(model.id);
      if (success) {
        showToast({
          variant: 'success',
          title: 'Model loaded',
          message: `Switched to ${model.displayName}`,
        });
        onClose?.();
      } else {
        showToast({
          variant: 'error',
          title: 'Failed to load',
          message: 'Model or provider not available',
        });
      }
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Error',
        message: (error as Error).message,
      });
    } finally {
      setIsLoadingModel(false);
    }
  };

  /**
   * Run a lightweight generation request to sanity-check the selected model.
   */
  const handleQuickTest = async () => {
    setIsTesting(true);
    try {
      const response = await generate('Say "Hello! I am working correctly." in one sentence.', {
        model: model.id,
        temperature: 0.7,
        maxTokens: 50,
      });
      
      showToast({
        variant: 'success',
        title: 'Test successful',
        message: `Response: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`,
        duration: 5000,
      });
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Test failed',
        message: (error as Error).message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (compact) {
    return (
      <div className="quick-model-actions-compact">
        {!isActive && (
          <button
            className="action-btn load-btn"
            onClick={handleLoad}
            disabled={isLoadingModel || isLoading}
            title="Load model"
          >
            {isLoadingModel ? (
              <Loader2 size={14} className="spinning" />
            ) : (
              <Zap size={14} />
            )}
          </button>
        )}
        <button
          className="action-btn test-btn"
          onClick={handleQuickTest}
          disabled={isTesting || isLoading}
          title="Quick test"
        >
          {isTesting ? (
            <Loader2 size={14} className="spinning" />
          ) : (
            <Play size={14} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="quick-model-actions-panel">
      <div className="actions-header">
        <h4>{model.displayName}</h4>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>
      
      <div className="actions-content">
        <div className="model-info">
          <div className="info-row">
            <span className="label">Provider:</span>
            <span className="value">{model.provider}</span>
          </div>
          <div className="info-row">
            <span className="label">Size:</span>
            <span className="value">{model.sizeGB > 0 ? `${model.sizeGB} GB` : 'Cloud'}</span>
          </div>
          <div className="info-row">
            <span className="label">Context:</span>
            <span className="value">{model.contextWindow.toLocaleString()} tokens</span>
          </div>
        </div>

        <div className="actions-buttons">
          {!isActive ? (
            <button
              className="action-button primary load"
              onClick={handleLoad}
              disabled={isLoadingModel || isLoading}
            >
              {isLoadingModel ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <Zap size={16} />
                  <span>Load Model</span>
                </>
              )}
            </button>
          ) : (
            <div className="active-badge">
              <TechIcon icon={Zap} size={16} glow="green" />
              <span>Currently Active</span>
            </div>
          )}

          <button
            className="action-button test"
            onClick={handleQuickTest}
            disabled={isTesting || isLoading || !isActive}
          >
            {isTesting ? (
              <>
                <Loader2 size={16} className="spinning" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>Quick Test</span>
              </>
            )}
          </button>

          <button
            className="action-button compare"
            onClick={() => {
              showToast({
                variant: 'info',
                title: 'Compare Models',
                message: 'Model comparison feature coming soon',
              });
            }}
          >
            <GitCompare size={16} />
            <span>Compare</span>
          </button>

          <button
            className="action-button details"
            onClick={() => {
              showToast({
                variant: 'info',
                title: 'Model Details',
                message: 'Detailed model information coming soon',
              });
            }}
          >
            <Info size={16} />
            <span>Details</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickModelActions;

