/**
 * SecurityScanPanel.tsx
 * 
 * PURPOSE:
 * Component for displaying npm audit security scan results. Shows vulnerabilities,
 * allows filtering by severity, and provides fix functionality.
 * 
 * ARCHITECTURE:
 * React component that uses npmAuditService:
 * - npmAuditService: Runs npm audit and fixes vulnerabilities
 * - Vulnerability display with severity indicators
 * - Filter and search functionality
 * - Auto-fix capability
 * 
 * Features:
 * - Vulnerability scanning
 * - Severity-based filtering
 * - Fix recommendations
 * - Auto-fix with confirmation
 * - Summary statistics
 * 
 * CURRENT STATUS:
 * ✅ Vulnerability display
 * ✅ Severity filtering
 * ✅ Auto-fix
 * ✅ Summary statistics
 * 
 * DEPENDENCIES:
 * - npmAuditService: Security scanning operations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import SecurityScanPanel from '@/components/CodeQuality/SecurityScanPanel';
 * 
 * <SecurityScanPanel projectPath="/path/to/project" />
 * ```
 */

import { useState, useEffect } from 'react';
import { npmAuditService, type AuditResult, type Vulnerability } from '@/services/codeQuality/npmAuditService';
import { 
  Shield, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  Wrench,
  CheckCircle,
  XCircle,
  Filter,
  Search,
  X
} from 'lucide-react';
import '../../styles/SecurityScanPanel.css';

export interface SecurityScanPanelProps {
  projectPath: string;
  onScanComplete?: (result: AuditResult) => void;
}

function SecurityScanPanel({ projectPath, onScanComplete }: SecurityScanPanelProps) {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFixing, setIsFixing] = useState(false);

  useEffect(() => {
    if (projectPath) {
      scanProject();
    }
  }, [projectPath]);

  const scanProject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await npmAuditService.scanProject(projectPath);
      setAuditResult(result);
      onScanComplete?.(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFix = async (force: boolean = false) => {
    if (!auditResult || auditResult.summary.vulnerabilities.total === 0) {
      return;
    }

    if (!confirm(`Fix ${auditResult.summary.vulnerabilities.total} vulnerabilities?`)) {
      return;
    }

    try {
      setIsFixing(true);
      setError(null);
      const result = await npmAuditService.fixVulnerabilities(projectPath, force);
      
      if (result.success) {
        // Re-scan to get updated results
        await scanProject();
        alert(`Fixed ${result.fixed} vulnerabilities`);
      } else {
        setError(result.errors.join(', '));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsFixing(false);
    }
  };

  const getSeverityIcon = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle size={16} className="severity-critical" />;
      case 'high':
        return <AlertCircle size={16} className="severity-high" />;
      case 'moderate':
        return <AlertTriangle size={16} className="severity-moderate" />;
      case 'low':
        return <Info size={16} className="severity-low" />;
      default:
        return <Info size={16} className="severity-info" />;
    }
  };

  const getSeverityColor = (severity: Vulnerability['severity']) => {
    switch (severity) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f59e0b';
      case 'moderate':
        return '#eab308';
      case 'low':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  const filteredVulnerabilities = auditResult?.vulnerabilities.filter(v => {
    const matchesSeverity = selectedSeverity === 'all' || v.severity === selectedSeverity;
    const matchesSearch = searchQuery === '' || 
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  }) || [];

  if (!projectPath) {
    return (
      <div className="security-scan-panel">
        <div className="empty-state">
          <p>No project path provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="security-scan-panel">
      <div className="scan-header">
        <div className="header-left">
          <Shield size={20} />
          <h2>Security Scan</h2>
        </div>
        <div className="header-actions">
          <button
            onClick={scanProject}
            className="scan-btn"
            disabled={isLoading}
            title="Scan for vulnerabilities"
          >
            <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
            Scan
          </button>
          {auditResult && auditResult.summary.vulnerabilities.total > 0 && (
            <button
              onClick={() => handleFix(false)}
              className="fix-btn"
              disabled={isFixing}
              title="Fix vulnerabilities"
            >
              <Wrench size={16} />
              Fix
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-message">
          <XCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {isLoading && !auditResult ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spinning" />
          <span>Scanning for vulnerabilities...</span>
        </div>
      ) : auditResult ? (
        <>
          <div className="scan-summary">
            <div className="summary-card">
              <div className="summary-label">Total Vulnerabilities</div>
              <div className="summary-value critical">
                {auditResult.summary.vulnerabilities.total}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Critical</div>
              <div className="summary-value critical">
                {auditResult.summary.vulnerabilities.critical}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">High</div>
              <div className="summary-value high">
                {auditResult.summary.vulnerabilities.high}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Moderate</div>
              <div className="summary-value moderate">
                {auditResult.summary.vulnerabilities.moderate}
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-label">Low</div>
              <div className="summary-value low">
                {auditResult.summary.vulnerabilities.low}
              </div>
            </div>
          </div>

          <div className="scan-filters">
            <div className="filter-group">
              <Filter size={14} />
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="severity-filter"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
                <option value="info">Info</option>
              </select>
            </div>
            <div className="filter-group">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search vulnerabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="clear-search-btn"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <div className="vulnerabilities-list">
            {filteredVulnerabilities.length === 0 ? (
              <div className="empty-state">
                {auditResult.summary.vulnerabilities.total === 0 ? (
                  <>
                    <CheckCircle size={48} className="success-icon" />
                    <p>No vulnerabilities found!</p>
                  </>
                ) : (
                  <p>No vulnerabilities match the current filters</p>
                )}
              </div>
            ) : (
              filteredVulnerabilities.map((vuln, index) => (
                <div key={`${vuln.name}-${index}`} className="vulnerability-item">
                  <div className="vuln-header">
                    <div className="vuln-severity">
                      {getSeverityIcon(vuln.severity)}
                      <span
                        className="severity-badge"
                        style={{ color: getSeverityColor(vuln.severity) }}
                      >
                        {vuln.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="vuln-name">{vuln.name}</div>
                    {vuln.fixAvailable && (
                      <span className="fix-available-badge">Fix Available</span>
                    )}
                  </div>
                  <div className="vuln-title">{vuln.title}</div>
                  {vuln.description && (
                    <div className="vuln-description">{vuln.description}</div>
                  )}
                  {vuln.recommendation && (
                    <div className="vuln-recommendation">
                      <strong>Recommendation:</strong> {vuln.recommendation}
                    </div>
                  )}
                  {vuln.path && (
                    <div className="vuln-path">
                      <strong>Path:</strong> <code>{vuln.path}</code>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <p>Click "Scan" to check for vulnerabilities</p>
        </div>
      )}
    </div>
  );
}

export default SecurityScanPanel;

