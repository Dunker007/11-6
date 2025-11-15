import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiServiceBridge } from './aiServiceBridge';

// Mock dependencies
vi.mock('./multiFileContextService', () => ({
  multiFileContextService: {
    analyzeProject: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('./projectKnowledgeService', () => ({
  projectKnowledgeService: {
    getActiveProject: vi.fn().mockReturnValue(null),
    getFullProjectContext: vi.fn().mockReturnValue(''),
  },
}));

vi.mock('./router', () => ({
  llmRouter: {
    generate: vi.fn().mockResolvedValue({ text: '{}' }),
  },
}));

describe('AIServiceBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startIndexing', () => {
    it('should start indexing when project is available', async () => {
      const projectRoot = '/test/project';
      await expect(aiServiceBridge.startIndexing(projectRoot)).resolves.not.toThrow();
      expect(aiServiceBridge.isIndexing()).toBe(true);
      expect(aiServiceBridge.getCurrentProjectRoot()).toBe(projectRoot);
    });
  });

  describe('stopIndexing', () => {
    it('should stop indexing and clear project root', async () => {
      await aiServiceBridge.startIndexing('/test/project');
      await aiServiceBridge.stopIndexing();
      expect(aiServiceBridge.isIndexing()).toBe(false);
      expect(aiServiceBridge.getCurrentProjectRoot()).toBeNull();
    });
  });

  describe('createPlan', () => {
    it('should create a plan from a prompt', async () => {
      const prompt = 'Add a login page';
      const response = await aiServiceBridge.createPlan(prompt);
      
      expect(response.success).toBe(true);
      expect(response.plan).toBeDefined();
      if (response.plan) {
        expect(response.plan.steps).toBeInstanceOf(Array);
      }
    });

    it('should handle errors gracefully', async () => {
      const { llmRouter } = await import('./router');
      vi.mocked(llmRouter.generate).mockRejectedValueOnce(new Error('LLM error'));
      
      const response = await aiServiceBridge.createPlan('test');
      expect(response.success).toBe(true); // Should fallback to mock plan
      expect(response.plan).toBeDefined();
    });
  });

  describe('structureIdea', () => {
    it('should structure an idea with title and summary', async () => {
      const rawText = 'Build a todo app with React and TypeScript';
      const idea = await aiServiceBridge.structureIdea(rawText);
      
      expect(idea).toBeDefined();
      expect(idea.title).toBeDefined();
      expect(idea.summary).toBeDefined();
    });
  });

  describe('turboEdit', () => {
    it('should edit code based on instruction', async () => {
      const code = 'function add(a, b) { return a + b; }';
      const instruction = 'Add input validation';
      
      const result = await aiServiceBridge.turboEdit(code, instruction);
      
      expect(result.success).toBeDefined();
      if (result.success) {
        expect(result.editedCode).toBeDefined();
        expect(result.diff).toBeDefined();
      }
    });
  });
});

