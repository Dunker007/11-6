import { create } from 'zustand';
import { agentForgeService } from './agentForgeService';
import type { Agent, AgentConfig, AgentTemplate } from '@/types/agentforge';

interface AgentForgeStore {
  // State
  agents: Agent[];
  templates: AgentTemplate[];
  currentAgent: Agent | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadAgents: () => void;
  loadTemplates: () => void;
  createAgent: (config: AgentConfig) => Agent;
  createFromTemplate: (templateId: string, overrides?: Partial<AgentConfig>) => Agent | null;
  selectAgent: (id: string) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => Agent | null;
  deleteAgent: (id: string) => boolean;
  runAgent: (id: string) => Promise<void>;
}

export const useAgentForgeStore = create<AgentForgeStore>((set, get) => ({
  agents: [],
  templates: [],
  currentAgent: null,
  isLoading: false,
  error: null,

  loadAgents: () => {
    const agents = agentForgeService.getAllAgents();
    set({ agents });
  },

  loadTemplates: () => {
    const templates = agentForgeService.getTemplates();
    set({ templates });
  },

  createAgent: (config) => {
    const newAgent = agentForgeService.createAgent(config);
    get().loadAgents();
    set({ currentAgent: newAgent });
    return newAgent;
  },

  createFromTemplate: (templateId, overrides) => {
    const agent = agentForgeService.createFromTemplate(templateId, overrides);
    if (agent) {
      get().loadAgents();
      set({ currentAgent: agent });
    }
    return agent;
  },

  selectAgent: (id) => {
    const agent = agentForgeService.getAgent(id);
    set({ currentAgent: agent });
  },

  updateAgent: (id, updates) => {
    const updated = agentForgeService.updateAgent(id, updates);
    if (updated) {
      get().loadAgents();
      if (get().currentAgent?.id === id) {
        set({ currentAgent: updated });
      }
    }
    return updated;
  },

  deleteAgent: (id) => {
    const deleted = agentForgeService.deleteAgent(id);
    if (deleted) {
      get().loadAgents();
      if (get().currentAgent?.id === id) {
        set({ currentAgent: null });
      }
    }
    return deleted;
  },

  runAgent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await agentForgeService.runAgent(id);
      get().loadAgents();
      const updated = agentForgeService.getAgent(id);
      if (updated) {
        set({ currentAgent: updated, isLoading: false });
      }
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },
}));

