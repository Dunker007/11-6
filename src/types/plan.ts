// src/types/plan.ts
/**
 * Types for AI-generated execution plans
 * Used by aiServiceBridge and VibeBar
 */

export type PlanStepType = 'THINK' | 'READ_FILE' | 'CREATE_FILE' | 'EDIT_FILE' | 'DELETE_FILE' | 'RUN_COMMAND';

export type PlanStepStatus = 'pending' | 'running' | 'completed' | 'error';

export type PlanStatus = 'pending' | 'running' | 'paused' | 'completed' | 'error';

export interface PlanStep {
  id: string;
  type: PlanStepType;
  status: PlanStepStatus;
  thought?: string;
  filePath?: string;
  content?: string;
  command?: string;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}

export interface Plan {
  id: string;
  title: string;
  status: PlanStatus;
  steps: PlanStep[];
  currentStep: number;
  createdAt?: Date;
  updatedAt?: Date;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
}

export interface PlanResponse {
  success: boolean;
  plan?: Plan;
  error?: string;
}

export interface StructuredIdea {
  title: string;
  summary: string;
}

