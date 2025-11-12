import type { Project, ProjectFile } from '@/types/project';
import { fileSystemService } from '../filesystem/fileSystemService';

const STORAGE_KEY = 'dlx_projects';
const ACTIVE_PROJECT_KEY = 'dlx_active_project';
const USE_FILE_SYSTEM_KEY = 'dlx_use_file_system';

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

  private useFileSystem(): boolean {
    try {
      const stored = localStorage.getItem(USE_FILE_SYSTEM_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  }

  setUseFileSystem(use: boolean): void {
    localStorage.setItem(USE_FILE_SYSTEM_KEY, use ? 'true' : 'false');
  }

  async openProjectFromDisk(path: string): Promise<Project | null> {
    try {
      const exists = await fileSystemService.exists(path);
      if (!exists.data) {
        return null;
      }

      const stats = await fileSystemService.stat(path);
      if (!stats.success || !stats.data?.isDirectory) {
        return null;
      }

      // Read project.json if it exists
      const projectJsonPath = `${path}/project.json`;
      const projectJsonExists = await fileSystemService.exists(projectJsonPath);
      
      let project: Project;
      if (projectJsonExists.data) {
        const projectJson = await fileSystemService.readFile(projectJsonPath);
        if (projectJson.success && projectJson.data) {
          project = JSON.parse(projectJson.data);
          project.rootPath = path;
        } else {
          return null;
        }
      } else {
        // Create new project from directory
        const dirName = path.split(/[/\\]/).pop() || 'Untitled';
        project = {
          id: crypto.randomUUID(),
          name: dirName,
          rootPath: path,
          files: [],
          status: 'idea', // Add default status
          createdAt: stats.data ? new Date(stats.data.ctime) : new Date(),
          updatedAt: stats.data ? new Date(stats.data.mtime) : new Date(),
        };
      }

      // Load files from disk
      const entries = await fileSystemService.readdir(path);
      if (entries.success && entries.data) {
        project.files = await this.buildFileTree(path, entries.data);
      }

      this.projects.set(project.id, project);
      this.activeProjectId = project.id;
      this.saveProjects();
      return project;
    } catch (error) {
      console.error('Failed to open project from disk:', error);
      return null;
    }
  }

  private async buildFileTree(_rootPath: string, entries: any[]): Promise<ProjectFile[]> {
    const files: ProjectFile[] = [];

    for (const entry of entries) {
      if (entry.isDirectory) {
        const subEntries = await fileSystemService.readdir(entry.path);
        const children = subEntries.success && subEntries.data
          ? await this.buildFileTree(entry.path, subEntries.data)
          : [];

        files.push({
          path: entry.path,
          name: entry.name,
          content: '',
          isDirectory: true,
          children,
        });
      } else {
        const content = await fileSystemService.readFile(entry.path);
        files.push({
          path: entry.path,
          name: entry.name,
          content: content.success ? (content.data || '') : '',
          isDirectory: false,
        });
      }
    }

    return files;
  }

  async saveProjectToDisk(projectId: string, path: string): Promise<boolean> {
    const project = this.projects.get(projectId);
    if (!project) return false;

    try {
      // Ensure directory exists
      await fileSystemService.mkdir(path, true);

      // Save project.json
      const projectJson = JSON.stringify({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status, // Ensure status is saved
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }, null, 2);

      await fileSystemService.writeFile(`${path}/project.json`, projectJson);

      // Save all files
      await this.saveFilesToDisk(project.files[0], path);

      project.rootPath = path;
      this.saveProjects();
      return true;
    } catch (error) {
      console.error('Failed to save project to disk:', error);
      return false;
    }
  }

  private async saveFilesToDisk(root: ProjectFile, basePath: string): Promise<void> {
    if (!root.children) return;

    for (const file of root.children) {
      const filePath = `${basePath}/${file.name}`;

      if (file.isDirectory) {
        await fileSystemService.mkdir(filePath, true);
        await this.saveFilesToDisk(file, filePath);
      } else {
        await fileSystemService.writeFile(filePath, file.content || '');
      }
    }
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
      status: 'idea', // All new projects start as an idea
    };

    this.projects.set(project.id, project);
    this.activeProjectId = project.id;
    this.saveProjects();
    return project;
  }

  getProject(id: string): Project | null {
    return this.projects.get(id) || null;
  }

  getProjectRoot(id: string): string | null {
    const project = this.projects.get(id);
    return project?.rootPath || null;
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

  // Overload to accept a full project object for simplicity
  updateProject(project: Project): void;
  // Original signature for partial updates
  updateProject(id: string, updates: Partial<Project>): void;
  updateProject(idOrProject: string | Project, updates?: Partial<Project>): void {
    if (typeof idOrProject === 'string') {
      const project = this.projects.get(idOrProject);
      if (project) {
        Object.assign(project, updates, { updatedAt: new Date() });
        this.projects.set(idOrProject, project);
        this.saveProjects();
      }
    } else {
      const project = idOrProject;
      project.updatedAt = new Date();
      this.projects.set(project.id, project);
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

    // Create file on disk if project has a real rootPath (drive-based project)
    if (project.rootPath && this.isDriveBasedProject(project.rootPath)) {
      const fullPath = this.resolveFilePath(project.rootPath, path);
      // Ensure parent directory exists
      const parentDir = fullPath.split(/[/\\]/).slice(0, -1).join('/');
      fileSystemService.mkdir(parentDir, true).then(() => {
        return fileSystemService.writeFile(fullPath, content);
      }).catch((error) => {
        console.error('Failed to create file on disk:', error);
      });
    }
  }

  updateFile(projectId: string, path: string, content: string): void {
    const project = this.projects.get(projectId);
    if (!project) return;

    const file = this.findFileInTree(project.files[0], path);
    if (file && !file.isDirectory) {
      file.content = content;
      project.updatedAt = new Date();
      this.saveProjects();

      // Save to disk if project has a real rootPath (drive-based project)
      if (project.rootPath && this.isDriveBasedProject(project.rootPath)) {
        const fullPath = this.resolveFilePath(project.rootPath, path);
        fileSystemService.writeFile(fullPath, content).catch((error) => {
          console.error('Failed to save file to disk:', error);
        });
      }
    }
  }

  deleteFile(projectId: string, path: string): void {
    const project = this.projects.get(projectId);
    if (!project) return;

    this.removeFileFromTree(project.files[0], path);
    project.updatedAt = new Date();
    this.saveProjects();

    // Delete from disk if project has a real rootPath (drive-based project)
    if (project.rootPath && this.isDriveBasedProject(project.rootPath)) {
      const fullPath = this.resolveFilePath(project.rootPath, path);
      fileSystemService.rm(fullPath, false).catch((error) => {
        console.error('Failed to delete file from disk:', error);
      });
    }
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

  private isDriveBasedProject(rootPath: string): boolean {
    // Check if it's a Windows path (contains drive letter) or Unix absolute path
    // Virtual paths typically start with '/' but don't have drive letters or are relative
    return /^[A-Za-z]:/.test(rootPath) || // Windows: C:\ or C:/
           (rootPath.startsWith('/') && rootPath.length > 1 && !rootPath.startsWith('/tmp')); // Unix absolute path
  }

  private resolveFilePath(rootPath: string, filePath: string): string {
    // Remove leading slash from filePath if present
    const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    
    // Handle Windows vs Unix path separators
    const separator = rootPath.includes('\\') ? '\\' : '/';
    
    // Ensure rootPath doesn't end with separator
    const normalizedRoot = rootPath.endsWith(separator) ? rootPath.slice(0, -1) : rootPath;
    
    return `${normalizedRoot}${separator}${normalizedPath}`;
  }
}

export const projectService = ProjectService.getInstance();

