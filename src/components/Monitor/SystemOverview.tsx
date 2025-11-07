import { useEffect, useState } from 'react';
import { useProjectStore } from '../../services/project/projectStore';
import { useActivityStore } from '../../services/activity/activityStore';
import { useLLMStore } from '../../services/ai/llmStore';
import { Activity, Zap, Database, Cpu } from 'lucide-react';
import '../../styles/SystemOverview.css';

function SystemOverview() {
  const { projects, activeProject } = useProjectStore();
  const { activities } = useActivityStore();
  const { status: llmStatus } = useLLMStore();
  const [uptime, setUptime] = useState(0);

  // Calculate uptime (simulated - starts from page load)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate activity in last hour
  const recentActivity = activities.filter(a => 
    Date.now() - a.timestamp < 3600000
  ).length;

  // System health (simplified calculation)
  const systemHealth = llmStatus === 'connected' ? 95 : 75;

  return (
    <div className="system-overview">
      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-indicator online">
          <div className="status-pulse"></div>
          <span>SYSTEM OPERATIONAL</span>
        </div>
        <div className="uptime-display">
          <span className="uptime-label">UPTIME</span>
          <span className="uptime-value">{formatUptime(uptime)}</span>
        </div>
      </div>

      {/* Main Gauges */}
      <div className="gauges-grid">
        {/* System Health Gauge */}
        <div className="gauge-card">
          <div className="gauge-header">
            <Cpu size={20} className="gauge-icon" />
            <span className="gauge-title">System Health</span>
          </div>
          <div className="gauge-container">
            <svg className="gauge-svg" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="gradient-health" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              {/* Background circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="rgba(139, 92, 246, 0.1)"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="url(#gradient-health)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(systemHealth / 100) * 534} 534`}
                transform="rotate(-90 100 100)"
                className="gauge-progress"
              />
              {/* Center text */}
              <text
                x="100"
                y="105"
                textAnchor="middle"
                className="gauge-value-text"
              >
                {systemHealth}%
              </text>
            </svg>
          </div>
        </div>

        {/* Active Projects Gauge */}
        <div className="gauge-card">
          <div className="gauge-header">
            <Database size={20} className="gauge-icon" />
            <span className="gauge-title">Active Projects</span>
          </div>
          <div className="gauge-container">
            <div className="stat-display">
              <div className="stat-number">{activeProject ? 1 : 0}</div>
              <div className="stat-total">of {projects.length}</div>
            </div>
          </div>
        </div>

        {/* Activity Rate Gauge */}
        <div className="gauge-card">
          <div className="gauge-header">
            <Activity size={20} className="gauge-icon" />
            <span className="gauge-title">Activity Rate</span>
          </div>
          <div className="gauge-container">
            <div className="stat-display">
              <div className="stat-number">{recentActivity}</div>
              <div className="stat-total">events/hour</div>
            </div>
          </div>
        </div>

        {/* AI Status Gauge */}
        <div className="gauge-card">
          <div className="gauge-header">
            <Zap size={20} className="gauge-icon" />
            <span className="gauge-title">AI Status</span>
          </div>
          <div className="gauge-container">
            <div className="stat-display">
              <div className={`status-badge ${llmStatus}`}>
                {llmStatus === 'connected' ? 'ONLINE' : 
                 llmStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SystemOverview;

