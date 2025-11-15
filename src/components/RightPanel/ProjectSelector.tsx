// src/components/RightPanel/ProjectSelector.tsx
import { useState } from 'react';
import { useProjectStore } from '../../services/project/projectStore';
import TechIcon from '../Icons/TechIcon';
import { ICON_MAP } from '../Icons/IconSet';
import { ChevronDown, Check } from 'lucide-react';
import '../../styles/RightPanel.css'; // We'll add styles here later

const ProjectSelector = () => {
  const { projects, activeProject, setActiveProject } = useProjectStore();
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: 'idea' | 'backlog' | 'in-progress' | 'completed' | 'deployed' | 'archived') => {
    switch (status) {
      case 'idea': return 'bg-purple-500';
      case 'backlog': return 'bg-gray-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'deployed': return 'bg-emerald-500';
      case 'archived': return 'bg-gray-700';
      default: return 'bg-gray-700';
    }
  };

  if (!activeProject) {
    return (
      <div className="project-selector-empty">
        <TechIcon icon={ICON_MAP.folder} />
        <span>No Active Project</span>
      </div>
    );
  }

  return (
    <div className="project-selector-container">
      <button className="project-selector-button" onClick={() => setIsOpen(!isOpen)}>
        <div className="project-info">
          <span className={`status-dot ${getStatusColor(activeProject.status)}`}></span>
          <span className="project-name">{activeProject.name}</span>
        </div>
        <ChevronDown size={20} className={`chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && (
        <div className="project-dropdown">
          {projects.map((project) => (
            <div
              key={project.id}
              className="dropdown-item"
              onClick={() => {
                setActiveProject(project.id);
                setIsOpen(false);
              }}
            >
              <div className="project-info">
                <span className={`status-dot ${getStatusColor(project.status)}`}></span>
                <span className="project-name">{project.name}</span>
              </div>
              {activeProject.id === project.id && <Check size={16} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;
