/**
 * projectStore.ts
 * 
 * PURPOSE:
 * Zustand store for project management state. Manages active projects, files, and their content.
 * Provides reactive state for project operations including creation, selection, file management,
 * and activity tracking. Central store for all project-related UI state.
 * 
 * ARCHITECTURE:
 * Zustand store that wraps projectService with reactive state:
 * - Manages projects list and active project
 * - Tracks active file selection
 * - Handles file operations (add, update, delete, get content)
 * - Integrates with activityService for activity logging
 * - Provides project root path resolution
 * 
 * CURRENT STATUS:
 * ✅ Full project CRUD operations
 * ✅ File management (add, update, delete)
 * ✅ Active project/file tracking
 * ✅ Activity logging integration
 * ✅ Project root path management
 * ✅ Project status updates
 * 
 * DEPENDENCIES:
 * - projectService: Core project data operations
 * - activityService: Activity logging
 * - @/types/project: Project type definitions
 * - lucide-react: Icons for activities
 * 
 * STATE MANAGEMENT:
 * - projects: List of all projects
 * - activeProject: Currently selected project
 * - activeProjectRoot: Root path of active project
 * - activeFile: Currently selected file path
 * - isLoading: Loading state flag
 * - error: Error message if any
 * 
 * PERFORMANCE:
 * - Reactive updates via Zustand
 * - Efficient file content access
 * - Activity logging doesn't block operations
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * import { useProjectStore } from '@/services/project/projectStore';
 * 
 * function MyComponent() {
 *   const { activeProject, activeFile, setActiveFile, updateFile } = useProjectStore();
 *   
 *   const handleSave = () => {
 *     if (activeFile) {
 *       updateFile(activeFile, newContent);
 *     }
 *   };
 * }
 * ```
 * 
 * RELATED FILES:
 * - src/services/project/projectService.ts: Core project operations
 * - src/services/activity/activityService.ts: Activity logging
 * - src/components/VibeEditor/VibeEditor.tsx: Uses this store
 * - src/components/VibeEditor/FileExplorer.tsx: Uses this store
 * 
 * TODO / FUTURE ENHANCEMENTS:
 * - Project templates support
 * - Project import/export
 * - Project sharing
 * - Recent projects list
 */
import { create } from 'zustand';
import { projectService } from './projectService';
import { activityService } from '../activity/activityService';
import type { Project } from '@/types/project';
import { FolderPlus, FileText, Trash2 } from 'lucide-react';
import { getActivityIconAndColor } from '@/services/activity/activityIconMapper';

type ProjectStatus = Project['status'];

interface ProjectStore {
  projects: Project[];
  activeProject: Project | null;
  activeProjectRoot: string | null; // Add this line
  isLoading: boolean;
  error: string | null;
  loadProjects: () => void;
  createProject: (name: string, description?: string) => Project;
  setActiveProject: (id: string) => void;
  updateProjectStatus: (id: string, status: ProjectStatus) => void;
  updateFile: (path: string, content: string) => void;
  addFile: (path: string, content: string, language?: string) => void;
  deleteFile: (path: string) => void;
  getFileContent: (path: string) => string | null;
  activeFile: string | null;
  setActiveFile: (path: string | null) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: [],
  activeProject: null,
  activeProjectRoot: null, // Add this line
  activeFile: null,
  isLoading: false,
  error: null,

  loadProjects: () => {
    const projects = projectService.getAllProjects();
    const activeProject = projectService.getActiveProject();
    set({ projects, activeProject });
  },

  createProject: (name, description) => {
    const project = projectService.createProject(name, description);
    // New projects start as 'idea'
    project.status = 'idea';
    projectService.updateProject(project);

    const activeProjectRoot = projectService.getProjectRoot(project.id);

    set((state) => ({
      projects: [...state.projects, project],
      activeProject: project,
      activeProjectRoot: activeProjectRoot,
    }));
    
    // Track activity
    activityService.addActivity({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'project',
      action: 'created',
      description: `Created project "${name}"`,
      timestamp: Date.now(),
      icon: FolderPlus,
      color: 'green',
    });
    
    return project;
  },

  setActiveProject: (id) => {
    projectService.setActiveProject(id);
    const activeProject = projectService.getActiveProject();
    // Assuming projectService can provide the root path
    const activeProjectRoot = activeProject ? projectService.getProjectRoot(id) : null;
    set({ activeProject, activeProjectRoot });
    
    // Track activity
    if (activeProject) {
      activityService.addActivity({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'project',
        action: 'opened',
        description: `Opened project "${activeProject.name}"`,
        timestamp: Date.now(),
        icon: FolderPlus,
        color: 'cyan',
      });
    }
  },

  updateProjectStatus: (id, status) => {
    const project = projectService.getProject(id);
    if (project) {
      project.status = status;
      projectService.updateProject(project);
      const projects = projectService.getAllProjects();
      const activeProject = get().activeProject?.id === id ? project : get().activeProject;
      set({ projects, activeProject });

      // Track activity - icon and color are now handled by the mapper
      const { icon, color } = getActivityIconAndColor('project', 'status_changed');
      activityService.addActivity({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'project',
        action: 'status_changed',
        description: `Project "${project.name}" status changed to ${status}`,
        timestamp: Date.now(),
        icon,
        color,
      });
    }
  },

  updateFile: (path, content) => {
    const { activeProject } = get();
    if (!activeProject) return;

    projectService.updateFile(activeProject.id, path, content);
    const updatedProject = projectService.getProject(activeProject.id);
    if (updatedProject) {
      set({ activeProject: updatedProject });
    }
  },

  addFile: (path, content, language) => {
    const { activeProject } = get();
    if (!activeProject) return;

    projectService.addFile(activeProject.id, path, content, language);
    const updatedProject = projectService.getProject(activeProject.id);
    if (updatedProject) {
      set({ activeProject: updatedProject });
    }
    
    // Track activity
    const fileName = path.split('/').pop() || path;
    activityService.addActivity({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'file',
      action: 'created',
      description: `Created ${fileName}`,
      timestamp: Date.now(),
      metadata: { path },
      icon: FileText,
      color: 'green',
    });
  },

  deleteFile: (path) => {
    const { activeProject } = get();
    if (!activeProject) return;

    projectService.deleteFile(activeProject.id, path);
    const updatedProject = projectService.getProject(activeProject.id);
    if (updatedProject) {
      set({ activeProject: updatedProject });
    }
    
    // Track activity
    const fileName = path.split('/').pop() || path;
    activityService.addActivity({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'file',
      action: 'deleted',
      description: `Deleted ${fileName}`,
      timestamp: Date.now(),
      metadata: { path },
      icon: Trash2,
      color: 'red',
    });
  },

  getFileContent: (path) => {
    const { activeProject } = get();
    if (!activeProject) return null;

    return projectService.getFileContent(activeProject.id, path);
  },

  setActiveFile: (path) => {
    set({ activeFile: path });
  },
}));

