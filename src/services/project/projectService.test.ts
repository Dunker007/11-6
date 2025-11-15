import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectService } from './projectService';
import type { Project } from '@/types/project';

// Mock dependencies
vi.mock('../filesystem/fileSystemService', () => ({
  fileSystemService: {
    exists: vi.fn().mockResolvedValue({ success: true, data: true }),
    stat: vi.fn().mockResolvedValue({
      success: true,
      data: {
        isDirectory: true,
        isFile: false,
        ctime: new Date().toISOString(),
        mtime: new Date().toISOString(),
      },
    }),
    readFile: vi.fn().mockResolvedValue({ success: true, data: '{}' }),
    readdir: vi.fn().mockResolvedValue({
      success: true,
      data: [],
    }),
  },
}));

vi.mock('../logging/loggerService', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ProjectService', () => {
  let projectService: ProjectService;

  beforeEach(() => {
    localStorage.clear();
    projectService = ProjectService.getInstance();
  });

  describe('createProject', () => {
    it('should create a new project', () => {
      const project = projectService.createProject('Test Project', '/test/path');
      
      expect(project).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.rootPath).toBe('/test/path');
      expect(project.id).toBeDefined();
    });

    it('should save project to storage', () => {
      const project = projectService.createProject('Test Project', '/test/path');
      const saved = projectService.getProject(project.id);
      
      expect(saved).toBeDefined();
      expect(saved?.id).toBe(project.id);
    });
  });

  describe('getProject', () => {
    it('should return project by id', () => {
      const project = projectService.createProject('Test Project', '/test/path');
      const retrieved = projectService.getProject(project.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(project.id);
    });

    it('should return null for non-existent project', () => {
      const retrieved = projectService.getProject('non-existent-id');
      expect(retrieved).toBeNull();
    });
  });

  describe('getAllProjects', () => {
    it('should return all projects', () => {
      projectService.createProject('Project 1', '/path1');
      projectService.createProject('Project 2', '/path2');
      
      const projects = projectService.getAllProjects();
      expect(projects.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('setActiveProject', () => {
    it('should set active project', () => {
      const project = projectService.createProject('Test Project', '/test/path');
      projectService.setActiveProject(project.id);
      
      const active = projectService.getActiveProject();
      expect(active?.id).toBe(project.id);
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', () => {
      const project = projectService.createProject('Test Project', '/test/path');
      projectService.deleteProject(project.id);
      
      const retrieved = projectService.getProject(project.id);
      expect(retrieved).toBeNull();
    });
  });
});

