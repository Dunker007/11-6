import { useState, useEffect } from 'react';
import { useCodeReviewStore } from '../../services/codereview/codeReviewStore';
import { useActivityStore } from '../../services/activity/activityStore';
import type { CodeIssue } from '@/types/codereview';
import TechIcon from '../Icons/TechIcon';
import { ScanEye, AlertCircle, AlertTriangle, Info, CheckCircle, Zap, Lock, Sparkles, Bug, Puzzle } from 'lucide-react';
import '../../styles/CodeReview.css';

function CodeReview() {
  const { reviews, currentReview, isLoading, analyzeCode, selectReview, deleteReview, loadReviews } =
    useCodeReviewStore();
  const { addActivity } = useActivityStore();
  const [projectPath, setProjectPath] = useState('');
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleAnalyze = async () => {
    if (!projectPath.trim()) return;

    addActivity('system', 'started', 'Started code review analysis');

    await analyzeCode(projectPath.trim(), {
      includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      excludePatterns: ['node_modules/**', 'dist/**'],
      checkTypes: ['performance', 'security', 'style', 'bug', 'complexity', 'best-practice'],
    });

    addActivity('system', 'completed', 'Code review analysis completed');

    setProjectPath('');
    setShowAnalyzeDialog(false);
  };

  const getSeverityIcon = (severity: CodeIssue['severity']) => {
    switch (severity) {
      case 'error':
        return <TechIcon icon={AlertCircle} size={16} glow="none" className="severity-icon error" />;
      case 'warning':
        return <TechIcon icon={AlertTriangle} size={16} glow="none" className="severity-icon warning" />;
      case 'info':
        return <TechIcon icon={Info} size={16} glow="none" className="severity-icon info" />;
      case 'suggestion':
        return <TechIcon icon={CheckCircle} size={16} glow="none" className="severity-icon suggestion" />;
      default:
        return <TechIcon icon={Info} size={16} glow="none" className="severity-icon" />;
    }
  };

  const getCategoryIcon = (category: CodeIssue['category']) => {
    switch (category) {
      case 'performance':
        return <TechIcon icon={Zap} size={14} glow="none" className="category-icon performance" />;
      case 'security':
        return <TechIcon icon={Lock} size={14} glow="none" className="category-icon security" />;
      case 'style':
        return <TechIcon icon={Sparkles} size={14} glow="none" className="category-icon style" />;
      case 'bug':
        return <TechIcon icon={Bug} size={14} glow="none" className="category-icon bug" />;
      case 'complexity':
        return <TechIcon icon={Puzzle} size={14} glow="none" className="category-icon complexity" />;
      case 'best-practice':
        return <TechIcon icon={CheckCircle} size={14} glow="none" className="category-icon best-practice" />;
      default:
        return <TechIcon icon={Info} size={14} glow="none" className="category-icon" />;
    }
  };

  return (
    <div className="code-review-container">
      <div className="code-review-header">
        <h2>Code Review</h2>
        <button onClick={() => setShowAnalyzeDialog(true)} className="analyze-btn" disabled={isLoading}>
          <TechIcon icon={ScanEye} size={18} glow="cyan" animated={isLoading} />
          <span>{isLoading ? 'Analyzing...' : 'Analyze Code'}</span>
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
            <TechIcon icon={ScanEye} size={64} glow="violet" animated={false} className="empty-icon" />
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
                            {getCategoryIcon(issue.category)}
                            <span className="issue-file">{issue.file}</span>
                            <span className="issue-location">
                              Line {issue.line}
                              {issue.column && `, Col ${issue.column}`}
                            </span>
                          </div>
                          <span className={`severity-badge ${issue.severity}`}>
                            {getSeverityIcon(issue.severity)}
                            <span>{issue.severity}</span>
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

