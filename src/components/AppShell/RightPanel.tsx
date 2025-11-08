import '../../styles/RightPanel.css';
import ActivityFeed from '../Activity/ActivityFeed';
import ProjectSelector from '../RightPanel/ProjectSelector';
import IdeaPipeline from '../RightPanel/IdeaPipeline';
import GitStatusWidget from '../RightPanel/GitStatusWidget';
import SystemStatusWidget from '../RightPanel/SystemStatusWidget';

function RightPanel() {
  return (
    <div className="right-panel glass-panel">
      <div className="command-center-grid">
        <div className="grid-item project-selector">
          <ProjectSelector />
        </div>
        <div className="grid-item idea-pipeline">
          <IdeaPipeline />
        </div>
        <div className="grid-item activity-feed">
          <ActivityFeed />
        </div>
        <div className="grid-item git-status">
          <GitStatusWidget />
        </div>
        <div className="grid-item system-status">
          <SystemStatusWidget />
        </div>
      </div>
    </div>
  );
}

export default RightPanel;

