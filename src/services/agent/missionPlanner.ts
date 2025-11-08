// src/services/agent/missionPlanner.ts
import { Agent } from '../../types/agent';

export interface MissionStep {
  agentId: Agent['id'];
  task: string;
}

export interface MissionPlan {
  objective: string;
  steps: MissionStep[];
}

class MissionPlanner {
  async createPlan(objective: string): Promise<MissionPlan> {
    // This is where the magic will happen.
    // For now, we'll return a mocked plan based on keywords.
    // In the future, this will involve a call to an LLM with the project context.
    console.log(`[MissionPlanner] Creating plan for objective: "${objective}"`);

    const plan: MissionPlan = {
      objective,
      steps: [],
    };

    if (objective.toLowerCase().includes('refactor') && objective.toLowerCase().includes('zustand')) {
      plan.steps = [
        { agentId: 'guardian', task: 'Analyze current state management files for complexity.' },
        { agentId: 'kai', task: 'Generate a step-by-step refactoring plan to migrate to Zustand.' },
      ];
    } else if (objective.toLowerCase().includes('deploy')) {
      plan.steps = [
        { agentId: 'guardian', task: 'Run final code quality and security checks.' },
        { agentId: 'kai', task: 'Outline the deployment steps for Vercel.' },
      ];
    } else {
      plan.steps = [
        { agentId: 'kai', task: `Deconstruct the high-level objective: "${objective}"` },
      ];
    }
    
    console.log('[MissionPlanner] Mock plan generated:', plan);
    return Promise.resolve(plan);
  }
}

export const missionPlanner = new MissionPlanner();
