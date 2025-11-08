// src/types/plan.ts
/**
 * Types for AI-generated execution plans
 * Used by aiServiceBridge and VibeBar
 */

export type PlanStepType = 'THINK' | 'READ_FILE' | 'EDIT_FILE' | 'RUN_COMMAND';

export interface PlanStep {
  type: PlanStepType;
  thought?: string;
  filePath?: string;
  content?: string;
  command?: string;
}

export interface Plan {
  steps: PlanStep[];
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

