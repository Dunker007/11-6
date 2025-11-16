import { edService } from './edService';
import { itorService } from './itorService';
import { useAgentStore } from './agentStore';
import type { AgentPairWorkflow, EdGenerationResult, ItorReviewResult } from '@/types/agents';

/**
 * Agent Pair Service
 * Orchestrates Ed → Itor → Ed workflow
 * Manages the feedback loop between writer and reviewer
 */
class AgentPairService {
  /**
   * Execute the full pipeline: Generate code with Ed, review with Itor, and refine if needed.
   * 
   * This method orchestrates the Ed → Itor → Ed workflow, where Ed generates code,
   * Itor reviews it, and if not approved, Ed refines based on feedback. The process
   * continues until approval or max iterations is reached.
   * 
   * @param prompt - The natural language prompt describing what code to generate
   * @param context - Optional context object containing:
   *   - filePath: Path to the file being edited
   *   - existingCode: Current code in the file (for context)
   *   - language: Programming language (e.g., 'typescript', 'javascript')
   *   - maxIterations: Maximum number of refinement iterations (default: 3)
   * @returns A promise that resolves to an AgentPairWorkflow containing generation results, review results, and refined code
   * @throws {Error} If generation or review fails
   * 
   * @example
   * ```typescript
   * const workflow = await agentPairService.generateAndReview(
   *   'Create a function to calculate fibonacci numbers',
   *   {
   *     filePath: 'src/utils/math.ts',
   *     language: 'typescript',
   *     maxIterations: 3
   *   }
   * );
   * if (workflow.itorResult?.approved) {
   *   console.log('Code approved!', workflow.refinedCode || workflow.edResult.code);
   * }
   * ```
   */
  async generateAndReview(
    prompt: string,
    context?: {
      filePath?: string;
      existingCode?: string;
      language?: string;
      maxIterations?: number;
    }
  ): Promise<AgentPairWorkflow> {
    const store = useAgentStore.getState();
    const maxIterations = context?.maxIterations || 3;
    let iterations = 0;
    let refinementCycles = 0; // Track refinement cycles separately
    let currentCode = '';
    let edResult: EdGenerationResult | null = null;
    let itorResult: ItorReviewResult | null = null;
    let refinedCode: string | null = null;

    const workflow: AgentPairWorkflow = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      edResult: { code: '', confidence: 0 },
      itorResult: null,
      refinedCode: null,
      iterations: 0,
      createdAt: new Date(),
    };

