/**
 * Agent System Types
 * Ed (Boomhauer-style code writer) + Itor (cartoon hawk code reviewer)
 */

export type AgentStatus = 'idle' | 'thinking' | 'working' | 'reviewing' | 'success' | 'error';

export type EdStatus = 
  | 'idle'        // Relaxed, chill pose
  | 'thinking'    // Hand on chin, contemplating
  | 'coding'      // Typing/writing code
  | 'refining'    // Improving code based on feedback
  | 'success'     // Celebration, thumbs up
  | 'error';      // Concerned, needs help

export type ItorStatus =
  | 'idle'        // Perched, watching
  | 'scanning'    // Scanning code for issues
  | 'reviewing'   // Analyzing code quality
  | 'alert'       // Issues found, wings spread
  | 'approved'    // Code approved, nodding
  | 'error';      // Critical issue found

export interface AgentPairState {
  edStatus: EdStatus;
  itorStatus: ItorStatus;
  currentWorkflow: 'idle' | 'ed-generating' | 'itor-reviewing' | 'ed-refining' | 'complete' | 'error';
  lastEdActivity?: Date;
  lastItorActivity?: Date;
  reviewCount: number;
  issuesFound: number;
}

export interface EdGenerationResult {
  code: string;
  explanation?: string;
  confidence: number; // 0-1
}

export interface ItorReviewResult {
  approved: boolean;
  issues: ItorReviewIssue[];
  score: number; // 0-100
}

export interface ItorReviewIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'bug' | 'security' | 'performance' | 'style' | 'best-practice';
  message: string;
  suggestion?: string;
  lineStart?: number;
  lineEnd?: number;
}

export interface AgentPairWorkflow {
  id: string;
  edResult: EdGenerationResult;
  itorResult: ItorReviewResult | null;
  refinedCode: string | null;
  iterations: number;
  createdAt: Date;
  completedAt?: Date;
}

export type VibeType = 'performance' | 'refactor' | 'bug' | 'style';

export interface CodeVibe {
  id: string;
  type: VibeType;
  message: string;
  suggestion?: string;
  agent: 'Vibed Ed' | 'Itor';
  lineStart: number;
  lineEnd: number;
  filePath: string;
  createdAt: Date;
}

