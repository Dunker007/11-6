import { useLLMStore } from '../ai/llmStore';
import type { TemplateFile } from '@/types/create';

export interface AIGenerationResult {
  success: boolean;
  files: TemplateFile[];
  error?: string;
}

export class AIGeneratorService {
  private static instance: AIGeneratorService;

  static getInstance(): AIGeneratorService {
    if (!AIGeneratorService.instance) {
      AIGeneratorService.instance = new AIGeneratorService();
    }
    return AIGeneratorService.instance;
  }

  async generateProject(
    projectName: string,
    description: string
  ): Promise<AIGenerationResult> {
    try {
      const prompt = this.buildProjectPrompt(projectName, description);
      const response = await useLLMStore.getState().generate(prompt, {
        maxTokens: 4000,
        temperature: 0.7,
      });

      // Parse the AI response to extract file structure
      const files = this.parseAIResponse(response, projectName);
      
      return {
        success: true,
        files,
      };
    } catch (error) {
      return {
        success: false,
        files: [],
        error: (error as Error).message,
      };
    }
  }

  private buildProjectPrompt(projectName: string, description: string): string {
    return `You are an expert software architect. Generate a complete project structure for:

Project Name: ${projectName}
Description: ${description}

Generate a JSON response with the following structure:
{
  "files": [
    {
      "path": "/package.json",
      "content": "...",
      "isDirectory": false
    },
    {
      "path": "/src",
      "isDirectory": true,
      "content": ""
    },
    ...
  ]
}

Requirements:
1. Include all necessary configuration files (package.json, tsconfig.json, etc.)
2. Create a proper directory structure
3. Include starter code files with basic functionality
4. Replace {{name}} with the project name "${projectName}"
5. Make files production-ready with proper structure
6. Include a README.md with setup instructions

Return ONLY valid JSON, no markdown formatting.`;
  }

  private parseAIResponse(response: string, projectName: string): TemplateFile[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      if (!parsed.files || !Array.isArray(parsed.files)) {
        throw new Error('Invalid file structure in AI response');
      }

      // Replace {{name}} placeholders and ensure proper structure
      return parsed.files.map((file: any) => ({
        path: file.path,
        content: typeof file.content === 'string' 
          ? file.content.replace(/\{\{name\}\}/g, projectName)
          : file.content || '',
        isDirectory: file.isDirectory || false,
      }));
    } catch (error) {
      // Fallback: create a basic project structure
      return this.createFallbackProject(projectName);
    }
  }

  private createFallbackProject(projectName: string): TemplateFile[] {
    return [
      {
        path: '/package.json',
        content: JSON.stringify({
          name: projectName.toLowerCase().replace(/\s+/g, '-'),
          version: '0.1.0',
          description: 'Generated project',
          main: 'index.js',
          scripts: {
            start: 'node index.js',
          },
        }, null, 2),
      },
      {
        path: '/README.md',
        content: `# ${projectName}\n\nGenerated project`,
      },
      {
        path: '/index.js',
        content: `console.log('Hello from ${projectName}!');\n`,
      },
    ];
  }
}

export const aiGeneratorService = AIGeneratorService.getInstance();

