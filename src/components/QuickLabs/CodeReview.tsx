import { useState, useEffect } from 'react';
import { useCodeReviewStore } from '../../services/codereview/codeReviewStore';
import type { CodeIssue } from '@/types/codereview';
import '../../styles/CodeReview.css';

function CodeReview() {
  const { reviews, currentReview, isLoading, analyzeCode, selectReview, deleteReview, loadReviews } =
    useCodeReviewStore();
  const [projectPath, setProjectPath] = useState('');
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleAnalyze = async () => {
    if (!projectPath.trim()) return;

    await analyzeCode(projectPath.trim(), {
      includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      excludePatterns: ['node_modules/**', 'dist/**'],
      checkTypes: ['performance', 'security', 'style', 'bug', 'complexity', 'best-practice'],
    });

    setProjectPath('');
    setShowAnalyzeDialog(false);
  };

  const getSeverityColor = (severity: CodeIssue['severity']) => {
    switch (severity) {
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      case 'suggestion':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getCategoryIcon = (category: CodeIssue['category']) => {
    switch (category) {
      case 'performance':
        return '⚡';
      case 'security':
        return '🔒';
      case 'style':
        return '✨';
      case 'bug':
        return '🐛';
      case 'complexity':
        return '🧩';
      case 'best-practice':
        return '✅';
      default:
        return '📝';
    }
  };

  return (
    <div className="code-review-container">
      <div className="code-review-header">
        <h2>Code Review</h2>
        <button onClick={() => setShowAnalyzeDialog(true)} className="analyze-btn" disabled={isLoading}>
          {isLoading ? 'Analyzing...' : '+ Analyze Code'}
        </button>
      </div>

      {showAnalyzeDialog && (
        <div className="modal-overlay" onClick={() => setShowAnalyzeDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Analyze Code</h3>
            <input
              type="text"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              placeholder="Project path..."
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              autoFocus
            />
            <div className="modal-actions">
              <button onClick={handleAnalyze} className="confirm-btn" disabled={!projectPath.trim() || isLoading}>
                Analyze
              </button>
              <button onClick={() => setShowAnalyzeDialog(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="code-review-content">
        {reviews.length === 0 ? (
          <div className="empty-state">
            <h3>No Reviews Yet</h3>
            <p>Start by analyzing your codebase</p>
          </div>
        ) : (
          <div className="reviews-layout">
            <div className="reviews-sidebar">
              <h3>Review History</h3>
              <div className="reviews-list">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className={`review-item ${currentReview?.id === review.id ? 'active' : ''}`}
                    onClick={() => selectReview(review.id)}
                  >
                    <div className="review-item-header">
                      <span className="review-path">{review.projectPath}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteReview(review.id);
                        }}
                        className="delete-review-btn"
                      >
                        ×
                      </button>
                    </div>
                    <div className="review-item-meta">
                      <span className={`status-badge ${review.status}`}>{review.status}</span>
                      <span>{review.summary.totalIssues} issues</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {currentReview && (
              <div className="review-details">
                <div className="review-summary">
                  <h3>Review Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-card">
                      <div className="summary-label">Total Issues</div>
                      <div className="summary-value">{currentReview.summary.totalIssues}</div>
                    </div>
                    <div className="summary-card error">
                      <div className="summary-label">Errors</div>
                      <div className="summary-value">{currentReview.summary.errors}</div>
                    </div>
                    <div className="summary-card warning">
                      <div className="summary-label">Warnings</div>
                      <div className="summary-value">{currentReview.summary.warnings}</div>
                    </div>
                    <div className="summary-card suggestion">
                      <div className="summary-label">Suggestions</div>
                      <div className="summary-value">{currentReview.summary.suggestions}</div>
                    </div>
                  </div>
                </div>

                <div className="issues-section">
                  <h3>Issues</h3>
                  <div className="issues-list">
                    {currentReview.issues.map((issue) => (
                      <div key={issue.id} className={`issue-card ${issue.severity}`}>
                        <div className="issue-header">
                          <div className="issue-meta">
                            <span className="category-icon">{getCategoryIcon(issue.category)}</span>
                            <span className="issue-file">{issue.file}</span>
                            <span className="issue-location">
                              Line {issue.line}
                              {issue.column && `, Col ${issue.column}`}
                            </span>
                          </div>
                          <span
                            className="severity-badge"
                            style={{ backgroundColor: getSeverityColor(issue.severity) }}
                          >
                            {issue.severity}
                          </span>
                        </div>
                        <div className="issue-message">{issue.message}</div>
                        {issue.code && (
                          <div className="issue-code">
                            <code>{issue.code}</code>
                          </div>
                        )}
                        {issue.fix && (
                          <div className="issue-fix">
                            <strong>Suggested fix:</strong> <code>{issue.fix}</code>
                          </div>
                        )}
                        {issue.rule && (
                          <div className="issue-rule">
                            <small>Rule: {issue.rule}</small>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CodeReview;

