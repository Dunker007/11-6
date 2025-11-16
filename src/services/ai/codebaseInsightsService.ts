import { useProjectStore } from '@/services/project/projectStore';
import { llmRouter } from './router';

class CodebaseInsightsService {
  async summarizeProject(): Promise<string | null> {
    try {
      const { activeProject, getFileContent } = useProjectStore.getState();
      if (!activeProject) return 'No active project.';
      const sample = activeProject.files
        .filter(f => !f.isDirectory)
        .slice(0, 5)
        .map(f => {
          const content = (getFileContent(f.path) || '').substring(0, 800);
          return `${f.path}\n---\n${content}`;
        })
        .join('\n\n');

      const prompt = `Provide a concise technical summary of this codebase snapshot (files and partial contents). Call out architecture, key modules, and any potential risks.\n\n${sample}`;

      const response = await llmRouter.generate(prompt, {
        temperature: 0.5,
        maxTokens: 800,
      });
      return response.text || null;
    } catch {
      return 'LLM unavailable. Insights will appear once LLM is configured.';
    }
  }
}

export const codebaseInsightsService = new CodebaseInsightsService();


