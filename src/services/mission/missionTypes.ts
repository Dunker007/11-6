export type MissionStatus =
  | 'pending'
  | 'running'
  | 'blocked'
  | 'waiting-human'
  | 'paused'
  | 'completed'
  | 'failed';

export type MissionStepStatus =
  | 'pending'
  | 'running'
  | 'waiting-human'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface MissionRetryPolicy {
  attempts: number;
  backoff?: 'linear' | 'exponential';
  delayMs?: number;
}

export interface MissionStepDefinition {
  id?: string;
  title?: string;
  agentId: string;
  action: string;
  description?: string;
  inputs?: Record<string, unknown>;
  requiresApproval?: boolean;
  retryPolicy?: MissionRetryPolicy;
}

export interface MissionPhaseDefinition {
  id?: string;
  name: string;
  description?: string;
  parallel?: boolean;
  steps: MissionStepDefinition[];
}

export interface MissionDefinition {
  id: string;
  objective: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
  phases: MissionPhaseDefinition[];
  exitCriteria?: string[];
}

export interface MissionLogEntry {
  id: string;
  missionId: string;
  stepId?: string;
  agentId?: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
}

export interface MissionStepRun {
  id: string;
  definition: MissionStepDefinition;
  status: MissionStepStatus;
  startedAt?: number;
  completedAt?: number;
  output?: Record<string, unknown>;
  attempts: number;
}

export interface MissionPhaseRun {
  id: string;
  definition: MissionPhaseDefinition;
  status: MissionStatus;
  startedAt?: number;
  completedAt?: number;
  steps: MissionStepRun[];
}

export interface MissionRun {
  id: string;
  definition: MissionDefinition;
  status: MissionStatus;
  progress: number;
  phases: MissionPhaseRun[];
  logs: MissionLogEntry[];
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

export interface MissionCapabilityContext {
  mission: MissionRun;
  phase: MissionPhaseRun;
  step: MissionStepRun;
}

export interface MissionCapabilityResult {
  status: MissionStepStatus;
  logs?: string[];
  output?: Record<string, unknown>;
  errorMessage?: string;
  requireApproval?: boolean;
}

export type MissionCapabilityHandler = (
  context: MissionCapabilityContext
) => Promise<MissionCapabilityResult> | MissionCapabilityResult;

export interface MissionCapability {
  id: string;
  displayName: string;
  description?: string;
  agentId: string;
  handler: MissionCapabilityHandler;
}
