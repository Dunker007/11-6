// src/components/Desktop/ProjectHealthWidget.tsx
import React from 'react';
import { useProjectStore } from '../../services/project/projectStore';
import { errorLogger } from '../../services/errors/errorLogger';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import '../../styles/DesktopWidgets.css';

const ProjectHealthWidget = () => {
  const activeProject = useProjectStore(state => state.activeProject);
  const errorStats = errorLogger.getStats();
  const criticalErrors = errorStats.bySeverity.critical + errorStats.bySeverity.error;

  if (!activeProject) {
    return (
      <div className="widget-placeholder">
        <TechIcon icon={ICON_MAP.folder} />
        <span>No Active Project</span>
      </div>
    );
  }

  return (
    <div className="widget-content">
      <div className="widget-header">
        <TechIcon icon={ICON_MAP.folder} size="sm" />
        <h4>{activeProject.name}</h4>
      </div>
      <div className="widget-metrics">
        <div className="metric-item">
          <span className="metric-value">{activeProject.files.length}</span>
          <span className="metric-label">Files</span>
        </div>
        <div className="metric-item">
          <span className="metric-value">12</span>
          <span className="metric-label">Commits</span>
        </div>
        <div className={`metric-item ${criticalErrors > 0 ? 'errors' : ''}`}>
          <span className="metric-value">{criticalErrors}</span>
          <span className="metric-label">Errors</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectHealthWidget;
