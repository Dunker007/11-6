import { useState, useEffect } from 'react';
import { useHealthStore } from '../../services/health/healthStore';
import '../../styles/HealthDashboard.css';

function HealthDashboard() {
  const { stats, metrics, alerts, checkHealth, startMonitoring, stopMonitoring, acknowledgeAlert } = useHealthStore();
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    checkHealth();
    if (autoRefresh) {
      startMonitoring(5000);
    }
    return () => {
      stopMonitoring();
    };
  }, [autoRefresh]);

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getMetricColor = (status: string): string => {
    switch (status) {
      case 'critical':
        return 'rgb(239, 68, 68)';
      case 'warning':
        return 'rgb(251, 191, 36)';
      default:
        return 'rgb(34, 197, 94)';
    }
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-header">
        <h2>System Health</h2>
        <div className="header-controls">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => {
                setAutoRefresh(e.target.checked);
                if (e.target.checked) {
                  startMonitoring(5000);
                } else {
                  stopMonitoring();
                }
              }}
            />
            <span>Auto-refresh</span>
          </label>
          <button onClick={() => checkHealth()} className="refresh-btn">
            ↻ Refresh
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3>Alerts</h3>
          {alerts.map((alert) => (
            <div key={alert.id} className={`alert-item ${alert.severity}`}>
              <div className="alert-content">
                <span className="alert-icon">{alert.severity === 'critical' ? '🔴' : '⚠️'}</span>
                <span className="alert-message">{alert.message}</span>
              </div>
              <button
                onClick={() => acknowledgeAlert(alert.id)}
                className="acknowledge-btn"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <h3>CPU</h3>
              <span className="stat-value">{stats.cpu.usage.toFixed(1)}%</span>
            </div>
            <div className="stat-details">
              <div>Model: {stats.cpu.model}</div>
              <div>Cores: {stats.cpu.cores}</div>
              {stats.cpu.temperature && (
                <div>Temp: {stats.cpu.temperature.toFixed(1)}°C</div>
              )}
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${stats.cpu.usage}%`,
                  backgroundColor: stats.cpu.usage > 90 ? 'rgb(239, 68, 68)' : stats.cpu.usage > 70 ? 'rgb(251, 191, 36)' : 'rgb(34, 197, 94)',
                }}
              />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <h3>Memory</h3>
              <span className="stat-value">{stats.memory.usage.toFixed(1)}%</span>
            </div>
            <div className="stat-details">
              <div>Used: {formatBytes(stats.memory.used)}</div>
              <div>Free: {formatBytes(stats.memory.free)}</div>
              <div>Total: {formatBytes(stats.memory.total)}</div>
            </div>
            <div className="stat-bar">
              <div
                className="stat-bar-fill"
                style={{
                  width: `${stats.memory.usage}%`,
                  backgroundColor: stats.memory.usage > 95 ? 'rgb(239, 68, 68)' : stats.memory.usage > 80 ? 'rgb(251, 191, 36)' : 'rgb(34, 197, 94)',
                }}
              />
            </div>
          </div>

          {stats.disk.length > 0 && (
            <div className="stat-card">
              <div className="stat-header">
                <h3>Disk</h3>
                <span className="stat-value">{stats.disk[0].usage.toFixed(1)}%</span>
              </div>
              <div className="stat-details">
                <div>Used: {formatBytes(stats.disk[0].used)}</div>
                <div>Free: {formatBytes(stats.disk[0].free)}</div>
                <div>Total: {formatBytes(stats.disk[0].total)}</div>
              </div>
              <div className="stat-bar">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${stats.disk[0].usage}%`,
                    backgroundColor: stats.disk[0].usage > 95 ? 'rgb(239, 68, 68)' : stats.disk[0].usage > 85 ? 'rgb(251, 191, 36)' : 'rgb(34, 197, 94)',
                  }}
                />
              </div>
            </div>
          )}

          <div className="stat-card">
            <div className="stat-header">
              <h3>Processes</h3>
              <span className="stat-value">{stats.processes.total}</span>
            </div>
            <div className="stat-details">
              <div>Running: {stats.processes.running}</div>
              <div>Uptime: {Math.floor(stats.uptime / 3600)}h</div>
            </div>
          </div>
        </div>
      )}

      {metrics.length > 0 && (
        <div className="metrics-section">
          <h3>Health Metrics</h3>
          <div className="metrics-list">
            {metrics.map((metric) => (
              <div key={metric.id} className="metric-item">
                <div className="metric-name">{metric.name}</div>
                <div className="metric-value" style={{ color: getMetricColor(metric.status) }}>
                  {metric.value.toFixed(1)}{metric.unit}
                </div>
                <div className={`metric-status ${metric.status}`}>{metric.status}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HealthDashboard;

