/**
 * Console Panel
 * Displays command output and execution results
 */

import { useState, useEffect, useRef } from 'react';
import { llmRouter } from '../services/ai/router';
import { apiKeyService } from '../services/apiKeys/apiKeyService';
import '../styles-new/console-panel.css';

interface ConsolePanelProps {
  output: string;
  isVisible?: boolean;
  onToggle?: () => void;
  onClear?: () => void;
}

type FilterType = 'all' | 'errors' | 'warnings';

export default function ConsolePanel({ output, isVisible = false, onToggle, onClear: _onClear }: ConsolePanelProps) {
  const [isExpanded, setIsExpanded] = useState(isVisible);
  const [geminiStatus, setGeminiStatus] = useState<'active' | 'unavailable' | 'checking'>('checking');
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const outputRef = useRef<HTMLPreElement>(null);

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

  useEffect(() => {
    setIsExpanded(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (isExpanded && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isExpanded, filter, searchQuery]);

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output).then(() => {
        // Show temporary feedback
        const copyBtn = document.querySelector('.console-copy-btn');
        if (copyBtn) {
          const originalText = copyBtn.textContent;
          copyBtn.textContent = '✓ Copied';
          setTimeout(() => {
            if (copyBtn) copyBtn.textContent = originalText;
          }, 2000);
        }
      }).catch((err) => {
        console.error('Failed to copy:', err);
      });
    }
  };

  const filterOutput = (text: string, filterType: FilterType): string => {
    if (filterType === 'all') return text;
    
    const lines = text.split('\n');
    const filtered = lines.filter(line => {
      const lowerLine = line.toLowerCase();
      if (filterType === 'errors') {
        return lowerLine.includes('error') || lowerLine.includes('failed') || lowerLine.includes('❌') || lowerLine.includes('exception');
      } else if (filterType === 'warnings') {
        return lowerLine.includes('warning') || lowerLine.includes('warn') || lowerLine.includes('⚠️') || lowerLine.includes('deprecated');
      }
      return true;
    });
    
    return filtered.join('\n');
  };

  const highlightSearch = (text: string, query: string): string => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  };

  const formatOutput = (text: string): string => {
    if (!text) return 'No output yet. Run a command to see results here.';
    
    let formatted = text;
    
    // Apply filter
    formatted = filterOutput(formatted, filter);
    
    // Apply search highlighting
    if (searchQuery) {
      formatted = highlightSearch(formatted, searchQuery);
    }
    
    // Format common patterns
    formatted = formatted
      .replace(/✅|✓/g, '<span class="console-success">$&</span>')
      .replace(/❌|✗/g, '<span class="console-error">$&</span>')
      .replace(/⚠️|⚠/g, '<span class="console-warning">$&</span>')
      .replace(/ℹ️|ℹ/g, '<span class="console-info">$&</span>');
    
    return formatted;
  };

  const filteredOutput = formatOutput(output);

  const handleClear = _onClear || (() => {});

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
          <div className="console-toolbar">
            <div className="console-filters">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
                title="Show all output"
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'errors' ? 'active' : ''}`}
                onClick={() => setFilter('errors')}
                title="Show errors only"
              >
                Errors
              </button>
              <button
                className={`filter-btn ${filter === 'warnings' ? 'active' : ''}`}
                onClick={() => setFilter('warnings')}
                title="Show warnings only"
              >
                Warnings
              </button>
            </div>
            <div className="console-search">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="console-search-input"
              />
            </div>
            <div className="console-actions-bar">
              {output && (
                <>
                  <button
                    onClick={handleCopy}
                    className="console-copy-btn"
                    title="Copy output"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={() => handleClear()}
                    className="console-clear-btn"
                    title="Clear console"
                  >
                    🗑️ Clear
                  </button>
                </>
              )}
            </div>
          </div>
          <pre 
            ref={outputRef}
            className="console-output"
            dangerouslySetInnerHTML={{ __html: filteredOutput }}
          />
        </div>
      )}
    </div>
  );
}
