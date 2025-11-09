// src/components/RightPanel/GitStatusWidget.tsx
import { useGitHubStore } from '../../services/github/githubStore';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import '../../styles/RightPanel.css';

const GitStatusWidget = () => {
  const { status, branches } = useGitHubStore();

  return (
    <div className="status-widget-container">
      <div className="widget-header">
        <TechIcon icon={ICON_MAP.github} />
        <h4>Git Status</h4>
      </div>
      <div className="widget-content">
        {status ? (
          <>
            <div className="widget-row">
              <TechIcon icon={ICON_MAP.gitbranch} size="sm" />
              <span>Current Branch:</span>
              <span className="widget-value">{status.branch}</span>
            </div>
            <div className="widget-row">
              <TechIcon icon={ICON_MAP.layers} size="sm" />
              <span>Changed Files:</span>
              <span className="widget-value">{status.files.length}</span>
            </div>
            <div className="widget-row">
              <TechIcon icon={ICON_MAP.gitbranch} size="sm" />
              <span>Total Branches:</span>
              <span className="widget-value">{branches.length}</span>
            </div>
          </>
        ) : (
          <div className="widget-placeholder">
            <span>No Git repository detected.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GitStatusWidget;
