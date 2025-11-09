// src/components/RightPanel/IdeaPipeline.tsx
import { useProjectStore } from '../../services/project/projectStore';
import type { Project } from '../../types/project';
import '../../styles/RightPanel.css';
import { DndContext, closestCenter, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import KaiCreativeRoom from './KaiCreativeRoom'; // Import the extracted component

type ProjectStatus = Project['status'];

// Removed unused Message interface

const DraggableProjectItem = ({ project, statusOrder }: { project: Project, statusOrder: ProjectStatus[] }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: project.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const { updateProjectStatus } = useProjectStore();

  const handleStatusChange = (projectId: string, newStatus: ProjectStatus) => {
    updateProjectStatus(projectId, newStatus);
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="pipeline-item">
      <p className="item-name">{project.name}</p>
      <select
        value={project.status}
        onChange={(e) => handleStatusChange(project.id, e.target.value as ProjectStatus)}
        className="status-select"
        onClick={(e) => e.stopPropagation()} // Prevent drag from starting on select click
      >
        {statusOrder.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  );
};

const DroppableColumn = ({ status, projects, getStatusColor, statusOrder }: { status: ProjectStatus, projects: Project[], getStatusColor: (s: ProjectStatus) => string, statusOrder: ProjectStatus[] }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
  });
  const style = {
    backgroundColor: isOver ? 'rgba(var(--accent-cyan-rgb), 0.1)' : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="pipeline-column">
      <div className="column-header">
        <span className={`status-dot ${getStatusColor(status)}`}></span>
        <h4>{status.replace('-', ' ')}</h4>
        <span className="project-count">{projects.length}</span>
      </div>
      <div className="column-items">
        {projects.map(project => (
          <DraggableProjectItem key={project.id} project={project} statusOrder={statusOrder} />
        ))}
      </div>
    </div>
  );
};


const IdeaPipeline = () => {
  const { projects, updateProjectStatus } = useProjectStore();

  const statusOrder: ProjectStatus[] = ['idea', 'backlog', 'in-progress', 'completed'];

  const projectsByStatus = statusOrder.reduce((acc, status) => {
    acc[status] = projects.filter(p => p.status === status);
    return acc;
  }, {} as Record<ProjectStatus, Project[]>);

  const handleDragEnd = (event: any) => {
    const { over, active } = event;
    if (over && active) {
      const projectId = active.id;
      const newStatus = over.id as ProjectStatus;
      const project = projects.find(p => p.id === projectId);
      if (project && project.status !== newStatus) {
        updateProjectStatus(projectId, newStatus);
      }
    }
  };

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'idea': return 'bg-purple-500';
      case 'backlog': return 'bg-gray-500';
      case 'in-progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      default: return 'bg-gray-700';
    }
  };
  
  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="idea-pipeline-container">
        <div className="pipeline-columns">
          <div className="pipeline-column kai-column">
            <KaiCreativeRoom />
          </div>
          {statusOrder.map(status => (
            <DroppableColumn 
              key={status}
              status={status}
              projects={projectsByStatus[status]}
              getStatusColor={getStatusColor}
              statusOrder={statusOrder}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
};

export default IdeaPipeline;
