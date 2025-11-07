import '../styles/RightPanel.css';
import LLMStatus from '../LLMStatus/LLMStatus';

function RightPanel() {
  return (
    <div className="right-panel">
      <div className="panel-section">
        <div className="section-header">Activity Feed</div>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-icon">✨</span>
            <div className="activity-content">
              <div className="activity-title">Project initialized</div>
              <div className="activity-time">Just now</div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-section">
        <LLMStatus />
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
    </div>
  );
}

export default RightPanel;

