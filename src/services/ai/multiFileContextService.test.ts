import { describe, it, expect, beforeEach, vi } from 'vitest';
import { multiFileContextService } from './multiFileContextService';
import type { Project, ProjectFile } from '@/types/project';

// Mock fileSystemService
vi.mock('../filesystem/fileSystemService', () => ({
  fileSystemService: {
    readFile: vi.fn().mockResolvedValue({ success: true, data: 'file content' }),
  },
}));

describe('MultiFileContextService', () => {
  const mockProject: Project = {
    id: 'test-project',
    name: 'Test Project',
    path: '/test/project',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFiles: ProjectFile[] = [
    {
      path: 'src/index.ts',
      name: 'index.ts',
      type: 'file',
      content: `import { Component } from './Component';
export function main() {}`,
    },
    {
      path: 'src/Component.tsx',
      name: 'Component.tsx',
      type: 'file',
      content: `export function Component() {}`,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    multiFileContextService.clearContext(mockProject.id);
  });

  describe('analyzeProject', () => {
    it('should analyze a project and create context', async () => {
      const projectWithFiles = { ...mockProject, files: mockFiles };
      await multiFileContextService.analyzeProject(projectWithFiles);

      const context = multiFileContextService.getContext(mockProject.id);
      expect(context).toBeDefined();
      expect(context?.projectId).toBe(mockProject.id);
    });

    it('should parse imports from files', async () => {
      const projectWithFiles = { ...mockProject, files: mockFiles };
      await multiFileContextService.analyzeProject(projectWithFiles);

      const context = multiFileContextService.getContext(mockProject.id);
      const indexContext = context?.files.get('src/index.ts');
      expect(indexContext?.imports.length).toBeGreaterThan(0);
    });

    it('should build dependency graph', async () => {
      const projectWithFiles = { ...mockProject, files: mockFiles };
      await multiFileContextService.analyzeProject(projectWithFiles);

      const context = multiFileContextService.getContext(mockProject.id);
      expect(context?.dependencyGraph).toBeDefined();
      expect(context?.dependencyGraph.size).toBeGreaterThan(0);
    });
  });

  describe('getRelatedFiles', () => {
    it('should return related files based on dependencies', async () => {
      const projectWithFiles = { ...mockProject, files: mockFiles };
      await multiFileContextService.analyzeProject(projectWithFiles);

      const related = multiFileContextService.getRelatedFiles(
        mockProject.id,
        'src/index.ts',
        2
      );
      expect(Array.isArray(related)).toBe(true);
    });

    it('should return empty array for non-existent file', () => {
      const related = multiFileContextService.getRelatedFiles(
        mockProject.id,
        'non-existent.ts',
        2
      );
      expect(related).toEqual([]);
    });
  });

  describe('getGraphInsights', () => {
    it('should return graph insights after analysis', async () => {
      const projectWithFiles = { ...mockProject, files: mockFiles };
      await multiFileContextService.analyzeProject(projectWithFiles);

      const insights = multiFileContextService.getGraphInsights(mockProject.id);
      expect(insights).toBeDefined();
      expect(insights?.cycles).toBeDefined();
      expect(insights?.orphans).toBeDefined();
    });
  });

  describe('clearContext', () => {
    it('should clear context for a project', async () => {
      const projectWithFiles = { ...mockProject, files: mockFiles };
      await multiFileContextService.analyzeProject(projectWithFiles);

      multiFileContextService.clearContext(mockProject.id);
      const context = multiFileContextService.getContext(mockProject.id);
      expect(context).toBeUndefined();
    });
  });
});

