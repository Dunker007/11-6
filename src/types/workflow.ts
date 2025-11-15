/**
 * Workflow Type Definitions
 * 
 * Types for the workflow execution system that orchestrates
 * Project, Build, Deploy, Monitor, and Monetize workflows.
 */

export type WorkflowType = 'project' | 'build' | 'deploy' | 'monitor' | 'monetize';

export type WorkflowStatus = 'idle' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

export type WorkflowStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  status: WorkflowStepStatus;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  error?: string;
  metadata?: Record<string, any>;
}

export interface Workflow {
  id: string;
  type: WorkflowType;
  name: string;
  description?: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  startTime?: Date;
  endTime?: Date;
  duration?: number; // milliseconds
  error?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowConfig {
  type: WorkflowType;
  name: string;
  description?: string;
  steps: Omit<WorkflowStep, 'id' | 'status' | 'startTime' | 'endTime' | 'duration' | 'error'>[];
  metadata?: Record<string, any>;
}

export interface WorkflowExecutionResult {
  success: boolean;
  workflowId: string;
  duration: number;
  error?: string;
  stepsCompleted: number;
  stepsTotal: number;
}

// Project Workflow Types
export interface ProjectWorkflowConfig extends WorkflowConfig {
  type: 'project';
  projectId?: string;
  projectPath?: string;
  actions: ('create' | 'open' | 'analyze' | 'generate' | 'git-init')[];
}

// Build Workflow Types
export interface BuildWorkflowConfig extends WorkflowConfig {
  type: 'build';
  projectId: string;
  buildType: 'dev' | 'production' | 'test';
  buildCommand?: string;
  outputPath?: string;
}

export interface BuildResult {
  success: boolean;
  output: string;
  errors: string[];
  warnings: string[];
  duration: number;
  outputPath?: string;
}

// Deploy Workflow Types
export interface DeployWorkflowConfig extends WorkflowConfig {
  type: 'deploy';
  projectId: string;
  target: 'local' | 'staging' | 'production' | 'custom';
  environment?: Record<string, string>;
  deployCommand?: string;
}

export interface DeploymentTarget {
  id: string;
  name: string;
  type: 'local' | 'staging' | 'production' | 'custom';
  url?: string;
  status: 'active' | 'inactive' | 'error';
  lastDeployed?: Date;
  metadata?: Record<string, any>;
}

// Monitor Workflow Types
export interface MonitorWorkflowConfig extends WorkflowConfig {
  type: 'monitor';
  targets: string[]; // IDs of things to monitor
  metrics: ('health' | 'performance' | 'errors' | 'llm-status')[];
  alertThresholds?: Record<string, number>;
}

export interface MonitorAlert {
  id: string;
  type: 'health' | 'performance' | 'error' | 'llm-status';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Monetize Workflow Types
export interface MonetizeWorkflowConfig extends WorkflowConfig {
  type: 'monetize';
  revenueStreams: string[];
  pricingStrategy?: 'free' | 'freemium' | 'subscription' | 'one-time' | 'usage-based';
  targetRevenue?: number;
}

export interface RevenueStream {
  id: string;
  name: string;
  type: 'subscription' | 'one-time' | 'usage-based' | 'affiliate' | 'advertising';
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time';
  status: 'active' | 'paused' | 'archived';
  metadata?: Record<string, any>;
}

