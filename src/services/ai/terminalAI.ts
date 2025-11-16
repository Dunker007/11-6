/**
 * terminalAI.ts
 * 
 * Ed's terminal command execution service.
 * Allows Ed to execute commands based on natural language requests.
 */

import { terminalService } from '../terminal/terminalService';
import { llmRouter } from './router';
import { logger } from '../logging/loggerService';

export interface TerminalCommandRequest {
  userRequest: string; // e.g., "Run tests", "Install dependencies", "Build the project"
  sessionId?: string;
  workingDirectory?: string;
}

export interface TerminalCommandResponse {
  success: boolean;
  command?: string;
  executionId?: string;
  explanation?: string;
  error?: string;
}

class TerminalAI {
  /**
   * Convert natural language request to terminal command and execute it.
   */
  async executeFromRequest(request: TerminalCommandRequest): Promise<TerminalCommandResponse> {
    try {
      // Use LLM to convert natural language to command
      const prompt = `Convert this natural language request into a terminal command:

User request: "${request.userRequest}"

Consider:
- Operating system: ${process.platform}
- Common package managers: npm, yarn, pip, etc.
- Common build tools: npm run, make, etc.
- Return ONLY the command, nothing else

Examples:
- "Run tests" → "npm test"
- "Install dependencies" → "npm install"
- "Build the project" → "npm run build"
- "Start dev server" → "npm run dev"

Command:`;

      let command: string;
      try {
        const response = await llmRouter.generate(prompt, {
          temperature: 0.3,
          maxTokens: 100,
        });

        if (!response.text) {
          return {
            success: false,
            error: 'Failed to generate command - no response text',
          };
        }

        // Extract command (clean up any markdown or extra text)
        command = response.text.trim()
          .replace(/^```[\w]*\n?/, '')
          .replace(/\n?```$/, '')
          .trim();
      } catch (error) {
        logger.error('TerminalAI: Failed to generate command', { error: error as Error });
        return {
          success: false,
          error: (error as Error).message || 'Failed to generate command',
        };
      }

      // Execute the command
      const result = await terminalService.executeCommand(
        command,
        request.workingDirectory,
        request.sessionId
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Failed to execute command',
        };
      }

      return {
        success: true,
        command,
        executionId: result.executionId,
        explanation: `Executed: ${command}`,
      };
    } catch (error) {
      logger.error('TerminalAI: Failed to execute request', { error: error as Error });
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Suggest command based on context.
   */
  async suggestCommand(context: string): Promise<string | null> {
    try {
      const prompt = `Based on this context, suggest a helpful terminal command:

Context: ${context}

Return only the command, nothing else.`;

      const response = await llmRouter.generate(prompt, {
        temperature: 0.5,
        maxTokens: 100,
      });

      if (!response.text) {
        return null;
      }

      return response.text.trim()
        .replace(/^```[\w]*\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
    } catch (error) {
      logger.error('TerminalAI: Failed to suggest command', { error: error as Error });
      return null;
    }
  }
}

export const terminalAI = new TerminalAI();

