// src/services/agent/missionPlanner.ts
import { MissionDefinition, MissionPhaseDefinition, MissionStepDefinition } from '../mission/missionTypes';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

class MissionPlanner {
  async createPlan(objective: string): Promise<MissionDefinition> {
    const normalized = objective.toLowerCase();

    const phases: MissionPhaseDefinition[] = [];

    // Phase 1 – Analysis
    const analysisSteps: MissionStepDefinition[] = [
      {
        agentId: 'guardian',
        action: 'analyzeErrors',
        description: 'Check the latest errors and system health.',
      },
    ];

    phases.push({
      id: `phase_analysis_${createId()}`,
      name: 'Analysis',
      description: 'Gather context and assess current state.',
      steps: analysisSteps,
    });

    // Phase 2 – Planning / Refactor
    const planningSteps: MissionStepDefinition[] = [
      {
        agentId: 'kai',
        action: 'generatePlan',
        description: 'Create a strategic approach for the objective.',
      },
    ];

    if (normalized.includes('refactor')) {
      planningSteps.push({
        agentId: 'kai',
        action: 'outlineRefactor',
        description: 'Break down the refactor tasks into actionable steps.',
      });
    }

    phases.push({
      id: `phase_planning_${createId()}`,
      name: 'Planning',
      description: 'Design the path forward using agent intelligence.',
      steps: planningSteps,
    });

    // Phase 3 – Deployment / Wrap-up
    if (normalized.includes('deploy')) {
      phases.push({
        id: `phase_deploy_${createId()}`,
        name: 'Deployment Prep',
        description: 'Prepare deployment checklist and guardrails.',
        steps: [
          {
            agentId: 'kai',
            action: 'outlineDeployment',
            description: 'Summarize deployment steps for the team.',
          },
        ],
      });
    }

    const definition: MissionDefinition = {
      id: `definition_${createId()}`,
      objective,
      createdAt: new Date().toISOString(),
      phases,
      exitCriteria: normalized.includes('deploy')
        ? ['guardian.noCriticalErrors', 'tests.unit.pass']
        : ['guardian.noCriticalErrors'],
    };

    console.log('[MissionPlanner] Generated mission definition:', definition);
    return definition;
  }
}

export const missionPlanner = new MissionPlanner();
