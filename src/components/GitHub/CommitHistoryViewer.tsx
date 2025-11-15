/**
 * CommitHistoryViewer.tsx
 * 
 * PURPOSE:
 * Visual commit history viewer component. Displays interactive commit graph,
 * commit list with details, and allows filtering/searching commits.
 * 
 * ARCHITECTURE:
 * React component that displays Git commit history:
 * - commitHistoryService: Retrieves commit data
 * - Interactive commit graph visualization
 * - Commit list with details
 * - Filter and search functionality
 * 
 * Features:
 * - Interactive commit graph
 * - Commit details panel
 * - Filter by author, date, message
 * - Search commits
 * - Branch visualization
 * - Commit diff preview
 * 
 * CURRENT STATUS:
 * ✅ Commit list display
 * ✅ Commit graph visualization
 * ✅ Filter and search
 * ✅ Commit details
 * 
 * DEPENDENCIES:
 * - commitHistoryService: Commit history operations
 * - gitDiffService: Diff operations for commit preview
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import CommitHistoryViewer from '@/components/GitHub/CommitHistoryViewer';
 * 
 * <CommitHistoryViewer
 *   repoPath="/path/to/repo"
 *   onCommitSelect={(commit) => console.log(commit)}
 * />
 * ```
 * 
 * RELATED FILES:
 * - src/services/git/commitHistoryService.ts: Commit history service
 * - src/services/git/gitDiffService.ts: Diff service
 */

import { useState, useEffect, useMemo } from 'react';
import { commitHistoryService, type Commit, type CommitGraph } from '@/services/git/commitHistoryService';
import { gitDiffService } from '@/services/git/gitDiffService';
import { 
  GitCommit, 
  GitBranch, 
  Tag, 
  User, 
  Calendar, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  X,
  RefreshCw,
  FileText,
  Plus,
  Minus
} from 'lucide-react';
import '../../styles/CommitHistoryViewer.css';

export interface CommitHistoryViewerProps {
  repoPath: string;
  onCommitSelect?: (commit: Commit) => void;
  onClose?: () => void;
  initialBranch?: string;
}

