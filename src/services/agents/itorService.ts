import { codeReviewService } from '@/services/codereview/codeReviewService';
import { useAgentStore } from './agentStore';
import type { ItorReviewResult } from '@/types/agents';
import type { CodeIssue } from '@/types/codereview';

/**
 * Itor Service - The Code Reviewer
 * Cartoon hawk, sharp-eyed code reviewer
 * Uses analytical temperature (0.3) for precise reviews
 */
class ItorService {
  /**
   * Review code for issues
   */
  async reviewCode(
    code: string,
    context?: {
      filePath?: string;
      language?: string;
    }
  ): Promise<ItorReviewResult> {
    const store = useAgentStore.getState();
    store.setItorStatus('scanning');
    store.setWorkflow('itor-reviewing');
    store.incrementReviewCount();

    try {
      store.setItorStatus('reviewing');

      // Use codeReviewService for structured review
      const review = await codeReviewService.reviewCode(code, {
        filePath: context?.filePath,
        language: context?.language || 'typescript',
        includeSecurity: true,
        includePerformance: true,
        includeStyle: true,
      });

      const issues = review.issues || [];
      const criticalIssues = issues.filter((i: CodeIssue) => i.severity === 'error').length;
      const highIssues = issues.filter((i: CodeIssue) => i.severity === 'warning').length;
      const mediumIssues = issues.filter((i: CodeIssue) => i.severity === 'info').length;
      const lowIssues = issues.filter((i: CodeIssue) => i.severity === 'suggestion').length;

      // Calculate score (0-100, higher is better)
      const totalIssues = issues.length;
      const score = totalIssues === 0 
        ? 100 
        : Math.max(0, 100 - (criticalIssues * 20) - (highIssues * 10) - (mediumIssues * 5) - (lowIssues * 2));

      const approved = criticalIssues === 0 && highIssues === 0 && score >= 80;

      if (issues.length > 0) {
        store.incrementIssuesFound(issues.length);
      }

      // Map code review issues to Itor's format
      const mappedIssues = issues.map((issue: CodeIssue) => ({
        severity: issue.severity === 'error' ? 'critical' as const
          : issue.severity === 'warning' ? 'high' as const
          : issue.severity === 'info' ? 'medium' as const
          : 'low' as const,
        category: (issue.category === 'complexity' ? 'best-practice' : issue.category) as 'bug' | 'security' | 'performance' | 'style' | 'best-practice',
        message: issue.message,
        suggestion: issue.fix,
      }));

      if (approved) {
        store.setItorStatus('approved');
      } else if (criticalIssues > 0 || highIssues > 0) {
        store.setItorStatus('alert');
      } else {
        store.setItorStatus('idle');
      }

      return {
        approved,
        issues: mappedIssues,
        score,
      };
    } catch (error) {
      store.setItorStatus('error');
      store.setWorkflow('error');
      throw error;
    }
  }

  /**
   * Analyze code for specific issue types
   */
  async analyzeIssues(
    code: string,
    focusAreas: Array<'bug' | 'security' | 'performance' | 'style' | 'best-practice'> = ['bug', 'security']
  ): Promise<ItorReviewResult> {
    const store = useAgentStore.getState();
    store.setItorStatus('scanning');

    try {
      const review = await codeReviewService.reviewCode(code, {
        includeSecurity: focusAreas.includes('security'),
        includePerformance: focusAreas.includes('performance'),
        includeStyle: focusAreas.includes('style'),
      });

      const issues = review.issues || [];
      const filteredIssues = issues.filter((issue: CodeIssue) => {
        const category = issue.category === 'complexity' ? 'best-practice' : issue.category;
        return focusAreas.includes(category);
      });

      const mappedIssues = filteredIssues.map((issue: CodeIssue) => ({
        severity: issue.severity === 'error' ? 'critical' as const
          : issue.severity === 'warning' ? 'high' as const
          : issue.severity === 'info' ? 'medium' as const
          : 'low' as const,
        category: (issue.category === 'complexity' ? 'best-practice' : issue.category) as 'bug' | 'security' | 'performance' | 'style' | 'best-practice',
        message: issue.message,
        suggestion: issue.fix,
      }));

      const criticalIssues = mappedIssues.filter((i) => i.severity === 'critical').length;
      const highIssues = mappedIssues.filter((i) => i.severity === 'high').length;

      if (criticalIssues > 0 || highIssues > 0) {
        store.setItorStatus('alert');
      } else {
        store.setItorStatus('approved');
      }

      return {
        approved: criticalIssues === 0 && highIssues === 0,
        issues: mappedIssues,
        score: mappedIssues.length === 0 ? 100 : Math.max(0, 100 - (criticalIssues * 20) - (highIssues * 10)),
      };
    } catch (error) {
      store.setItorStatus('error');
      throw error;
    }
  }

  /**
   * Reset Itor to idle state
   */
  reset(): void {
    const store = useAgentStore.getState();
    store.setItorStatus('idle');
  }
}

export const itorService = new ItorService();

