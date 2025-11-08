// src/services/agent/agentStore.ts
import { create } from 'zustand';
import { Agent, AgentStatus } from '../../types/agent';

interface AgentStore {
  agents: Record<string, Agent>;
  registerAgent: (agent: Agent) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  addAgentLog: (id: string, log: string) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  agents: {},
  registerAgent: (agent) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [agent.id]: agent,
      },
    })),
  updateAgentStatus: (id, status) =>
    set((state) => {
      if (!state.agents[id]) return state;
      return {
        agents: {
          ...state.agents,
          [id]: {
            ...state.agents[id],
            status,
            lastRun: new Date(),
          },
        },
      };
    }),
  addAgentLog: (id, log) =>
    set((state) => {
      if (!state.agents[id]) return state;
      return {
        agents: {
          ...state.agents,
          [id]: {
            ...state.agents[id],
            logs: [...state.agents[id].logs, `[${new Date().toLocaleTimeString()}] ${log}`],
          },
        },
      };
    }),
}));
