import type { CodeReview, CodeIssue, ReviewSettings, SecuritySummary } from '@/types/codereview';
import { fileSystemService } from '@/services/filesystem/fileSystemService';

const REVIEWS_STORAGE_KEY = 'dlx_code_reviews';

/**
 * Compare semantic versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  // Remove leading 'v' or 'V' if present
  const clean1 = v1.replace(/^[vV]/, '');
  const clean2 = v2.replace(/^[vV]/, '');
  
  // Split into parts and convert to numbers
  const parts1 = clean1.split('.').map(part => {
    // Handle pre-release versions (e.g., "4.18.0-beta")
    const numPart = part.split('-')[0];
    return parseInt(numPart, 10) || 0;
  });
  
  const parts2 = clean2.split('.').map(part => {
    const numPart = part.split('-')[0];
    return parseInt(numPart, 10) || 0;
  });
  
  // Pad arrays to same length
  const maxLength = Math.max(parts1.length, parts2.length);
  while (parts1.length < maxLength) parts1.push(0);
  while (parts2.length < maxLength) parts2.push(0);
  
  // Compare each part
  for (let i = 0; i < maxLength; i++) {
    if (parts1[i] < parts2[i]) return -1;
    if (parts1[i] > parts2[i]) return 1;
  }
  
  return 0;
}

/**
 * Extract version from version range string
 * Handles: "^4.17.0", "~4.18.0", ">=4.0.0", "4.18.0", etc.
 */
function extractVersion(versionRange: string): string {
  // Remove range operators and whitespace
  const cleaned = versionRange
    .replace(/^[\^~>=<]+/, '') // Remove ^, ~, >=, <=, >, <
    .replace(/\s+/g, '') // Remove whitespace
    .split('||')[0] // Take first version if multiple (OR)
    .split(' ')[0]; // Take first version if space-separated
  
  // Extract version number (e.g., "4.18.0" from "4.18.0-beta.1")
  const match = cleaned.match(/^(\d+\.\d+\.\d+)/);
  if (match) {
    return match[1];
  }
  
  // Fallback: try to parse as-is
  return cleaned;
}

/**
 * Check if a version is less than the required minimum version
 */
function isVersionLessThan(versionRange: string, minVersion: string): boolean {
  const extractedVersion = extractVersion(versionRange);
  return compareVersions(extractedVersion, minVersion) < 0;
}

export class CodeReviewService {
  private static instance: CodeReviewService;
  private reviews: Map<string, CodeReview> = new Map();

  private constructor() {
    this.loadReviews();
  }

  static getInstance(): CodeReviewService {
    if (!CodeReviewService.instance) {
      CodeReviewService.instance = new CodeReviewService();
    }
    return CodeReviewService.instance;
  }

  private loadReviews(): void {
    try {
      const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (stored) {
        const reviews: CodeReview[] = JSON.parse(stored);
        reviews.forEach((review) => {
          review.createdAt = new Date(review.createdAt);
          if (review.completedAt) {
            review.completedAt = new Date(review.completedAt);
          }
          this.reviews.set(review.id, review);
        });
      }
    } catch (error) {
      console.error('Failed to load code reviews:', error);
    }
  }

