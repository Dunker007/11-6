import { useState, useEffect, useMemo, useCallback } from 'react';
import { errorLogger } from '../../services/errors/errorLogger';
import {
  CapturedError,
  ErrorCategory,
  ErrorSeverity,
  ErrorFilter,
} from '../../types/error';
import { formatTimeAgo } from '../../utils/formatters';
import TechIcon from '../Icons/TechIcon';
import {
  AlertCircle,
  X,
  Copy,
  Check,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import '../../styles/ErrorConsole.css';

interface ErrorConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ErrorConsole({ isOpen, onClose }: ErrorConsoleProps) {
  const [errors, setErrors] = useState<CapturedError[]>([]);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<ErrorFilter>({});
  const [showFilters, setShowFilters] = useState(false);

  const loadErrors = useCallback(() => {
    setErrors(errorLogger.getErrors());
  }, []);

  // Load errors on mount and subscribe to updates
  useEffect(() => {
    loadErrors();
    const unsubscribe = errorLogger.subscribe(() => {
      // Use setTimeout to defer state update to next tick, avoiding updates during render
      setTimeout(loadErrors, 0);
    });
    return unsubscribe;
  }, [loadErrors]);

  // Filter errors
  const filteredErrors = useMemo(() => {
    return errorLogger.getFilteredErrors(filter);
  }, [errors, filter]);

  const stats = useMemo(() => errorLogger.getStats(), [errors]);

  const handleCopyError = (error: CapturedError) => {
    const errorText = `
Error ID: ${error.id}
Type: ${error.type}
Severity: ${error.severity}
Message: ${error.message}
Timestamp: ${new Date(error.timestamp).toISOString()}

${error.stack ? `Stack Trace:\n${error.stack}` : ''}

Context:
${JSON.stringify(error.context, null, 2)}
    `.trim();

    navigator.clipboard.writeText(errorText);
    setCopiedId(error.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportErrors = () => {
    const json = errorLogger.exportErrors(filter);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dlx-errors-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearErrors = () => {
    if (
      confirm(
        'Are you sure you want to clear all errors? This cannot be undone.'
      )
    ) {
      errorLogger.clearErrors();
      loadErrors();
    }
  };

  // Removed unused getSeverityColor function

  if (!isOpen) return null;

  return (
    <div className="error-console-overlay">
      <div className="error-console">
        {/* Header */}
        <div className="error-console-header">
          <div className="error-console-title">
            <TechIcon icon={AlertCircle} size="md" glow="red" />
            <h2>Error Console</h2>
            <span className="error-count">{stats.total} errors</span>
          </div>
          <div className="error-console-actions">
            <button
              className="icon-btn"
              onClick={() => setShowFilters(!showFilters)}
              title="Toggle Filters"
            >
              <TechIcon icon={Filter} size="sm" />
            </button>
            <button
              className="icon-btn"
              onClick={handleExportErrors}
              title="Export Errors"
            >
              <TechIcon icon={Download} size="sm" />
            </button>
            <button
              className="icon-btn"
              onClick={handleClearErrors}
              title="Clear All"
            >
              <TechIcon icon={Trash2} size="sm" />
            </button>
            <button className="icon-btn" onClick={onClose} title="Close">
              <TechIcon icon={X} size="sm" />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="error-stats">
          <div className="stat-item">
            <span className="stat-label">Critical</span>
            <span className="stat-value critical">
              {stats.bySeverity.critical}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Errors</span>
            <span className="stat-value error">{stats.bySeverity.error}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Warnings</span>
            <span className="stat-value warning">
              {stats.bySeverity.warning}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">This Session</span>
            <span className="stat-value">{stats.sessionErrors}</span>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="error-filters">
            <div className="filter-group">
              <label>Severity</label>
              <div className="filter-buttons">
                {(
                  ['critical', 'error', 'warning', 'info'] as ErrorSeverity[]
                ).map((severity) => (
                  <button
                    key={severity}
                    className={`filter-btn ${filter.severity?.includes(severity) ? 'active' : ''}`}
                    onClick={() => {
                      const newSeverity = filter.severity?.includes(severity)
                        ? filter.severity.filter((s) => s !== severity)
                        : [...(filter.severity || []), severity];
                      setFilter({
                        ...filter,
                        severity: newSeverity.length ? newSeverity : undefined,
                      });
                    }}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>
            <div className="filter-group">
              <label>Category</label>
              <div className="filter-buttons">
                {(
                  [
                    'react',
                    'console',
                    'network',
                    'runtime',
                    'build',
                  ] as ErrorCategory[]
                ).map((category) => (
                  <button
                    key={category}
                    className={`filter-btn ${filter.category?.includes(category) ? 'active' : ''}`}
                    onClick={() => {
                      const newCategory = filter.category?.includes(category)
                        ? filter.category.filter((c) => c !== category)
                        : [...(filter.category || []), category];
                      setFilter({
                        ...filter,
                        category: newCategory.length ? newCategory : undefined,
                      });
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error List */}
        <div className="error-list">
          {filteredErrors.length === 0 ? (
            <div className="empty-state">
              <TechIcon icon={Check} size="lg" glow="green" />
              <p>No errors found</p>
              <span className="empty-hint">
                {filter.category || filter.severity
                  ? 'Try adjusting your filters'
                  : 'The error capture system is active and monitoring'}
              </span>
            </div>
          ) : (
            filteredErrors.map((error) => {
              const friendlyMessage = errorLogger.getUserFriendlyMessage(error);
              const recoverySteps = errorLogger.getRecoverySteps(error);

              return (
                <div key={error.id} className={`error-item ${error.severity}`}>
                  <div
                    className="error-item-header"
                    onClick={() =>
                      setExpandedError(
                        expandedError === error.id ? null : error.id
                      )
                    }
                  >
                    <div className="error-item-left">
                      <TechIcon
                        icon={
                          expandedError === error.id ? ChevronDown : ChevronRight
                        }
                        size="sm"
                      />
                      <div className={`severity-badge ${error.severity}`}>
                        {error.severity}
                      </div>
                      <div className={`category-badge ${error.type}`}>
                        {error.type}
                      </div>
                      {error.count && error.count > 1 && (
                        <span className="error-count-badge">{error.count}x</span>
                      )}
                    </div>
                    <div className="error-item-right">
                      <span className="error-time">
                        {formatTimeAgo(error.timestamp)}
                      </span>
                      <button
                        className="icon-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyError(error);
                        }}
                        title="Copy Error"
                      >
                        <TechIcon
                          icon={copiedId === error.id ? Check : Copy}
                          size="sm"
                          glow={copiedId === error.id ? 'green' : undefined}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="error-message">{friendlyMessage}</div>
                  {expandedError === error.id && (
                    <div className="error-details">
                      {recoverySteps.length > 0 && (
                        <div className="error-section">
                          <h4>Recommended Actions</h4>
                          <ul className="error-recovery-list">
                            {recoverySteps.map((step) => (
                              <li key={step}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="error-section">
                        <h4>Technical Message</h4>
                        <p className="error-technical">{error.message}</p>
                      </div>
                      {error.stack && (
                        <div className="error-section">
                          <h4>Stack Trace</h4>
                          <pre className="error-stack">{error.stack}</pre>
                        </div>
                      )}
                      {error.context && Object.keys(error.context).length > 0 && (
                        <div className="error-section">
                          <h4>Context</h4>
                          <div className="error-context">
                            {Object.entries(error.context).map(([key, value]) => (
                              <div key={key} className="context-item">
                                <span className="context-key">{key}:</span>
                                <span className="context-value">
                                  {typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="error-meta">
                        <span>ID: {error.id}</span>
                        <span>
                          Timestamp: {new Date(error.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
