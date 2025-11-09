/**
 * Console Panel
 * Displays command output and execution results
 */

import { useState } from 'react';
import '../styles-new/console-panel.css';

interface ConsolePanelProps {
  output: string;
  isVisible?: boolean;
  onToggle?: () => void;
  onClear?: () => void;
}

export default function ConsolePanel({ output, isVisible = false, onToggle, onClear }: ConsolePanelProps) {
  const [isExpanded, setIsExpanded] = useState(isVisible);

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
