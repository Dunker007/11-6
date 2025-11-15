/**
 * Insights Stream Types
 * Chronological timeline of agent activities and system events
 */

import type { CodeVibe, ItorReviewIssue } from './agents';
import type { PlanStep, PlanStatus } from './plan';

export type InsightType = 
  | 'agent-activity' 
  | 'code-vibe' 
  | 'plan-event' 
  | 'code-review' 
  | 'file-change' 
  | 'command-output' 
  | 'system-alert';

export interface Insight {
  id: string;
  type: InsightType;
  agent: 'Vibed Ed' | 'Itor' | 'System' | 'User';
  message: string;
  timestamp: Date;
  details?: {
    status?: string;
    planId?: string;
    stepId?: string;
    stepType?: PlanStep['type'];
    planStatus?: PlanStatus;
    error?: string;
    filePath?: string;
    lineStart?: number;
    lineEnd?: number;
    vibeType?: CodeVibe['type'];
    reviewIssues?: ItorReviewIssue[];
    command?: string;
    output?: string;
  };
}

