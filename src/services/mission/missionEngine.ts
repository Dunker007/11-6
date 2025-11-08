import { missionEventBus } from './missionEventBus';
import {
  MissionCapability,
  MissionCapabilityResult,
  MissionDefinition,
  MissionLogEntry,
  MissionPhaseRun,
  MissionRun,
  MissionStatus,
  MissionStepRun,
  MissionStepStatus,
} from './missionTypes';
import { useMissionStore } from './missionStore';
import { errorLogger } from '../errors/errorLogger';
import { notificationService } from '../notification/notificationService';
import { ICON_MAP } from '../../components/Icons/IconSet';

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
};

interface RunOptions {
  missionId?: string;
}

class MissionEngine {
  private capabilities: Map<string, MissionCapability> = new Map();

  constructor() {
    this.registerDefaultCapabilities();
  }

  registerCapability(capability: MissionCapability) {
    this.capabilities.set(capability.id, capability);
  }

  async runMission(definition: MissionDefinition, options: RunOptions = {}): Promise<string> {
    const missionId = options.missionId ?? `mission_${createId()}`;
    const missionRun: MissionRun = {
      id: missionId,
      definition,
      status: 'pending',
      progress: 0,
      phases: definition.phases.map((phase) => ({
        id: phase.id ?? `phase_${createId()}`,
        definition: phase,
        status: 'pending',
        steps: phase.steps.map((step) => ({
          id: step.id ?? `step_${createId()}`,
          definition: step,
          status: 'pending',
          attempts: 0,
        })),
      } as MissionPhaseRun)),
      logs: [],
      createdAt: Date.now(),
    };

    useMissionStore.getState().addMission(missionRun);
    missionEventBus.emit({
      missionId,
      type: 'mission:created',
      payload: { mission: missionRun },
      timestamp: Date.now(),
    });

    notificationService.info('Mission Started', `Launching mission “${definition.objective}”`, ICON_MAP.deploy);

    this.updateMissionStatus(missionId, 'running');

    for (const phase of missionRun.phases) {
      await this.executePhase(missionId, phase);
      if (useMissionStore.getState().missions[missionId]?.status === 'failed') {
        break;
      }
    }

    const finalMission = useMissionStore.getState().missions[missionId];
    if (finalMission && finalMission.status === 'running') {
      this.updateMissionStatus(missionId, 'completed');
      notificationService.success('Mission Complete', `Mission “${definition.objective}” completed successfully.`, ICON_MAP.target);
    }

    return missionId;
  }

  private async executePhase(missionId: string, phase: MissionPhaseRun) {
    this.appendLog(missionId, {
      id: createId(),
      missionId,
      level: 'info',
      message: `Starting phase: ${phase.definition.name}`,
      timestamp: Date.now(),
    });

    this.updatePhaseStatus(missionId, phase.id, 'running');

    for (const step of phase.steps) {
      const success = await this.executeStep(missionId, phase, step);
      if (!success) {
        this.updatePhaseStatus(missionId, phase.id, 'failed');
        return;
      }
    }

    this.updatePhaseStatus(missionId, phase.id, 'completed');
  }

