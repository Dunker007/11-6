/**
 * Console Panel
 * Displays command output and execution results
 */

import { useState, useEffect } from 'react';
import { llmRouter } from '../services/ai/router';
import { apiKeyService } from '../services/apiKeys/apiKeyService';
import '../styles-new/console-panel.css';

interface ConsolePanelProps {
  output: string;
  isVisible?: boolean;
  onToggle?: () => void;
  onClear?: () => void;
}

export default function ConsolePanel({ output, isVisible = false, onToggle, onClear }: ConsolePanelProps) {
  const [isExpanded, setIsExpanded] = useState(isVisible);
  const [geminiStatus, setGeminiStatus] = useState<'active' | 'unavailable' | 'checking'>('checking');

  useEffect(() => {
    // Check Gemini status
    const checkGeminiStatus = async () => {
      // Ensure API keys are initialized before checking
      await apiKeyService.ensureInitialized();
      const geminiKey = await apiKeyService.getKeyForProviderAsync('gemini');
      if (geminiKey) {
        const geminiProvider = llmRouter.getProvider('gemini');
        if (geminiProvider) {
          const isHealthy = await geminiProvider.healthCheck();
          setGeminiStatus(isHealthy ? 'active' : 'unavailable');
        } else {
          setGeminiStatus('unavailable');
        }
      } else {
        setGeminiStatus('unavailable');
      }
    };

    checkGeminiStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkGeminiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    onToggle?.();
  };

  const handleClear = () => {
    onClear?.();
  };

  return (
    <div className={`console-panel ${isExpanded ? 'expanded' : ''}`}>
      <div className="console-header" onClick={handleToggle}>
        <div className="console-title">
          <span className="console-icon">💻</span>
          <span>Console</span>
          {geminiStatus === 'active' && (
            <span className="console-gemini-status" title="Gemini Flash 2.5 Active">
              ⚡ Gemini
            </span>
          )}
          {output && (
            <span className="console-status">●</span>
          )}
        </div>
        <div className="console-actions">
          {output && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="console-clear-btn"
              title="Clear console"
            >
              🗑️
            </button>
          )}
          <button className="console-toggle-btn">
            {isExpanded ? '▼' : '▲'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="console-content">
          <pre className="console-output">
            {output || 'No output yet. Run a command to see results here.'}
          </pre>
        </div>
      )}
    </div>
  );
}