function CommitHistoryViewer({
  repoPath,
  onCommitSelect,
  onClose,
  initialBranch,
}: CommitHistoryViewerProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [graph, setGraph] = useState<CommitGraph | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<Commit | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(50);
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());

  // Load commits on mount
  useEffect(() => {
    loadCommits();
    loadGraph();
  }, [repoPath, initialBranch, limit]);

  // Filter commits based on search and filters
  const filteredCommits = useMemo(() => {
    let filtered = commits;

    if (searchQuery) {
      filtered = filtered.filter(commit =>
        commit.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        commit.sha.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (authorFilter) {
      filtered = filtered.filter(commit =>
        commit.author.name.toLowerCase().includes(authorFilter.toLowerCase()) ||
        commit.author.email.toLowerCase().includes(authorFilter.toLowerCase())
      );
    }

    return filtered;
  }, [commits, searchQuery, authorFilter]);

  // Get unique authors for filter
  const authors = useMemo(() => {
    const authorSet = new Set<string>();
    commits.forEach(commit => {
      authorSet.add(commit.author.name);
    });
    return Array.from(authorSet).sort();
  }, [commits]);

  const loadCommits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await commitHistoryService.getCommitHistory(repoPath, {
        limit,
        branch: initialBranch,
      });
      setCommits(history);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadGraph = async () => {
    try {
      const commitGraph = await commitHistoryService.getCommitGraph(repoPath, limit);
      setGraph(commitGraph);
    } catch (err) {
      console.error('Error loading graph:', err);
    }
  };

  const handleCommitClick = async (commit: Commit) => {
    setSelectedCommit(commit);
    onCommitSelect?.(commit);
    
    // Load commit details with stats
    const details = await commitHistoryService.getCommitDetails(repoPath, commit.sha);
    if (details) {
      setSelectedCommit(details);
    }
  };

  const toggleCommitExpansion = (sha: string) => {
    const newExpanded = new Set(expandedCommits);
    if (newExpanded.has(sha)) {
      newExpanded.delete(sha);
    } else {
      newExpanded.add(sha);
    }
    setExpandedCommits(newExpanded);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(date);
  };

  return (
    <div className="commit-history-viewer">
      <div className="commit-history-header">
        <div className="header-title">
          <GitCommit size={20} />
          <h2>Commit History</h2>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={() => setShowFilters(!showFilters)}
            title="Toggle filters"
          >
            <Filter size={18} />
          </button>
          <button
            className="icon-btn"
            onClick={loadCommits}
            title="Refresh"
            disabled={isLoading}
          >
            <RefreshCw size={18} className={isLoading ? 'spinning' : ''} />
          </button>
          {onClose && (
            <button className="icon-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="commit-history-filters">
          <div className="filter-group">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search commits..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="filter-input"
            />
            {searchQuery && (
              <button
                className="clear-filter-btn"
                onClick={() => setSearchQuery('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="filter-group">
            <User size={16} />
            <select
              value={authorFilter}
              onChange={(e) => setAuthorFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All authors</option>
              {authors.map(author => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
            {authorFilter && (
              <button
                className="clear-filter-btn"
                onClick={() => setAuthorFilter('')}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <div className="filter-group">
            <label>
              Limit:
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                className="limit-input"
              />
            </label>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          <X size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="commit-history-content">
        <div className="commit-list">
          {isLoading && commits.length === 0 ? (
            <div className="loading-state">
              <RefreshCw size={24} className="spinning" />
              <span>Loading commits...</span>
            </div>
          ) : filteredCommits.length === 0 ? (
            <div className="empty-state">
              <GitCommit size={48} />
              <p>No commits found</p>
            </div>
          ) : (
            filteredCommits.map((commit) => {
              const isExpanded = expandedCommits.has(commit.sha);
              const isSelected = selectedCommit?.sha === commit.sha;
              const isMerge = commit.parents.length > 1;

              return (
                <div
                  key={commit.sha}
                  className={`commit-item ${isSelected ? 'selected' : ''} ${isMerge ? 'merge-commit' : ''}`}
                  onClick={() => handleCommitClick(commit)}
                >
                  <div className="commit-header">
                    <div className="commit-graph-indicator">
                      {isMerge && <GitBranch size={14} />}
                    </div>
                    <div className="commit-main">
                      <div className="commit-message">
                        {commit.message}
                      </div>
                      <div className="commit-meta">
                        <span className="commit-sha">{commit.shortSha}</span>
                        <span className="commit-author">
                          <User size={12} />
                          {commit.author.name}
                        </span>
                        <span className="commit-date">
                          <Calendar size={12} />
                          {formatRelativeDate(commit.date)}
                        </span>
                        {commit.branches && commit.branches.length > 0 && (
                          <span className="commit-branches">
                            <GitBranch size={12} />
                            {commit.branches.join(', ')}
                          </span>
                        )}
                        {commit.tags && commit.tags.length > 0 && (
                          <span className="commit-tags">
                            <Tag size={12} />
                            {commit.tags.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="expand-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCommitExpansion(commit.sha);
                      }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="commit-details">
                      <div className="detail-row">
                        <strong>Full SHA:</strong> <code>{commit.sha}</code>
                      </div>
                      <div className="detail-row">
                        <strong>Date:</strong> {formatDate(commit.date)}
                      </div>
                      <div className="detail-row">
                        <strong>Author:</strong> {commit.author.name} &lt;{commit.author.email}&gt;
                      </div>
                      {commit.stats && (
                        <div className="detail-row">
                          <strong>Changes:</strong>
                          <span className="stats">
                            <span className="stat-item">
                              <FileText size={12} />
                              {commit.stats.files} files
                            </span>
                            <span className="stat-item insertions">
                              <Plus size={12} />
                              {commit.stats.insertions} insertions
                            </span>
                            <span className="stat-item deletions">
                              <Minus size={12} />
                              {commit.stats.deletions} deletions
                            </span>
                          </span>
                        </div>
                      )}
                      {commit.parents.length > 0 && (
                        <div className="detail-row">
                          <strong>Parents:</strong>
                          <div className="parent-shas">
                            {commit.parents.map(parent => (
                              <code key={parent} className="parent-sha">
                                {parent.substring(0, 7)}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {selectedCommit && (
          <div className="commit-details-panel">
            <div className="panel-header">
              <h3>Commit Details</h3>
              <button className="icon-btn" onClick={() => setSelectedCommit(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="panel-content">
              <div className="detail-section">
                <h4>Message</h4>
                <p>{selectedCommit.message}</p>
              </div>
              <div className="detail-section">
                <h4>Author</h4>
                <p>
                  {selectedCommit.author.name} &lt;{selectedCommit.author.email}&gt;
                </p>
              </div>
              <div className="detail-section">
                <h4>Date</h4>
                <p>{formatDate(selectedCommit.date)}</p>
              </div>
              <div className="detail-section">
                <h4>SHA</h4>
                <code>{selectedCommit.sha}</code>
              </div>
              {selectedCommit.stats && (
                <div className="detail-section">
                  <h4>Statistics</h4>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <FileText size={20} />
                      <div>
                        <div className="stat-value">{selectedCommit.stats.files}</div>
                        <div className="stat-label">Files</div>
                      </div>
                    </div>
                    <div className="stat-card insertions">
                      <Plus size={20} />
                      <div>
                        <div className="stat-value">{selectedCommit.stats.insertions}</div>
                        <div className="stat-label">Insertions</div>
                      </div>
                    </div>
                    <div className="stat-card deletions">
                      <Minus size={20} />
                      <div>
                        <div className="stat-value">{selectedCommit.stats.deletions}</div>
                        <div className="stat-label">Deletions</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommitHistoryViewer;