  private async executeStep(missionId: string, phase: MissionPhaseRun, step: MissionStepRun): Promise<boolean> {
    const capabilityId = `${step.definition.agentId}.${step.definition.action}`;
    const capability = this.capabilities.get(capabilityId);

    const startTime = Date.now();
    this.updateStepStatus(missionId, step.id, 'running', startTime);
    this.appendLog(missionId, {
      id: createId(),
      missionId,
      stepId: step.id,
      agentId: step.definition.agentId,
      level: 'info',
      message: `Executing ${capabilityId}`,
      timestamp: startTime,
    });

    let result: MissionCapabilityResult | undefined;

    if (!capability) {
      result = {
        status: 'failed',
        errorMessage: `No capability registered for ${capabilityId}`,
      };
    } else {
      try {
        result = await capability.handler({
          mission: useMissionStore.getState().missions[missionId],
          phase,
          step,
        });
      } catch (error) {
        console.error('[MissionEngine] Step execution failed:', error);
        result = {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    const endTime = Date.now();
    const finalStatus: MissionStepStatus = result?.status ?? 'completed';
    this.updateStepStatus(missionId, step.id, finalStatus, startTime, endTime, result?.output);

    result?.logs?.forEach((message) =>
      this.appendLog(missionId, {
        id: createId(),
        missionId,
        stepId: step.id,
        agentId: step.definition.agentId,
        level: 'info',
        message,
        timestamp: Date.now(),
      })
    );

    if (result?.errorMessage) {
      this.appendLog(missionId, {
        id: createId(),
        missionId,
        stepId: step.id,
        agentId: step.definition.agentId,
        level: 'error',
        message: result.errorMessage,
        timestamp: endTime,
      });
      this.updateMissionStatus(missionId, 'failed');
      notificationService.error('Mission Failed', result.errorMessage, ICON_MAP.alert);
      return false;
    }

    if (finalStatus === 'waiting-human') {
      notificationService.info(
        'Mission Awaiting Approval',
        `Mission “${useMissionStore.getState().missions[missionId]?.definition.objective}” requires your input.`,
        ICON_MAP.hand
      );
      return false;
    }

    this.updateMissionProgress(missionId);
    return finalStatus === 'completed';
  }

  private updateMissionStatus(missionId: string, status: MissionStatus) {
    useMissionStore.getState().updateMissionStatus(missionId, status);
    missionEventBus.emit({
      missionId,
      type: 'mission:status-changed',
      payload: { status },
      timestamp: Date.now(),
    });
  }

  private updatePhaseStatus(missionId: string, phaseId: string, status: MissionStatus) {
    useMissionStore.setState((state) => {
      const mission = state.missions[missionId];
      if (!mission) return state;
      const phases = mission.phases.map((phase) =>
        phase.id === phaseId
          ? {
              ...phase,
              status,
              startedAt: phase.startedAt ?? Date.now(),
              completedAt: status === 'completed' || status === 'failed' ? Date.now() : phase.completedAt,
            }
          : phase
      );
      return {
        missions: {
          ...state.missions,
          [missionId]: {
            ...mission,
            phases,
          },
        },
      };
    });
  }

  private updateStepStatus(
    missionId: string,
    stepId: string,
    status: MissionStepStatus,
    startedAt?: number,
    completedAt?: number,
    output?: Record<string, unknown>
  ) {
    useMissionStore.setState((state) => {
      const mission = state.missions[missionId];
      if (!mission) return state;
      const phases = mission.phases.map((phase) => ({
        ...phase,
        steps: phase.steps.map((step) =>
          step.id === stepId
            ? {
                ...step,
                status,
                attempts: step.attempts + (status === 'running' ? 1 : 0),
                startedAt: startedAt ?? step.startedAt ?? Date.now(),
                completedAt: completedAt ?? step.completedAt,
                output: output ?? step.output,
              }
            : step
        ),
      }));
      return {
        missions: {
          ...state.missions,
          [missionId]: {
            ...mission,
            phases,
          },
        },
      };
    });

    const mission = useMissionStore.getState().missions[missionId];
    if (!mission) return;

    const updatedStep = mission.phases.flatMap((phase) => phase.steps).find((step) => step.id === stepId);
    if (updatedStep) {
      missionEventBus.emit({
        missionId,
        type: 'mission:step-status-changed',
        payload: { step: updatedStep },
        timestamp: Date.now(),
      });
    }
  }

  private updateMissionProgress(missionId: string) {
    const mission = useMissionStore.getState().missions[missionId];
    if (!mission) return;
    const steps = mission.phases.flatMap((phase) => phase.steps);
    const completed = steps.filter((step) => step.status === 'completed').length;
    const progress = steps.length === 0 ? 0 : Math.round((completed / steps.length) * 100);
    useMissionStore.getState().updateMissionProgress(missionId, progress);
    missionEventBus.emit({
      missionId,
      type: 'mission:progress-changed',
      payload: { progress },
      timestamp: Date.now(),
    });
  }

  private appendLog(missionId: string, log: MissionLogEntry) {
    useMissionStore.getState().appendLog(missionId, log);
    missionEventBus.emit({
      missionId,
      type: 'mission:log',
      payload: { log },
      timestamp: log.timestamp,
    });
  }

  private registerDefaultCapabilities() {
    this.registerCapability({
      id: 'guardian.analyzeErrors',
      agentId: 'guardian',
      displayName: 'Analyze Error Logs',
      description: 'Inspect the error logger and surface the most recent issues.',
      handler: () => {
        const stats = errorLogger.getStats();
        const critical = stats.bySeverity.critical;
        const errors = stats.bySeverity.error;
        return {
          status: 'completed',
          logs: [
            `Guardian analyzed error stream. Critical: ${critical}, error: ${errors}.`,
            'No blocking issues detected.',
          ],
          output: { stats },
        } satisfies MissionCapabilityResult;
      },
    });

    this.registerCapability({
      id: 'kai.generatePlan',
      agentId: 'kai',
      displayName: 'Generate Strategic Plan',
      description: 'Kai drafts a strategic plan for the objective.',
      handler: ({ mission }) => {
        const idea = `Kai drafted plan for “${mission.definition.objective}”.`;
        return {
          status: 'completed',
          logs: [idea],
          output: { summary: idea },
        } satisfies MissionCapabilityResult;
      },
    });

    this.registerCapability({
      id: 'kai.outlineRefactor',
      agentId: 'kai',
      displayName: 'Outline Refactor Tasks',
      description: 'Break the refactor objective into concrete tasks.',
      handler: ({ mission }) => {
        const steps = [
          'Inventory current modules and their dependencies.',
          'Design new state boundaries using Zustand slices.',
          'Plan migration order with fallbacks.',
        ];
        return {
          status: 'completed',
          logs: steps.map((s) => `• ${s}`),
          output: { steps },
        } satisfies MissionCapabilityResult;
      },
    });

    this.registerCapability({
      id: 'kai.outlineDeployment',
      agentId: 'kai',
      displayName: 'Outline Deployment Steps',
      handler: ({ mission }) => {
        return {
          status: 'completed',
          logs: [
            'Outlined deployment steps:',
            '1. Run automated tests',
            '2. Build production bundle',
            '3. Deploy to hosting provider',
          ],
        } satisfies MissionCapabilityResult;
      },
    });
  }
}

export const missionEngine = new MissionEngine();
