import { useEffect } from 'react';
import { useDeploymentStore } from '../../services/deploy/deploymentStore';
import '../../styles/DeployWorkflow.css';

function DeploymentHistory() {
  const { history, loadHistory } = useDeploymentStore();

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (!history || history.deployments.length === 0) {
    return (
      <div className="deployment-history">
        <h3>Deployment History</h3>
        <div className="empty-state">No deployments yet. Deploy your first project to get started!</div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'pending':
      case 'building':
      case 'deploying':
        return '⏳';
      case 'cancelled':
        return '🚫';
      default:
        return '⚪';
    }
  };

  return (
    <div className="deployment-history">
      <div className="history-header">
        <h3>Deployment History</h3>
        <div className="history-stats">
          <span className="stat">
            Total: <strong>{history.totalDeployments}</strong>
          </span>
          <span className="stat">
            Success Rate: <strong>{history.successRate.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      <div className="deployments-list">
        {history.deployments.map((deployment) => (
          <div key={deployment.id} className={`deployment-item ${deployment.status}`}>
            <div className="deployment-main">
              <div className="deployment-status">
                <span className="status-icon">{getStatusIcon(deployment.status)}</span>
                <div className="deployment-info">
                  <div className="deployment-name">{deployment.targetName}</div>
                  <div className="deployment-meta">
                    <span>{formatDate(deployment.createdAt)}</span>
                    {deployment.completedAt && (
                      <>
                        <span>•</span>
                        <span>Completed {formatDate(deployment.completedAt)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {deployment.url && (
                <a
                  href={deployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="deployment-url"
                >
                  🌐 View Site
                </a>
              )}
            </div>
            {deployment.error && (
              <div className="deployment-error">{deployment.error}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DeploymentHistory;

