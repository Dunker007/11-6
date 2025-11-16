import { llmRouter } from '@/services/ai/router';
import { useAgentStore } from './agentStore';
import type { EdGenerationResult } from '@/types/agents';

/**
 * Ed Service - The Code Writer
 * Boomhauer-style, laid-back code generator
 * Uses creative temperature (0.91) for innovative solutions
 */
class EdService {
  /**
   * Generate code based on user prompt
   */
  async generateCode(
    prompt: string,
    context?: {
      filePath?: string;
      existingCode?: string;
      language?: string;
    }
  ): Promise<EdGenerationResult> {
    const store = useAgentStore.getState();
    store.setEdStatus('thinking');
    store.setWorkflow('ed-generating');

    try {
      // Build context-aware prompt
      let fullPrompt = `You are Ed, a laid-back but skilled code writer. You write clean, efficient code with a chill vibe.

User Request: ${prompt}
`;

      if (context?.existingCode) {
        fullPrompt += `\nExisting Code:\n\`\`\`${context.language || 'typescript'}\n${context.existingCode}\n\`\`\`\n`;
      }

      if (context?.filePath) {
        fullPrompt += `\nTarget File: ${context.filePath}\n`;
      }

      fullPrompt += `\nGenerate the code. Keep it clean, well-commented, and maintainable.`;

      store.setEdStatus('coding');

      // Use llmRouter with creative temperature
      const result = await llmRouter.generate(fullPrompt, {
        temperature: 0.91, // Creative temperature
        maxTokens: 2048,
      });

      store.setEdStatus('success');

      // Extract code from response (remove markdown code blocks if present)
      let code = result.text.trim();
      code = code.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '').trim();

      return {
        code,
        explanation: undefined,
        confidence: 0.85, // Ed is confident but chill
      };
    } catch (error) {
      store.setEdStatus('error');
      store.setWorkflow('error');
      throw error;
    }
  }

  /**
   * Refine code based on Itor's feedback
   */
  async refineCode(
    code: string,
    feedback: string,
    context?: {
      filePath?: string;
      language?: string;
    }
  ): Promise<EdGenerationResult> {
    const store = useAgentStore.getState();
    store.setEdStatus('refining');

    try {
      const prompt = `You are Ed. Itor found some issues with this code. Refine it based on the feedback.

Original Code:
\`\`\`${context?.language || 'typescript'}\n${code}\n\`\`\`

Itor's Feedback:
${feedback}

Generate the improved code:`;

      const result = await llmRouter.generate(prompt, {
        temperature: 0.85, // Slightly less creative when refining
        maxTokens: 2048,
      });

      store.setEdStatus('success');

      // Extract code from response
      let refinedCode = result.text.trim();
      refinedCode = refinedCode.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '').trim();

      return {
        code: refinedCode,
        explanation: `Refined based on Itor's feedback: ${feedback}`,
        confidence: 0.9, // Higher confidence after refinement
      };
    } catch (error) {
      store.setEdStatus('error');
      throw error;
    }
  }

  /**
   * Reset Ed to idle state
   */
  reset(): void {
    const store = useAgentStore.getState();
    store.setEdStatus('idle');
  }
}

export const edService = new EdService();

