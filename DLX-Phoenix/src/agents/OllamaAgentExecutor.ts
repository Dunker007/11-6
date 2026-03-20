// Ollama Agent Executor - Local Agent Execution with Ollama Models
// Extends the agent framework for zero-cost local inference

import { ollamaService } from '../cortex/OllamaService';
import type { AgentTask, AgentExecutionResult, IAgentExecutor } from './AgentService';

export class OllamaAgentExecutor implements IAgentExecutor {
    async execute(task: AgentTask): Promise<AgentExecutionResult> {
        try {
            // Check if Ollama is available
            const isAvailable = await ollamaService.checkHealth();
            
            if (!isAvailable) {
                return {
                    success: false,
                    output: '',
                    error: 'Ollama is not running. Please start Ollama and try again.'
                };
            }

            // Build the prompt based on task type
            const prompt = this.buildPrompt(task);

            // Generate with Ollama
            const output = await ollamaService.generate({
                model: task.gem.model,
                prompt: prompt,
                system: task.gem.systemInstructions,
                temperature: 0.7
            });

            // Determine file extension
            const fileExt = this.detectLanguage(output, task.type);
            const timestamp = Date.now();
            const fileName = `${task.type}_${timestamp}.${fileExt}`;
            const outputPath = `/output/${fileName}`;

            return {
                success: true,
                output: output,
                outputPath: outputPath
            };
        } catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error during local execution'
            };
        }
    }

    /**
     * Build optimized prompts for local models
     */
    private buildPrompt(task: AgentTask): string {
        switch (task.type) {
            case 'code-generation':
                return `${task.prompt}

Generate clean, working code. Requirements:
1. Proper imports and dependencies
2. Type definitions (if applicable)
3. Error handling
4. Brief comments for complex logic

Output ONLY the code, no markdown formatting, no explanations.`;

            case 'research':
                return `Research Task: ${task.prompt}

Provide a comprehensive research summary with:
1. Key findings and insights
2. Important data points
3. Sources (if applicable)
4. Actionable recommendations

Format as markdown for readability.`;

            case 'content-writing':
                return `Content Writing Task: ${task.prompt}

Create high-quality, engaging content that is:
- Well-structured with clear sections
- Easy to read and understand
- Factually accurate
- SEO-friendly (where applicable)

Format as markdown.`;

            default:
                return task.prompt;
        }
    }

    /**
     * Detect output language/format
     */
    private detectLanguage(output: string, taskType: string): string {
        if (taskType === 'research' || taskType === 'content-writing') {
            return 'md';
        }

        // Code detection
        if (output.includes('import type') || output.includes('interface ')) return 'ts';
        if (output.includes('import ') && output.includes('=>')) return 'tsx';
        if (output.includes('def ') || output.includes('import ')) return 'py';
        if (output.includes('function') || output.includes('const ')) return 'js';
        if (output.includes('<!DOCTYPE') || output.includes('<html')) return 'html';
        if (output.includes('{') && output.includes('display:')) return 'css';
        
        return 'txt';
    }

    /**
     * Get execution statistics
     */
    async getExecutionStats(modelName: string): Promise<{
        modelSize: string;
        estimatedSpeed: string;
        available: boolean;
    }> {
        const modelInfo = await ollamaService.getModelInfo(modelName);
        
        if (!modelInfo) {
            return {
                modelSize: 'Unknown',
                estimatedSpeed: 'Unknown',
                available: false
            };
        }

        return {
            modelSize: ollamaService.formatModelSize(modelInfo.size),
            estimatedSpeed: this.estimateSpeed(modelInfo.size),
            available: true
        };
    }

    /**
     * Estimate generation speed based on model size
     */
    private estimateSpeed(sizeInBytes: number): string {
        const gb = sizeInBytes / (1024 ** 3);
        
        if (gb < 4) return 'Fast (~10-20 tokens/sec)';
        if (gb < 8) return 'Medium (~5-10 tokens/sec)';
        return 'Slow (~2-5 tokens/sec)';
    }
}

// Export singleton
export const ollamaAgentExecutor = new OllamaAgentExecutor();
