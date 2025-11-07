import { useProjectStore } from '../../services/project/projectStore';
import TechIcon from '../Icons/TechIcon';
import { Folder, Play, Trash2, Clock } from 'lucide-react';
import '../../styles/RecentOperations.css';

function RecentOperations() {
  const { projects, setActiveProject, deleteProject } = useProjectStore();

  // Get the 6 most recent projects
  const recentProjects = [...projects]
    .sort((a, b) => {
      const aTime = a.lastModified || a.createdAt || 0;
      const bTime = b.lastModified || b.createdAt || 0;
      return bTime - aTime;
    })
    .slice(0, 6);

  const handleOpen = (projectId: string) => {
    setActiveProject(projectId);
  };

  const handleDelete = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this project? This action cannot be undone.')) {
      deleteProject(projectId);
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getStatusColor = (projectId: string) => {
    // Simple logic: if recently modified, green; otherwise yellow
    const project = projects.find(p => p.id === projectId);
    if (!project) return 'yellow';
    
    const lastMod = project.lastModified || project.createdAt || 0;
    const hoursSince = (Date.now() - lastMod) / 3600000;
    
    if (hoursSince < 1) return 'green';
    if (hoursSince < 24) return 'yellow';
    return 'red';
  };

  if (recentProjects.length === 0) {
    return (
      <div className="recent-operations">
        <div className="operations-header">
          <span className="header-accent">▸</span>
          <h3 className="operations-title">RECENT OPERATIONS</h3>
          <span className="header-line"></span>
        </div>
        <div className="no-operations">
          <div className="no-ops-icon">◈</div>
          <p className="no-ops-text">No recent projects</p>
          <p className="no-ops-subtext">Create your first mission to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-operations">
      <div className="operations-header">
        <span className="header-accent">▸</span>
        <h3 className="operations-title">RECENT OPERATIONS</h3>
        <span className="header-line"></span>
      </div>

      <div className="operations-grid">
        {recentProjects.map((project) => {
          const fileCount = Object.keys(project.files).length;
          const lastMod = project.lastModified || project.createdAt || Date.now();
          const statusColor = getStatusColor(project.id);

          return (
            <div 
              key={project.id} 
              className="operation-card"
              onClick={() => handleOpen(project.id)}
            >
              {/* Status LED */}
              <div className={`status-led ${statusColor}`}></div>

              {/* Project icon */}
              <div className="project-icon-wrapper">
                <TechIcon 
                  icon={Folder}
                  size={24}
                  glow="cyan"
                  className="project-icon"
                />
              </div>

              {/* Project info */}
              <div className="project-info">
                <h4 className="project-name">{project.name}</h4>
                <div className="project-meta">
                  <span className="meta-item">
                    <span className="meta-icon">◈</span>
                    <span>{fileCount} files</span>
                  </span>
                  <span className="meta-divider">|</span>
                  <span className="meta-item">
                    <Clock size={12} />
                    <span>{getTimeAgo(lastMod)}</span>
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="card-actions">
                <button 
                  className="action-btn open-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpen(project.id);
                  }}
                  title="Open Project"
                >
                  <Play size={14} />
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={(e) => handleDelete(project.id, e)}
                  title="Delete Project"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Hover scan effect */}
              <div className="card-scan"></div>

              {/* Corner brackets */}
              <div className="card-brackets">
                <span className="bracket tl"></span>
                <span className="bracket tr"></span>
                <span className="bracket bl"></span>
                <span className="bracket br"></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RecentOperations;

