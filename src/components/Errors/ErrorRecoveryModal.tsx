/**
 * ErrorRecoveryModal.tsx
 *
 * PURPOSE:
 * User-friendly error display with recovery suggestions and auto-fix options.
 *
 * FEATURES:
 * - Plain English error explanations
 * - Step-by-step recovery instructions
 * - Auto-fix button (when available)
 * - Technical details (collapsible)
 * - Error history
 */

import React, { useState } from 'react';
import {
  useSmartErrorHandlerStore,
  smartErrorHandlerService,
} from '../../services/errors/smartErrorHandlerService';
import { Button } from '../ui/Button';
import './ErrorRecoveryModal.css';

export const ErrorRecoveryModal: React.FC = () => {
  const { currentError, setCurrentError, resolveError, retryError, autoFixError } =
    useSmartErrorHandlerStore();
  const [showTechnical, setShowTechnical] = useState(false);

  if (!currentError) return null;

  const handleClose = () => {
    resolveError(currentError.id);
    setCurrentError(null);
  };

  const handleRetry = async () => {
    await retryError(currentError.id);
    setCurrentError(null);
  };

  const handleAutoFix = async () => {
    await autoFixError(currentError.id);
    setCurrentError(null);
  };

  const icon = smartErrorHandlerService.getErrorIcon(currentError.category);
  const color = smartErrorHandlerService.getSeverityColor(currentError.severity);

  return (
    <div className="error-recovery-overlay">
      <div className="error-recovery-modal">
        {/* Header */}
        <div className="error-recovery-header" style={{ borderLeftColor: color }}>
          <div className="error-recovery-icon">{icon}</div>
          <div className="error-recovery-title-section">
            <h2 className="error-recovery-title">{currentError.title}</h2>
            <span className="error-recovery-severity">{currentError.severity}</span>
          </div>
          <button className="error-recovery-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        {/* Message */}
        <div className="error-recovery-content">
          <div className="error-recovery-message">{currentError.message}</div>

          <div className="error-recovery-explanation">
            <strong>What happened:</strong>
            <p>{currentError.explanation}</p>
          </div>

          {/* Recovery Suggestions */}
          {currentError.suggestions.length > 0 && (
            <div className="error-recovery-suggestions">
              <strong>How to fix it:</strong>
              <ol>
                {currentError.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ol>
            </div>
          )}

          {/* Technical Details (Collapsible) */}
          {currentError.technicalDetails && (
            <div className="error-recovery-technical">
              <button
                className="error-technical-toggle"
                onClick={() => setShowTechnical(!showTechnical)}
              >
                {showTechnical ? '▼' : '▶'} Technical Details
              </button>
              {showTechnical && (
                <pre className="error-technical-details">
                  {typeof currentError.technicalDetails.error === 'string'
                    ? currentError.technicalDetails.error
                    : JSON.stringify(currentError.technicalDetails, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="error-recovery-actions">
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          {currentError.autoFixAvailable && (
            <Button onClick={handleAutoFix}>
              ✨ Auto-Fix
            </Button>
          )}
          {smartErrorHandlerService.shouldAutoRetry(currentError) && (
            <Button onClick={handleRetry}>
              🔄 Retry
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorRecoveryModal;
