import { useActivityStore } from '../../services/activity/activityStore';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import '../../styles/AlertsPanel.css';

function AlertsPanel() {
  const { activities } = useActivityStore();

  // Get recent important activities (errors, builds, deploys)
  const alerts = activities
    .filter(a => 
      a.type === 'error' || 
      a.type === 'build' || 
      a.type === 'deploy' ||
      (a.type === 'project' && a.action === 'created')
    )
    .slice(0, 10);

  const getAlertType = (activity: any) => {
    if (activity.type === 'error') return 'error';
    if (activity.action === 'failed') return 'error';
    if (activity.action === 'completed') return 'success';
    if (activity.action === 'started') return 'info';
    return 'info';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={16} className="alert-icon success" />;
      case 'error':
        return <XCircle size={16} className="alert-icon error" />;
      case 'warning':
        return <AlertTriangle size={16} className="alert-icon warning" />;
      default:
        return <Info size={16} className="alert-icon info" />;
    }
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="alerts-panel">
      <div className="alerts-header">
        <div className="header-content">
          <Bell size={20} className="alerts-icon" />
          <h3 className="alerts-title">Recent Alerts</h3>
        </div>
        <div className="alerts-count">
          {alerts.length}
        </div>
      </div>

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="no-alerts">
            <Bell size={32} className="no-alerts-icon" />
            <p className="no-alerts-text">All clear</p>
            <p className="no-alerts-subtext">No alerts at this time</p>
          </div>
        ) : (
          alerts.map((activity) => {
            const alertType = getAlertType(activity);
            
            return (
              <div key={activity.id} className={`alert-item ${alertType}`}>
                <div className="alert-icon-wrapper">
                  {getAlertIcon(alertType)}
                </div>

                <div className="alert-content">
                  <div className="alert-description">{activity.description}</div>
                  <div className="alert-time">{formatTime(activity.timestamp)}</div>
                </div>

                <div className={`alert-badge ${alertType}`}>
                  {activity.type}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AlertsPanel;

