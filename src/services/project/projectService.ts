import type { Project, ProjectFile } from '@/types/project';

const STORAGE_KEY = 'dlx_projects';
const ACTIVE_PROJECT_KEY = 'dlx_active_project';

export class ProjectService {
  private static instance: ProjectService;
  private projects: Map<string, Project> = new Map();
  private activeProjectId: string | null = null;

  private constructor() {
    this.loadProjects();
  }

  static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  private loadProjects(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const projectsArray: Project[] = JSON.parse(stored);
        projectsArray.forEach((project) => {
          project.createdAt = new Date(project.createdAt);
          project.updatedAt = new Date(project.updatedAt);
          this.projects.set(project.id, project);
        });
      }

      const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
      if (activeId && this.projects.has(activeId)) {
        this.activeProjectId = activeId;
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }

  private saveProjects(): void {
    try {
      const projectsArray = Array.from(this.projects.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectsArray));
      if (this.activeProjectId) {
        localStorage.setItem(ACTIVE_PROJECT_KEY, this.activeProjectId);
      }
    } catch (error) {
      console.error('Failed to save projects:', error);
    }
  }

  createProject(name: string, description?: string): Project {
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      rootPath: `/${name.toLowerCase().replace(/\s+/g, '-')}`,
      files: [
        {
          path: `/${name.toLowerCase().replace(/\s+/g, '-')}`,
          name: name.toLowerCase().replace(/\s+/g, '-'),
          content: '',
          isDirectory: true,
          children: [],
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.projects.set(project.id, project);
    this.activeProjectId = project.id;
    this.saveProjects();
    return project;
  }

  getProject(id: string): Project | null {
    return this.projects.get(id) || null;
  }

  getAllProjects(): Project[] {
    return Array.from(this.projects.values());
  }

  getActiveProject(): Project | null {
    if (!this.activeProjectId) return null;
    return this.projects.get(this.activeProjectId) || null;
  }

  setActiveProject(id: string): void {
    if (this.projects.has(id)) {
      this.activeProjectId = id;
      this.saveProjects();
    }
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const project = this.projects.get(id);
    if (project) {
      Object.assign(project, updates, { updatedAt: new Date() });
      this.projects.set(id, project);
      this.saveProjects();
    }
  }

  deleteProject(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) {
      if (this.activeProjectId === id) {
        const projects = Array.from(this.projects.values());
        this.activeProjectId = projects.length > 0 ? projects[0].id : null;
      }
      this.saveProjects();
    }
    return deleted;
  }

  addFile(projectId: string, path: string, content: string, language?: string): void {
    const project = this.projects.get(projectId);
    if (!project) return;

    const parts = path.split('/').filter(Boolean);
    const fileName = parts[parts.length - 1];
    const dirPath = parts.slice(0, -1).join('/');

    const file: ProjectFile = {
      path,
      name: fileName,
      content,
      language,
      isDirectory: false,
    };

    this.insertFileIntoTree(project.files[0], file, dirPath);
    project.updatedAt = new Date();
    this.saveProjects();
  }

  updateFile(projectId: string, path: string, content: string): void {
    const project = this.projects.get(projectId);
    if (!project) return;

    const file = this.findFileInTree(project.files[0], path);
    if (file && !file.isDirectory) {
      file.content = content;
      project.updatedAt = new Date();
      this.saveProjects();
    }
  }

  deleteFile(projectId: string, path: string): void {
    const project = this.projects.get(projectId);
    if (!project) return;

    this.removeFileFromTree(project.files[0], path);
    project.updatedAt = new Date();
    this.saveProjects();
  }

  private insertFileIntoTree(root: ProjectFile, file: ProjectFile, dirPath: string): void {
    if (!dirPath || dirPath === root.path) {
      if (!root.children) root.children = [];
      root.children.push(file);
      return;
    }

    const parts = dirPath.split('/').filter(Boolean);
    const nextDir = parts[0];
    const remainingPath = parts.slice(1).join('/');

    if (!root.children) root.children = [];

    let dir = root.children.find((f) => f.isDirectory && f.name === nextDir);
    if (!dir) {
      dir = {
        path: `${root.path}/${nextDir}`,
        name: nextDir,
        content: '',
        isDirectory: true,
        children: [],
      };
      root.children.push(dir);
    }

    this.insertFileIntoTree(dir, file, remainingPath);
  }

  private findFileInTree(root: ProjectFile, path: string): ProjectFile | null {
    if (root.path === path) return root;

    if (root.children) {
      for (const child of root.children) {
        const found = this.findFileInTree(child, path);
        if (found) return found;
      }
    }

    return null;
  }

  private removeFileFromTree(root: ProjectFile, path: string): boolean {
    if (!root.children) return false;

    const index = root.children.findIndex((f) => f.path === path);
    if (index !== -1) {
      root.children.splice(index, 1);
      return true;
    }

    for (const child of root.children) {
      if (this.removeFileFromTree(child, path)) {
        return true;
      }
    }

    return false;
  }

  getFileContent(projectId: string, path: string): string | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const file = this.findFileInTree(project.files[0], path);
    return file && !file.isDirectory ? file.content : null;
  }
}

export const projectService = ProjectService.getInstance();

