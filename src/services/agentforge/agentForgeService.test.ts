import { describe, it, expect, beforeEach } from 'vitest';
import { agentForgeService } from './agentForgeService';

describe('AgentForgeService', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('getTemplates', () => {
    it('should return available agent templates', () => {
      const templates = agentForgeService.getTemplates();
      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('name');
      expect(templates[0]).toHaveProperty('config');
    });
  });

  describe('createAgent', () => {
    it('should create a new agent with provided config', () => {
      const config = {
        name: 'Test Agent',
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        systemPrompt: 'You are a helpful assistant.',
        capabilities: [],
      };

      const agent = agentForgeService.createAgent(config);
      
      expect(agent).toBeDefined();
      expect(agent.id).toBeDefined();
      expect(agent.config).toEqual(config);
      expect(agent.status).toBe('idle');
      expect(agent.usageCount).toBe(0);
      expect(agent.createdAt).toBeInstanceOf(Date);
    });

    it('should persist agent to storage', () => {
      const config = {
        name: 'Test Agent',
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        systemPrompt: 'Test prompt',
        capabilities: [],
      };

      const agent = agentForgeService.createAgent(config);
      const retrieved = agentForgeService.getAgent(agent.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(agent.id);
    });
  });

  describe('createFromTemplate', () => {
    it('should create agent from template', () => {
      const agent = agentForgeService.createFromTemplate('code-assistant');
      
      expect(agent).toBeDefined();
      expect(agent?.config.name).toBe('Code Assistant');
      expect(agent?.config.provider).toBe('gemini');
    });

    it('should return null for invalid template', () => {
      const agent = agentForgeService.createFromTemplate('invalid-template');
      expect(agent).toBeNull();
    });

    it('should apply overrides when creating from template', () => {
      const agent = agentForgeService.createFromTemplate('code-assistant', {
        temperature: 0.9,
      });
      
      expect(agent).toBeDefined();
      expect(agent?.config.temperature).toBe(0.9);
    });
  });

  describe('getAgent', () => {
    it('should retrieve agent by ID', () => {
      const config = {
        name: 'Test Agent',
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        systemPrompt: 'Test',
        capabilities: [],
      };

      const created = agentForgeService.createAgent(config);
      const retrieved = agentForgeService.getAgent(created.id);
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return null for non-existent agent', () => {
      const agent = agentForgeService.getAgent('non-existent-id');
      expect(agent).toBeNull();
    });
  });

  describe('getAllAgents', () => {
    it('should return all agents', () => {
      const config = {
        name: 'Test Agent',
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        systemPrompt: 'Test',
        capabilities: [],
      };

      agentForgeService.createAgent(config);
      const agents = agentForgeService.getAllAgents();
      
      expect(agents).toBeInstanceOf(Array);
      expect(agents.length).toBeGreaterThan(0);
    });
  });

  describe('updateAgent', () => {
    it('should update agent properties', () => {
      const config = {
        name: 'Test Agent',
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        systemPrompt: 'Test',
        capabilities: [],
      };

      const agent = agentForgeService.createAgent(config);
      const updated = agentForgeService.updateAgent(agent.id, {
        status: 'running',
        usageCount: 5,
      });
      
      expect(updated).toBeDefined();
      expect(updated?.status).toBe('running');
      expect(updated?.usageCount).toBe(5);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent agent', () => {
      const updated = agentForgeService.updateAgent('non-existent-id', {
        status: 'running',
      });
      expect(updated).toBeNull();
    });
  });

  describe('deleteAgent', () => {
    it('should delete agent by ID', () => {
      const config = {
        name: 'Test Agent',
        provider: 'gemini',
        model: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        systemPrompt: 'Test',
        capabilities: [],
      };

      const agent = agentForgeService.createAgent(config);
      const deleted = agentForgeService.deleteAgent(agent.id);
      
      expect(deleted).toBe(true);
      expect(agentForgeService.getAgent(agent.id)).toBeNull();
    });

    it('should return false for non-existent agent', () => {
      const deleted = agentForgeService.deleteAgent('non-existent-id');
      expect(deleted).toBe(false);
    });
  });
});

