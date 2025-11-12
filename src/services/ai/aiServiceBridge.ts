// src/services/ai/aiServiceBridge.ts
import { Plan, PlanResponse, StructuredIdea } from '@/types/plan';
import { multiFileContextService } from './multiFileContextService';
import { projectKnowledgeService } from './projectKnowledgeService';
import { llmRouter } from './router';

/**
 * AI Service Bridge
 * 
 * Unified interface for AI operations running in the renderer process.
 * No longer uses IPC - all services run locally for better performance.
 */

class AIServiceBridge {
  private indexingActive = false;
  private currentProjectRoot: string | null = null;

  /**
   * Start indexing and analyzing a project to build comprehensive project understanding.
   * 
   * Uses multiFileContextService to analyze project structure, dependencies, and context.
   * This enables AI features to have deep awareness of the codebase.
   * 
   * @param projectRoot - The root path of the project to index
   * @returns A promise that resolves when indexing is complete
   * @throws {Error} If indexing fails or project cannot be found
   * 
   * @example
   * ```typescript
   * await aiServiceBridge.startIndexing('/path/to/project');
   * console.log('Project indexed successfully');
   * ```
   */
  async startIndexing(projectRoot: string): Promise<void> {
    console.log('Starting project indexing (renderer-side):', projectRoot);
    this.indexingActive = true;
    this.currentProjectRoot = projectRoot;

    try {
      // Get active project from project store
      const project = projectKnowledgeService.getActiveProject();
      if (project) {
        // Analyze project structure and build context
        await multiFileContextService.analyzeProject(project);
        console.log('Project indexing complete');
      }
    } catch (error) {
      console.error('Error during project indexing:', error);
      throw error;
    }
  }

  /**
   * Stop the current indexing process and clean up resources.
   * 
   * This method resets the indexing state and clears the current project root.
   * Useful for cleanup when switching projects or canceling indexing.
   * 
   * @returns A promise that resolves when cleanup is complete
   * 
   * @example
   * ```typescript
   * await aiServiceBridge.stopIndexing();
   * console.log('Indexing stopped');
   * ```
   */
  async stopIndexing(): Promise<void> {
    console.log('Stopping project indexing');
    this.indexingActive = false;
    this.currentProjectRoot = null;
  }

  /**
   * Create an execution plan from a natural language prompt.
   * 
   * Uses LLM to generate structured, step-by-step plans for accomplishing tasks.
   * The plan includes project context for better understanding and more accurate planning.
   * Falls back to a mock plan if LLM is unavailable.
   * 
   * @param prompt - The natural language description of the task to plan
   * @returns A promise that resolves to a PlanResponse containing the generated plan or error
   * 
   * @example
   * ```typescript
   * const response = await aiServiceBridge.createPlan('Add a login page with email and password');
   * if (response.success && response.plan) {
   *   console.log(`Plan has ${response.plan.steps.length} steps`);
   * }
   * ```
   */
  async createPlan(prompt: string): Promise<PlanResponse> {
    console.log('Creating plan for prompt:', prompt);

    try {
      // Get project context for better AI understanding
      const projectContext = projectKnowledgeService.getFullProjectContext();
      
      // Build prompt with context
      const fullPrompt = `
You are an AI assistant helping with code generation and project tasks.

Project Context:
${projectContext}

User Request: ${prompt}

Generate a step-by-step plan to accomplish this task. Return a JSON object with this structure:
{
  "steps": [
    {
      "type": "THINK" | "READ_FILE" | "EDIT_FILE" | "RUN_COMMAND",
      "thought": "reasoning for THINK steps",
      "filePath": "path for file operations",
      "content": "description of changes for EDIT_FILE",
      "command": "command to run for RUN_COMMAND"
    }
  ]
}

Keep the plan concise and actionable.
`;

      try {
        // Try to use configured LLM
        const response = await llmRouter.generate(fullPrompt, {
          temperature: 0.7,
          maxTokens: 2048,
        });

        // Parse LLM response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const planData = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            plan: planData as Plan,
          };
        }
      } catch (llmError) {
        console.warn('LLM generation failed, using mock plan:', llmError);
      }

