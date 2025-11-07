import { useProjectStore } from '../../services/project/projectStore';
import { FolderOpen, FileText, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import '../../styles/ProjectHealthGrid.css';

function ProjectHealthGrid() {
  const { projects, activeProject, setActiveProject } = useProjectStore();

  // Calculate project health (simplified)
  const getProjectHealth = (project: any) => {
    const fileCount = project.files?.length || 0;
    if (fileCount === 0) return { status: 'warning', label: 'No Files' };
    if (fileCount < 5) return { status: 'caution', label: 'Starting' };
    return { status: 'healthy', label: 'Active' };
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="project-health-grid">
      <div className="grid-header">
        <h3 className="grid-title">Project Status</h3>
        <div className="project-count">
          <span className="count-value">{projects.length}</span>
          <span className="count-label">Total Projects</span>
        </div>
      </div>

      <div className="projects-grid">
        {projects.length === 0 ? (
          <div className="no-projects">
            <FolderOpen size={48} className="no-projects-icon" />
            <p className="no-projects-text">No projects yet</p>
            <p className="no-projects-subtext">Create your first project to get started</p>
          </div>
        ) : (
          projects.map((project) => {
            const health = getProjectHealth(project);
            const isActive = activeProject?.id === project.id;
            
            return (
              <div 
                key={project.id}
                className={`project-card ${isActive ? 'active' : ''} ${health.status}`}
                onClick={() => setActiveProject(project.id)}
              >
                {/* Active Indicator */}
                {isActive && (
                  <div className="active-indicator">
                    <span className="active-pulse"></span>
                    <span className="active-text">ACTIVE</span>
                  </div>
                )}

                {/* Project Header */}
                <div className="project-card-header">
                  <FolderOpen size={20} className="project-icon" />
                  <h4 className="project-name">{project.name}</h4>
                </div>

                {/* Project Stats */}
                <div className="project-stats">
                  <div className="stat-item">
                    <FileText size={14} />
                    <span>{project.files?.length || 0} files</span>
                  </div>
                  <div className="stat-item">
                    <Clock size={14} />
                    <span>{formatDate(project.createdAt)}</span>
                  </div>
                </div>

                {/* Health Status */}
                <div className={`health-status ${health.status}`}>
                  {health.status === 'healthy' && <CheckCircle size={14} />}
                  {health.status === 'warning' && <AlertCircle size={14} />}
                  {health.status === 'caution' && <AlertCircle size={14} />}
                  <span>{health.label}</span>
                </div>

                {/* Description */}
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}

                {/* Glow Effect */}
                <div className="card-glow"></div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default ProjectHealthGrid;

