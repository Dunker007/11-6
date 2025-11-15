export interface CodeIssue {
  id: string;
  file: string;
  line: number;
  column?: number;
  severity: 'error' | 'warning' | 'info' | 'suggestion';
  message: string;
  rule?: string;
  code?: string;
  fix?: string;
  category: 'performance' | 'security' | 'style' | 'bug' | 'complexity' | 'best-practice';
  securityType?: 'injection' | 'xss' | 'auth' | 'secrets' | 'dependencies' | 'crypto';
}

export interface SecuritySummary {
  score: number; // 0-100, higher is better
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  byType: Record<string, number>;
  dependencyVulnerabilities: Array<{
    package: string;
    version: string;
    vulnerability: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
}

export interface CodeReview {
  id: string;
  projectPath: string;
  files: string[];
  issues: CodeIssue[];
  summary: {
    totalIssues: number;
    errors: number;
    warnings: number;
    suggestions: number;
    byCategory: Record<string, number>;
    byFile: Record<string, number>;
  };
  createdAt: Date;
  completedAt?: Date;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
}

export interface ReviewSettings {
  includePatterns: string[];
  excludePatterns: string[];
  checkTypes: ('performance' | 'security' | 'style' | 'bug' | 'complexity' | 'best-practice')[];
  maxIssues?: number;
  failOnError?: boolean;
}

export interface ReviewRule {
  id: string;
  name: string;
  description: string;
  category: CodeIssue['category'];
  enabled: boolean;
  severity: CodeIssue['severity'];
}

