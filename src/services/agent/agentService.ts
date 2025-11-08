// src/services/agent/agentService.ts
import { useAgentStore } from './agentStore';
import { Agent, AgentStatus } from '../../types/agent';

class AgentService {
  private store = useAgentStore;

  registerAgent(agent: Omit<Agent, 'status' | 'logs' | 'lastRun'>) {
    const fullAgent: Agent = {
      ...agent,
      status: 'idle',
      logs: [],
    };
    this.store.getState().registerAgent(fullAgent);
  }

  updateAgentStatus(id: string, status: AgentStatus) {
    this.store.getState().updateAgentStatus(id, status);
  }

  addAgentLog(id: string, log: string) {
    this.store.getState().addAgentLog(id, log);
  }

  getAgent(id: string): Agent | undefined {
    return this.store.getState().agents[id];
  }

  getAllAgents(): Agent[] {
    return Object.values(this.store.getState().agents);
  }
}

export const agentService = new AgentService();
