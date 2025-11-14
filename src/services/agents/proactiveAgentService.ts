/**
 * Proactive Agent Service
 * Triggers real-time code analysis by Vibed Ed and Itor
 */

import { llmRouter } from '@/services/ai/router';
import { semanticIndexService } from '@/services/ai/semanticIndexService';
import { useVibesStore } from './vibesStore';
import { useAgentStore } from './agentStore';
import { insightsStreamStore } from './insightsStreamStore';
import type { CodeVibe, VibeType } from '@/types/agents';

class ProactiveAgentService {
  private analysisTimeout: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 1500; // Wait 1.5s after typing stops
  private readonly MIN_CHUNK_SIZE = 50; // Minimum characters to analyze

  /**
   * Trigger code analysis with debouncing
   */
  public triggerCodeAnalysis(code: string, filePath: string): void {
    // Clear existing timeout
    if (this.analysisTimeout) {
      clearTimeout(this.analysisTimeout);
    }

    // Skip if code is too short
    if (code.trim().length < this.MIN_CHUNK_SIZE) {
      return;
    }

    // Debounce analysis
    this.analysisTimeout = setTimeout(() => {
      this.analyzeCode(code, filePath).catch((error) => {
        console.error('Code analysis failed:', error);
      });
    }, this.DEBOUNCE_MS);
  }

  /**
   * Analyze code using both agents
   */
  private async analyzeCode(code: string, filePath: string): Promise<CodeVibe[]> {
    const store = useAgentStore.getState();
    store.setEdStatus('thinking');
    store.setItorStatus('scanning');

    try {
      // Run both analyses in parallel
      const [itorVibes, vibedEdVibes] = await Promise.all([
        this.runItorAnalysis(code, filePath),
        this.runVibedEdAnalysis(code, filePath),
      ]);

      // Combine and add file path
      const allVibes: CodeVibe[] = [
        ...itorVibes.map(v => ({ ...v, filePath })),
        ...vibedEdVibes.map(v => ({ ...v, filePath })),
      ];

      // Update vibes store
      useVibesStore.getState().setVibes(allVibes);

      // Log to insights stream
      if (allVibes.length > 0) {
        insightsStreamStore.getState().addInsight({
          id: `vibes-${Date.now()}`,
          type: 'code-vibe',
          agent: 'System',
          message: `Found ${allVibes.length} code vibes in ${filePath}`,
          details: {
            filePath,
            vibeType: allVibes[0]?.type,
          },
        });
      }

      store.setEdStatus('idle');
      store.setItorStatus('idle');

      return allVibes;
    } catch (error) {
      console.error('Code analysis error:', error);
      store.setEdStatus('error');
      store.setItorStatus('error');
      throw error;
    }
  }

  /**
   * Run Itor's analysis (bug/style detection)
   */
  private async runItorAnalysis(code: string, _filePath: string): Promise<CodeVibe[]> {
    const prompt = `You are Itor, a code review agent. Analyze this code snippet for bugs, style issues, and best practices.

Code:
\`\`\`
${code}
\`\`\`

Respond with a JSON array of objects. Each object should have:
- "type": "bug" or "style"
- "message": Brief description of the issue
- "suggestion": Optional improvement suggestion
- "lineStart": Starting line number (1-indexed)
- "lineEnd": Ending line number (1-indexed)

Only include real issues. Return an empty array if the code is good.
Example: [{"type": "bug", "message": "Potential null reference", "suggestion": "Add null check", "lineStart": 5, "lineEnd": 5}]`;

    try {
      const response = await llmRouter.generate(prompt, {
        temperature: 0.3, // Lower temperature for more focused review
        maxTokens: 1000,
      });

      const vibes = this.parseLLMResponse(response.text, 'Itor');
      return vibes.filter(vibe => vibe.type === 'bug' || vibe.type === 'style');
    } catch (error) {
      console.error('Itor analysis failed:', error);
      return [];
    }
  }

  /**
   * Run Vibed Ed's analysis (performance/refactoring)
   */
  private async runVibedEdAnalysis(code: string, _filePath: string): Promise<CodeVibe[]> {
    // Get semantic context from the codebase
    const semanticContext = await semanticIndexService.search(
      `code similar to: ${code.substring(0, 200)}`,
      3
    ).catch(() => []);

    const contextSnippet = semanticContext.length > 0
      ? `\n\nSimilar code patterns found:\n${semanticContext.map(c => c.preview).join('\n')}`
      : '';

    const prompt = `You are Vibed Ed, a creative coding agent focused on performance and refactoring. Analyze this code for optimization opportunities and refactoring suggestions.

Code:
\`\`\`
${code}
\`\`\`
${contextSnippet}

Respond with a JSON array of objects. Each object should have:
- "type": "performance" or "refactor"
- "message": Brief description of the opportunity
- "suggestion": Optional refactoring suggestion
- "lineStart": Starting line number (1-indexed)
- "lineEnd": Ending line number (1-indexed)

Focus on meaningful improvements. Return an empty array if the code is already optimal.
Example: [{"type": "performance", "message": "Consider memoizing this calculation", "suggestion": "Use useMemo hook", "lineStart": 10, "lineEnd": 12}]`;

    try {
      const response = await llmRouter.generate(prompt, {
        temperature: 0.91, // Higher temperature for creative suggestions
        maxTokens: 1000,
      });

      const vibes = this.parseLLMResponse(response.text, 'Vibed Ed');
      return vibes.filter(vibe => vibe.type === 'performance' || vibe.type === 'refactor');
    } catch (error) {
      console.error('Vibed Ed analysis failed:', error);
      return [];
    }
  }

  /**
   * Parse LLM response into CodeVibe objects
   */
  private parseLLMResponse(responseText: string, agent: 'Vibed Ed' | 'Itor'): CodeVibe[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .filter(item => this.isValidVibe(item))
        .map((item, index) => ({
          id: `${agent}-${Date.now()}-${index}`,
          type: item.type as VibeType, // Safe after isValidVibe filter
          message: item.message as string,
          suggestion: item.suggestion as string,
          agent,
          lineStart: Math.max(1, item.lineStart || 1),
          lineEnd: Math.max(item.lineStart || 1, item.lineEnd || item.lineStart || 1),
          filePath: '', // Will be set by caller
          createdAt: new Date(),
        }));
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      return [];
    }
  }

  /**
   * Validate that an object is a valid CodeVibe
   */
  private isValidVibe(item: unknown): item is Partial<CodeVibe> {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const vibe = item as Record<string, unknown>;

    return (
      ['performance', 'refactor', 'bug', 'style'].includes(vibe.type as VibeType) &&
      typeof vibe.message === 'string' &&
      typeof vibe.lineStart === 'number' &&
      vibe.lineStart > 0
    );
  }
}

export const proactiveAgentService = new ProactiveAgentService();