    try {
      // Step 1: Ed generates initial code
      store.setWorkflow('ed-generating');
      edResult = await edService.generateCode(prompt, context);
      currentCode = edResult.code;
      workflow.edResult = edResult;
      iterations++;

      // Step 2: Itor reviews initial code
      store.setWorkflow('itor-reviewing');
      itorResult = await itorService.reviewCode(currentCode, {
        filePath: context?.filePath,
        language: context?.language,
      });
      workflow.itorResult = itorResult;
      iterations++;

      // Step 3: Iterative refinement loop - continue until approved or maxIterations reached
      // maxIterations represents the maximum number of refinement cycles (refine + review pairs)
      while (!itorResult.approved && refinementCycles < maxIterations) {
        const feedback = this.formatFeedback(itorResult.issues);
        
        store.setWorkflow('ed-refining');
        const refined = await edService.refineCode(currentCode, feedback, {
          filePath: context?.filePath,
          language: context?.language,
        });
        
        refinedCode = refined.code;
        workflow.refinedCode = refinedCode;
        currentCode = refinedCode;
        iterations++;
        refinementCycles++;

        // Review the refined code
        store.setWorkflow('itor-reviewing');
        itorResult = await itorService.reviewCode(refinedCode, {
          filePath: context?.filePath,
          language: context?.language,
        });
        
        workflow.itorResult = itorResult;
        iterations++;
      }

      workflow.iterations = iterations;
      workflow.completedAt = new Date();

      if (itorResult.approved || (workflow.itorResult && workflow.itorResult.approved)) {
        store.setWorkflow('complete');
      } else {
        store.setWorkflow('idle');
      }

      store.addWorkflow(workflow);
      return workflow;
    } catch (error) {
      workflow.completedAt = new Date();
      store.setWorkflow('error');
      throw error;
    }
  }

  /**
   * Create an iterative feedback loop between Ed and Itor until code meets quality standards.
   * 
   * This method implements a more sophisticated workflow where Ed generates code,
   * Itor reviews it, and if the score is below the minimum threshold, Ed refines
   * the code based on feedback. This continues until approval or max iterations.
   * 
   * @param prompt - The natural language prompt describing what code to generate
   * @param context - Optional context object containing:
   *   - filePath: Path to the file being edited
   *   - existingCode: Current code in the file (for context)
   *   - language: Programming language
   *   - maxIterations: Maximum number of refinement iterations (default: 5)
   *   - minScore: Minimum review score to consider approved (default: 80)
   * @returns A promise that resolves to an AgentPairWorkflow with the final code and review results
   * @throws {Error} If generation or review fails
   * 
   * @example
   * ```typescript
   * const workflow = await agentPairService.createFeedbackLoop(
   *   'Create a secure authentication function',
   *   {
   *     language: 'typescript',
   *     maxIterations: 5,
   *     minScore: 85
   *   }
   * );
   * console.log(`Final score: ${workflow.itorResult?.score}`);
   * ```
   */
  async createFeedbackLoop(
    prompt: string,
    context?: {
      filePath?: string;
      existingCode?: string;
      language?: string;
      maxIterations?: number;
      minScore?: number; // Minimum score to consider approved (default: 80)
    }
  ): Promise<AgentPairWorkflow> {
    const store = useAgentStore.getState();
    const maxIterations = context?.maxIterations || 5;
    const minScore = context?.minScore || 80;
    let iterations = 0;
    let currentCode = '';
    let edResult: EdGenerationResult | null = null;
    let itorResult: ItorReviewResult | null = null;

    const workflow: AgentPairWorkflow = {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      edResult: { code: '', confidence: 0 },
      itorResult: null,
      refinedCode: null,
      iterations: 0,
      createdAt: new Date(),
    };

    try {
      // Initial generation
      store.setWorkflow('ed-generating');
      edResult = await edService.generateCode(prompt, context);
      currentCode = edResult.code;
      workflow.edResult = edResult;
      iterations++;

      // Iterative refinement loop
      while (iterations < maxIterations) {
        // Review current code
        store.setWorkflow('itor-reviewing');
        itorResult = await itorService.reviewCode(currentCode, {
          filePath: context?.filePath,
          language: context?.language,
        });
        workflow.itorResult = itorResult;
        iterations++;

        // Check if approved
        if (itorResult.approved && itorResult.score >= minScore) {
          workflow.refinedCode = currentCode;
          break;
        }

        // Refine based on feedback
        const feedback = this.formatFeedback(itorResult.issues);
        store.setWorkflow('ed-refining');
        const refined = await edService.refineCode(currentCode, feedback, {
          filePath: context?.filePath,
          language: context?.language,
        });
        
        currentCode = refined.code;
        workflow.refinedCode = currentCode;
        iterations++;
      }

      workflow.iterations = iterations;
      workflow.completedAt = new Date();

      if (itorResult && itorResult.approved && itorResult.score >= minScore) {
        store.setWorkflow('complete');
      } else {
        store.setWorkflow('idle');
      }

      store.addWorkflow(workflow);
      return workflow;
    } catch (error) {
      workflow.completedAt = new Date();
      store.setWorkflow('error');
      throw error;
    }
  }

  /**
   * Format Itor's issues into feedback for Ed
   */
  private formatFeedback(issues: ItorReviewResult['issues']): string {
    if (issues.length === 0) {
      return 'Code looks good!';
    }

    const critical = issues.filter(i => i.severity === 'critical');
    const high = issues.filter(i => i.severity === 'high');
    const medium = issues.filter(i => i.severity === 'medium');
    const low = issues.filter(i => i.severity === 'low');

    let feedback = 'Found some issues that need attention:\n\n';

    if (critical.length > 0) {
      feedback += 'CRITICAL ISSUES:\n';
      critical.forEach(issue => {
        feedback += `- ${issue.message}\n`;
        if (issue.suggestion) {
          feedback += `  Suggestion: ${issue.suggestion}\n`;
        }
      });
      feedback += '\n';
    }

    if (high.length > 0) {
      feedback += 'HIGH PRIORITY:\n';
      high.forEach(issue => {
        feedback += `- ${issue.message}\n`;
        if (issue.suggestion) {
          feedback += `  Suggestion: ${issue.suggestion}\n`;
        }
      });
      feedback += '\n';
    }

    if (medium.length > 0) {
      feedback += 'MEDIUM PRIORITY:\n';
      medium.slice(0, 5).forEach(issue => {
        feedback += `- ${issue.message}\n`;
      });
      feedback += '\n';
    }

    if (low.length > 0 && critical.length === 0 && high.length === 0) {
      feedback += 'MINOR SUGGESTIONS:\n';
      low.slice(0, 3).forEach(issue => {
        feedback += `- ${issue.message}\n`;
      });
    }

    return feedback.trim();
  }
}

export const agentPairService = new AgentPairService();

