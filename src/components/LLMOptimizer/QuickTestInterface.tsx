/**
 * Quick Test Interface
 * Dedicated panel for quickly testing models with custom prompts
 */

import { useState, useCallback, useMemo } from 'react';
import { Play, X, Loader2, CheckCircle2, XCircle, Copy, ChevronDown } from 'lucide-react';
import { useLLMStore } from '@/services/ai/llmStore';
import { useLLMOptimizerStore } from '@/services/ai/llmOptimizerStore';
import { useToast } from '@/components/ui';
import type { ModelCatalogEntry } from '@/types/optimizer';
import '@/styles/QuickTestInterface.css';

interface QuickTestInterfaceProps {
  model?: ModelCatalogEntry;
  onClose?: () => void;
  defaultPrompt?: string;
}

const QUICK_TEST_PROMPTS = [
  { label: 'Hello Test', prompt: 'Say "Hello! I am working correctly." in one sentence.' },
  { label: 'Code Explanation', prompt: 'Explain what this code does: function add(a, b) { return a + b; }' },
  { label: 'Math Problem', prompt: 'Solve: What is 15 * 23? Show your work.' },
  { label: 'Creative Writing', prompt: 'Write a haiku about coding.' },
  { label: 'Code Generation', prompt: 'Write a TypeScript function that reverses a string.' },
];

function QuickTestInterface({ 
  model, 
  onClose,
  defaultPrompt = QUICK_TEST_PROMPTS[0].prompt 
}: QuickTestInterfaceProps) {
  const { generate, activeModel, isLoading, models } = useLLMStore();
  const { modelCatalog } = useLLMOptimizerStore();
  const { showToast } = useToast();
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [response, setResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testTime, setTestTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(
    model?.id || activeModel?.id || null
  );

  // Get available models from catalog or store
  const availableModels = useMemo(() => {
    if (modelCatalog && modelCatalog.length > 0) {
      return modelCatalog.map(entry => ({
        id: entry.id,
        name: entry.displayName,
        provider: entry.provider,
        isAvailable: true,
      }));
    }
    // Fallback to models from store
    return models.map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      isAvailable: m.isAvailable ?? true,
    }));
  }, [modelCatalog, models]);

  // Get selected model from catalog or store
  const selectedModel = useMemo(() => {
    if (!selectedModelId) return null;
    
    // Try catalog first
    if (modelCatalog) {
      const catalogModel = modelCatalog.find(m => m.id === selectedModelId);
      if (catalogModel) return catalogModel;
    }
    
    // Fallback to store models
    const storeModel = models.find(m => m.id === selectedModelId);
    if (storeModel) {
      // Convert store model to catalog entry format
      return {
        id: storeModel.id,
        displayName: storeModel.name,
        provider: storeModel.provider,
        optimizationMethod: undefined,
      } as ModelCatalogEntry;
    }
    
    return null;
  }, [selectedModelId, modelCatalog, models]);

  const testModel = useCallback(async () => {
    if (!selectedModel) {
      showToast({
        variant: 'error',
        title: 'No model selected',
        message: 'Please select a model to test',
      });
      return;
    }

    setIsTesting(true);
    setError(null);
    setResponse(null);
    setTestTime(null);

    const startTime = performance.now();

    try {
      const result = await generate(prompt, {
        model: selectedModel.id,
        temperature: 0.7,
        maxTokens: 200,
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      setResponse(result);
      setTestTime(duration);
    } catch (err) {
      const errorMessage = (err as Error).message || 'Unknown error occurred';
      setError(errorMessage);
      showToast({
        variant: 'error',
        title: 'Test failed',
        message: errorMessage,
      });
    } finally {
      setIsTesting(false);
    }
  }, [selectedModel, prompt, generate, showToast]);

  const copyResponse = useCallback(() => {
    if (response) {
      navigator.clipboard.writeText(response);
      showToast({
        variant: 'success',
        title: 'Copied',
        message: 'Response copied to clipboard',
      });
    }
  }, [response, showToast]);

  const useQuickPrompt = useCallback((quickPrompt: string) => {
    setPrompt(quickPrompt);
    setResponse(null);
    setError(null);
    setTestTime(null);
  }, []);

  return (
    <div className="quick-test-interface">
      <div className="test-header">
        <div className="test-title">
          <h3>Quick Test</h3>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <X size={16} />
          </button>
        )}
      </div>

      <div className="test-content">
        <div className="test-model-selector">
          <label className="test-label">Model</label>
          <div className="model-selector-wrapper">
            <button
              className="model-selector-btn"
              onClick={() => setShowModelSelector(!showModelSelector)}
              disabled={isTesting || isLoading}
            >
              <span className="selector-text">
                {selectedModel ? selectedModel.displayName : 'Select a model...'}
              </span>
              <ChevronDown size={14} className={showModelSelector ? 'open' : ''} />
            </button>
            {showModelSelector && (
              <div className="model-selector-dropdown">
                {availableModels.length === 0 ? (
                  <div className="dropdown-empty">No models available</div>
                ) : (
                  availableModels.map((m) => (
                    <button
                      key={m.id}
                      className={`dropdown-item ${selectedModelId === m.id ? 'selected' : ''} ${!m.isAvailable ? 'unavailable' : ''}`}
                      onClick={() => {
                        setSelectedModelId(m.id);
                        setShowModelSelector(false);
                        setResponse(null);
                        setError(null);
                        setTestTime(null);
                      }}
                    >
                      <span className="item-name">{m.name}</span>
                      <span className="item-provider">{m.provider}</span>
                      {activeModel?.id === m.id && (
                        <CheckCircle2 size={12} className="active-indicator" />
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {!selectedModel ? (
          <div className="test-empty">
            <p>Select a model above to test</p>
          </div>
        ) : (
          <>
            <div className="test-prompt-section">
              <label className="test-label">Test Prompt</label>
              <textarea
                className="test-textarea"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your test prompt..."
                rows={4}
                disabled={isTesting || isLoading}
              />
              <div className="quick-prompts">
                <span className="quick-prompts-label">Quick prompts:</span>
                <div className="quick-prompts-list">
                  {QUICK_TEST_PROMPTS.map((qp, idx) => (
                    <button
                      key={idx}
                      className="quick-prompt-btn"
                      onClick={() => useQuickPrompt(qp.prompt)}
                      disabled={isTesting || isLoading}
                      title={qp.prompt}
                    >
                      {qp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              className="test-run-btn"
              onClick={testModel}
              disabled={isTesting || isLoading || !prompt.trim()}
            >
              {isTesting ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <Play size={16} />
                  <span>Run Test</span>
                </>
              )}
            </button>

            {testTime !== null && (
              <div className="test-metrics">
                <span className="metric">
                  Response time: <strong>{testTime.toFixed(0)}ms</strong>
                </span>
              </div>
            )}

            {error && (
              <div className="test-error">
                <XCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {response && (
              <div className="test-response">
                <div className="response-header">
                  <span className="response-label">Response</span>
                  <button className="copy-btn" onClick={copyResponse} title="Copy response">
                    <Copy size={14} />
                  </button>
                </div>
                <div className="response-content">{response}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default QuickTestInterface;

