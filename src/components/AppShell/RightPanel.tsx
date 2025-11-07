import '../../styles/RightPanel.css';
import ActivityFeed from '../Activity/ActivityFeed';
import LLMStatus from '../LLMStatus/LLMStatus';
import HealthDashboard from '../Health/HealthDashboard';
import VersionDisplay from '../System/VersionDisplay';

function RightPanel() {
  return (
    <div className="right-panel">
      <div className="panel-section activity-feed-section">
        <ActivityFeed />
      </div>

      <div className="panel-section">
        <LLMStatus />
      </div>

      <div className="panel-section">
        <HealthDashboard />
      </div>

      <div className="panel-section">
        <div className="section-header">AI Suggestions</div>
        <div className="suggestions-list">
          <div className="suggestion-item">
            <span className="suggestion-icon">💡</span>
            <div className="suggestion-content">
              <div className="suggestion-title">Start coding</div>
              <div className="suggestion-desc">Create your first file</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <div className="section-header">Stats</div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">0</div>
            <div className="stat-label">Files</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">0</div>
            <div className="stat-label">Lines</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">0</div>
            <div className="stat-label">Tokens</div>
          </div>
        </div>
      </div>

      <VersionDisplay />
    </div>
  );
}

export default RightPanel;