      // Fallback: Generate a simple mock plan
      return {
        success: true,
        plan: this.generateMockPlan(prompt),
      };
    } catch (error) {
      console.error('Error creating plan:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Structure a raw text idea into a formatted idea with title and summary.
   * 
   * Uses LLM to extract a concise title and summary from unstructured text.
   * Falls back to simple text processing if LLM is unavailable.
   * 
   * @param rawText - The raw, unstructured idea text
   * @returns A promise that resolves to a StructuredIdea with title and summary
   * 
   * @example
   * ```typescript
   * const idea = await aiServiceBridge.structureIdea('I want to build a todo app with React');
   * console.log(`Title: ${idea.title}`);
   * console.log(`Summary: ${idea.summary}`);
   * ```
   */
  async structureIdea(rawText: string): Promise<StructuredIdea> {
    console.log('Structuring idea from raw text');

    try {
      const prompt = `
Take this raw idea and structure it into a clear title and summary:

Raw idea: ${rawText}

Return a JSON object with:
{
  "title": "A concise title (50 chars max)",
  "summary": "A clear 2-3 sentence summary"
}
`;

      try {
        const response = await llmRouter.generate(prompt, {
          temperature: 0.7,
          maxTokens: 256,
        });

        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const structured = JSON.parse(jsonMatch[0]);
          return structured as StructuredIdea;
        }
      } catch (llmError) {
        console.warn('LLM structuring failed, using simple processing:', llmError);
      }

      // Fallback: Simple text processing
      const lines = rawText.trim().split('\n');
      const title = lines[0].substring(0, 50) + (lines[0].length > 50 ? '...' : '');
      const summary = rawText.substring(0, 200) + (rawText.length > 200 ? '...' : '');

      return { title, summary };
    } catch (error) {
      console.error('Error structuring idea:', error);
      // Return safe fallback
      return {
        title: rawText.substring(0, 50) + '...',
        summary: rawText,
      };
    }
  }

  /**
   * Generate a mock plan for testing/fallback
   */
  private generateMockPlan(prompt: string): Plan {
    const lowerPrompt = prompt.toLowerCase();

    // Pattern matching for common requests
    if (lowerPrompt.includes('add') && (lowerPrompt.includes('component') || lowerPrompt.includes('page'))) {
      const componentName = this.extractComponentName(prompt);
      return {
        steps: [
          {
            type: 'THINK',
            thought: `Creating a new ${componentName} component`,
          },
          {
            type: 'EDIT_FILE',
            filePath: `src/components/${componentName}.tsx`,
            content: `Create a React component named ${componentName}`,
          },
          {
            type: 'EDIT_FILE',
            filePath: `src/components/${componentName}.css`,
            content: 'Add basic styles for the component',
          },
        ],
      };
    }

    if (lowerPrompt.includes('rename') || lowerPrompt.includes('refactor')) {
      return {
        steps: [
          {
            type: 'THINK',
            thought: 'Analyzing codebase for refactoring opportunities',
          },
          {
            type: 'READ_FILE',
            filePath: 'src/',
          },
          {
            type: 'THINK',
            thought: 'Identifying files that need updates',
          },
        ],
      };
    }

    // Generic plan
    return {
      steps: [
        {
          type: 'THINK',
          thought: `Understanding request: "${prompt}"`,
        },
        {
          type: 'THINK',
          thought: 'This feature requires manual implementation or more specific instructions',
        },
      ],
    };
  }

  private extractComponentName(prompt: string): string {
    const words = prompt.split(' ');
    const addIndex = words.findIndex(w => w.toLowerCase() === 'add');
    if (addIndex !== -1 && addIndex + 1 < words.length) {
      const name = words[addIndex + 1];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'NewComponent';
  }

  /**
   * Check if project indexing is currently active.
   * 
   * @returns True if indexing is in progress, false otherwise
   * 
   * @example
   * ```typescript
   * if (aiServiceBridge.isIndexing()) {
   *   console.log('Indexing in progress...');
   * }
   * ```
   */
  isIndexing(): boolean {
    return this.indexingActive;
  }

  /**
   * Get the current project root path being indexed.
   * 
   * @returns The project root path if indexing is active, null otherwise
   * 
   * @example
   * ```typescript
   * const projectRoot = aiServiceBridge.getCurrentProjectRoot();
   * if (projectRoot) {
   *   console.log(`Indexing project at: ${projectRoot}`);
   * }
   * ```
   */
  getCurrentProjectRoot(): string | null {
    return this.currentProjectRoot;
  }

  /**
   * Generate a response using the LLM router
   */
  async generateResponse(prompt: string): Promise<{ text: string }> {
    try {
      const response = await llmRouter.generate(prompt, {
        temperature: 0.9,
        maxTokens: 1000
      });
      return { text: response.text };
    } catch (error) {
      console.error('AI Service Bridge generateResponse error:', error);
      return { text: "Sorry, I'm having trouble connecting right now. Please try again." };
    }
  }

  /**
   * Turbo Edit: Generate code changes from a natural language instruction.
   * 
   * Uses LLM to modify code based on user instructions, returning the edited code
   * along with a diff showing what changed. Includes project context for better understanding.
   * 
   * @param selectedCode - The code to be edited
   * @param instruction - Natural language instruction describing the desired changes
   * @param filePath - Optional file path for context-aware editing
   * @returns A promise that resolves to an object containing success status, edited code, diff, or error
   * 
   * @example
   * ```typescript
   * const result = await aiServiceBridge.turboEdit(
   *   'function add(a, b) { return a + b; }',
   *   'Add input validation to check if both parameters are numbers',
   *   'src/utils/math.ts'
   * );
   * if (result.success && result.editedCode) {
   *   console.log('Edited code:', result.editedCode);
   *   console.log('Diff:', result.diff);
   * }
   * ```
   */
  async turboEdit(selectedCode: string, instruction: string, filePath?: string): Promise<{
    success: boolean;
    editedCode?: string;
    diff?: string;
    error?: string;
  }> {
    console.log('Turbo Edit:', instruction);

    try {
      const projectContext = projectKnowledgeService.getFullProjectContext();
      
      const prompt = `
You are a code editor assistant. The user wants to edit some code.

${filePath ? `File: ${filePath}\n` : ''}
${projectContext ? `Project Context:\n${projectContext}\n` : ''}

Current Code:
\`\`\`
${selectedCode}
\`\`\`

User Instruction: ${instruction}

Generate the edited code that fulfills the user's instruction. Return ONLY the edited code, no explanations or markdown formatting. If the instruction is unclear, return the original code unchanged.
`;

      try {
        const response = await llmRouter.generate(prompt, {
          temperature: 0.7,
          maxTokens: 2048,
        });

        // Extract code from response (remove markdown code blocks if present)
        let editedCode = response.text.trim();
        editedCode = editedCode.replace(/^```[\w]*\n?/g, '').replace(/\n?```$/g, '').trim();

        // Simple diff calculation
        const diff = this.calculateDiff(selectedCode, editedCode);

        return {
          success: true,
          editedCode,
          diff,
        };
      } catch (llmError) {
        console.warn('LLM turbo edit failed:', llmError);
        return {
          success: false,
          error: (llmError as Error).message,
        };
      }
    } catch (error) {
      console.error('Error in turbo edit:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  private calculateDiff(oldCode: string, newCode: string): string {
    // Simple diff: show lines that changed
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    const diff: string[] = [];

    const maxLines = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';
      if (oldLine !== newLine) {
        if (oldLine) diff.push(`- ${oldLine}`);
        if (newLine) diff.push(`+ ${newLine}`);
      }
    }

    return diff.join('\n');
  }
}

// Export singleton instance
export const aiServiceBridge = new AIServiceBridge();
