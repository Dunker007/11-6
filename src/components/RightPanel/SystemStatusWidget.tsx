// src/components/RightPanel/SystemStatusWidget.tsx
import { useState, useEffect, memo } from 'react';
import { useLLMStore } from '../../services/ai/llmStore';
import { errorLogger } from '../../services/errors/errorLogger';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import { AlertCircle } from 'lucide-react';
import '../../styles/RightPanel.css';

const SystemStatusWidget = memo(function SystemStatusWidget() {
  const availableProviders = useLLMStore((state) => state.availableProviders);
  const isLoading = useLLMStore((state) => state.isLoading);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const updateErrorCount = () => {
      const stats = errorLogger.getStats();
      setErrorCount(stats.bySeverity.critical + stats.bySeverity.error);
    };
    updateErrorCount();
    // Defer subscribe callback to prevent updates during render
    const unsubscribe = errorLogger.subscribe(() => setTimeout(updateErrorCount, 0));
    return unsubscribe;
  }, []);

  return (
    <div className="status-widget-container">
      <div className="widget-header">
        <TechIcon icon={ICON_MAP.monitor} />
        <h4>System Status</h4>
      </div>
      <div className="widget-content">
        <div className="widget-row">
          <TechIcon icon={ICON_MAP.vibedEd} size="sm" />
          <span>LLM Status:</span>
          {isLoading ? (
            <span className="widget-value">Checking...</span>
          ) : availableProviders.length > 0 ? (
            <span className="widget-value online">Online</span>
          ) : (
            <span className="widget-value offline">Offline</span>
          )}
        </div>
        <div className="widget-row">
          <TechIcon icon={AlertCircle} size="sm" />
          <span>Errors:</span>
          <span className={`widget-value ${errorCount > 0 ? 'errors' : ''}`}>
            {errorCount}
          </span>
        </div>
      </div>
    </div>
  );
});

export default SystemStatusWidget;
