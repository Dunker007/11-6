// src/services/agent/registerAgents.ts
import { agentService } from './agentService';
import { ICON_MAP } from '../../components/Icons/IconSet';

export function registerAllAgents() {
  agentService.registerAgent({
    id: 'kai',
    name: 'Kai, The Strategist',
    description: 'A creative partner for brainstorming new passive income streams.',
    icon: ICON_MAP.vibedEd,
    capabilities: [
      { id: 'kai.generatePlan', name: 'Strategic Planning' },
      { id: 'kai.outlineRefactor', name: 'Refactor Blueprint' },
      { id: 'kai.outlineDeployment', name: 'Deployment Outline' },
    ],
  });

  agentService.registerAgent({
    id: 'guardian',
    name: 'Guardian, The System Monitor',
    description: 'A background agent that proactively monitors application health and errors.',
    icon: ICON_MAP.shield,
    capabilities: [
      { id: 'guardian.analyzeErrors', name: 'Error Analysis' },
    ],
  });

  // Future agents can be registered here
}
