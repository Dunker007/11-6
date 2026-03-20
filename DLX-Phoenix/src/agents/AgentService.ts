// Agent Automation System - Core Framework
// Allows Gems to execute real tasks (code gen, web scraping, API testing)

import { aiService } from '../cortex/aiService';
import type { Gem } from '../vault/Store';
import { useGamificationStore } from '../features/gamification/GamificationStore';

export type AgentTaskType =
    | 'code-generation'    // Generate code files
    | 'web-scraping'       // Scrape web data (future: Puppeteer)
    | 'api-testing'        // Test REST APIs (future)
    | 'research'           // Research & summarize
    | 'content-writing';   // Generate articles/posts

export interface AgentTask {
    id: string;
    type: AgentTaskType;
    name: string;
    description: string;
    prompt: string;
    gem: Gem;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number; // 0-100
    result?: string;
    outputPath?: string;
    error?: string;
    createdAt: number;
    completedAt?: number;
}

export interface AgentExecutionResult {
    success: boolean;
    output: string;
    outputPath?: string;
    error?: string;
}

// Base executor interface - each task type implements this
export interface IAgentExecutor {
    execute(task: AgentTask): Promise<AgentExecutionResult>;
}

// ===== CODE GENERATION EXECUTOR =====
export class CodeGenerationExecutor implements IAgentExecutor {
    async execute(task: AgentTask): Promise<AgentExecutionResult> {
        try {
            // Use the Gem's provider to generate code
            const codePrompt = `${task.gem.systemInstructions}

User Request: ${task.prompt}

Generate clean, working code. Include:
1. Proper imports
2. Type definitions (if TypeScript)
3. Error handling
4. Comments explaining key logic

Output ONLY the code, no markdown formatting, no explanations.`;

            const generatedCode = await aiService.generateWithProvider(
                task.gem.provider,
                codePrompt,
                task.gem.systemInstructions
            );

            // Determine file extension based on detected language
            const fileExt = this.detectLanguage(generatedCode);
            const timestamp = Date.now();
            const fileName = `agent_generated_${timestamp}.${fileExt}`;
            const outputPath = `/output/${fileName}`;

            return {
                success: true,
                output: generatedCode,
                outputPath: outputPath
            };
        } catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    private detectLanguage(code: string): string {
        // Simple language detection
        if (code.includes('import type') || code.includes('interface ')) return 'ts';
        if (code.includes('import ') && code.includes('=>')) return 'tsx';
        if (code.includes('def ') || code.includes('import ')) return 'py';
        if (code.includes('function') || code.includes('const ')) return 'js';
        if (code.includes('<!DOCTYPE') || code.includes('<html')) return 'html';
        if (code.includes('{') && code.includes('display:')) return 'css';
        return 'txt';
    }
}

// ===== RESEARCH EXECUTOR =====
export class ResearchExecutor implements IAgentExecutor {
    async execute(task: AgentTask): Promise<AgentExecutionResult> {
        try {
            const researchPrompt = `${task.gem.systemInstructions}

Research Topic: ${task.prompt}

Provide a comprehensive research summary including:
1. Key findings
2. Important data points
3. Sources/references (if applicable)
4. Actionable insights

Format as markdown for easy reading.`;

            const research = await aiService.generateWithProvider(
                task.gem.provider,
                researchPrompt,
                task.gem.systemInstructions
            );

            const timestamp = Date.now();
            const fileName = `research_${timestamp}.md`;
            const outputPath = `/output/${fileName}`;

            return {
                success: true,
                output: research,
                outputPath: outputPath
            };
        } catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// ===== CONTENT WRITING EXECUTOR =====
export class ContentWritingExecutor implements IAgentExecutor {
    async execute(task: AgentTask): Promise<AgentExecutionResult> {
        try {
            const contentPrompt = `${task.gem.systemInstructions}

Writing Request: ${task.prompt}

Create high-quality content that is:
- Well-structured
- Engaging and readable
- SEO-optimized (if applicable)
- Factually accurate

Format as markdown.`;

            const content = await aiService.generateWithProvider(
                task.gem.provider,
                contentPrompt,
                task.gem.systemInstructions
            );

            const timestamp = Date.now();
            const fileName = `content_${timestamp}.md`;
            const outputPath = `/output/${fileName}`;

            return {
                success: true,
                output: content,
                outputPath: outputPath
            };
        } catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

// ===== AGENT SERVICE (Main coordinator) =====
export class AgentService {
    private executors: Map<AgentTaskType, IAgentExecutor> = new Map();

    constructor() {
        // Register executors for each task type
        this.executors.set('code-generation', new CodeGenerationExecutor());
        this.executors.set('research', new ResearchExecutor());
        this.executors.set('content-writing', new ContentWritingExecutor());

        // Placeholders for future executors
        // this.executors.set('web-scraping', new WebScrapingExecutor()); // Needs Puppeteer
        // this.executors.set('api-testing', new APITestingExecutor()); // Future
    }

    async executeTask(task: AgentTask): Promise<AgentExecutionResult> {
        const executor = this.executors.get(task.type);

        if (!executor) {
            return {
                success: false,
                output: '',
                error: `No executor found for task type: ${task.type}`
            };
        }

        const result = await executor.execute(task);

        // Award XP if successful
        if (result.success) {
            useGamificationStore.getState().incrementTasks();
        }

        return result;
    }

    getSupportedTaskTypes(): AgentTaskType[] {
        return Array.from(this.executors.keys());
    }
}

// Singleton instance
export const agentService = new AgentService();

// Helper to create a new task
export const createAgentTask = (
    type: AgentTaskType,
    name: string,
    prompt: string,
    gem: Gem
): AgentTask => ({
    id: `task-${Date.now()}`,
    type,
    name,
    description: prompt,
    prompt,
    gem,
    status: 'pending',
    progress: 0,
    createdAt: Date.now()
});
