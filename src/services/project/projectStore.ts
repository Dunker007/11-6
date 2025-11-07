import { create } from 'zustand';
import { projectService } from './projectService';
import type { Project } from '@/types/project';

interface ProjectStore {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  error: string | null;
  loadProjects: () => void;
  createProject: (name: string, description?: string) => Project;
  setActiveProject: (id: string) => void;
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
    set((state) => ({
      projects: [...state.projects, project],
      activeProject: project,
    }));
    return project;
  },

  setActiveProject: (id) => {
    projectService.setActiveProject(id);
    const activeProject = projectService.getActiveProject();
    set({ activeProject });
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
  },

  deleteFile: (path) => {
    const { activeProject } = get();
    if (!activeProject) return;

    projectService.deleteFile(activeProject.id, path);
    const updatedProject = projectService.getProject(activeProject.id);
    if (updatedProject) {
      set({ activeProject: updatedProject });
    }
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

