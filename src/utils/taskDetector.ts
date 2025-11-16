import type { TaskType } from '@/types/llm';

const TASK_KEYWORDS: Record<Exclude<TaskType, 'general'>, RegExp[]> = {
  coding: [
    /\brefactor\b/i,
    /\bbug\b/i,
    /\btests?\b/i,
    /\btest cases?\b/i,
    /\boptimi[sz]e\b/i,
    /\bfunction\b/i,
    /\bcode\b/i,
    /\bcompile\b/i,
    /\btypescript\b/i,
    /\bjavascript\b/i,
    /\bclass\b/i,
  ],
  vision: [
    /\bimage\b/i,
    /\banal[y|ys]e an? image\b/i,
    /\bscreenshot\b/i,
    /\bpicture\b/i,
    /\bvision\b/i,
    /\bdiagram\b/i,
  ],
  reasoning: [
    /\bplan\b/i,
    /\bstrategy\b/i,
    /\bcompare\b/i,
    /\banaly[sz]e\b/i,
    /\bwhy\b/i,
    /\bexplain\b/i,
    /\barchitecture\b/i,
    /\bdecision\b/i,
  ],
  'function-calling': [
    /\bfunction call\b/i,
    /\btool invocation\b/i,
    /\bcall tool\b/i,
    /\bstructured\b/i,
    /\bjson\b/i,
    /\bschema\b/i,
  ],
};

/**
 * Infer the most likely task type based on user prompt heuristics.
 *
 * @param prompt - Raw user request text.
 * @returns Inferred task category or 'general' when no match is found.
 */
export function detectTaskType(prompt: string): TaskType {
  const normalized = prompt.trim().toLowerCase();
  if (!normalized) {
    return 'general';
  }

  for (const [task, patterns] of Object.entries(TASK_KEYWORDS) as [Exclude<TaskType, 'general'>, RegExp[]][]) {
    if (patterns.some((pattern) => pattern.test(normalized))) {
      return task;
    }
  }

  return 'general';
}




