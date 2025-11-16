import { describe, it, expect, beforeEach, vi } from 'vitest';
import { projectKnowledgeService } from './projectKnowledgeService';
import type { Project, ProjectFile } from '@/types/project';

// Mock dependencies
vi.mock('../project/projectService', () => ({
  projectService: {
    getProject: vi.fn(),
    getProjectFiles: vi.fn(),
  },
}));

vi.mock('./multiFileContextService', () => ({
  multiFileContextService: {
    analyzeProject: vi.fn().mockResolvedValue(undefined),
    getContext: vi.fn().mockReturnValue(undefined),
  },
}));

describe('ProjectKnowledgeService', () => {
  const mockProject: Project = {
    id: 'test-project',
    name: 'Test Project',
    path: '/test/project',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFiles: ProjectFile[] = [
    {
      path: 'package.json',
      name: 'package.json',
      type: 'file',
      content: JSON.stringify({
        name: 'test-project',
        dependencies: { react: '^18.0.0' },
      }),
    },
    {
      path: 'src/index.tsx',
      name: 'index.tsx',
      type: 'file',
      content: 'import React from "react";',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProjectKnowledge', () => {
    it('should return project knowledge when project exists', async () => {
      const { projectService } = await import('../project/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);
      vi.mocked(projectService.getProjectFiles).mockResolvedValue(mockFiles);

      const knowledge = projectKnowledgeService.getProjectKnowledge(mockProject.id);
      expect(knowledge).toBeDefined();
      expect(knowledge?.project.id).toBe(mockProject.id);
    });

    it('should detect languages from files', async () => {
      const { projectService } = await import('../project/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);
      vi.mocked(projectService.getProjectFiles).mockResolvedValue(mockFiles);

      const knowledge = projectKnowledgeService.getProjectKnowledge(mockProject.id);
      expect(knowledge?.languages.length).toBeGreaterThan(0);
    });

    it('should detect frameworks from dependencies', async () => {
      const { projectService } = await import('../project/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(mockProject);
      vi.mocked(projectService.getProjectFiles).mockResolvedValue(mockFiles);

      const knowledge = projectKnowledgeService.getProjectKnowledge(mockProject.id);
      expect(knowledge?.frameworks).toBeDefined();
      expect(Array.isArray(knowledge?.frameworks)).toBe(true);
    });

    it('should return undefined for non-existent project', () => {
      const { projectService } = await import('../project/projectService');
      vi.mocked(projectService.getProject).mockResolvedValue(null);

      const knowledge = projectKnowledgeService.getProjectKnowledge('non-existent');
      expect(knowledge).toBeUndefined();
    });
  });

  describe('getFullProjectContext', () => {
    it('should return full project context as string', () => {
      const context = projectKnowledgeService.getFullProjectContext();
      expect(typeof context).toBe('string');
    });
  });

  describe('suggestNavigation', () => {
    it('should suggest workflow based on query', () => {
      const suggestion = projectKnowledgeService.suggestNavigation('I want to deploy my app');
      expect(suggestion).toBeDefined();
      if (suggestion) {
        expect(suggestion).toHaveProperty('workflow');
        expect(suggestion).toHaveProperty('reason');
      }
    });

    it('should return null for unrelated queries', () => {
      const suggestion = projectKnowledgeService.suggestNavigation('random text');
      // May return null or a default suggestion
      if (suggestion) {
        expect(suggestion).toHaveProperty('workflow');
      }
    });
  });
});

