// aiAssistantService.ts – Core service for autonomous assistance & NL editing
import { agentService, createAgentTask } from '../../agents/AgentService';
import { useStore } from '../../vault/Store';
import type { AgentTask, AgentTaskType } from '../../agents/AgentService';

/**
 * Parses a natural‑language prompt and decides which AgentTaskType to use.
 * Returns a prepared AgentTask ready for execution.
 */
function planTaskFromPrompt(prompt: string): AgentTask {
    // Very simple heuristic – can be expanded later
    const lowered = prompt.toLowerCase();
    let type: AgentTaskType = 'code-generation';
    if (lowered.includes('refactor') || lowered.includes('rename')) {
        type = 'code-generation';
    } else if (lowered.includes('research') || lowered.includes('summarize')) {
        type = 'research';
    } else if (lowered.includes('write') || lowered.includes('article')) {
        type = 'content-writing';
    }
    const activeGem = useStore.getState().gems.find(g => g.id === useStore.getState().activeGemId)!;
    return createAgentTask(type, 'User Prompt Task', prompt, activeGem);
}

/**
 * Executes a user prompt as an autonomous assistance task.
 * Returns the raw result from the underlying executor.
 */
export async function runAssistantPrompt(prompt: string) {
    const task = planTaskFromPrompt(prompt);
    // Add to global task list for UI tracking
    useStore.getState().addAgentTask(task);
    const result = await agentService.executeTask(task);
    // Update task status in store
    useStore.getState().updateAgentTask(task.id, {
        status: result.success ? 'completed' : 'failed',
        progress: 100,
        result: result.output,
        outputPath: result.outputPath,
        error: result.error,
        completedAt: Date.now(),
    });
    return result;
}

/**
 * Applies a natural‑language edit across the codebase.
 * The prompt should describe the change, e.g. "rename UserProfile to MemberProfile".
 * This creates a special "code‑generation" task that receives the whole repo as context.
 */
export async function applyNaturalLanguageEdit(editPrompt: string) {
    // For now we reuse the same planning logic – treat as code‑generation task
    const task = planTaskFromPrompt(editPrompt);
    useStore.getState().addAgentTask(task);
    const result = await agentService.executeTask(task);
    useStore.getState().updateAgentTask(task.id, {
        status: result.success ? 'completed' : 'failed',
        progress: 100,
        result: result.output,
        outputPath: result.outputPath,
        error: result.error,
        completedAt: Date.now(),
    });
    return result;
}