  private saveReviews(): void {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(Array.from(this.reviews.values())));
    } catch (error) {
      console.error('Failed to save code reviews:', error);
    }
  }

  async analyzeCode(projectPath: string, settings: ReviewSettings): Promise<CodeReview> {
    const review: CodeReview = {
      id: crypto.randomUUID(),
      projectPath,
      files: [],
      issues: [],
      summary: {
        totalIssues: 0,
        errors: 0,
        warnings: 0,
        suggestions: 0,
        byCategory: {},
        byFile: {},
      },
      createdAt: new Date(),
      status: 'analyzing',
    };

    this.reviews.set(review.id, review);
    this.saveReviews();

    // Simulate code analysis
    await this.simulateAnalysis(review, settings);

    return review;
  }

  /**
   * Review a code string directly (for use in agent services)
   */
  async reviewCode(
    code: string,
    options?: {
      filePath?: string;
      language?: string;
      includeSecurity?: boolean;
      includePerformance?: boolean;
      includeStyle?: boolean;
    }
  ): Promise<CodeReview> {
    const review: CodeReview = {
      id: crypto.randomUUID(),
      projectPath: options?.filePath || 'inline',
      files: options?.filePath ? [options.filePath] : [],
      issues: [],
      summary: {
        totalIssues: 0,
        errors: 0,
        warnings: 0,
        suggestions: 0,
        byCategory: {},
        byFile: {},
      },
      createdAt: new Date(),
      status: 'analyzing',
    };

    // Simple code review - check for common issues
    const issues: CodeIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNum = index + 1;

      // Check for common issues
      if (line.includes('console.log') && !line.includes('//')) {
        issues.push({
          id: crypto.randomUUID(),
          file: options?.filePath || 'inline',
          line: lineNum,
          column: 1,
          severity: 'suggestion',
          message: 'Consider removing console.log in production code',
          rule: 'no-console',
          code: line.trim(),
          category: 'style',
        });
      }

      if (line.includes('any') && options?.language === 'typescript') {
        issues.push({
          id: crypto.randomUUID(),
          file: options?.filePath || 'inline',
          line: lineNum,
          column: 1,
          severity: 'warning',
          message: 'Avoid using "any" type',
          rule: 'no-any',
          code: line.trim(),
          category: 'style',
        });
      }

      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push({
          id: crypto.randomUUID(),
          file: options?.filePath || 'inline',
          line: lineNum,
          column: 1,
          severity: 'suggestion',
          message: 'TODO/FIXME comment found',
          rule: 'no-todo',
          code: line.trim(),
          category: 'best-practice',
        });
      }
    });

    review.issues = issues;
    review.summary = this.calculateSummary(issues);
    review.status = 'completed';
    review.completedAt = new Date();

    return review;
  }

  private async simulateAnalysis(review: CodeReview, _settings: ReviewSettings): Promise<void> {
    // Simulate analysis delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate sample issues
    const sampleIssues: CodeIssue[] = [
      {
        id: crypto.randomUUID(),
        file: 'src/components/App.tsx',
        line: 15,
        column: 10,
        severity: 'warning',
        message: 'Unused variable detected',
        rule: 'no-unused-vars',
        code: 'const unusedVar = 42;',
        category: 'style',
      },
      {
        id: crypto.randomUUID(),
        file: 'src/utils/helpers.ts',
        line: 32,
        column: 5,
        severity: 'error',
        message: 'Potential null reference',
        rule: 'no-null-reference',
        code: 'value.toString()',
        fix: 'value?.toString()',
        category: 'bug',
      },
      {
        id: crypto.randomUUID(),
        file: 'src/api/client.ts',
        line: 8,
        column: 1,
        severity: 'suggestion',
        message: 'Consider using async/await instead of promises',
        rule: 'prefer-async-await',
        category: 'best-practice',
      },
    ];

    review.issues = sampleIssues;
    review.files = Array.from(new Set(sampleIssues.map((i) => i.file)));
    review.summary = this.calculateSummary(sampleIssues);
    review.status = 'completed';
    review.completedAt = new Date();

    this.saveReviews();
  }

  private calculateSummary(issues: CodeIssue[]): CodeReview['summary'] {
    const summary: CodeReview['summary'] = {
      totalIssues: issues.length,
      errors: 0,
      warnings: 0,
      suggestions: 0,
      byCategory: {},
      byFile: {},
    };

    issues.forEach((issue) => {
      if (issue.severity === 'error') summary.errors++;
      else if (issue.severity === 'warning') summary.warnings++;
      else if (issue.severity === 'suggestion') summary.suggestions++;

      summary.byCategory[issue.category] = (summary.byCategory[issue.category] || 0) + 1;
      summary.byFile[issue.file] = (summary.byFile[issue.file] || 0) + 1;
    });

    return summary;
  }

  getReview(id: string): CodeReview | null {
    return this.reviews.get(id) || null;
  }

  getAllReviews(): CodeReview[] {
    return Array.from(this.reviews.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  deleteReview(id: string): boolean {
    const deleted = this.reviews.delete(id);
    if (deleted) this.saveReviews();
    return deleted;
  }

  async analyzeSecurity(projectPath: string): Promise<{ issues: CodeIssue[]; summary: SecuritySummary }> {
    const issues: CodeIssue[] = [];
    const dependencyVulns: SecuritySummary['dependencyVulnerabilities'] = [];

    try {
      // Generate sample security issues
      // TODO: Implement actual file scanning with pattern matching
      issues.push(
        {
          id: crypto.randomUUID(),
          file: 'src/config/api.ts',
          line: 12,
          column: 5,
          severity: 'error',
          message: 'Hardcoded API key detected',
          rule: 'no-hardcoded-secrets',
          code: "const API_KEY = 'sk-1234567890abcdef';",
          fix: "const API_KEY = process.env.API_KEY;",
          category: 'security',
          securityType: 'secrets',
        },
        {
          id: crypto.randomUUID(),
          file: 'src/db/query.ts',
          line: 45,
          column: 10,
          severity: 'error',
          message: 'Potential SQL injection vulnerability',
          rule: 'no-sql-injection',
          code: "const query = `SELECT * FROM users WHERE id = ${userId}`;",
          fix: 'Use parameterized queries',
          category: 'security',
          securityType: 'injection',
        },
        {
          id: crypto.randomUUID(),
          file: 'src/components/UserProfile.tsx',
          line: 23,
          column: 8,
          severity: 'warning',
          message: 'Potential XSS vulnerability - using innerHTML with user input',
          rule: 'no-xss',
          code: "element.innerHTML = userInput;",
          fix: 'Use textContent or sanitize input',
          category: 'security',
          securityType: 'xss',
        },
        {
          id: crypto.randomUUID(),
          file: 'src/api/routes.ts',
          line: 8,
          column: 1,
          severity: 'warning',
          message: 'Route handler missing authentication check',
          rule: 'require-auth',
          code: 'router.get("/api/users", (req, res) => {',
          fix: 'Add authentication middleware',
          category: 'security',
          securityType: 'auth',
        }
      );

      // Check package.json for vulnerable dependencies (simplified)
      try {
        const packageJsonResult = await fileSystemService.readFile(`${projectPath}/package.json`);
        if (packageJsonResult.success && packageJsonResult.data) {
          const packageJson = JSON.parse(packageJsonResult.data);
          const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
          
          // Sample vulnerability check - using semantic version comparison
          if (deps['express'] && isVersionLessThan(deps['express'], '4.18.0')) {
            dependencyVulns.push({
              package: 'express',
              version: deps['express'],
              vulnerability: 'CVE-2022-24999',
              severity: 'high',
            });
          }
        }
      } catch {
        // Ignore package.json read errors
      }

      // Calculate security summary
      const securityIssues = issues.filter((i) => i.category === 'security');
      const summary: SecuritySummary = {
        score: Math.max(0, 100 - (securityIssues.length * 10) - (dependencyVulns.length * 15)),
        criticalIssues: securityIssues.filter((i) => i.severity === 'error').length,
        highIssues: securityIssues.filter((i) => i.severity === 'warning').length,
        mediumIssues: securityIssues.filter((i) => i.severity === 'info').length,
        lowIssues: securityIssues.filter((i) => i.severity === 'suggestion').length,
        byType: {},
        dependencyVulnerabilities: dependencyVulns,
      };

      securityIssues.forEach((issue) => {
        if (issue.securityType) {
          summary.byType[issue.securityType] = (summary.byType[issue.securityType] || 0) + 1;
        }
      });

      return { issues, summary };
    } catch (error) {
      console.error('Security analysis error:', error);
      return {
        issues: [],
        summary: {
          score: 0,
          criticalIssues: 0,
          highIssues: 0,
          mediumIssues: 0,
          lowIssues: 0,
          byType: {},
          dependencyVulnerabilities: [],
        },
      };
    }
  }
}

export const codeReviewService = CodeReviewService.getInstance();

