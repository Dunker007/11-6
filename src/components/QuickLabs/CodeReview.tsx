import { useState, useEffect } from 'react';
import { useCodeReviewStore } from '../../services/codereview/codeReviewStore';
import { codeReviewService } from '../../services/codereview/codeReviewService';
import { useActivityStore } from '../../services/activity/activityStore';
import { useAgentStore } from '../../services/agents/agentStore';
import ItorAvatar from '../Agents/ItorAvatar';
import type { CodeIssue, SecuritySummary } from '@/types/codereview';
import TechIcon from '../Icons/TechIcon';
import { ScanEye, AlertCircle, AlertTriangle, Info, CheckCircle, Zap, Lock, Sparkles, Bug, Puzzle, Shield } from 'lucide-react';
import '../../styles/CodeReview.css';

/**
 * Quick Labs code review dashboard for running automated analysis across codebases.
 * Supports general reviews, security scans, and displays actionable findings.
 *
 * @returns Interactive panel for initiating and browsing code review results.
 */
function CodeReview() {
  const { reviews, currentReview, isLoading, analyzeCode, selectReview, deleteReview, loadReviews } =
    useCodeReviewStore();
  const { addActivity } = useActivityStore();
  const { itorStatus, setItorStatus } = useAgentStore();
  const [projectPath, setProjectPath] = useState('');
  const [showAnalyzeDialog, setShowAnalyzeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'review' | 'security'>('review');
  const [securityIssues, setSecurityIssues] = useState<CodeIssue[]>([]);
  const [securitySummary, setSecuritySummary] = useState<SecuritySummary | null>(null);
  const [isAnalyzingSecurity, setIsAnalyzingSecurity] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  /**
   * Execute a standard code review for the provided project path.
   */
  const handleAnalyze = async () => {
    if (!projectPath.trim()) return;

    setItorStatus('scanning');
    addActivity('system', 'started', 'Started code review analysis');

    await analyzeCode(projectPath.trim(), {
      includePatterns: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      excludePatterns: ['node_modules/**', 'dist/**'],
      checkTypes: ['performance', 'security', 'style', 'bug', 'complexity', 'best-practice'],
    });

    setItorStatus('reviewing');
    addActivity('system', 'completed', 'Code review analysis completed');
    
    setTimeout(() => {
      if (currentReview && currentReview.issues.length === 0) {
        setItorStatus('approved');
      } else if (currentReview && currentReview.issues.length > 0) {
        setItorStatus('alert');
      } else {
        setItorStatus('idle');
      }
    }, 1000);

    setProjectPath('');
    setShowAnalyzeDialog(false);
  };

  /**
   * Map an issue severity to a decorated icon.
   *
   * @param severity - Issue severity level.
   * @returns Icon representing the severity.
   */
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

  /**
   * Map issue category to its icon.
   *
   * @param category - Issue category type.
   * @returns Icon representing the category.
   */
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

  /**
   * Run the dedicated security analysis workflow for the active project.
   */
  const handleSecurityAnalysis = async () => {
    if (!projectPath.trim()) return;
    setIsAnalyzingSecurity(true);
    setItorStatus('scanning');
    addActivity('system', 'started', 'Started security analysis');
    try {
      const result = await codeReviewService.analyzeSecurity(projectPath.trim());
      setSecurityIssues(result.issues);
      setSecuritySummary(result.summary);
      setItorStatus(result.issues.length === 0 ? 'approved' : 'alert');
      addActivity('system', 'completed', 'Security analysis completed');
    } catch (error) {
      setItorStatus('error');
      console.error('Security analysis failed:', error);
    } finally {
      setIsAnalyzingSecurity(false);
    }
  };

  return (
    <div className="code-review-container">
      <div className="code-review-header">
        <div className="code-review-header-left">
          <ItorAvatar status={itorStatus} size="md" animated={isLoading || isAnalyzingSecurity} />
          <h2>Code Review</h2>
        </div>
        <div className="review-tabs">
          <button
            className={`review-tab ${activeTab === 'review' ? 'active' : ''}`}
            onClick={() => setActiveTab('review')}
          >
            Code Review
          </button>
          <button
            className={`review-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={16} />
            Security Review
          </button>
        </div>
        <button onClick={() => setShowAnalyzeDialog(true)} className="analyze-btn" disabled={isLoading || isAnalyzingSecurity}>
          <TechIcon icon={activeTab === 'security' ? Shield : ScanEye} size={18} glow="cyan" animated={isLoading || isAnalyzingSecurity} />
          <span>{isLoading || isAnalyzingSecurity ? 'Analyzing...' : activeTab === 'security' ? 'Analyze Security' : 'Analyze Code'}</span>
        </button>
      </div>

      {showAnalyzeDialog && (
        <div className="modal-overlay" onClick={() => setShowAnalyzeDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{activeTab === 'security' ? 'Security Analysis' : 'Analyze Code'}</h3>
            <input
              type="text"
              value={projectPath}
              onChange={(e) => setProjectPath(e.target.value)}
              placeholder="Project path..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (activeTab === 'security') {
                    handleSecurityAnalysis();
                  } else {
                    handleAnalyze();
                  }
                }
              }}
              autoFocus
            />
            <div className="modal-actions">
              <button
                onClick={activeTab === 'security' ? handleSecurityAnalysis : handleAnalyze}
                className="confirm-btn"
                disabled={!projectPath.trim() || isLoading || isAnalyzingSecurity}
              >
                {activeTab === 'security' ? 'Analyze Security' : 'Analyze'}
              </button>
              <button onClick={() => setShowAnalyzeDialog(false)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="code-review-content">
        {activeTab === 'security' ? (
          securitySummary ? (
            <div className="security-review-view">
              <div className="security-summary-card">
                <div className="security-score">
                  <Shield size={32} />
                  <div className="score-value" style={{ color: securitySummary.score >= 80 ? '#10b981' : securitySummary.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                    {securitySummary.score}
                  </div>
                  <div className="score-label">Security Score</div>
                </div>
                <div className="security-stats">
                  <div className="stat-item critical">
                    <span className="stat-value">{securitySummary.criticalIssues}</span>
                    <span className="stat-label">Critical</span>
                  </div>
                  <div className="stat-item high">
                    <span className="stat-value">{securitySummary.highIssues}</span>
                    <span className="stat-label">High</span>
                  </div>
                  <div className="stat-item medium">
                    <span className="stat-value">{securitySummary.mediumIssues}</span>
                    <span className="stat-label">Medium</span>
                  </div>
                  <div className="stat-item low">
                    <span className="stat-value">{securitySummary.lowIssues}</span>
                    <span className="stat-label">Low</span>
                  </div>
                </div>
              </div>

              {securitySummary.dependencyVulnerabilities.length > 0 && (
                <div className="dependency-vulns">
                  <h3>Dependency Vulnerabilities</h3>
                  {securitySummary.dependencyVulnerabilities.map((vuln, idx) => (
                    <div key={idx} className={`vuln-card ${vuln.severity}`}>
                      <div className="vuln-header">
                        <span className="vuln-package">{vuln.package}</span>
                        <span className={`vuln-severity ${vuln.severity}`}>{vuln.severity}</span>
                      </div>
                      <div className="vuln-details">
                        <span>Version: {vuln.version}</span>
                        <span>{vuln.vulnerability}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="security-issues-section">
                <h3>Security Issues</h3>
                <div className="issues-list">
                  {securityIssues.map((issue) => (
                    <div key={issue.id} className={`issue-card ${issue.severity} security-issue`}>
                      <div className="issue-header">
                        <div className="issue-meta">
                          {getCategoryIcon(issue.category)}
                          <span className="issue-file">{issue.file}</span>
                          <span className="issue-location">
                            Line {issue.line}
                            {issue.column && `, Col ${issue.column}`}
                          </span>
                          {issue.securityType && (
                            <span className="security-type-badge">{issue.securityType}</span>
                          )}
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
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <TechIcon icon={Shield} size={64} glow="violet" animated={false} className="empty-icon" />
              <h3>No Security Analysis Yet</h3>
              <p>Start by analyzing your codebase for security issues</p>
            </div>
          )
        ) : (
          reviews.length === 0 ? (
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
          )
        )}
      </div>
    </div>
  );
}

export default CodeReview;

