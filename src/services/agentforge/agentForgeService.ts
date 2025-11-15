import type { Agent, AgentConfig, AgentTemplate } from '@/types/agentforge';
import { logger } from '@/services/logging/loggerService';

const AGENTS_STORAGE_KEY = 'dlx_agents';
const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'Helps with coding tasks and debugging',
    icon: '💻',
    category: 'coding',
    config: {
      name: 'Code Assistant',
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp', // Default to Gemini Flash 2.5
      temperature: 0.7,
      systemPrompt: 'You are a helpful coding assistant.',
      capabilities: [],
    },
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    description: 'Assists with writing and content creation',
    icon: '✍️',
    category: 'writing',
    config: {
      name: 'Content Writer',
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp', // Default to Gemini Flash 2.5
      temperature: 0.91, // Creative temperature for content writing
      systemPrompt: 'You are a creative content writer.',
      capabilities: [],
    },
  },
  {
    id: 'code-reviewer',
    name: 'Code Reviewer',
    description: 'Reviews code for quality and best practices',
    icon: '🔍',
    category: 'analysis',
    config: {
      name: 'Code Reviewer',
      provider: 'gemini',
      model: 'gemini-2.0-flash-exp', // Default to Gemini Flash 2.5
      temperature: 0.3,
      systemPrompt: 'You are a thorough code reviewer.',
      capabilities: [],
    },
  },
];

export class AgentForgeService {
  private static instance: AgentForgeService;
  private agents: Map<string, Agent> = new Map();

  private constructor() {
    this.loadAgents();
  }

  static getInstance(): AgentForgeService {
    if (!AgentForgeService.instance) {
      AgentForgeService.instance = new AgentForgeService();
    }
    return AgentForgeService.instance;
  }

  private loadAgents(): void {
    try {
      const stored = localStorage.getItem(AGENTS_STORAGE_KEY);
      if (stored) {
        const agents: Agent[] = JSON.parse(stored);
        agents.forEach((agent) => {
          agent.createdAt = new Date(agent.createdAt);
          agent.updatedAt = new Date(agent.updatedAt);
          if (agent.lastUsed) {
            agent.lastUsed = new Date(agent.lastUsed);
          }
          this.agents.set(agent.id, agent);
        });
      }
    } catch (error) {
      logger.error('Failed to load agents:', { error });
    }
  }

  private saveAgents(): void {
    try {
      localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(Array.from(this.agents.values())));
    } catch (error) {
      logger.error('Failed to save agents:', { error });
    }
  }

  getTemplates(): AgentTemplate[] {
    return AGENT_TEMPLATES;
  }

  createAgent(config: AgentConfig): Agent {
    const agent: Agent = {
      id: crypto.randomUUID(),
      config,
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
    };

    this.agents.set(agent.id, agent);
    this.saveAgents();
    return agent;
  }

  createFromTemplate(templateId: string, overrides?: Partial<AgentConfig>): Agent | null {
    const template = AGENT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return null;

    const config: AgentConfig = {
      ...template.config,
      ...overrides,
    } as AgentConfig;

    return this.createAgent(config);
  }

  getAgent(id: string): Agent | null {
    return this.agents.get(id) || null;
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  updateAgent(id: string, updates: Partial<Agent>): Agent | null {
    const agent = this.agents.get(id);
    if (!agent) return null;

    const updated: Agent = {
      ...agent,
      ...updates,
      updatedAt: new Date(),
    };
    this.agents.set(id, updated);
    this.saveAgents();
    return updated;
  }

  deleteAgent(id: string): boolean {
    const deleted = this.agents.delete(id);
    if (deleted) this.saveAgents();
    return deleted;
  }

  async runAgent(id: string): Promise<void> {
    const agent = this.agents.get(id);
    if (!agent) return;

    agent.status = 'running';
    agent.lastUsed = new Date();
    agent.usageCount++;
    this.saveAgents();

    // Simulate agent running
    await new Promise((resolve) => setTimeout(resolve, 1000));

    agent.status = 'idle';
    this.saveAgents();
  }
}

export const agentForgeService = AgentForgeService.getInstance();

