import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';
import { useHealthStore } from '@/services/health/healthStore';
import '../../styles/LLMOptimizer.css';

const SystemAlertsCompact = () => {
  const { alerts, acknowledgeAlert, checkHealth } = useHealthStore();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Refresh alerts periodically
  useEffect(() => {
    checkHealth();
    const interval = setInterval(() => {
      checkHealth();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkHealth]);

  // Auto-dismiss non-critical alerts after 5 seconds
  useEffect(() => {
    alerts.forEach((alert) => {
      if (alert.severity === 'warning' && !dismissedAlerts.has(alert.id)) {
        const timer = setTimeout(() => {
          handleDismiss(alert.id);
        }, 5000);
        return () => clearTimeout(timer);
      }
    });
  }, [alerts, dismissedAlerts]);

  const handleDismiss = useCallback((id: string) => {
    acknowledgeAlert(id);
    setDismissedAlerts((prev) => new Set(prev).add(id));
  }, [acknowledgeAlert]);

  // Filter out dismissed alerts and show max 3
  const visibleAlerts = alerts
    .filter((alert) => !dismissedAlerts.has(alert.id))
    .slice(0, 3);

  if (visibleAlerts.length === 0) {
    return (
      <div className="sidebar-section">
        <h3>System Alerts</h3>
        <div className="compact-alerts-empty">
          <CheckCircle size={16} className="alert-icon healthy" />
          <span className="alert-text">All systems normal</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sidebar-section">
      <h3>System Alerts</h3>
      <div className="compact-alerts-list">
        {visibleAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`compact-alert-item ${alert.severity}`}
          >
            <AlertTriangle size={14} className="alert-icon" />
            <span className="alert-message" title={alert.message}>
              {alert.message.length > 40
                ? `${alert.message.substring(0, 40)}...`
                : alert.message}
            </span>
            <button
              className="alert-dismiss-btn"
              onClick={() => handleDismiss(alert.id)}
              title="Dismiss alert"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {alerts.length > 3 && (
          <div className="compact-alerts-more">
            +{alerts.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemAlertsCompact;

