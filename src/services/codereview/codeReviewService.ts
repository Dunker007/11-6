import type { CodeReview, CodeIssue, ReviewSettings } from '@/types/codereview';

const REVIEWS_STORAGE_KEY = 'dlx_code_reviews';

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
}

export const codeReviewService = CodeReviewService.getInstance();

